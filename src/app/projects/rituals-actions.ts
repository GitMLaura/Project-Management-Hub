"use server";

import { revalidatePath } from "next/cache";
import { getActiveProfile } from "@/lib/active-profile";
import { canCreateItemInArea, canManageScope } from "@/lib/item-rules";
import { createItem } from "@/app/projects/items-actions";
import { buildTaskInput } from "@/lib/pending-task";
import { getItem } from "@/lib/supabase/items";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseTranscript, validateRitualImport, type RitualKind } from "@/lib/transcripts";

export type ImportRitualResult = { ok: true; ritualId: string } | { ok: false; error: string };

// FormData: projectId, title, kind, heldOn (YYYY-MM-DD), participantId (repeated), file (.txt or .vtt).
export async function importRitual(formData: FormData): Promise<ImportRitualResult> {
  const projectId = formData.get("projectId");
  const title = formData.get("title");
  const kind = formData.get("kind");
  const heldOn = formData.get("heldOn");
  const file = formData.get("file");
  const participantIds = formData.getAll("participantId").filter((value): value is string => typeof value === "string");
  if (
    typeof projectId !== "string" ||
    typeof title !== "string" ||
    typeof kind !== "string" ||
    typeof heldOn !== "string" ||
    !(file instanceof File)
  ) {
    return { ok: false, error: "Dados inválidos. Recarregue a página e tente de novo." };
  }

  const problem = validateRitualImport({
    title,
    kind,
    heldOn,
    participantCount: participantIds.length,
    fileName: file.name,
    fileSize: file.size,
  });
  if (problem) return { ok: false, error: problem };

  // Roles apply only in the interface (PRD decision 4), but Server Actions check again.
  const profile = await getActiveProfile();
  if (!canManageScope(profile)) {
    return { ok: false, error: `Como ${profile.roleLabel}, você não importa ritos. Peça a um líder ou ao Dono.` };
  }

  let transcript: string;
  try {
    transcript = parseTranscript(file.name, await file.text());
  } catch (caught) {
    return { ok: false, error: caught instanceof Error ? caught.message : "Não foi possível ler o arquivo." };
  }

  const supabase = createSupabaseServerClient();
  const found = await supabase
    .from("participants")
    .select("id")
    .eq("project_id", projectId)
    .in("id", participantIds);
  if (found.error || (found.data ?? []).length !== new Set(participantIds).size) {
    return { ok: false, error: "Algum participante escolhido não pertence a este projeto." };
  }

  const created = await supabase
    .from("rituals")
    .insert({ project_id: projectId, title: title.trim(), kind: kind as RitualKind, held_on: heldOn, transcript })
    .select("id")
    .single();
  if (created.error || !created.data) {
    return { ok: false, error: "Não foi possível importar o rito. Nada foi gravado; tente novamente." };
  }

  const linked = await supabase
    .from("ritual_participants")
    .insert([...new Set(participantIds)].map((participantId) => ({ ritual_id: created.data.id, participant_id: participantId })));
  if (linked.error) {
    return { ok: false, error: "O rito foi importado, mas não foi possível registrar os participantes." };
  }

  revalidatePath(`/projects/${projectId}/rituals`, "layout");
  return { ok: true, ritualId: created.data.id };
}

export type ApproveSummaryResult = { ok: true } | { ok: false; error: string };

// A summary is born as a draft. Only the area leader (or the Owner) makes it official.
export async function approveSummary(projectId: string, summaryId: string): Promise<ApproveSummaryResult> {
  const supabase = createSupabaseServerClient();
  const { data: summary } = await supabase
    .from("ritual_summaries")
    .select("id, status, rituals!inner(project_id), areas(name)")
    .eq("id", summaryId)
    .maybeSingle();
  const ritual = Array.isArray(summary?.rituals) ? summary.rituals[0] : summary?.rituals;
  const area = Array.isArray(summary?.areas) ? summary.areas[0] : summary?.areas;
  if (!summary || !ritual || ritual.project_id !== projectId || !area) {
    return { ok: false, error: "Resumo não encontrado neste projeto." };
  }
  if (summary.status === "approved") return { ok: false, error: "Este resumo já foi aprovado." };

  const profile = await getActiveProfile();
  if (!canCreateItemInArea(profile, area.name)) {
    return {
      ok: false,
      error: `Como ${profile.roleLabel}, você não aprova o resumo de ${area.name}. Só o líder da área ou o Dono aprova.`,
    };
  }

  const { error } = await supabase
    .from("ritual_summaries")
    .update({ status: "approved", approved_by: profile.name, approved_at: new Date().toISOString() })
    .eq("id", summaryId)
    .eq("status", "draft");
  if (error) return { ok: false, error: "Não foi possível aprovar o resumo. Tente novamente." };

  revalidatePath(`/projects/${projectId}/rituals`, "layout");
  return { ok: true };
}

export type CreateTaskFromPendingResult = { ok: true } | { ok: false; error: string };

// One pending becomes one task. Scope rules E1-E3 are checked again by createItem.
export async function createTaskFromPending(
  projectId: string,
  pendingId: string,
  storyId: string,
  assigneeId: string,
  deadline: string,
): Promise<CreateTaskFromPendingResult> {
  const supabase = createSupabaseServerClient();
  const { data: pending } = await supabase
    .from("ritual_pendings")
    .select("id, description, task_id, ritual_summaries!inner(area_id, rituals!inner(project_id))")
    .eq("id", pendingId)
    .maybeSingle();
  const summary = Array.isArray(pending?.ritual_summaries) ? pending.ritual_summaries[0] : pending?.ritual_summaries;
  const ritual = Array.isArray(summary?.rituals) ? summary.rituals[0] : summary?.rituals;
  if (!pending || !summary || !ritual || ritual.project_id !== projectId) {
    return { ok: false, error: "Pendência não encontrada neste projeto." };
  }
  if (pending.task_id) return { ok: false, error: "Esta pendência já virou tarefa." };

  const story = await getItem(projectId, storyId).catch(() => null);
  if (!story || story.type !== "story" || story.archivedAt) {
    return { ok: false, error: "Escolha uma história ativa deste projeto como pai da tarefa." };
  }

  const created = await createItem(
    buildTaskInput({
      projectId,
      areaId: summary.area_id as string,
      storyId,
      assigneeId,
      deadline,
      description: pending.description as string,
    }),
  );
  if (!created.ok) {
    const detail = created.fieldErrors?.map((fieldError) => fieldError.message).join(" ");
    return { ok: false, error: detail ? `${created.error} ${detail}` : created.error };
  }

  const linked = await supabase
    .from("ritual_pendings")
    .update({ task_id: created.id })
    .eq("id", pendingId)
    .is("task_id", null);
  if (linked.error) {
    return { ok: false, error: "A tarefa foi criada, mas não foi possível ligá-la à pendência." };
  }

  revalidatePath(`/projects/${projectId}`, "layout");
  return { ok: true };
}

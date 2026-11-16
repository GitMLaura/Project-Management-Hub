"use server";

import { revalidatePath } from "next/cache";
import { getActiveProfile } from "@/lib/active-profile";
import { canManageScope } from "@/lib/item-rules";
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

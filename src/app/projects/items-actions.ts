"use server";

import { revalidatePath } from "next/cache";
import { getActiveProfile } from "@/lib/active-profile";
import {
  canCreateItemInArea,
  canManageScope,
  isItemInput,
  normalizeItemInput,
  validateItem,
  type DeadlineLimits,
  type ItemFieldError,
} from "@/lib/item-rules";
import { getItem } from "@/lib/supabase/items";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateItemResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: ItemFieldError[] };

export async function createItem(raw: unknown): Promise<CreateItemResult> {
  // Roles apply only in the interface (PRD decision 4), but we still check here.
  const profile = await getActiveProfile();
  if (!canManageScope(profile)) {
    return { ok: false, error: "Seu perfil não cria itens de escopo." };
  }

  if (!isItemInput(raw)) {
    return { ok: false, error: "Dados inválidos. Recarregue a página e tente de novo." };
  }

  const input = normalizeItemInput(raw);

  const supabase = createSupabaseServerClient();

  // Deadline limits come from the database, never from the browser (rules E2 and E3).
  const limits: DeadlineLimits = {};
  if (input.type === "epic") {
    const { data: project } = await supabase
      .from("projects")
      .select("deadline")
      .eq("id", input.projectId)
      .maybeSingle();
    limits.projectDeadline = project?.deadline ?? null;
  } else if (input.parentId) {
    const parent = await getItem(input.projectId, input.parentId).catch(() => null);
    limits.parentDeadline = parent?.deadline ?? null;
  }

  const validation = validateItem(input, limits);
  if (!validation.ok) {
    return { ok: false, error: "Corrija os campos indicados.", fieldErrors: validation.errors };
  }

  const { data: area } = await supabase
    .from("areas")
    .select("name")
    .eq("id", input.areaId)
    .eq("project_id", input.projectId)
    .maybeSingle();
  if (!area) {
    return { ok: false, error: "Área não encontrada neste projeto." };
  }
  if (!canCreateItemInArea(profile, area.name)) {
    return {
      ok: false,
      error: `Como ${profile.roleLabel}, você só cria itens da sua área (${profile.area}).`,
    };
  }

  const { data, error } = await supabase
    .from("items")
    .insert({
      project_id: input.projectId,
      parent_id: input.parentId,
      type: input.type,
      title: input.title,
      description: input.description || null,
      area_id: input.areaId,
      assignee_id: input.assigneeId,
      start_date: input.startDate || null,
      deadline: input.deadline,
      status: input.status,
      is_critical: input.isCritical,
      story_persona: input.type === "story" ? input.storyPersona : null,
      story_action: input.type === "story" ? input.storyAction : null,
      story_benefit: input.type === "story" ? input.storyBenefit : null,
      acceptance_criteria: input.type === "story" ? input.acceptanceCriteria : [],
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: "Não foi possível salvar o item. Confira os campos e tente novamente.",
    };
  }

  revalidatePath(`/projects/${input.projectId}`);
  return { ok: true, id: data.id };
}

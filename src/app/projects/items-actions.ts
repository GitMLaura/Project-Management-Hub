"use server";

import { revalidatePath } from "next/cache";
import { getActiveProfile } from "@/lib/active-profile";
import {
  canCreateItemInArea,
  canManageScope,
  isGroupInput,
  isItemInput,
  normalizeItemInput,
  validateGroup,
  validateItem,
  type ItemFieldError,
} from "@/lib/item-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateItemResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: ItemFieldError[] };

export async function createItem(raw: unknown): Promise<CreateItemResult> {
  // Roles apply only in the interface (PRD decision 4), but we still check here.
  const profile = await getActiveProfile();
  if (!canManageScope(profile)) {
    return { ok: false, error: "Seu perfil não cria tarefas." };
  }

  if (!isItemInput(raw)) {
    return { ok: false, error: "Dados inválidos. Recarregue a página e tente de novo." };
  }

  const input = normalizeItemInput(raw);

  const supabase = createSupabaseServerClient();

  // The deadline limit comes from the database, never from the browser.
  const { data: project } = await supabase
    .from("projects")
    .select("deadline")
    .eq("id", input.projectId)
    .maybeSingle();

  const validation = validateItem(input, project?.deadline ?? null);
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
      error: `Como ${profile.roleLabel}, você só cria tarefas da sua área (${profile.area}).`,
    };
  }

  const { data, error } = await supabase
    .from("items")
    .insert({
      project_id: input.projectId,
      parent_id: input.groupId,
      type: "task",
      title: input.title,
      description: input.description || null,
      area_id: input.areaId,
      assignee_id: input.assigneeId,
      start_date: input.startDate || null,
      deadline: input.deadline,
      status: input.status,
      is_critical: input.isCritical,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: "Não foi possível salvar a tarefa. Confira os campos e tente novamente.",
    };
  }

  revalidatePath(`/projects/${input.projectId}`, "layout");
  return { ok: true, id: data.id };
}

export type CreateGroupResult = { ok: true; id: string } | { ok: false; error: string };

// "Agrupar": creates a named group and moves the chosen tasks into it.
export async function createGroup(raw: unknown): Promise<CreateGroupResult> {
  const profile = await getActiveProfile();
  if (!canManageScope(profile)) {
    return { ok: false, error: "Seu perfil não agrupa tarefas." };
  }
  if (!isGroupInput(raw)) {
    return { ok: false, error: "Dados inválidos. Recarregue a página e tente de novo." };
  }
  const message = validateGroup(raw);
  if (message) return { ok: false, error: message };

  const supabase = createSupabaseServerClient();

  // Only live tasks of this project, and (for an area leader) only tasks of their area.
  const { data: tasks, error: tasksError } = await supabase
    .from("items")
    .select("id, area:areas(name)")
    .eq("project_id", raw.projectId)
    .eq("type", "task")
    .is("archived_at", null)
    .in("id", raw.taskIds);
  if (tasksError || !tasks || tasks.length !== new Set(raw.taskIds).size) {
    return { ok: false, error: "Algumas tarefas não foram encontradas. Recarregue a página." };
  }
  const blocked = tasks.some((task) => {
    const area = Array.isArray(task.area) ? task.area[0] : task.area;
    return !canCreateItemInArea(profile, area?.name ?? "");
  });
  if (blocked) {
    return {
      ok: false,
      error: `Como ${profile.roleLabel}, você só agrupa tarefas da sua área (${profile.area}).`,
    };
  }

  const { data: group, error: groupError } = await supabase
    .from("items")
    .insert({
      project_id: raw.projectId,
      type: "group",
      group_label: raw.label,
      title: raw.title.trim(),
    })
    .select("id")
    .single();
  if (groupError || !group) {
    return { ok: false, error: "Não foi possível criar o grupo. Tente novamente." };
  }

  const { error: moveError } = await supabase
    .from("items")
    .update({ parent_id: group.id })
    .in("id", raw.taskIds);
  if (moveError) {
    return { ok: false, error: "O grupo foi criado, mas não consegui mover as tarefas. Tente de novo." };
  }

  revalidatePath(`/projects/${raw.projectId}`, "layout");
  return { ok: true, id: group.id };
}

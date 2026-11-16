"use server";

import { revalidatePath } from "next/cache";
import { getActiveProfile } from "@/lib/active-profile";
import { canUpdateTaskStatus, isItemStatus } from "@/lib/item-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateStatusResult = { ok: true } | { ok: false; error: string };

export async function updateTaskStatus(
  projectId: unknown,
  itemId: unknown,
  status: unknown,
): Promise<UpdateStatusResult> {
  if (typeof projectId !== "string" || typeof itemId !== "string" || !isItemStatus(status)) {
    return { ok: false, error: "Dados inválidos. Recarregue a página e tente de novo." };
  }

  // Roles apply only in the interface (PRD decision 4), but we still check here.
  const profile = await getActiveProfile();
  const supabase = createSupabaseServerClient();

  const { data: task } = await supabase
    .from("items")
    .select("type, archived_at, areas(name), participants(name)")
    .eq("id", itemId)
    .eq("project_id", projectId)
    .maybeSingle();
  const area = Array.isArray(task?.areas) ? task.areas[0] : task?.areas;
  const person = Array.isArray(task?.participants) ? task.participants[0] : task?.participants;
  if (!task || task.type !== "task" || task.archived_at || !area || !person) {
    return { ok: false, error: "Tarefa não encontrada neste projeto." };
  }
  if (!canUpdateTaskStatus(profile, { areaName: area.name, assigneeName: person.name })) {
    return { ok: false, error: "Você só altera o status de tarefas pelas quais responde." };
  }

  const { error } = await supabase.from("items").update({ status }).eq("id", itemId);
  if (error) {
    return { ok: false, error: "Não foi possível salvar o status. Tente novamente." };
  }

  revalidatePath(`/projects/${projectId}`, "layout");
  return { ok: true };
}

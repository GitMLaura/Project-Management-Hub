"use server";

import { revalidatePath } from "next/cache";
import { getActiveProfile } from "@/lib/active-profile";
import { canCreateItemInArea } from "@/lib/item-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ArchiveResult = { ok: true } | { ok: false; error: string };

// Archive and restore share the same checks: same permission as creating items in the area.
async function changeArchive(
  projectId: unknown,
  itemId: unknown,
  action: "archive_item" | "restore_item",
): Promise<ArchiveResult> {
  if (typeof projectId !== "string" || typeof itemId !== "string") {
    return { ok: false, error: "Dados inválidos. Recarregue a página e tente de novo." };
  }

  // Roles apply only in the interface (PRD decision 4), but we still check here.
  const profile = await getActiveProfile();
  const supabase = createSupabaseServerClient();

  const { data: item } = await supabase
    .from("items")
    .select("area_id, areas(name)")
    .eq("id", itemId)
    .eq("project_id", projectId)
    .maybeSingle();
  const area = Array.isArray(item?.areas) ? item.areas[0] : item?.areas;
  if (!item || !area) {
    return { ok: false, error: "Item não encontrado neste projeto." };
  }
  if (!canCreateItemInArea(profile, area.name)) {
    return {
      ok: false,
      error: `Como ${profile.roleLabel}, você só altera itens da sua área (${profile.area}).`,
    };
  }

  const { error } = await supabase.rpc(action, { p_id: itemId });
  if (error) {
    const reason = error.message.includes("parent item is archived")
      ? "Restaure primeiro o item pai."
      : "Nada foi alterado; tente novamente.";
    return {
      ok: false,
      error:
        action === "archive_item"
          ? `Não foi possível arquivar. ${reason}`
          : `Não foi possível restaurar. ${reason}`,
    };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function archiveItem(projectId: unknown, itemId: unknown): Promise<ArchiveResult> {
  return changeArchive(projectId, itemId, "archive_item");
}

export async function restoreItem(projectId: unknown, itemId: unknown): Promise<ArchiveResult> {
  return changeArchive(projectId, itemId, "restore_item");
}

import type { GroupLabel, ItemStatus, ItemType } from "@/lib/item-rules";
import type { ItemRecord } from "@/lib/item-tree";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ItemRow = {
  id: string;
  parent_id: string | null;
  type: ItemType;
  group_label: GroupLabel | null;
  title: string;
  description: string | null;
  area_id: string | null;
  assignee_id: string | null;
  start_date: string | null;
  deadline: string | null;
  status: ItemStatus;
  is_critical: boolean;
  archived_at: string | null;
};

const COLUMNS =
  "id, parent_id, type, group_label, title, description, area_id, assignee_id, start_date, deadline, status, is_critical, archived_at";

function toRecord(row: ItemRow): ItemRecord {
  return {
    id: row.id,
    parentId: row.parent_id,
    type: row.type,
    groupLabel: row.group_label,
    title: row.title,
    description: row.description ?? "",
    areaId: row.area_id ?? "",
    assigneeId: row.assignee_id ?? "",
    startDate: row.start_date,
    deadline: row.deadline ?? "",
    status: row.status,
    isCritical: row.is_critical,
    archivedAt: row.archived_at,
  };
}

export async function listItems(projectId: string): Promise<ItemRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("items")
    .select(COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ItemRow[]).map(toRecord);
}

// Returns null when the item does not exist in this project.
export async function getItem(projectId: string, itemId: string): Promise<ItemRecord | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("items")
    .select(COLUMNS)
    .eq("project_id", projectId)
    .eq("id", itemId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRecord(data as ItemRow) : null;
}

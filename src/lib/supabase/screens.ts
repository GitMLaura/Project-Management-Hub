import type { ScreenRecord } from "@/lib/screens";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ScreenRow = {
  id: string;
  project_id: string;
  feature_id: string;
  name: string;
  storage_path: string;
  sha256: string;
  phash: string;
  width: number;
  height: number;
  size_bytes: number;
  is_reference: boolean;
};

const COLUMNS =
  "id, project_id, feature_id, name, storage_path, sha256, phash, width, height, size_bytes, is_reference";

function toRecord(row: ScreenRow): ScreenRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    featureId: row.feature_id,
    name: row.name,
    storagePath: row.storage_path,
    sha256: row.sha256,
    phash: row.phash,
    width: row.width,
    height: row.height,
    sizeBytes: row.size_bytes,
    isReference: row.is_reference,
  };
}

export async function listScreens(projectId: string): Promise<ScreenRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("screens")
    .select(COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ScreenRow[]).map(toRecord);
}

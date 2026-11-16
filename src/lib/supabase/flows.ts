import type { FlowRecord } from "@/lib/flows";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FlowRow = {
  id: string;
  project_id: string;
  feature_id: string;
  title: string;
  source: string;
};

const COLUMNS = "id, project_id, feature_id, title, source";

function toRecord(row: FlowRow): FlowRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    featureId: row.feature_id,
    title: row.title,
    source: row.source,
  };
}

export async function listFlows(projectId: string): Promise<FlowRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("flows")
    .select(COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as FlowRow[]).map(toRecord);
}

export async function getFlow(projectId: string, flowId: string): Promise<FlowRecord | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("flows")
    .select(COLUMNS)
    .eq("project_id", projectId)
    .eq("id", flowId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRecord(data as FlowRow) : null;
}

// step id (node id in the Mermaid text) -> screen id, for one flow.
export async function listStepLinks(flowId: string): Promise<Record<string, string>> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("flow_step_screens")
    .select("step_id, screen_id")
    .eq("flow_id", flowId);
  if (error) throw new Error(error.message);
  const links: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.screen_id) links[row.step_id] = row.screen_id;
  }
  return links;
}

// Every flow step that points to a screen: which flow and which step (node id).
export async function listScreenLinks(
  screenId: string,
): Promise<{ flowId: string; stepId: string }[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("flow_step_screens")
    .select("flow_id, step_id")
    .eq("screen_id", screenId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ flowId: row.flow_id as string, stepId: row.step_id as string }));
}

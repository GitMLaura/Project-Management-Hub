import type { RuleRecord } from "@/lib/rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RuleRow = {
  id: string;
  project_id: string;
  feature_id: string;
  code: number;
  title: string;
  body: string;
  updated_at: string;
};

const COLUMNS = "id, project_id, feature_id, code, title, body, updated_at";

function toRecord(row: RuleRow): RuleRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    featureId: row.feature_id,
    code: row.code,
    title: row.title,
    body: row.body,
    updatedAt: row.updated_at,
  };
}

export async function listRules(projectId: string): Promise<RuleRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("business_rules")
    .select(COLUMNS)
    .eq("project_id", projectId)
    .order("code", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as RuleRow[]).map(toRecord);
}

export async function getRule(projectId: string, ruleId: string): Promise<RuleRecord | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("business_rules")
    .select(COLUMNS)
    .eq("project_id", projectId)
    .eq("id", ruleId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRecord(data as RuleRow) : null;
}

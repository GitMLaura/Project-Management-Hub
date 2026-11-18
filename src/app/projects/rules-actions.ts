"use server";

import { revalidatePath } from "next/cache";
import { getActiveProfile } from "@/lib/active-profile";
import { canManageScope } from "@/lib/item-rules";
import { isRuleInput, validateRuleInput } from "@/lib/rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SaveRuleResult = { ok: true } | { ok: false; error: string };

export async function saveRule(raw: unknown): Promise<SaveRuleResult> {
  if (!isRuleInput(raw)) {
    return { ok: false, error: "Dados inválidos. Recarregue a página e tente de novo." };
  }
  const problem = validateRuleInput(raw);
  if (problem) return { ok: false, error: problem };

  // Roles apply only in the interface (PRD decision 4), but we still check here.
  const profile = await getActiveProfile();
  const supabase = createSupabaseServerClient();

  const { data: feature } = await supabase
    .from("items")
    .select("type")
    .eq("id", raw.featureId)
    .eq("project_id", raw.projectId)
    .maybeSingle();
  if (!feature || feature.type !== "group") {
    return { ok: false, error: "Grupo não encontrado neste projeto." };
  }
  // A group has no area of its own, so the owner and the area leaders may edit its spec.
  if (!canManageScope(profile)) {
    return { ok: false, error: `Como ${profile.roleLabel}, você só consulta a especificação.` };
  }

  const fields = { title: raw.title.trim(), body: raw.body };
  const { error } = raw.ruleId
    ? await supabase
        .from("business_rules")
        .update(fields)
        .eq("id", raw.ruleId)
        .eq("project_id", raw.projectId)
    : await supabase
        .from("business_rules")
        .insert({ ...fields, project_id: raw.projectId, feature_id: raw.featureId, code: 0 });

  if (error) {
    return { ok: false, error: "Não foi possível salvar a regra. Nada foi gravado; tente novamente." };
  }

  revalidatePath(`/projects/${raw.projectId}/spec`, "layout");
  return { ok: true };
}

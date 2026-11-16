"use server";

import { revalidatePath } from "next/cache";
import { isFlowInput, validateFlowInput } from "@/lib/flows";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkFeaturePermission } from "@/lib/supabase/spec-permission";

export type FlowActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function saveFlow(raw: unknown): Promise<FlowActionResult> {
  if (!isFlowInput(raw)) {
    return { ok: false, error: "Dados inválidos. Recarregue a página e tente de novo." };
  }
  const problem = validateFlowInput(raw);
  if (problem) return { ok: false, error: problem };
  const denied = await checkFeaturePermission(raw.projectId, raw.featureId);
  if (denied) return { ok: false, error: denied };

  const supabase = createSupabaseServerClient();
  const fields = { title: raw.title.trim(), source: raw.source };

  if (raw.flowId) {
    const { error } = await supabase
      .from("flows")
      .update(fields)
      .eq("id", raw.flowId)
      .eq("project_id", raw.projectId);
    if (error) return { ok: false, error: "Não foi possível salvar o fluxo. Tente novamente." };
    revalidatePath(`/projects/${raw.projectId}/spec`, "layout");
    return { ok: true, id: raw.flowId };
  }

  const { data, error } = await supabase
    .from("flows")
    .insert({ ...fields, project_id: raw.projectId, feature_id: raw.featureId })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: "Não foi possível salvar o fluxo. Nada foi gravado; tente novamente." };
  }
  revalidatePath(`/projects/${raw.projectId}/spec`, "layout");
  return { ok: true, id: data.id };
}

// Links one step (node id) of a flow to a screen, or removes the link (screenId = null).
export async function linkStepScreen(
  projectId: unknown,
  flowId: unknown,
  stepId: unknown,
  screenId: unknown,
): Promise<FlowActionResult> {
  if (
    typeof projectId !== "string" ||
    typeof flowId !== "string" ||
    typeof stepId !== "string" ||
    !(screenId === null || typeof screenId === "string")
  ) {
    return { ok: false, error: "Dados inválidos. Recarregue a página e tente de novo." };
  }
  const supabase = createSupabaseServerClient();
  const { data: flow } = await supabase
    .from("flows")
    .select("feature_id")
    .eq("id", flowId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!flow) return { ok: false, error: "Fluxo não encontrado neste projeto." };
  const denied = await checkFeaturePermission(projectId, flow.feature_id);
  if (denied) return { ok: false, error: denied };

  const { error } = await supabase
    .from("flow_step_screens")
    .upsert({ flow_id: flowId, step_id: stepId, screen_id: screenId }, { onConflict: "flow_id,step_id" });
  if (error) return { ok: false, error: "Não foi possível vincular a tela. Tente novamente." };

  revalidatePath(`/projects/${projectId}/spec`, "layout");
  return { ok: true };
}

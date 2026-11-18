import { getActiveProfile } from "@/lib/active-profile";
import { canManageScope } from "@/lib/item-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Roles apply only in the interface (PRD decision 4), but Server Actions check again.
// Returns a message when the active profile may NOT edit the spec of this group, else null.
export async function checkFeaturePermission(
  projectId: string,
  featureId: string,
): Promise<string | null> {
  const profile = await getActiveProfile();
  const supabase = createSupabaseServerClient();
  const { data: feature } = await supabase
    .from("items")
    .select("type")
    .eq("id", featureId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!feature || feature.type !== "group") {
    return "Grupo não encontrado neste projeto.";
  }
  // A group has no area of its own, so the owner and the area leaders may edit its spec.
  if (!canManageScope(profile)) {
    return `Como ${profile.roleLabel}, você só consulta a especificação.`;
  }
  return null;
}

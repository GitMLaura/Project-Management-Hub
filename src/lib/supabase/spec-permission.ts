import { getActiveProfile } from "@/lib/active-profile";
import { canCreateItemInArea } from "@/lib/item-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Roles apply only in the interface (PRD decision 4), but Server Actions check again.
// Returns a message when the active profile may NOT edit the spec of this feature, else null.
export async function checkFeaturePermission(
  projectId: string,
  featureId: string,
): Promise<string | null> {
  const profile = await getActiveProfile();
  const supabase = createSupabaseServerClient();
  const { data: feature } = await supabase
    .from("items")
    .select("type, areas(name)")
    .eq("id", featureId)
    .eq("project_id", projectId)
    .maybeSingle();
  const area = Array.isArray(feature?.areas) ? feature.areas[0] : feature?.areas;
  if (!feature || feature.type !== "feature" || !area) {
    return "Funcionalidade não encontrada neste projeto.";
  }
  if (!canCreateItemInArea(profile, area.name)) {
    return `Como ${profile.roleLabel}, você só edita a especificação da sua área (${profile.area}).`;
  }
  return null;
}

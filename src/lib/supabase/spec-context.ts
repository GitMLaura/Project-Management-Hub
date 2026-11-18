import type { ItemRecord } from "@/lib/item-tree";
import { getItem } from "@/lib/supabase/items";
import { getProject, type ProjectDetail } from "@/lib/supabase/projects";

export type FeatureContext = {
  project: ProjectDetail;
  feature: ItemRecord; // a group: the spec (flows, rules, screens) hangs on groups
};

// Loads a project and one of its (active) groups. Returns null when not found.
export async function loadFeatureContext(
  projectId: string,
  featureId: string,
): Promise<FeatureContext | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  const feature = await getItem(projectId, featureId);
  if (!feature || feature.type !== "group" || feature.archivedAt) return null;
  return { project, feature };
}

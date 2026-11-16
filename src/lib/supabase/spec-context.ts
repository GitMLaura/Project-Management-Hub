import type { ItemRecord } from "@/lib/item-tree";
import { getItem } from "@/lib/supabase/items";
import { getProject, type ProjectDetail } from "@/lib/supabase/projects";

export type FeatureContext = {
  project: ProjectDetail;
  feature: ItemRecord;
  epic: ItemRecord | null;
  areaName: string;
};

// Loads a project and one of its (active) features. Returns null when not found.
export async function loadFeatureContext(
  projectId: string,
  featureId: string,
): Promise<FeatureContext | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  const feature = await getItem(projectId, featureId);
  if (!feature || feature.type !== "feature" || feature.archivedAt) return null;
  const epic = feature.parentId ? await getItem(projectId, feature.parentId) : null;
  const areaName = project.areas.find((area) => area.id === feature.areaId)?.name ?? "";
  return { project, feature, epic, areaName };
}

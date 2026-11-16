import { isRitualKind, type RitualKind } from "@/lib/transcripts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RitualSummaryRow = {
  id: string;
  title: string;
  kind: RitualKind;
  heldOn: string;
};

export type RitualDetail = RitualSummaryRow & {
  projectId: string;
  transcript: string;
  participantIds: string[];
};

type RitualRow = {
  id: string;
  project_id: string;
  kind: string;
  title: string;
  held_on: string;
  transcript?: string;
};

function toKind(value: string): RitualKind {
  if (!isRitualKind(value)) throw new Error(`Tipo de rito desconhecido: ${value}`);
  return value;
}

// Newest first. The transcript text is not loaded for the list.
export async function listRituals(projectId: string): Promise<RitualSummaryRow[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rituals")
    .select("id, project_id, kind, title, held_on")
    .eq("project_id", projectId)
    .order("held_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as RitualRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    kind: toKind(row.kind),
    heldOn: row.held_on,
  }));
}

export async function getRitual(projectId: string, ritualId: string): Promise<RitualDetail | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rituals")
    .select("id, project_id, kind, title, held_on, transcript")
    .eq("project_id", projectId)
    .eq("id", ritualId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as RitualRow;

  const links = await supabase.from("ritual_participants").select("participant_id").eq("ritual_id", ritualId);
  if (links.error) throw new Error(links.error.message);

  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    kind: toKind(row.kind),
    heldOn: row.held_on,
    transcript: row.transcript ?? "",
    participantIds: (links.data ?? []).map((link) => link.participant_id as string),
  };
}

export type RitualPending = {
  id: string;
  description: string;
  suggestedAssignee: string | null;
  taskId: string | null;
};

export type RitualAreaSummary = {
  id: string;
  areaId: string;
  keyPoints: string[];
  decisions: string[];
  risks: string[];
  status: "draft" | "approved";
  isPregenerated: boolean;
  approvedBy: string | null;
  pendings: RitualPending[];
};

// Summaries of one ritual, one per area, with their pendings.
export async function listRitualSummaries(ritualId: string): Promise<RitualAreaSummary[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ritual_summaries")
    .select(
      "id, area_id, key_points, decisions, risks, status, is_pregenerated, approved_by, ritual_pendings(id, description, suggested_assignee, task_id, created_at)",
    )
    .eq("ritual_id", ritualId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const pendings = (row.ritual_pendings ?? []) as {
      id: string;
      description: string;
      suggested_assignee: string | null;
      task_id: string | null;
      created_at: string;
    }[];
    return {
      id: row.id as string,
      areaId: row.area_id as string,
      keyPoints: (row.key_points ?? []) as string[],
      decisions: (row.decisions ?? []) as string[],
      risks: (row.risks ?? []) as string[],
      status: row.status === "approved" ? "approved" : "draft",
      isPregenerated: Boolean(row.is_pregenerated),
      approvedBy: (row.approved_by as string | null) ?? null,
      pendings: [...pendings]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((pending) => ({
          id: pending.id,
          description: pending.description,
          suggestedAssignee: pending.suggested_assignee,
          taskId: pending.task_id,
        })),
    };
  });
}

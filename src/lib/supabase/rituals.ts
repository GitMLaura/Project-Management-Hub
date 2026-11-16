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

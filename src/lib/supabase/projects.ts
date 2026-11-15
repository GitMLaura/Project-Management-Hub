import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProjectSummary = {
  id: string;
  name: string;
  objective: string;
  startDate: string;
  deadline: string;
};

export type ProjectParticipant = {
  id: string;
  name: string;
  isOwner: boolean;
  isAreaLeader: boolean;
};

export type ProjectArea = {
  id: string;
  name: string;
  participants: ProjectParticipant[];
};

export type ProjectDetail = ProjectSummary & { areas: ProjectArea[] };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProjectRow = {
  id: string;
  name: string;
  objective: string;
  start_date: string;
  deadline: string;
};

function toSummary(row: ProjectRow): ProjectSummary {
  return {
    id: row.id,
    name: row.name,
    objective: row.objective,
    startDate: row.start_date,
    deadline: row.deadline,
  };
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, objective, start_date, deadline")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toSummary);
}

// Returns null when the id is malformed or the project does not exist.
export async function getProject(id: string): Promise<ProjectDetail | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const supabase = createSupabaseServerClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, objective, start_date, deadline")
    .eq("id", id)
    .maybeSingle();
  if (projectError) throw new Error(projectError.message);
  if (!project) return null;

  const { data: areas, error: areasError } = await supabase
    .from("areas")
    .select("id, name")
    .eq("project_id", id)
    .order("created_at", { ascending: true });
  if (areasError) throw new Error(areasError.message);

  const { data: participants, error: participantsError } = await supabase
    .from("participants")
    .select("id, area_id, name, is_owner, is_area_leader")
    .eq("project_id", id)
    .order("created_at", { ascending: true });
  if (participantsError) throw new Error(participantsError.message);

  return {
    ...toSummary(project),
    areas: (areas ?? []).map((area) => ({
      id: area.id,
      name: area.name,
      participants: (participants ?? [])
        .filter((participant) => participant.area_id === area.id)
        .map((participant) => ({
          id: participant.id,
          name: participant.name,
          isOwner: participant.is_owner,
          isAreaLeader: participant.is_area_leader,
        })),
    })),
  };
}

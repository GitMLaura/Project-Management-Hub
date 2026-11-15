"use server";

import { revalidatePath } from "next/cache";
import { getActiveProfile } from "@/lib/active-profile";
import { canCreateProject } from "@/lib/demo-profiles";
import {
  isProjectInput,
  normalizeProjectInput,
  validateProject,
  type FieldError,
} from "@/lib/project-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateProjectResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: FieldError[] };

export async function createProject(raw: unknown): Promise<CreateProjectResult> {
  // Roles apply only in the interface (PRD decision 4), but we still check here.
  const profile = await getActiveProfile();
  if (!canCreateProject(profile)) {
    return { ok: false, error: "Só o Dono do projeto pode criar projetos." };
  }

  if (!isProjectInput(raw)) {
    return { ok: false, error: "Dados inválidos. Recarregue a página e tente de novo." };
  }

  const input = normalizeProjectInput(raw);
  const validation = validateProject(input);
  if (!validation.ok) {
    return {
      ok: false,
      error: "Corrija os campos indicados.",
      fieldErrors: validation.errors,
    };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_project", {
    p_name: input.name,
    p_objective: input.objective,
    p_start_date: input.startDate,
    p_deadline: input.deadline,
    p_areas: input.areas,
    p_participants: input.participants.map((participant) => ({
      name: participant.name,
      area: participant.area,
      is_owner: participant.isOwner,
      is_area_leader: participant.isAreaLeader,
    })),
  });

  if (error || typeof data !== "string") {
    return {
      ok: false,
      error: "Não foi possível salvar o projeto. Nada foi gravado; tente novamente.",
    };
  }

  revalidatePath("/");
  return { ok: true, id: data };
}

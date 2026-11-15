// Demo profiles: fictional people that visitors can switch between.
// The same names will be reused by the seed (story H5.1.1).

export const PROFILE_COOKIE = "demo_profile";

export type DemoProfileId =
  | "owner"
  | "design-lead"
  | "dev-lead"
  | "participant";

export type ProfileRole = "owner" | "area-lead" | "participant";

export type DemoProfile = {
  id: DemoProfileId;
  name: string;
  role: ProfileRole;
  roleLabel: string;
  area: string;
};

export const DEMO_PROFILES: readonly DemoProfile[] = [
  {
    id: "owner",
    role: "owner",
    name: "Helena Duarte",
    roleLabel: "Dono do projeto",
    area: "Produto/Negócio",
  },
  {
    id: "design-lead",
    role: "area-lead",
    name: "Rafael Moura",
    roleLabel: "Líder de Design",
    area: "Design",
  },
  {
    id: "dev-lead",
    role: "area-lead",
    name: "Camila Tavares",
    roleLabel: "Líder de Dev",
    area: "Desenvolvimento",
  },
  {
    id: "participant",
    role: "participant",
    name: "Bruno Siqueira",
    roleLabel: "Participante",
    area: "QA",
  },
];

export const DEFAULT_PROFILE_ID: DemoProfileId = "owner";

export function isDemoProfileId(value: unknown): value is DemoProfileId {
  return DEMO_PROFILES.some((profile) => profile.id === value);
}

// Never trust the cookie: anything unknown or missing falls back to the default.
export function resolveProfile(cookieValue: string | undefined): DemoProfile {
  const id = isDemoProfileId(cookieValue) ? cookieValue : DEFAULT_PROFILE_ID;
  return DEMO_PROFILES.find((profile) => profile.id === id) ?? DEMO_PROFILES[0];
}

// Roles apply only in the interface (PRD decision 4): only the owner creates projects.
export function canCreateProject(profile: DemoProfile): boolean {
  return profile.role === "owner";
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

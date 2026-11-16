// Pure rules for business rules (stories H3.1.x). No database here.

export type RuleInput = {
  projectId: string;
  featureId: string;
  ruleId: string | null; // null = new rule
  title: string;
  body: string; // Markdown, the source of truth
};

export type RuleRecord = {
  id: string;
  projectId: string;
  featureId: string;
  code: number;
  title: string;
  body: string;
  updatedAt: string;
};

// RN-001, RN-012, RN-123: stable id, unique in the project.
export function formatRuleCode(code: number): string {
  return `RN-${String(code).padStart(3, "0")}`;
}

export function validateRuleInput(input: { title: string; body: string }): string | null {
  if (!input.title.trim()) return "Informe um título para a regra.";
  if (!input.body.trim()) return "Escreva o texto da regra.";
  return null;
}

export function isRuleInput(value: unknown): value is RuleInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.projectId === "string" &&
    typeof v.featureId === "string" &&
    (v.ruleId === null || typeof v.ruleId === "string") &&
    typeof v.title === "string" &&
    typeof v.body === "string"
  );
}

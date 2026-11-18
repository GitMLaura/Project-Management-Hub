// Markdown export of business rules (story H3.1.2). The .md download, the screen and the
// PDF all come from the same Markdown, so they never diverge.
import { normalizeName } from "@/lib/project-validation";
import { formatRuleCode, type RuleRecord } from "@/lib/rules";

export type ExportGroup = { id: string; title: string };

export type ExportScope = { kind: "project" } | { kind: "group"; groupId: string };

export type ExportInput = {
  projectName: string;
  groups: readonly ExportGroup[];
  rules: readonly RuleRecord[];
  scope: ExportScope;
};

// Header lines say exactly what is inside: the project, and the group when the scope is narrower.
export function buildRulesMarkdown(input: ExportInput): string {
  const { projectName, groups, rules, scope } = input;

  const selected = groups.filter((group) => scope.kind === "project" || group.id === scope.groupId);

  const lines: string[] = ["# Regras de negócio", ""];
  lines.push(`- **Projeto:** ${projectName}`);
  if (scope.kind === "group" && selected.length > 0) {
    lines.push(`- **Grupo:** ${selected[0].title}`);
  }
  lines.push("");

  let sections = 0;
  for (const group of selected) {
    const groupRules = rules
      .filter((rule) => rule.featureId === group.id)
      .sort((a, b) => a.code - b.code);
    if (groupRules.length === 0) continue;
    sections += 1;
    lines.push(`## ${group.title}`, "");
    for (const rule of groupRules) {
      lines.push(`### ${formatRuleCode(rule.code)} — ${rule.title}`, "", rule.body.trim(), "");
    }
  }

  if (sections === 0) {
    lines.push("_Nenhuma regra de negócio cadastrada neste escopo._", "");
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// Safe file name: lowercase, no accents, words joined by dashes.
export function exportFileName(label: string, extension: "md" | "pdf"): string {
  const slug = normalizeName(label)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `regras-${slug || "projeto"}.${extension}`;
}

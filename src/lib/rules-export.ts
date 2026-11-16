// Markdown export of business rules (story H3.1.2). The .md download, the screen and the
// PDF all come from the same Markdown, so they never diverge.
import { normalizeName } from "@/lib/project-validation";
import { formatRuleCode, type RuleRecord } from "@/lib/rules";

export type ExportFeature = { id: string; title: string };
export type ExportEpic = { id: string; title: string; features: ExportFeature[] };

export type ExportScope =
  | { kind: "project" }
  | { kind: "epic"; epicId: string }
  | { kind: "feature"; featureId: string };

export type ExportInput = {
  projectName: string;
  epics: readonly ExportEpic[];
  rules: readonly RuleRecord[];
  scope: ExportScope;
};

// Header lines say exactly what is inside: project, and epic and feature when the scope is narrower.
export function buildRulesMarkdown(input: ExportInput): string {
  const { projectName, epics, rules, scope } = input;

  const selected = epics
    .map((epic) => ({
      ...epic,
      features: epic.features.filter(
        (feature) =>
          scope.kind === "project" ||
          (scope.kind === "epic" && epic.id === scope.epicId) ||
          (scope.kind === "feature" && feature.id === scope.featureId),
      ),
    }))
    .filter((epic) => epic.features.length > 0);

  const lines: string[] = ["# Regras de negócio", ""];
  lines.push(`- **Projeto:** ${projectName}`);
  if (scope.kind !== "project" && selected.length > 0) {
    lines.push(`- **Épico:** ${selected[0].title}`);
  }
  if (scope.kind === "feature" && selected.length > 0) {
    lines.push(`- **Funcionalidade:** ${selected[0].features[0].title}`);
  }
  lines.push("");

  let sections = 0;
  for (const epic of selected) {
    for (const feature of epic.features) {
      const featureRules = rules
        .filter((rule) => rule.featureId === feature.id)
        .sort((a, b) => a.code - b.code);
      if (featureRules.length === 0) continue;
      sections += 1;
      lines.push(`## Épico: ${epic.title} › Funcionalidade: ${feature.title}`, "");
      for (const rule of featureRules) {
        lines.push(`### ${formatRuleCode(rule.code)} — ${rule.title}`, "", rule.body.trim(), "");
      }
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

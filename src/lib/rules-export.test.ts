import { describe, expect, it } from "vitest";
import type { RuleRecord } from "@/lib/rules";
import { buildRulesMarkdown, exportFileName, type ExportGroup } from "@/lib/rules-export";

const groups: ExportGroup[] = [
  { id: "g1", title: "Checkout" },
  { id: "g2", title: "Carrinho" },
  { id: "g3", title: "Rastreio" },
];

function rule(code: number, featureId: string, title: string, body: string): RuleRecord {
  return { id: `r${code}`, projectId: "p", featureId, code, title, body, updatedAt: "2026-01-01" };
}

const rules = [
  rule(2, "g1", "Pedido minimo", "O valor minimo é **R$ 15**."),
  rule(1, "g1", "Pagamento", "Aceitar Pix e cartão."),
  rule(3, "g3", "Atualizacao", "A cada 30 segundos."),
];

describe("buildRulesMarkdown", () => {
  it("exports the whole project with one section per group, rules in code order", () => {
    const md = buildRulesMarkdown({ projectName: "Aurora", groups, rules, scope: { kind: "project" } });
    expect(md).toContain("- **Projeto:** Aurora");
    expect(md).not.toContain("**Grupo:**");
    expect(md).toContain("## Checkout");
    expect(md).toContain("## Rastreio");
    expect(md.indexOf("RN-001")).toBeLessThan(md.indexOf("RN-002"));
  });

  it("skips groups without rules", () => {
    const md = buildRulesMarkdown({ projectName: "Aurora", groups, rules, scope: { kind: "project" } });
    expect(md).not.toContain("Carrinho");
  });

  it("names project and group for a group export, and only its rules", () => {
    const md = buildRulesMarkdown({ projectName: "Aurora", groups, rules, scope: { kind: "group", groupId: "g1" } });
    expect(md).toContain("- **Projeto:** Aurora");
    expect(md).toContain("- **Grupo:** Checkout");
    expect(md).not.toContain("RN-003");
  });

  it("keeps the rule text as written (Markdown stays Markdown)", () => {
    const md = buildRulesMarkdown({ projectName: "Aurora", groups, rules, scope: { kind: "project" } });
    expect(md).toContain("### RN-002 — Pedido minimo\n\nO valor minimo é **R$ 15**.");
  });

  it("says so when there are no rules", () => {
    const md = buildRulesMarkdown({ projectName: "Aurora", groups, rules: [], scope: { kind: "project" } });
    expect(md).toContain("Nenhuma regra de negócio cadastrada");
  });

  it("ends with a single newline", () => {
    const md = buildRulesMarkdown({ projectName: "Aurora", groups, rules, scope: { kind: "project" } });
    expect(md.endsWith("\n")).toBe(true);
    expect(md.endsWith("\n\n")).toBe(false);
  });
});

describe("exportFileName", () => {
  it("makes a safe file name", () => {
    expect(exportFileName("Projeto Aurora", "md")).toBe("regras-projeto-aurora.md");
    expect(exportFileName("Épico: Pagamentos & Cobrança", "pdf")).toBe("regras-epico-pagamentos-cobranca.pdf");
  });

  it("falls back when the label is empty", () => {
    expect(exportFileName("???", "md")).toBe("regras-projeto.md");
  });
});

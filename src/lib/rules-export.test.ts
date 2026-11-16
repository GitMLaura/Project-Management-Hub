import { describe, expect, it } from "vitest";
import type { RuleRecord } from "@/lib/rules";
import { buildRulesMarkdown, exportFileName, type ExportEpic } from "@/lib/rules-export";

const epics: ExportEpic[] = [
  {
    id: "e1",
    title: "Pedidos",
    features: [
      { id: "f1", title: "Checkout" },
      { id: "f2", title: "Carrinho" },
    ],
  },
  { id: "e2", title: "Entregas", features: [{ id: "f3", title: "Rastreio" }] },
];

function rule(code: number, featureId: string, title: string, body: string): RuleRecord {
  return { id: `r${code}`, projectId: "p", featureId, code, title, body, updatedAt: "2026-01-01" };
}

const rules = [
  rule(2, "f1", "Pedido minimo", "O valor minimo é **R$ 15**."),
  rule(1, "f1", "Pagamento", "Aceitar Pix e cartão."),
  rule(3, "f3", "Atualizacao", "A cada 30 segundos."),
];

describe("buildRulesMarkdown", () => {
  it("exports the whole project with one section per feature, rules in code order", () => {
    const md = buildRulesMarkdown({ projectName: "Aurora", epics, rules, scope: { kind: "project" } });
    expect(md).toContain("- **Projeto:** Aurora");
    expect(md).not.toContain("**Épico:**");
    expect(md).toContain("## Épico: Pedidos › Funcionalidade: Checkout");
    expect(md).toContain("## Épico: Entregas › Funcionalidade: Rastreio");
    expect(md.indexOf("RN-001")).toBeLessThan(md.indexOf("RN-002"));
  });

  it("skips features without rules", () => {
    const md = buildRulesMarkdown({ projectName: "Aurora", epics, rules, scope: { kind: "project" } });
    expect(md).not.toContain("Carrinho");
  });

  it("header names project and epic for an epic export, and only its features", () => {
    const md = buildRulesMarkdown({
      projectName: "Aurora",
      epics,
      rules,
      scope: { kind: "epic", epicId: "e1" },
    });
    expect(md).toContain("- **Épico:** Pedidos");
    expect(md).not.toContain("**Funcionalidade:**");
    expect(md).not.toContain("Rastreio");
  });

  it("header names project, epic and feature for a feature export", () => {
    const md = buildRulesMarkdown({
      projectName: "Aurora",
      epics,
      rules,
      scope: { kind: "feature", featureId: "f1" },
    });
    expect(md).toContain("- **Projeto:** Aurora");
    expect(md).toContain("- **Épico:** Pedidos");
    expect(md).toContain("- **Funcionalidade:** Checkout");
    expect(md).not.toContain("RN-003");
  });

  it("keeps the rule text as written (Markdown stays Markdown)", () => {
    const md = buildRulesMarkdown({ projectName: "Aurora", epics, rules, scope: { kind: "project" } });
    expect(md).toContain("### RN-002 — Pedido minimo\n\nO valor minimo é **R$ 15**.");
  });

  it("says so when there are no rules", () => {
    const md = buildRulesMarkdown({ projectName: "Aurora", epics, rules: [], scope: { kind: "project" } });
    expect(md).toContain("Nenhuma regra de negócio cadastrada");
  });

  it("ends with a single newline", () => {
    const md = buildRulesMarkdown({ projectName: "Aurora", epics, rules, scope: { kind: "project" } });
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

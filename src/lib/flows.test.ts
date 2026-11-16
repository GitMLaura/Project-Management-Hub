import { describe, expect, it } from "vitest";
import {
  enumeratePaths,
  explainMermaidError,
  findRepeatedSegments,
  isFlowInput,
  normalizeLabel,
  parseFlowchart,
  searchFlows,
  validateFlowInput,
} from "@/lib/flows";

describe("normalizeLabel", () => {
  it("lowercases, strips accents and punctuation, collapses spaces", () => {
    expect(normalizeLabel("  Validar   SENHA?! ")).toBe("validar senha");
    expect(normalizeLabel("Informar e-mail, por favor.")).toBe("informar e mail por favor");
    expect(normalizeLabel("Autenticação")).toBe("autenticacao");
  });

  it("treats labels that differ only by case, accents or punctuation as equal", () => {
    expect(normalizeLabel("Validar senha")).toBe(normalizeLabel("VALIDAR  SENHA!"));
    expect(normalizeLabel("Código enviado")).toBe(normalizeLabel("codigo enviado."));
  });

  it("does not make different words equal", () => {
    expect(normalizeLabel("Validar senha")).not.toBe(normalizeLabel("Conferir senha"));
  });

  it("returns empty for punctuation only", () => {
    expect(normalizeLabel("?!...")).toBe("");
  });
});

describe("parseFlowchart", () => {
  it("reads nodes, labels and chained edges", () => {
    const flow = parseFlowchart("flowchart TD\n  A[Abrir app] --> B(Informar e-mail) --> C{Valido?}\n  C -->|sim| D[Entrar]");
    expect(flow.errors).toEqual([]);
    expect(flow.nodes.map((n) => n.label)).toEqual(["Abrir app", "Informar e-mail", "Valido?", "Entrar"]);
    expect(flow.edges).toEqual([
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "D" },
    ]);
  });

  it("handles quotes, nested parentheses, other arrows and comments", () => {
    const flow = parseFlowchart(
      'graph LR\n%% comentario\nA["Pagar (Pix)"] -.-> B[[Confirmar]]\nB ==> C((Fim));\nstyle A fill:#fff',
    );
    expect(flow.errors).toEqual([]);
    expect(flow.nodes.map((n) => n.label)).toEqual(["Pagar (Pix)", "Confirmar", "Fim"]);
    expect(flow.edges).toHaveLength(2);
  });

  it("a node mentioned again keeps its first label unless a new one is given", () => {
    const flow = parseFlowchart("flowchart TD\nA[Inicio] --> B[Meio]\nB --> C[Fim]");
    expect(flow.nodes.find((n) => n.id === "B")?.label).toBe("Meio");
  });

  it("uses the id as label when there is no text", () => {
    const flow = parseFlowchart("flowchart TD\nA --> B");
    expect(flow.nodes.map((n) => n.label)).toEqual(["A", "B"]);
  });

  it("explains a missing header in plain language", () => {
    const flow = parseFlowchart("A --> B");
    expect(flow.errors[0]).toContain('"flowchart"');
  });

  it("explains an unclosed bracket and says the line", () => {
    const flow = parseFlowchart("flowchart TD\nA[Abrir app --> B");
    expect(flow.errors[0]).toContain("Linha 2");
    expect(flow.errors[0]).toContain("fechado");
  });

  it("reports an empty flow", () => {
    expect(parseFlowchart("").errors.length).toBeGreaterThan(0);
    expect(parseFlowchart("flowchart TD").errors.length).toBeGreaterThan(0);
  });

  it("only warns about lines it cannot read", () => {
    const flow = parseFlowchart("flowchart TD\nA[Um] --> B[Dois]\n??? ###");
    expect(flow.errors).toEqual([]);
    expect(flow.warnings.length).toBeGreaterThan(0);
  });
});

describe("enumeratePaths", () => {
  it("lists every chain of 2 or more steps along the arrows", () => {
    const flow = parseFlowchart("flowchart TD\nA --> B --> C");
    expect(enumeratePaths(flow)).toEqual([["A", "B"], ["A", "B", "C"], ["B", "C"]]);
  });

  it("does not loop forever on cycles", () => {
    const flow = parseFlowchart("flowchart TD\nA --> B --> A");
    expect(enumeratePaths(flow).length).toBeGreaterThan(0);
  });
});

const login = {
  id: "login",
  title: "Login",
  source: "flowchart TD\nA[Abrir app] --> B[Informar e-mail] --> C[Validar senha] --> D[Entrar]",
};
const recover = {
  id: "recover",
  title: "Recuperar acesso",
  source:
    "flowchart TD\nX[Esqueci a senha] --> Y[Informar e-mail!] --> Z[VALIDAR SENHA] --> W[Redefinir]",
};
const other = {
  id: "other",
  title: "Pedido",
  source: "flowchart TD\nP[Escolher prato] --> Q[Pagar] --> R[Acompanhar]",
};

describe("findRepeatedSegments", () => {
  it("finds consecutive steps equal after normalization in different flows", () => {
    const segments = findRepeatedSegments([login, recover, other]);
    expect(segments).toHaveLength(1);
    expect(segments[0].steps).toEqual(["Informar e-mail", "Validar senha"]);
    expect(segments[0].occurrences.map((o) => o.flowId).sort()).toEqual(["login", "recover"]);
  });

  it("keeps only the longest segment when a shorter one is inside it", () => {
    const a = { id: "a", title: "A", source: "flowchart TD\n1[Um] --> 2[Dois] --> 3[Tres] --> 4[Quatro]" };
    const b = { id: "b", title: "B", source: "flowchart TD\n5[um] --> 6[dois] --> 7[tres] --> 8[Cinco]" };
    const segments = findRepeatedSegments([a, b]);
    expect(segments).toHaveLength(1);
    expect(segments[0].steps).toEqual(["Um", "Dois", "Tres"]);
  });

  it("ignores a single repeated step (needs 2 or more consecutive)", () => {
    const a = { id: "a", title: "A", source: "flowchart TD\nA[Pagar] --> B[Um]" };
    const b = { id: "b", title: "B", source: "flowchart TD\nC[Dois] --> D[Pagar]" };
    expect(findRepeatedSegments([a, b])).toEqual([]);
  });

  it("ignores repetition inside the same flow", () => {
    const a = {
      id: "a",
      title: "A",
      source: "flowchart TD\nA[Um] --> B[Dois]\nC[Um] --> D[Dois]",
    };
    expect(findRepeatedSegments([a])).toEqual([]);
  });

  it("does not count steps that are equal but not consecutive in the same order", () => {
    const a = { id: "a", title: "A", source: "flowchart TD\nA[Um] --> B[Dois]" };
    const b = { id: "b", title: "B", source: "flowchart TD\nC[Dois] --> D[Um]" };
    expect(findRepeatedSegments([a, b])).toEqual([]);
  });

  it("skips flows with syntax errors instead of failing", () => {
    expect(findRepeatedSegments([login, { id: "bad", title: "Ruim", source: "nada" }])).toEqual([]);
  });
});

describe("searchFlows", () => {
  const flows = [login, recover, other];

  it("lists the flows where a step appears, ignoring case and accents", () => {
    const result = searchFlows(flows, "VALIDAR senha");
    expect(result.map((m) => m.flowId)).toEqual(["login", "recover"]);
  });

  it("finds part of a step label", () => {
    expect(searchFlows(flows, "pag").map((m) => m.flowId)).toEqual(["other"]);
  });

  it("finds a chain of steps written with >", () => {
    const result = searchFlows(flows, "informar e-mail > validar");
    expect(result.map((m) => m.flowId)).toEqual(["login", "recover"]);
    expect(result[0].steps).toEqual(["Informar e-mail", "Validar senha"]);
  });

  it("does not match a chain in the wrong order", () => {
    expect(searchFlows(flows, "validar > informar")).toEqual([]);
  });

  it("returns nothing for an empty or unknown query", () => {
    expect(searchFlows(flows, "  ")).toEqual([]);
    expect(searchFlows(flows, "teletransporte")).toEqual([]);
  });
});

describe("validateFlowInput", () => {
  it("requires a title and a readable flow", () => {
    expect(validateFlowInput({ title: " ", source: "flowchart TD\nA --> B" })).toContain("título");
    expect(validateFlowInput({ title: "Login", source: "A --> B" })).toContain("flowchart");
    expect(validateFlowInput({ title: "Login", source: "flowchart TD\nA --> B" })).toBeNull();
  });
});

describe("isFlowInput", () => {
  it("checks the shape", () => {
    const base = { projectId: "p", featureId: "f", title: "t", source: "s" };
    expect(isFlowInput({ ...base, flowId: null })).toBe(true);
    expect(isFlowInput({ ...base })).toBe(false);
    expect(isFlowInput(null)).toBe(false);
  });
});

describe("explainMermaidError", () => {
  it("says the line and points to common mistakes", () => {
    const text = explainMermaidError("Parse error on line 3:\n...B --> \n-----^\nExpecting 'SEMI'");
    expect(text).toContain("linha 3");
    expect(text).toContain("setas");
  });

  it("still helps without a line number", () => {
    expect(explainMermaidError("Something odd")).toContain("não entendeu");
  });
});

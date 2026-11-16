import { describe, expect, it } from "vitest";
import { markdownToPdf } from "@/lib/markdown-pdf";

const SAMPLE = `# Regras de negócio

- **Projeto:** Aurora

## Épico: Pedidos › Funcionalidade: Checkout

### RN-001 — Pagamento

Aceitar **Pix** e cartão.

1. Primeiro
2. Segundo
`;

describe("markdownToPdf", () => {
  it("produces a real PDF file", () => {
    const bytes = markdownToPdf(SAMPLE);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("handles an empty document", () => {
    expect(markdownToPdf("").length).toBeGreaterThan(0);
  });

  it("adds pages for long content", () => {
    const long = Array.from({ length: 200 }, (_, i) => `Linha ${i} com algum texto de regra.`).join("\n\n");
    const short = markdownToPdf("Curto");
    expect(markdownToPdf(long).length).toBeGreaterThan(short.length * 2);
  });
});

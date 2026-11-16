// Turns the rules Markdown into a PDF (story H3.1.3). It reads the same Markdown text the
// screen and the .md download use, so the three never diverge.
import { jsPDF } from "jspdf";
import { Lexer, type Token, type Tokens } from "marked";

const MARGIN = 56;
const FONT_SIZES = { 1: 20, 2: 15, 3: 12.5, 4: 11.5, 5: 11, 6: 11 } as const;
const BODY_SIZE = 10.5;

// Plain text of inline Markdown (bold and italics markers are dropped).
function inlineText(tokens: Token[] | undefined, fallback: string): string {
  if (!tokens || tokens.length === 0) return fallback;
  return tokens
    .map((token) => {
      if ("tokens" in token && token.tokens) return inlineText(token.tokens as Token[], token.raw);
      if (token.type === "br") return "\n";
      return "text" in token ? String(token.text) : token.raw;
    })
    .join("");
}

// Standard PDF fonts cover Latin-1 and a few symbols; swap what they cannot draw.
function toPdfText(text: string): string {
  return text
    .replace(/[›»]/g, ">")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/[^\x00-\xFF–—•]/g, "?");
}

export function markdownToPdf(markdown: string): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  function write(
    text: string,
    options: { size: number; style?: "normal" | "bold"; font?: "helvetica" | "courier"; indent?: number; gap?: number },
  ) {
    doc.setFont(options.font ?? "helvetica", options.style ?? "normal");
    doc.setFontSize(options.size);
    const indent = options.indent ?? 0;
    const lines = doc.splitTextToSize(toPdfText(text), maxWidth - indent) as string[];
    const lineHeight = options.size * 1.35;
    for (const line of lines) {
      if (y + lineHeight > pageHeight - MARGIN) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(line, MARGIN + indent, y + options.size);
      y += lineHeight;
    }
    y += options.gap ?? 6;
  }

  function writeList(list: Tokens.List, depth: number) {
    list.items.forEach((item, index) => {
      const marker = list.ordered ? `${Number(list.start || 1) + index}.` : "•";
      const textParts = item.tokens.filter((token) => token.type !== "list");
      const text = textParts.map((token) => inlineText("tokens" in token ? (token.tokens as Token[]) : undefined, token.raw)).join(" ").trim();
      write(`${marker} ${text}`, { size: BODY_SIZE, indent: 14 + depth * 16, gap: 2 });
      item.tokens
        .filter((token): token is Tokens.List => token.type === "list")
        .forEach((nested) => writeList(nested, depth + 1));
    });
    y += 4;
  }

  for (const token of new Lexer().lex(markdown)) {
    switch (token.type) {
      case "heading": {
        const heading = token as Tokens.Heading;
        const size = FONT_SIZES[Math.min(heading.depth, 6) as keyof typeof FONT_SIZES];
        y += heading.depth <= 2 ? 6 : 2;
        write(inlineText(heading.tokens, heading.text), { size, style: "bold", gap: 6 });
        break;
      }
      case "paragraph": {
        const paragraph = token as Tokens.Paragraph;
        write(inlineText(paragraph.tokens, paragraph.text), { size: BODY_SIZE });
        break;
      }
      case "list":
        writeList(token as Tokens.List, 0);
        break;
      case "code":
        write((token as Tokens.Code).text, { size: 9.5, font: "courier", indent: 8 });
        break;
      case "blockquote":
        write(inlineText(undefined, (token as Tokens.Blockquote).text), { size: BODY_SIZE, indent: 12 });
        break;
      case "hr":
        y += 8;
        break;
      default:
        break;
    }
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

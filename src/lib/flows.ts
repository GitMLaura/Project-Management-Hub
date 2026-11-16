// Pure logic for flows (stories H3.2.x): reading Mermaid flowcharts, normalizing step
// labels, finding repeated segments across flows and searching steps. No database here.

export type FlowNode = { id: string; label: string };
export type FlowEdge = { from: string; to: string };

export type ParsedFlow = {
  nodes: FlowNode[]; // in order of appearance
  edges: FlowEdge[];
  errors: string[]; // fatal: the flow cannot be saved
  warnings: string[]; // lines we could not read (Mermaid may still draw them)
};

// Lowercase, no accents, no punctuation, collapsed spaces (PRD section 5.2).
export function normalizeLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const HEADER = /^(flowchart|graph)\b/i;
const DIRECTIVE = /^(subgraph|end|direction|classDef|class|style|linkStyle|click|accTitle|accDescr)\b/i;
const NODE_ID = /^[A-Za-z0-9_À-ɏ]+/;
const EDGE_OP = /^(?:-\.+-[>xo]?|<?(?:-{2,}|={2,})[>xo]?|~{3,})/;
const CLOSERS: Record<string, string> = { "[": "]", "(": ")", "{": "}", ">": "]" };

// Finds where a node shape ends, e.g. in `A[Pagar (Pix)]`. Returns the index after the last
// closer, or -1 when something is left open.
function shapeEnd(text: string, start: number): number {
  const stack: string[] = [];
  let quoted = false;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') quoted = !quoted;
    if (quoted) continue;
    if (stack.length === 0 || CLOSERS[char]) {
      if (CLOSERS[char] && !(char === ">" && stack.length > 0)) {
        stack.push(CLOSERS[char]);
        continue;
      }
    }
    if (char === stack[stack.length - 1]) {
      stack.pop();
      if (stack.length === 0) return i + 1;
    }
  }
  return -1;
}

function cleanLabel(raw: string): string {
  return raw
    .replace(/^[[({>/\\]+/, "")
    .replace(/[\])}/\\]+$/, "")
    .trim()
    .replace(/^"([\s\S]*)"$/, "$1")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseFlowchart(source: string): ParsedFlow {
  const result: ParsedFlow = { nodes: [], edges: [], errors: [], warnings: [] };
  const labels = new Map<string, string>();
  const order: string[] = [];

  const lines = source.split(/\r?\n/);
  let headerFound = false;

  const addNode = (id: string, label: string | null) => {
    if (!labels.has(id)) {
      labels.set(id, label ?? id);
      order.push(id);
    } else if (label !== null) {
      labels.set(id, label);
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const lineNo = index + 1;
    const line = lines[index].trim();
    if (!line || line.startsWith("%%")) continue;

    if (!headerFound) {
      if (!HEADER.test(line)) {
        result.errors.push(
          'A primeira linha deve começar com "flowchart" (por exemplo: flowchart TD).',
        );
        return result;
      }
      headerFound = true;
      continue;
    }
    if (DIRECTIVE.test(line)) continue;

    for (const statement of line.split(";")) {
      let rest = statement.trim();
      if (!rest) continue;
      let previous: string | null = null;
      let failed = false;

      while (rest) {
        const idMatch = NODE_ID.exec(rest);
        if (!idMatch) {
          result.warnings.push(`Linha ${lineNo}: não consegui ler "${rest.slice(0, 30)}".`);
          failed = true;
          break;
        }
        const id = idMatch[0];
        rest = rest.slice(id.length);
        let label: string | null = null;
        if (rest && CLOSERS[rest[0]]) {
          const end = shapeEnd(rest, 0);
          if (end < 0) {
            result.errors.push(
              `Linha ${lineNo}: um colchete, parêntese ou chave foi aberto e não foi fechado.`,
            );
            return result;
          }
          label = cleanLabel(rest.slice(0, end));
          rest = rest.slice(end);
        }
        addNode(id, label);
        if (previous !== null) result.edges.push({ from: previous, to: id });
        previous = id;

        rest = rest.trimStart();
        if (!rest) break;
        const op = EDGE_OP.exec(rest);
        if (!op) {
          result.warnings.push(`Linha ${lineNo}: não consegui ler "${rest.slice(0, 30)}".`);
          failed = true;
          break;
        }
        rest = rest.slice(op[0].length).trimStart();
        if (rest.startsWith("|")) {
          const close = rest.indexOf("|", 1);
          if (close < 0) {
            result.errors.push(`Linha ${lineNo}: o texto da seta começa com "|" e não termina.`);
            return result;
          }
          rest = rest.slice(close + 1).trimStart();
        }
        if (!rest) {
          result.warnings.push(`Linha ${lineNo}: a seta não leva a nenhum passo.`);
          failed = true;
          break;
        }
      }
      if (failed) continue;
    }
  }

  if (!headerFound) {
    result.errors.push("O fluxo está vazio. Comece com: flowchart TD");
    return result;
  }
  result.nodes = order.map((id) => ({ id, label: labels.get(id) ?? id }));
  if (result.nodes.length === 0) {
    result.errors.push("O fluxo não tem nenhum passo ainda.");
  }
  return result;
}

// ---------- Paths, repeated segments and search ----------

export const MAX_SEGMENT_STEPS = 8;
const MAX_PATHS_PER_FLOW = 5000;

// Every chain of 2+ consecutive steps that follows the arrows (no step repeated in a chain).
export function enumeratePaths(flow: ParsedFlow): string[][] {
  const next = new Map<string, Set<string>>();
  for (const edge of flow.edges) {
    if (!next.has(edge.from)) next.set(edge.from, new Set());
    next.get(edge.from)?.add(edge.to);
  }
  const paths: string[][] = [];
  const walk = (path: string[]) => {
    if (paths.length >= MAX_PATHS_PER_FLOW) return;
    if (path.length >= 2) paths.push([...path]);
    if (path.length >= MAX_SEGMENT_STEPS) return;
    for (const target of next.get(path[path.length - 1]) ?? []) {
      if (!path.includes(target)) walk([...path, target]);
    }
  };
  for (const node of flow.nodes) walk([node.id]);
  return paths;
}

export type FlowSource = { id: string; title: string; source: string };

export type SegmentOccurrence = { flowId: string; flowTitle: string; nodeIds: string[] };
export type RepeatedSegment = {
  steps: string[]; // labels as first written
  occurrences: SegmentOccurrence[];
};

function isContiguousPart(small: string[], big: string[]): boolean {
  if (small.length >= big.length) return false;
  for (let start = 0; start + small.length <= big.length; start += 1) {
    if (small.every((item, offset) => big[start + offset] === item)) return true;
  }
  return false;
}

// Sequences of 2+ consecutive steps with equal normalized labels in different flows.
export function findRepeatedSegments(flows: readonly FlowSource[]): RepeatedSegment[] {
  type Entry = { norm: string[]; steps: string[]; occ: Map<string, SegmentOccurrence> };
  const found = new Map<string, Entry>();

  for (const flow of flows) {
    const parsed = parseFlowchart(flow.source);
    if (parsed.errors.length > 0) continue;
    const label = new Map(parsed.nodes.map((node) => [node.id, node.label]));
    for (const path of enumeratePaths(parsed)) {
      const norm = path.map((id) => normalizeLabel(label.get(id) ?? ""));
      if (norm.some((item) => !item)) continue;
      const key = norm.join("\u0001");
      let entry = found.get(key);
      if (!entry) {
        entry = { norm, steps: path.map((id) => label.get(id) ?? id), occ: new Map() };
        found.set(key, entry);
      }
      if (!entry.occ.has(flow.id)) {
        entry.occ.set(flow.id, { flowId: flow.id, flowTitle: flow.title, nodeIds: path });
      }
    }
  }

  const repeated = [...found.values()].filter((entry) => entry.occ.size >= 2);
  const maximal = repeated.filter(
    (entry) =>
      !repeated.some(
        (other) =>
          other !== entry &&
          isContiguousPart(entry.norm, other.norm) &&
          [...entry.occ.keys()].every((flowId) => other.occ.has(flowId)),
      ),
  );

  return maximal
    .sort((a, b) => b.norm.length - a.norm.length || b.occ.size - a.occ.size)
    .map((entry) => ({ steps: entry.steps, occurrences: [...entry.occ.values()] }));
}

export type FlowSearchMatch = { flowId: string; flowTitle: string; steps: string[] };

// Text search for a step ("pagar") or a chain of steps ("login > validar senha").
export function searchFlows(flows: readonly FlowSource[], query: string): FlowSearchMatch[] {
  const terms = query
    .split(/>|→/)
    .map(normalizeLabel)
    .filter(Boolean);
  if (terms.length === 0) return [];

  const matches: FlowSearchMatch[] = [];
  for (const flow of flows) {
    const parsed = parseFlowchart(flow.source);
    if (parsed.errors.length > 0) continue;
    const label = new Map(parsed.nodes.map((node) => [node.id, node.label]));
    const norm = (id: string) => normalizeLabel(label.get(id) ?? "");

    if (terms.length === 1) {
      const hits = parsed.nodes.filter((node) => norm(node.id).includes(terms[0]));
      if (hits.length > 0) {
        matches.push({ flowId: flow.id, flowTitle: flow.title, steps: hits.map((node) => node.label) });
      }
      continue;
    }

    for (const path of enumeratePaths(parsed)) {
      let hit: string[] | null = null;
      for (let start = 0; start + terms.length <= path.length && !hit; start += 1) {
        if (terms.every((term, offset) => norm(path[start + offset]).includes(term))) {
          hit = path.slice(start, start + terms.length).map((id) => label.get(id) ?? id);
        }
      }
      if (hit) {
        matches.push({ flowId: flow.id, flowTitle: flow.title, steps: hit });
        break;
      }
    }
  }
  return matches;
}

// ---------- Saving ----------

export type FlowRecord = {
  id: string;
  projectId: string;
  featureId: string;
  title: string;
  source: string;
};

export type FlowInput = {
  projectId: string;
  featureId: string;
  flowId: string | null; // null = new flow
  title: string;
  source: string;
};

export function isFlowInput(value: unknown): value is FlowInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.projectId === "string" &&
    typeof v.featureId === "string" &&
    (v.flowId === null || typeof v.flowId === "string") &&
    typeof v.title === "string" &&
    typeof v.source === "string"
  );
}

// Returns a message in plain language, or null when the flow can be saved.
export function validateFlowInput(input: { title: string; source: string }): string | null {
  if (!input.title.trim()) return "Informe um título para o fluxo.";
  const parsed = parseFlowchart(input.source);
  return parsed.errors[0] ?? null;
}

// Turns a Mermaid error into something a non-developer can act on.
export function explainMermaidError(message: string): string {
  const line = /line (\d+)/i.exec(message)?.[1];
  const near = message
    .split("\n")
    .map((part) => part.trim())
    .find((part, index) => index > 0 && part && !part.startsWith("^") && !part.startsWith("Expecting"));
  const where = line ? ` na linha ${line}` : "";
  const hint = near ? ` Confira o texto perto de: "${near.slice(0, 60)}".` : "";
  return `O Mermaid não entendeu o diagrama${where}.${hint} Verifique as setas (-->), os colchetes e os parênteses.`;
}

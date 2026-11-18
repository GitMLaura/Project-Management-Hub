// Data of the "quadros de fluxo": for each flow, its steps in order, the screen linked to
// each step and a warning when one of those screens is repeated or looks like another.
// Pure: no database here.
import { parseFlowchart, type FlowRecord } from "@/lib/flows";
import { groupScreens, type ScreenGroup, type ScreenRecord } from "@/lib/screens";

export type BoardStep = {
  id: string; // node id in the Mermaid text
  label: string;
  screen: ScreenRecord | null;
};

export type BoardWarning = {
  kind: "exact" | "similar";
  names: string[]; // every screen of the repeated or similar set, by name
};

export type FlowBoard = {
  flow: FlowRecord;
  steps: BoardStep[];
  warnings: BoardWarning[];
};

export function buildFlowBoards(input: {
  flows: readonly FlowRecord[];
  // flow id -> (step id -> screen id)
  links: Record<string, Record<string, string>>;
  screens: readonly ScreenRecord[];
}): FlowBoard[] {
  const screenById = new Map(input.screens.map((screen) => [screen.id, screen]));
  const sets: ScreenGroup[] = groupScreens([...input.screens]);

  return input.flows.map((flow) => {
    const parsed = parseFlowchart(flow.source);
    const flowLinks = input.links[flow.id] ?? {};
    const steps = parsed.errors.length > 0
      ? []
      : parsed.nodes.map((node) => ({
          id: node.id,
          label: node.label,
          screen: screenById.get(flowLinks[node.id] ?? "") ?? null,
        }));

    const used = new Set(steps.flatMap((step) => (step.screen ? [step.screen.id] : [])));
    const warnings = sets
      .filter((set) => set.screens.some((screen) => used.has(screen.id)))
      .map((set): BoardWarning => ({ kind: set.kind, names: set.screens.map((screen) => screen.name) }));

    return { flow, steps, warnings };
  });
}

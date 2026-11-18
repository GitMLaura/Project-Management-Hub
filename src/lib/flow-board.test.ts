import { describe, expect, it } from "vitest";
import { buildFlowBoards } from "@/lib/flow-board";
import type { FlowRecord } from "@/lib/flows";
import type { ScreenRecord } from "@/lib/screens";

function screen(id: string, sha: string, phash: string): ScreenRecord {
  return {
    id, projectId: "p", featureId: "g", name: `Tela ${id}`, storagePath: id, sha256: sha, phash,
    width: 10, height: 10, sizeBytes: 1, isReference: false,
  };
}

const flow = (id: string, source: string): FlowRecord => ({ id, projectId: "p", featureId: "g", title: `Fluxo ${id}`, source });

const ZERO = "0".repeat(16);
const FAR = "f".repeat(16);

describe("buildFlowBoards", () => {
  const flows = [
    flow("f1", "flowchart TD\nA[Entrar] --> B[Cardápio]\nB --> C[Pagar]"),
    flow("f2", "flowchart TD\nA[Recuperar] --> B[Entrar]"),
  ];
  const screens = [screen("s1", "x", ZERO), screen("s2", "x", ZERO), screen("s3", "y", FAR)];
  const links = { f1: { A: "s1", C: "s3" }, f2: { B: "s2" } };
  const boards = buildFlowBoards({ flows, links, screens });

  it("lists the steps in order with the screen linked to each one", () => {
    expect(boards[0].steps.map((step) => [step.label, step.screen?.id ?? null])).toEqual([
      ["Entrar", "s1"],
      ["Cardápio", null],
      ["Pagar", "s3"],
    ]);
  });

  it("warns, in every flow that uses them, about identical screens", () => {
    expect(boards[0].warnings).toEqual([{ kind: "exact", names: ["Tela s1", "Tela s2"] }]);
    expect(boards[1].warnings).toEqual([{ kind: "exact", names: ["Tela s1", "Tela s2"] }]);
  });

  it("does not warn about screens that are different", () => {
    const only = buildFlowBoards({ flows: [flows[0]], links: { f1: { C: "s3" } }, screens });
    expect(only[0].warnings).toEqual([]);
  });

  it("gives a flow with unreadable text no steps", () => {
    const broken = buildFlowBoards({ flows: [flow("f3", "texto solto")], links: {}, screens: [] });
    expect(broken[0].steps).toEqual([]);
  });
});

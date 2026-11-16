import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeImage } from "@/lib/image-analysis";
import { findRepeatedSegments } from "@/lib/flows";
import { buildHealthPanel } from "@/lib/health-panel";
import type { ItemRecord } from "@/lib/item-tree";
import { buildItemTree } from "@/lib/item-tree";
import { groupScreens, type ScreenRecord } from "@/lib/screens";
import { parseTranscript } from "@/lib/transcripts";
import { AREAS, EPICS, FLOWS, PEOPLE, PROJECT, SCREENS } from "./aurora";
import { RITUALS } from "./rituals";
import { renderScreen } from "./screens";
import { countSeed, validateSeed } from "./validate";

const TODAY = "2026-11-16"; // any day works: dates in the seed are offsets from the run day

function day(offset: number): string {
  const date = new Date(`${TODAY}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

describe("Aurora seed", () => {
  it("is consistent", () => {
    expect(validateSeed()).toEqual([]);
  });

  it("has the size the PRD asks for", () => {
    const counts = countSeed();
    expect(counts.people).toBe(8);
    expect(counts.epics).toBeGreaterThanOrEqual(2);
    expect(counts.epics).toBeLessThanOrEqual(3);
    expect(counts.features).toBeGreaterThanOrEqual(6);
    expect(counts.features).toBeLessThanOrEqual(8);
    expect(counts.stories).toBe(12);
    expect(counts.tasks).toBeGreaterThanOrEqual(30);
    expect(counts.tasks).toBeLessThanOrEqual(40);
    expect(counts.flows).toBeGreaterThanOrEqual(2);
    expect(counts.screens).toBe(8);
    expect(counts.rituals).toBe(5);
    expect(counts.rules).toBeGreaterThanOrEqual(8);
  });

  it("includes the four demo profiles", () => {
    const names = PEOPLE.map((person) => person.name);
    for (const name of ["Helena Duarte", "Rafael Moura", "Camila Tavares", "Bruno Siqueira"]) {
      expect(names).toContain(name);
    }
  });

  it("shows the three health colors, with delays in Desenvolvimento", () => {
    const areaId = new Map(AREAS.map((name) => [name, `area-${name}`]));
    const personId = new Map(PEOPLE.map((person) => [person.name, `p-${person.name}`]));
    const records: ItemRecord[] = [];
    let counter = 0;
    const base = (type: ItemRecord["type"], parentId: string | null, title: string) => ({
      id: `i${(counter += 1)}`,
      parentId,
      type,
      title,
      description: "",
      storyPersona: null,
      storyAction: null,
      storyBenefit: null,
      acceptanceCriteria: [],
      archivedAt: null,
    });
    for (const epic of EPICS) {
      const epicRecord: ItemRecord = {
        ...base("epic", null, epic.title),
        areaId: areaId.get(epic.area)!,
        assigneeId: personId.get(epic.assignee)!,
        startDate: day(epic.start),
        deadline: day(epic.due),
        status: "em_andamento",
        isCritical: false,
      };
      records.push(epicRecord);
      for (const feature of epic.features) {
        const featureRecord: ItemRecord = {
          ...base("feature", epicRecord.id, feature.title),
          areaId: areaId.get(feature.area)!,
          assigneeId: personId.get(feature.assignee)!,
          startDate: day(feature.start),
          deadline: day(feature.due),
          status: "em_andamento",
          isCritical: false,
        };
        records.push(featureRecord);
        for (const story of feature.stories) {
          const storyRecord: ItemRecord = {
            ...base("story", featureRecord.id, story.title),
            areaId: areaId.get(story.area)!,
            assigneeId: personId.get(story.assignee)!,
            startDate: day(story.start),
            deadline: day(story.due),
            status: "em_andamento",
            isCritical: false,
          };
          records.push(storyRecord);
          for (const t of story.tasks) {
            records.push({
              ...base("task", storyRecord.id, t.title),
              areaId: areaId.get(t.area)!,
              assigneeId: personId.get(t.assignee)!,
              startDate: null,
              deadline: day(t.due),
              status: t.status,
              isCritical: Boolean(t.critical),
            });
          }
        }
      }
    }

    const panel = buildHealthPanel({
      projectName: PROJECT.name,
      projectStart: day(PROJECT.start),
      projectDeadline: day(PROJECT.due),
      areas: AREAS.map((name) => ({ id: areaId.get(name)!, name })),
      tree: buildItemTree(records),
      today: TODAY,
    });

    const colors = (entries: { health: { color: string } }[]) => entries.map((entry) => entry.health.color);
    expect(panel.epics.map((entry) => [entry.name, entry.health.color])).toEqual([
      ["Conta e acesso", "green"],
      ["Pedido e entrega", "red"],
      ["Restaurantes parceiros", "yellow"],
    ]);
    expect(panel.areas.map((entry) => [entry.name, entry.health.color])).toEqual([
      ["Produto/Negócio", "green"],
      ["Design", "yellow"],
      ["Desenvolvimento", "red"],
      ["QA", "green"],
    ]);
    expect(new Set([...colors(panel.epics), ...colors(panel.areas)])).toEqual(new Set(["green", "yellow", "red"]));
  });

  it("has repeated flow segments on purpose", () => {
    const segments = findRepeatedSegments(FLOWS.map((flow) => ({ id: flow.featureKey, title: flow.title, source: flow.source })));
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.some((segment) => segment.occurrences.length >= 2 && segment.steps.length >= 2)).toBe(true);
  });

  it("draws screens with 2 identical and 1 almost identical", () => {
    const records: ScreenRecord[] = SCREENS.map((spec) => {
      const analysis = analyzeImage(renderScreen(spec));
      return {
        id: spec.key,
        projectId: "p",
        featureId: spec.featureKey,
        name: spec.name,
        storagePath: "x",
        sha256: analysis.sha256,
        phash: analysis.phash,
        width: analysis.width,
        height: analysis.height,
        sizeBytes: 1,
        isReference: false,
      };
    });
    const groups = groupScreens(records);
    expect(groups.map((group) => [group.kind, group.screens.map((screen) => screen.id)])).toEqual([
      ["exact", ["login", "login-copy"]],
      ["similar", ["payment", "payment-v2"]],
    ]);
    const payment = records.find((record) => record.id === "payment")!;
    const variation = records.find((record) => record.id === "payment-v2")!;
    expect(payment.sha256).not.toBe(variation.sha256);
  });

  it("reads every transcript file", () => {
    for (const ritual of RITUALS) {
      const file = path.join(__dirname, "transcripts", ritual.file);
      const text = parseTranscript(ritual.file, readFileSync(file, "utf8"));
      expect(text.length).toBeGreaterThan(200);
      expect(ritual.summaries.length).toBeGreaterThan(0);
    }
  });
});

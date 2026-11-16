import { describe, expect, it } from "vitest";
import {
  calculateHealth,
  expectedProgress,
  type HealthInput,
  type HealthItem,
} from "@/lib/health";

const TODAY = "2026-06-15";

function task(id: string, overrides: Partial<HealthItem> = {}): HealthItem {
  return {
    id,
    title: id,
    type: "task",
    status: "a_fazer",
    deadline: "2026-12-31",
    isCritical: false,
    assigneeId: "u1",
    ...overrides,
  };
}

// Period of 100 days with today exactly at 50%: expected progress = 50%.
function input(items: HealthItem[], overrides: Partial<HealthInput> = {}): HealthInput {
  return {
    items,
    today: TODAY,
    periodStart: "2026-04-26",
    periodDeadline: "2026-08-04",
    ...overrides,
  };
}

// Tasks 50% done, matching the expected 50%.
const onTrack = (): HealthItem[] => [
  task("a", { status: "concluido" }),
  task("b"),
];

describe("expectedProgress", () => {
  it("is the share of the period already elapsed", () => {
    expect(expectedProgress("2026-06-15", "2026-04-26", "2026-08-04")).toBeCloseTo(50, 0);
  });

  it("is limited between 0 and 100", () => {
    expect(expectedProgress("2026-01-01", "2026-04-26", "2026-08-04")).toBe(0);
    expect(expectedProgress("2027-01-01", "2026-04-26", "2026-08-04")).toBe(100);
  });

  it("handles a period of a single day", () => {
    expect(expectedProgress("2026-06-14", "2026-06-15", "2026-06-15")).toBe(0);
    expect(expectedProgress("2026-06-15", "2026-06-15", "2026-06-15")).toBe(100);
  });
});

describe("calculateHealth: green", () => {
  it("is green when nothing is wrong", () => {
    const result = calculateHealth(input(onTrack()));
    expect(result.color).toBe("green");
    expect(result.label).toBe("Verde");
    expect(result.reasons).toEqual([]);
    expect(result.summary).toContain("Verde");
  });

  it("is green for an empty scope", () => {
    expect(calculateHealth(input([])).color).toBe("green");
  });

  it("a task due today is not late", () => {
    const items = [task("a", { status: "concluido" }), task("b", { deadline: TODAY })];
    expect(calculateHealth(input(items)).color).toBe("green");
  });

  it("a finished task past its deadline is not late", () => {
    const items = [task("a", { status: "concluido", deadline: "2026-01-01" }), task("b")];
    expect(calculateHealth(input(items)).color).toBe("green");
  });

  it("a deviation of exactly 10 p.p. stays green", () => {
    // 4 tasks, 1 done = 25% real, expected 35% => deviation 10 (not greater than 10).
    const items = [task("a", { status: "concluido" }), task("b"), task("c"), task("d")];
    const result = calculateHealth(
      input(items, { today: "2026-05-31", periodStart: "2026-04-26", periodDeadline: "2026-08-04" }),
    );
    expect(result.color).toBe("green");
  });
});

describe("calculateHealth: yellow", () => {
  it("is yellow with 1 or 2 late tasks", () => {
    const one = calculateHealth(
      input([task("a", { status: "concluido" }), task("c", { deadline: "2026-06-01" })]),
    );
    expect(one.color).toBe("yellow");
    expect(one.summary).toBe("Amarelo: 1 tarefa atrasada");
    const two = calculateHealth(
      input([task("a", { status: "concluido" }), task("b", { deadline: "2026-06-01" }), task("c", { deadline: "2026-06-02" })]),
    );
    expect(two.color).toBe("yellow");
    const late = two.reasons.find((r) => r.text.includes("atrasadas"));
    expect(late?.itemIds).toEqual(["b", "c"]);
  });

  it("is yellow when any item is blocked", () => {
    const result = calculateHealth(
      input([task("a", { status: "concluido" }), task("c", { status: "bloqueado" })]),
    );
    expect(result.color).toBe("yellow");
    expect(result.reasons[0].text).toBe("1 item bloqueado");
    expect(result.reasons[0].itemIds).toEqual(["c"]);
  });

  it("is yellow when the deviation is more than 10 p.p.", () => {
    // expected 50%, real 25% => deviation 25: not greater than 25, so yellow.
    const items = [task("a", { status: "concluido" }), task("b"), task("c"), task("d")];
    const result = calculateHealth(input(items));
    expect(result.color).toBe("yellow");
    expect(result.reasons[0].text).toContain("desvio de");
  });
});

describe("calculateHealth: red", () => {
  it("is red with 3 or more late tasks", () => {
    const items = [
      task("a", { status: "concluido" }),
      task("b", { deadline: "2026-06-01" }),
      task("c", { deadline: "2026-06-02" }),
      task("d", { deadline: "2026-06-03" }),
    ];
    const result = calculateHealth(input(items, { scopeLabel: "em Dev" }));
    expect(result.color).toBe("red");
    expect(result.summary).toContain("Vermelho: 3 tarefas atrasadas em Dev");
  });

  it("is red when a critical item is late", () => {
    const items = [...onTrack(), task("c", { isCritical: true, deadline: "2026-06-01" })];
    const result = calculateHealth(input(items));
    expect(result.color).toBe("red");
    expect(result.reasons.some((r) => r.text.includes("crítico"))).toBe(true);
  });

  it("is red when a critical item of any level is blocked", () => {
    const items = [...onTrack(), { ...task("f"), type: "feature" as const, isCritical: true, status: "bloqueado" as const }];
    expect(calculateHealth(input(items)).color).toBe("red");
  });

  it("a finished critical item does not count", () => {
    const items = [...onTrack(), task("c", { isCritical: true, status: "concluido", deadline: "2026-01-01" })];
    expect(calculateHealth(input(items)).color).toBe("green");
  });

  it("is red when the deviation is more than 25 p.p.", () => {
    // 5 tasks, none done: real 0%, expected 50% => deviation 50.
    const items = ["a", "b", "c", "d", "e"].map((id) => task(id));
    const result = calculateHealth(input(items));
    expect(result.color).toBe("red");
    expect(result.reasons[0].text).toContain("desvio de 50 p.p.");
  });

  it("is red for an item without an owner due in up to 7 days", () => {
    const items = [...onTrack(), task("c", { assigneeId: null, deadline: "2026-06-22" })];
    const result = calculateHealth(input(items));
    expect(result.color).toBe("red");
    expect(result.reasons[0].text).toContain("sem responsável");
  });

  it("an item without an owner due in 8 days is not red", () => {
    const items = [task("a", { status: "concluido" }), task("c", { assigneeId: null, deadline: "2026-06-23" })];
    expect(calculateHealth(input(items)).color).toBe("green");
  });
});

describe("calculateHealth: the most serious color wins", () => {
  it("shows only the red reasons when yellow and red conditions both apply", () => {
    const items = [
      task("a", { status: "concluido" }),
      task("b", { status: "bloqueado" }), // yellow
      task("c", { isCritical: true, deadline: "2026-06-01" }), // red (and 1 late task: yellow)
    ];
    const result = calculateHealth(input(items));
    expect(result.color).toBe("red");
    expect(result.reasons.every((r) => r.level === "red")).toBe(true);
  });
});

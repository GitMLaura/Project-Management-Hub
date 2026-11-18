import { describe, expect, it } from "vitest";
import { buildHomeSnapshot } from "@/lib/home-snapshot";

describe("buildHomeSnapshot", () => {
  it("returns zeros when there are no projects", () => {
    expect(buildHomeSnapshot([])).toEqual({
      projects: 0,
      healthy: 0,
      attention: 0,
      yellow: 0,
      red: 0,
      doneTasks: 0,
      totalTasks: 0,
      progressPercent: 0,
      lateTasks: 0,
    });
  });

  it("adds up tasks and splits projects by health", () => {
    const snapshot = buildHomeSnapshot([
      { health: "green", doneTasks: 3, totalTasks: 4, lateTasks: 0 },
      { health: "red", doneTasks: 1, totalTasks: 4, lateTasks: 3 },
      { health: "yellow", doneTasks: 0, totalTasks: 0, lateTasks: 1 },
    ]);
    expect(snapshot.projects).toBe(3);
    expect(snapshot.healthy).toBe(1);
    expect(snapshot.attention).toBe(2);
    expect(snapshot.yellow).toBe(1);
    expect(snapshot.red).toBe(1);
    expect(snapshot.doneTasks).toBe(4);
    expect(snapshot.totalTasks).toBe(8);
    expect(snapshot.progressPercent).toBe(50);
    expect(snapshot.lateTasks).toBe(4);
  });
});

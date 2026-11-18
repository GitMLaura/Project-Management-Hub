import { describe, expect, it } from "vitest";
import { menuKinds, pickMeetings } from "@/lib/ritual-menu";

const meetings = [
  { id: "a", kind: "daily" as const, heldOn: "2026-11-10" },
  { id: "b", kind: "daily" as const, heldOn: "2026-11-12" },
  { id: "c", kind: "planning" as const, heldOn: "2026-10-20" },
];

describe("menuKinds", () => {
  it("lists daily, weekly, retro and planning, with counts, and hides an empty review", () => {
    expect(menuKinds(meetings).map((item) => [item.value, item.count])).toEqual([
      ["daily", 2], ["weekly", 0], ["retro", 0], ["planning", 1],
    ]);
  });
  it("shows review when there is one", () => {
    expect(menuKinds([{ id: "r", kind: "review", heldOn: "2026-11-01" }]).some((item) => item.value === "review")).toBe(true);
  });
});

describe("pickMeetings", () => {
  it("shows the newest encontro of the kind", () => {
    expect(pickMeetings(meetings, "daily", undefined).current?.id).toBe("b");
  });
  it("shows the asked encontro", () => {
    expect(pickMeetings(meetings, "daily", "a").current?.id).toBe("a");
  });
  it("falls back to the first kind that has encontros, and to nothing when the kind is empty", () => {
    expect(pickMeetings(meetings, "x", undefined).kind).toBe("daily");
    expect(pickMeetings(meetings, "retro", undefined).current).toBeNull();
  });
});

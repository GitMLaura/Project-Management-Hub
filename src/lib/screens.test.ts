import { describe, expect, it } from "vitest";
import {
  DEFAULT_SIMILARITY_THRESHOLD,
  groupScreens,
  hammingDistance,
  parseThreshold,
  type ScreenRecord,
} from "./screens";

function screen(id: string, sha: string, phash: string): ScreenRecord {
  return {
    id,
    projectId: "p",
    featureId: "f",
    name: id,
    storagePath: `p/${id}.png`,
    sha256: sha.repeat(64).slice(0, 64),
    phash,
    width: 10,
    height: 10,
    sizeBytes: 1,
    isReference: false,
  };
}

const ZERO = "0000000000000000";
const FAR = "ffffffffffffffff";
const NEAR = "0000000000000007"; // 3 bits away from ZERO

describe("hammingDistance", () => {
  it("counts different bits", () => {
    expect(hammingDistance(ZERO, ZERO)).toBe(0);
    expect(hammingDistance(ZERO, NEAR)).toBe(3);
    expect(hammingDistance(ZERO, FAR)).toBe(64);
  });
});

describe("groupScreens", () => {
  it("groups exact copies as exact", () => {
    const groups = groupScreens([screen("a", "a", ZERO), screen("b", "a", ZERO), screen("c", "c", FAR)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].kind).toBe("exact");
    expect(groups[0].screens.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("groups look-alikes as similar", () => {
    const groups = groupScreens([screen("a", "a", ZERO), screen("b", "b", NEAR)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].kind).toBe("similar");
  });

  it("respects the threshold", () => {
    const list = [screen("a", "a", ZERO), screen("b", "b", NEAR)];
    expect(groupScreens(list, 2)).toHaveLength(0);
    expect(groupScreens(list, 3)).toHaveLength(1);
  });

  it("joins chains and leaves unique screens out", () => {
    const groups = groupScreens([
      screen("a", "a", ZERO),
      screen("b", "a", FAR), // copy of a (same file) but different hash
      screen("c", "c", FAR),
      screen("d", "d", "0f0f0f0f0f0f0f0f"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].screens.map((s) => s.id)).toEqual(["a", "b", "c"]);
    expect(groups[0].kind).toBe("similar");
  });

  it("returns nothing for empty or single lists", () => {
    expect(groupScreens([])).toEqual([]);
    expect(groupScreens([screen("a", "a", ZERO)])).toEqual([]);
  });
});

describe("parseThreshold", () => {
  it("uses the default when invalid", () => {
    expect(parseThreshold(undefined)).toBe(DEFAULT_SIMILARITY_THRESHOLD);
    expect(parseThreshold("abc")).toBe(DEFAULT_SIMILARITY_THRESHOLD);
    expect(parseThreshold("-1")).toBe(DEFAULT_SIMILARITY_THRESHOLD);
    expect(parseThreshold("99")).toBe(DEFAULT_SIMILARITY_THRESHOLD);
  });
  it("accepts values in range", () => {
    expect(parseThreshold("0")).toBe(0);
    expect(parseThreshold("5")).toBe(5);
  });
});

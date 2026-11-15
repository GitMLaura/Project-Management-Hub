import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROFILE_ID,
  DEMO_PROFILES,
  getInitials,
  isDemoProfileId,
  resolveProfile,
} from "@/lib/demo-profiles";

describe("DEMO_PROFILES", () => {
  it("has the four profiles from the PRD with unique ids", () => {
    expect(DEMO_PROFILES).toHaveLength(4);
    const ids = DEMO_PROFILES.map((profile) => profile.id);
    expect(new Set(ids).size).toBe(4);
  });

  it("includes the default profile", () => {
    expect(isDemoProfileId(DEFAULT_PROFILE_ID)).toBe(true);
  });
});

describe("isDemoProfileId", () => {
  it("accepts known ids", () => {
    expect(isDemoProfileId("owner")).toBe(true);
    expect(isDemoProfileId("dev-lead")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isDemoProfileId("admin")).toBe(false);
    expect(isDemoProfileId("")).toBe(false);
    expect(isDemoProfileId(undefined)).toBe(false);
    expect(isDemoProfileId(42)).toBe(false);
  });
});

describe("resolveProfile", () => {
  it("returns the profile for a valid cookie value", () => {
    expect(resolveProfile("design-lead").roleLabel).toBe("Líder de Design");
  });

  it("falls back to the default when the cookie is missing", () => {
    expect(resolveProfile(undefined).id).toBe(DEFAULT_PROFILE_ID);
  });

  it("falls back to the default when the cookie is invalid", () => {
    expect(resolveProfile("hacker").id).toBe(DEFAULT_PROFILE_ID);
  });
});

describe("getInitials", () => {
  it("uses first and last name", () => {
    expect(getInitials("Helena Duarte")).toBe("HD");
    expect(getInitials("Ana Maria de Souza")).toBe("AS");
  });

  it("handles a single name and extra spaces", () => {
    expect(getInitials("  bruno ")).toBe("B");
  });

  it("returns empty for an empty name", () => {
    expect(getInitials("   ")).toBe("");
  });
});

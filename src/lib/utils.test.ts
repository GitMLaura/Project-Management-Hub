import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins class names and ignores falsy values", () => {
    expect(cn("a", false, "b")).toBe("a b");
  });

  it("keeps the last conflicting Tailwind class", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

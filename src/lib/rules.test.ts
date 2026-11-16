import { describe, expect, it } from "vitest";
import { formatRuleCode, isRuleInput, validateRuleInput } from "@/lib/rules";

describe("formatRuleCode", () => {
  it("pads the code to three digits", () => {
    expect(formatRuleCode(1)).toBe("RN-001");
    expect(formatRuleCode(42)).toBe("RN-042");
    expect(formatRuleCode(123)).toBe("RN-123");
  });

  it("keeps larger numbers whole", () => {
    expect(formatRuleCode(1234)).toBe("RN-1234");
  });
});

describe("validateRuleInput", () => {
  it("requires a title and a body", () => {
    expect(validateRuleInput({ title: " ", body: "x" })).not.toBeNull();
    expect(validateRuleInput({ title: "x", body: "  " })).not.toBeNull();
    expect(validateRuleInput({ title: "Pedido minimo", body: "Valor minimo de R$ 15." })).toBeNull();
  });
});

describe("isRuleInput", () => {
  it("accepts a new rule and an existing one", () => {
    const base = { projectId: "p", featureId: "f", title: "t", body: "b" };
    expect(isRuleInput({ ...base, ruleId: null })).toBe(true);
    expect(isRuleInput({ ...base, ruleId: "r" })).toBe(true);
  });

  it("rejects bad shapes", () => {
    expect(isRuleInput(null)).toBe(false);
    expect(isRuleInput({ projectId: "p" })).toBe(false);
  });
});

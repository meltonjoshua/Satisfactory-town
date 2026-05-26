import { describe, it, expect } from "vitest";
import { validateForm, type CalculatorFormState } from "../src/hooks/useCalculatorForm";

describe("validateForm", () => {
  it("returns error when targetItem is empty", () => {
    const state: CalculatorFormState = {
      targetItem: "",
      targetRate: 30,
      preferredAlts: [],
      excludedResources: [],
      errors: {},
    };
    const errors = validateForm(state);
    expect(errors.targetItem).toBe("Please select a target product");
  });

  it("returns error when targetRate is zero", () => {
    const state: CalculatorFormState = {
      targetItem: "iron-ingot",
      targetRate: 0,
      preferredAlts: [],
      excludedResources: [],
      errors: {},
    };
    const errors = validateForm(state);
    expect(errors.targetRate).toBe("Target rate must be greater than 0");
  });

  it("returns error when targetRate is negative", () => {
    const state: CalculatorFormState = {
      targetItem: "iron-ingot",
      targetRate: -5,
      preferredAlts: [],
      excludedResources: [],
      errors: {},
    };
    const errors = validateForm(state);
    expect(errors.targetRate).toBe("Target rate must be greater than 0");
  });

  it("returns error when targetRate is unreasonably high", () => {
    const state: CalculatorFormState = {
      targetItem: "iron-ingot",
      targetRate: 200000,
      preferredAlts: [],
      excludedResources: [],
      errors: {},
    };
    const errors = validateForm(state);
    expect(errors.targetRate).toBe("Target rate seems unreasonably high");
  });

  it("returns no errors for valid form", () => {
    const state: CalculatorFormState = {
      targetItem: "iron-ingot",
      targetRate: 30,
      preferredAlts: [],
      excludedResources: [],
      errors: {},
    };
    const errors = validateForm(state);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("returns no errors for valid form with alternate recipes", () => {
    const state: CalculatorFormState = {
      targetItem: "reinforced-iron-plate",
      targetRate: 10,
      preferredAlts: ["stitched-iron-plate"],
      excludedResources: [],
      errors: {},
    };
    const errors = validateForm(state);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("returns no errors for valid form with resource constraints", () => {
    const state: CalculatorFormState = {
      targetItem: "iron-ingot",
      targetRate: 30,
      preferredAlts: [],
      excludedResources: ["no-sulfur"],
      errors: {},
    };
    const errors = validateForm(state);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("returns multiple errors when multiple fields are invalid", () => {
    const state: CalculatorFormState = {
      targetItem: "",
      targetRate: 0,
      preferredAlts: [],
      excludedResources: [],
      errors: {},
    };
    const errors = validateForm(state);
    expect(errors.targetItem).toBeDefined();
    expect(errors.targetRate).toBeDefined();
  });

  it("accepts small positive targetRate", () => {
    const state: CalculatorFormState = {
      targetItem: "iron-ingot",
      targetRate: 0.01,
      preferredAlts: [],
      excludedResources: [],
      errors: {},
    };
    const errors = validateForm(state);
    expect(errors.targetRate).toBeUndefined();
  });

  it("accepts exactly 100000 targetRate", () => {
    const state: CalculatorFormState = {
      targetItem: "iron-ingot",
      targetRate: 100000,
      preferredAlts: [],
      excludedResources: [],
      errors: {},
    };
    const errors = validateForm(state);
    expect(errors.targetRate).toBeUndefined();
  });
});
export interface CalculatorFormState {
  targetItem: string;
  targetRate: number;
  preferredAlts: string[];
  excludedResources: string[];
  errors: Record<string, string>;
}

export function validateForm(state: CalculatorFormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!state.targetItem) {
    errors.targetItem = "Please select a target product";
  }

  if (!state.targetRate || state.targetRate <= 0) {
    errors.targetRate = "Target rate must be greater than 0";
  }

  if (state.targetRate > 100000) {
    errors.targetRate = "Target rate seems unreasonably high";
  }

  return errors;
}
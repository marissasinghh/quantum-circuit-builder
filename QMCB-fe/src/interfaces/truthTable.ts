/**
 * DTO: shape of a truth table returned by the backend.
 */

export interface TruthTableDTO {
  input: readonly string[];
  output: readonly string[];
  probabilities?: readonly (readonly number[])[];
  amplitudes?: readonly (readonly [number, number])[][];
}

/** One row passed from the controller to the display layer. */
export interface TruthRow {
  input: string;
  trial: string;
  target: string;
  ok: boolean;
  trialProbabilities?: readonly number[];
  targetProbabilities?: readonly number[];
  amplitudes?: readonly (readonly [number, number])[];
}

/**
 * DTO: shape of a truth table returned by the backend.
 */

export interface TruthTableDTO {
  input: readonly string[];
  output: readonly string[];
  probabilities?: readonly (readonly number[])[];
  amplitudes?: readonly (readonly [number, number])[][];
}

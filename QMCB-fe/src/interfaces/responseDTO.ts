/**
 * DTO: top-level simulation response from the backend.
 * The frontend only renders this; no simulation on FE.
 */

import type { TruthTableDTO } from "./truthTable";

export interface SimulationResponseDTO {
  message: string;
  /**
   * Null for random-theta grading (Rx/Ry levels) — the backend grades via
   * unitary matrix comparison across sampled angles and returns no row-by-row table.
   */
  trial_truth_table: TruthTableDTO | null;
  target_truth_table: TruthTableDTO | null;
  /** True when the trial circuit is accepted — either exact string match or global-phase equivalence. */
  all_match: boolean;
  validation_mode: boolean;
  /** "random_theta" for Rx/Ry levels; null for all wavefunction-based levels. */
  grading_mode: "random_theta" | null;
  /** Number of random angles sampled (random_theta mode only). */
  samples_checked: number | null;
  /** Number of sampled angles for which the circuit passed (random_theta mode only). */
  samples_passed: number | null;
}

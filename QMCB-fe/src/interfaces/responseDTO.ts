/**
 * DTO: top-level simulation response from the backend.
 * The frontend only renders this; no simulation on FE.
 */

import type { TruthTableDTO } from "./truthTable";

export interface SimulationResponseDTO {
  message: string;
  trial_truth_table: TruthTableDTO;
  target_truth_table: TruthTableDTO;
  /** True when the trial circuit is accepted — either exact string match or global-phase equivalence. */
  all_match: boolean;
  validation_mode: boolean;
}

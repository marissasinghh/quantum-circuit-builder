/**
 * Frontend level definition for copy/UX.
 */

import type { Gate, GateStep } from "../types/global";
import type { TruthTableDTO } from "./truthTable";

/** Shape for a level's UI/UX config. */
export interface LevelDefinition {
  target_unitary: Gate;
  number_of_qubits: number;
  toolbox: readonly Gate[];

  /**
   * Canonical solution (for hints/docs). The FE does not enforce this;
   * the student can try anything, and the backend will grade via simulation.
   */
  canonical?: readonly GateStep[];

  expectedTruth?: TruthTableDTO;
  uiMaxGates?: number;
  description?: string;
}

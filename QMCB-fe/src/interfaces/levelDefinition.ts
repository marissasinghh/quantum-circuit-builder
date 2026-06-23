/**
 * Frontend level definition for copy/UX.
 */

import type { Gate, GateStep } from "../types/global";
import type { TruthTableDTO } from "./truthTable";
import type { ParameterMode } from "../utils/constants";

/** Shape for a level's UI/UX config. */
export interface LevelDefinition {
  /** Human-readable title for UI (falls back to target_unitary when omitted). */
  name?: string;
  target_unitary: Gate;
  number_of_qubits: number;
  toolbox: readonly Gate[];

  /**
   * Canonical solution (for hints/docs). The FE does not enforce this;
   * the student can try anything, and the backend will grade via simulation.
   */
  canonical?: readonly GateStep[];

  expectedTruth?: TruthTableDTO;
  /** How the backend resolves target parameters for this level. */
  parameterMode?: ParameterMode;
  uiMaxGates?: number;
  description?: string;
  hint1?: string;
  hint2?: string;
  /** Post-solve insight shown after the student first passes the level. */
  insight?: string;
  /** When true, level appears on the picker but is not openable from the grid (stub / deferred). */
  locked?: boolean;
}

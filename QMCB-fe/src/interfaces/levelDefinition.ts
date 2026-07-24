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
  /**
   * CircuitCanvas θ range-slider step in radians for this level only.
   * When omitted, CircuitCanvas defaults to 0.01 (unchanged for Rx/Ry/etc.).
   */
  thetaSliderStep?: number;
  description?: string;
  hint1?: string;
  hint2?: string;
  /** Post-solve insight shown after the student first passes the level. */
  insight?: string;
  /** When true, level appears on the picker but is not openable from the grid (stub / deferred). */
  locked?: boolean;
  /**
   * When true, completing or skipping this level does NOT add its gate to
   * the student's unlockedGates. Used by config-only dagger levels whose
   * target gate is identical to a gate the student already has (X†=X, Z†=Z,
   * H†=H, Y†=Y), and by CONTROLLED_U (requires seeded angles; not reusable
   * as a bare toolbox chip).
   */
  noGatesetUnlock?: boolean;
  /**
   * Backend target_unitary key to send in the simulate request.
   * When set, overrides target_unitary in buildRequestFromLevel().
   * Used by config-only dagger levels that point at a parent target entry
   * (e.g. X_DAG level sends "X" to the backend, which has no "X_DAG" entry).
   */
  backendTarget?: Gate;
}

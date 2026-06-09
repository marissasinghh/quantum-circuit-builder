/**
 * DTO: request sent to the backend to simulate the student's circuit
 * against the target unitary for the current level.
 *
 * Backend field name for dict entries is always `gate` (not `name`). Each
 * `gates[i]` lines up with `qubit_order[i]` for wiring.
 */
import type { AnyQubitOrder } from "../types/global";
import type { Gate } from "../types/global";

/** Optional runtime target parameters (seed for RANDOM_U; future multi-angle fields). */
export interface TargetParamsDTO {
  seed?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  /** Canonical target angle for RANDOM_THETA levels (Rx, Ry).
   *  Abs-normalised by the caller so the backend can grade directly.
   *  Absent when the student uses a decomposition (no parameterised gate). */
  theta?: number;
}

/** Mirroring backend types. */
export type ParameterizedGate = {
  gate: string;
  theta?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
};
export type UnitaryGateEntry = Gate | ParameterizedGate;

export const isParameterizedGate = (entry: UnitaryGateEntry): entry is ParameterizedGate => {
  return (
    entry !== null &&
    typeof entry === "object" &&
    "gate" in entry &&
    typeof (entry as ParameterizedGate).gate === "string"
  );
};

export interface UnitaryRequestDTO {
  target_unitary: Gate;
  number_of_qubits: number;
  gates: UnitaryGateEntry[];
  qubit_order: AnyQubitOrder[];
  /** Flat compat: seed for seed-driven levels (maps to TargetParamsDTO.seed). */
  seed?: number;
  /** Optional nested target params (future wire format). */
  target_params?: TargetParamsDTO;
}

/**
 * DTO: request sent to the backend to simulate the student's circuit
 * against the target unitary for the current level.
 *
 * Backend field name for dict entries is always `gate` (not `name`). Each
 * `gates[i]` lines up with `qubit_order[i]` for wiring.
 */
import type { AnyQubitOrder } from "../types/global";
import type { Gate } from "../types/global";

/** One step: legacy string, or parameterized gate (theta in radians when present). */
export type UnitaryGateEntry = Gate | { gate: string; theta?: number };

export interface UnitaryRequestDTO {
  target_unitary: Gate;
  number_of_qubits: number;
  gates: UnitaryGateEntry[];
  qubit_order: AnyQubitOrder[];
}

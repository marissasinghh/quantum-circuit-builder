/**
 * Controller: translate the current level config + student circuit
 * into the request DTO the backend expects, and provide a tiny
 * view model for the truth table display.
 * No React, no fetch here—pure translation layer.
 */

import type { PlacedGate } from "../types/global";
import type { UnitaryRequestDTO } from "../interfaces/unitary";
import type { SimulationResponseDTO } from "../interfaces/responseDTO";
import type { TruthRow } from "../interfaces/truthTable";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import { serializeOrders, serializeUnitaryGateEntries } from "../utils/circuit";

/** Build the POST body from the level's static info + student's gates. */
export function buildRequestFromLevel(
  level: LevelDefinition,
  gates: PlacedGate[],
  seed?: number
): UnitaryRequestDTO {
  return {
    target_unitary: level.target_unitary,
    number_of_qubits: level.number_of_qubits,
    gates: serializeUnitaryGateEntries(gates),
    qubit_order: serializeOrders(gates),
    ...(seed !== undefined && { seed }),
  };
}

/** Convert backend DTO into rows the table can render easily. */
export function toTruthRows(res: SimulationResponseDTO): TruthRow[] {
  const t = res.trial_truth_table;
  const target = res.target_truth_table;
  return t.input.map((inp, i) => ({
    input: inp,
    trial: t.output[i],
    target: target.output[i],
    // Use the backend's authoritative verdict so rows are marked correct when
    // the circuit matches up to global phase (all_match=true) even if the
    // Dirac-notation strings differ (e.g. H canonical Rz·SQRT_X·Rz).
    ok: res.all_match || t.output[i] === target.output[i],
    trialProbabilities: t.probabilities?.[i],
    targetProbabilities: target.probabilities?.[i],
    amplitudes: t.amplitudes?.[i],
  }));
}

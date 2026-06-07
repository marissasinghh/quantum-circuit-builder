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
import { ParameterMode } from "../utils/constants";

/** Build the POST body from the level's static info + student's gates. */
export function buildRequestFromLevel(
  level: LevelDefinition,
  gates: PlacedGate[],
  seed?: number
): UnitaryRequestDTO {
  // For TRIAL_THETA levels (Rx, Ry) supply the canonical target θ so the
  // backend grades against the abs-normalised angle the student chose, not
  // whatever it re-extracts from the trial circuit.  This blocks Rx(−θ) from
  // trivially matching an Rx(+θ) target via the direct-gate path.  When the
  // student uses a decomposition (no parameterised gate present), θ is not
  // sent and the backend falls back to its own extraction logic.
  let targetTheta: number | undefined;
  if (level.parameterMode === ParameterMode.TRIAL_THETA) {
    const gateWithTheta = gates.find(
      (g): g is PlacedGate & { theta: number } =>
        "theta" in g && typeof (g as { theta?: unknown }).theta === "number"
    );
    if (gateWithTheta) {
      targetTheta = Math.abs((gateWithTheta as { theta: number }).theta);
    }
  }

  return {
    target_unitary: level.target_unitary,
    number_of_qubits: level.number_of_qubits,
    gates: serializeUnitaryGateEntries(gates),
    qubit_order: serializeOrders(gates),
    ...(seed !== undefined && { seed }),
    ...(targetTheta !== undefined && { target_params: { theta: targetTheta } }),
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

/**
 * Controller: translate the current level config + student circuit
 * into the request DTO the backend expects, and provide a tiny
 * view model for the truth table display.
 * No React, no fetch here—pure translation layer.
 */

import type { PlacedGate } from "../types/global";
import type { TargetParamsDTO, UnitaryRequestDTO } from "../interfaces/unitary";
import type { SimulationResponseDTO } from "../interfaces/responseDTO";
import type { TruthRow } from "../interfaces/truthTable";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import { serializeOrders, serializeUnitaryGateEntries, gatesInColumnOrder } from "../utils/circuit";
import { ParameterMode } from "../utils/constants";

/** Build the POST body from the level's static info + student's gates. */
export function buildRequestFromLevel(
  level: LevelDefinition,
  gates: PlacedGate[],
  seed?: number,
  seedZxzAngles?: { alpha: number; beta: number; gamma: number },
  seedZyzAngles?: { gamma: number; beta: number; delta: number }
): UnitaryRequestDTO {
  // For RANDOM_THETA levels (Rx, Ry) supply the canonical target θ so the
  // backend grades against the abs-normalised angle the student chose, not
  // whatever it re-extracts from the trial circuit.  This blocks Rx(−θ) from
  // trivially matching an Rx(+θ) target via the direct-gate path.  When the
  // student uses a decomposition (no parameterised gate present), θ is not
  // sent and the backend falls back to its own extraction logic.
  let targetTheta: number | undefined;
  let parameterGateIndex: number | undefined;
  if (level.parameterMode === ParameterMode.RANDOM_THETA) {
    const orderedGates = gatesInColumnOrder(gates);
    const slotIdx = orderedGates.findIndex(
      (g): g is PlacedGate & { theta: number; isParameterSlot: true } =>
        "wire" in g && g.isParameterSlot === true
    );
    if (slotIdx >= 0) {
      parameterGateIndex = slotIdx;
      const slotGate = orderedGates[slotIdx];
      if ("theta" in slotGate && typeof slotGate.theta === "number") {
        targetTheta = Math.abs(slotGate.theta);
      }
    }
  }

  let targetParams: TargetParamsDTO | undefined;
  if (targetTheta !== undefined) {
    targetParams = { theta: targetTheta };
  } else if (
    level.parameterMode === ParameterMode.SEED_ZXZ &&
    seed !== undefined &&
    seedZxzAngles
  ) {
    targetParams = {
      seed,
      alpha: seedZxzAngles.alpha,
      beta: seedZxzAngles.beta,
      gamma: seedZxzAngles.gamma,
    };
  } else if (
    level.parameterMode === ParameterMode.SEED_ZYZ &&
    seed !== undefined &&
    seedZyzAngles
  ) {
    targetParams = {
      seed,
      gamma: seedZyzAngles.gamma,
      beta: seedZyzAngles.beta,
      delta: seedZyzAngles.delta,
    };
  }

  return {
    target_unitary: level.target_unitary,
    number_of_qubits: level.number_of_qubits,
    gates: serializeUnitaryGateEntries(gates),
    qubit_order: serializeOrders(gates),
    ...(seed !== undefined && { seed }),
    ...(targetParams && { target_params: targetParams }),
    // Flat compat: backend parser reads angle fields from the request root.
    ...(targetParams?.alpha !== undefined && { alpha: targetParams.alpha }),
    ...(targetParams?.beta !== undefined && { beta: targetParams.beta }),
    ...(targetParams?.gamma !== undefined && { gamma: targetParams.gamma }),
    ...(targetParams?.delta !== undefined && { delta: targetParams.delta }),
    ...(parameterGateIndex !== undefined && {
      parameter_gate_index: parameterGateIndex,
    }),
  };
}

/**
 * Convert backend DTO into rows the table can render.
 * Returns null for random-theta responses where the backend sends no truth tables.
 * Trial/target ket strings are pre-formatted by Cirq on the backend; the client-side
 * counterpart for live preview is normalizeUnitaryLeadingPhase + formatStateVectorAsDirac
 * in utils/diracFormatting.ts.
 */
export function toTruthRows(res: SimulationResponseDTO): TruthRow[] | null {
  const t = res.trial_truth_table;
  const target = res.target_truth_table;
  if (!t || !target) return null;
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

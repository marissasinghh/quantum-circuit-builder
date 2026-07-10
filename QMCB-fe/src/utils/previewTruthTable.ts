import type { LevelDefinition } from "../interfaces/levelDefinition";
import type { TruthTableDTO } from "../interfaces/truthTable";
import type { TruthRow } from "../interfaces/truthTable";
import { Gate, type PlacedGate, type PlacedSingleQubitGate } from "../types/global";
import { ParameterMode } from "./constants";
import { formatStateVectorAsDirac, normalizeUnitaryLeadingPhase } from "./diracFormatting";
import {
  columnFromUnitary,
  computeTrialUnitary,
  probabilitiesFromColumn,
  probabilitiesFromDiracString,
} from "./trialUnitary";

const PARAM_GATES = new Set<Gate>([Gate.RX, Gate.RY, Gate.RZ]);
const ONE_QUBIT_BASIS_INPUTS = ["|0⟩", "|1⟩"] as const;

/**
 * Build live-preview truth-table rows from the student's circuit and level expected outputs.
 * Returns null when preview is not applicable (no gates, random-theta level, or no truth table).
 */
export function buildPreviewTruthRows(
  gates: PlacedGate[],
  level: LevelDefinition,
  dynamicTruth?: TruthTableDTO
): TruthRow[] | null {
  if (level.parameterMode === ParameterMode.RANDOM_THETA) {
    return null;
  }

  const truth = dynamicTruth ?? level.expectedTruth;
  if (!truth || gates.length === 0) {
    return null;
  }

  const qubitCount = level.number_of_qubits;
  const unitary = computeTrialUnitary(gates, qubitCount);
  const normalized = normalizeUnitaryLeadingPhase(unitary);

  return truth.input.map((input, i) => {
    const col = columnFromUnitary(normalized, i);
    const rawCol = columnFromUnitary(unitary, i);
    const trial = formatStateVectorAsDirac(col, qubitCount);
    const trialProbabilities = probabilitiesFromColumn(rawCol);
    const target = truth.output[i] ?? "";
    const targetProbabilities = probabilitiesFromDiracString(target, qubitCount);

    return {
      input,
      trial,
      target,
      ok: false,
      trialProbabilities,
      targetProbabilities,
    };
  });
}

/**
 * Convert canonical GateSteps to PlacedSingleQubitGate[], injecting slotTheta
 * into the one step that has no fixed theta and is a parameterized gate type.
 * Mirrors the wire-extraction trick in blochMath.ts (step.order[0] → wire index).
 */
function canonicalToPlacedGates(
  level: LevelDefinition,
  slotTheta: number
): PlacedSingleQubitGate[] | null {
  if (!level.canonical) return null;
  return (level.canonical as readonly { gate: Gate; order: readonly number[]; theta?: number }[]).map(
    (step, i) => {
      const isParamStep = PARAM_GATES.has(step.gate) && step.theta === undefined;
      return {
        id: `canonical-${i}`,
        type: step.gate as PlacedSingleQubitGate["type"],
        wire: ((step.order[0] ?? 0) as 0 | 1 | 2),
        column: i,
        theta: isParamStep ? slotTheta : step.theta,
      };
    }
  );
}

/**
 * Build live-preview truth-table rows for a RANDOM_THETA level at the given slotTheta.
 * ok is always false (preview mode — no match indicators shown).
 * Returns null if canonical is missing or no student gates are placed.
 */
export function buildParamPreviewRows(
  gates: PlacedGate[],
  level: LevelDefinition,
  slotTheta: number
): TruthRow[] | null {
  if (gates.length === 0) return null;
  const canonicalGates = canonicalToPlacedGates(level, slotTheta);
  if (!canonicalGates) return null;

  const qubitCount = 1;
  const trialUnitary = normalizeUnitaryLeadingPhase(computeTrialUnitary(gates, qubitCount));
  const targetUnitary = normalizeUnitaryLeadingPhase(computeTrialUnitary(canonicalGates, qubitCount));

  return ONE_QUBIT_BASIS_INPUTS.map((input, i) => {
    const trialCol = columnFromUnitary(trialUnitary, i);
    const rawTrialCol = columnFromUnitary(computeTrialUnitary(gates, qubitCount), i);
    const targetCol = columnFromUnitary(targetUnitary, i);
    const rawTargetCol = columnFromUnitary(computeTrialUnitary(canonicalGates, qubitCount), i);

    return {
      input,
      trial: formatStateVectorAsDirac(trialCol, qubitCount),
      target: formatStateVectorAsDirac(targetCol, qubitCount),
      ok: false,
      trialProbabilities: probabilitiesFromColumn(rawTrialCol),
      targetProbabilities: probabilitiesFromColumn(rawTargetCol),
    };
  });
}

/**
 * Build graded truth-table rows for a RANDOM_THETA level at the snapshotted slotTheta.
 * ok is computed by comparing probability vectors within ε = 0.001.
 * Returns null if canonical is missing or no student gates are placed.
 */
export function buildParamGradedRows(
  gates: PlacedGate[],
  level: LevelDefinition,
  slotTheta: number
): TruthRow[] | null {
  if (gates.length === 0) return null;
  const canonicalGates = canonicalToPlacedGates(level, slotTheta);
  if (!canonicalGates) return null;

  const qubitCount = 1;
  const trialUnitary = normalizeUnitaryLeadingPhase(computeTrialUnitary(gates, qubitCount));
  const targetUnitary = normalizeUnitaryLeadingPhase(computeTrialUnitary(canonicalGates, qubitCount));
  const rawTrial = computeTrialUnitary(gates, qubitCount);
  const rawTarget = computeTrialUnitary(canonicalGates, qubitCount);

  return ONE_QUBIT_BASIS_INPUTS.map((input, i) => {
    const trialCol = columnFromUnitary(trialUnitary, i);
    const targetCol = columnFromUnitary(targetUnitary, i);
    const trialProbabilities = probabilitiesFromColumn(columnFromUnitary(rawTrial, i));
    const targetProbabilities = probabilitiesFromColumn(columnFromUnitary(rawTarget, i));
    const ok = trialProbabilities.every(
      (p, j) => Math.abs(p - (targetProbabilities[j] ?? 0)) < 0.001
    );

    return {
      input,
      trial: formatStateVectorAsDirac(trialCol, qubitCount),
      target: formatStateVectorAsDirac(targetCol, qubitCount),
      ok,
      trialProbabilities,
      targetProbabilities,
    };
  });
}

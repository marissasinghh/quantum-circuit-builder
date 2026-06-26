import type { LevelDefinition } from "../interfaces/levelDefinition";
import type { TruthTableDTO } from "../interfaces/truthTable";
import type { TruthRow } from "../interfaces/truthTable";
import type { PlacedGate } from "../types/global";
import { ParameterMode } from "./constants";
import { formatColumnAsDiracNormalized } from "./diracFormatting";
import {
  columnFromUnitary,
  computeTrialUnitary,
  probabilitiesFromColumn,
  probabilitiesFromDiracString,
} from "./trialUnitary";

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

  return truth.input.map((input, i) => {
    const col = columnFromUnitary(unitary, i);
    const trial = formatColumnAsDiracNormalized(col, qubitCount);
    const trialProbabilities = probabilitiesFromColumn(col);
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

import { describe, expect, it } from "vitest";

import { Gate, type PlacedGate } from "../types/global";
import {
  basisInputLabel,
  columnFromUnitary,
  computeTrialUnitary,
  probabilitiesFromColumn,
} from "./trialUnitary";

function assertColumnProbs(
  gates: PlacedGate[],
  qubitCount: number,
  inputIndex: number,
  expected: number[]
) {
  const unitary = computeTrialUnitary(gates, qubitCount);
  const col = columnFromUnitary(unitary, inputIndex);
  expect(probabilitiesFromColumn(col)).toEqual(expected);
}

function assertAllRowProbs(
  gates: PlacedGate[],
  qubitCount: number,
  expectedByInput: Record<string, number[]>
) {
  const unitary = computeTrialUnitary(gates, qubitCount);
  for (let i = 0; i < 2 ** qubitCount; i++) {
    const label = basisInputLabel(qubitCount, i);
    const expected = expectedByInput[label];
    if (!expected) continue;
    const col = columnFromUnitary(unitary, i);
    expect(probabilitiesFromColumn(col)).toEqual(expected);
  }
}

/** Cirq goldens: H,H,CNOT[C1→T0],H,H (CNOT_FLIPPED canonical). */
const CNOT_FLIPPED_GATES: PlacedGate[] = [
  { id: "h0a", type: Gate.H, wire: 0, column: 0 },
  { id: "h1a", type: Gate.H, wire: 1, column: 1 },
  { id: "cnot", type: Gate.CNOT, order: [1, 0], column: 2 },
  { id: "h0b", type: Gate.H, wire: 0, column: 3 },
  { id: "h1b", type: Gate.H, wire: 1, column: 4 },
];

const CNOT_FLIPPED_GOLDEN: Record<string, number[]> = {
  "|00⟩": [1, 0, 0, 0],
  "|01⟩": [0, 1, 0, 0],
  "|10⟩": [0, 0, 0, 1],
  "|11⟩": [0, 0, 1, 0],
};

/** Cirq goldens: single CONTROLLED_Z with order [0,1]. */
const CZ_GATES: PlacedGate[] = [
  { id: "cz", type: Gate.CONTROLLED_Z, order: [0, 1], column: 0 },
];

const CZ_GOLDEN: Record<string, number[]> = {
  "|00⟩": [1, 0, 0, 0],
  "|01⟩": [0, 1, 0, 0],
  "|10⟩": [0, 0, 1, 0],
  "|11⟩": [0, 0, 0, 1],
};

/** Cirq goldens: single SWAP with order [0,1]. */
const SWAP_GATES: PlacedGate[] = [
  { id: "swap", type: Gate.SWAP, order: [0, 1], column: 0 },
];

const SWAP_GOLDEN: Record<string, number[]> = {
  "|00⟩": [1, 0, 0, 0],
  "|01⟩": [0, 0, 1, 0],
  "|10⟩": [0, 1, 0, 0],
  "|11⟩": [0, 0, 0, 1],
};

/** Cirq goldens: X on wire 2, 3-qubit level. */
const X_WIRE2_GATES: PlacedGate[] = [
  { id: "x2", type: Gate.X, wire: 2, column: 0 },
];

const X_WIRE2_GOLDEN: Record<string, number[]> = {
  "|000⟩": [0, 1, 0, 0, 0, 0, 0, 0],
  "|001⟩": [1, 0, 0, 0, 0, 0, 0, 0],
  "|010⟩": [0, 0, 0, 1, 0, 0, 0, 0],
  "|011⟩": [0, 0, 1, 0, 0, 0, 0, 0],
  "|100⟩": [0, 0, 0, 0, 0, 1, 0, 0],
  "|101⟩": [0, 0, 0, 0, 1, 0, 0, 0],
  "|110⟩": [0, 0, 0, 0, 0, 0, 0, 1],
  "|111⟩": [0, 0, 0, 0, 0, 0, 1, 0],
};

describe("computeTrialUnitary", () => {
  it("matches Cirq for CNOT_FLIPPED canonical circuit on all basis inputs", () => {
    assertAllRowProbs(CNOT_FLIPPED_GATES, 2, CNOT_FLIPPED_GOLDEN);
  });

  it("matches Cirq spot-check |10⟩ for CNOT_FLIPPED", () => {
    assertColumnProbs(CNOT_FLIPPED_GATES, 2, 2, CNOT_FLIPPED_GOLDEN["|10⟩"]);
  });

  it("matches Cirq for single CONTROLLED_Z gate", () => {
    assertAllRowProbs(CZ_GATES, 2, CZ_GOLDEN);
  });

  it("matches Cirq spot-check |11⟩ for CONTROLLED_Z", () => {
    assertColumnProbs(CZ_GATES, 2, 3, CZ_GOLDEN["|11⟩"]);
  });

  it("matches Cirq for single SWAP gate", () => {
    assertAllRowProbs(SWAP_GATES, 2, SWAP_GOLDEN);
  });

  it("matches Cirq spot-check |01⟩ for SWAP", () => {
    assertColumnProbs(SWAP_GATES, 2, 1, SWAP_GOLDEN["|01⟩"]);
  });

  it("matches Cirq for X on wire 2 in a 3-qubit space", () => {
    assertAllRowProbs(X_WIRE2_GATES, 3, X_WIRE2_GOLDEN);
  });

  it("matches Cirq spot-check |000⟩ for X on wire 2", () => {
    assertColumnProbs(X_WIRE2_GATES, 3, 0, X_WIRE2_GOLDEN["|000⟩"]);
  });

  it("returns identity for an empty circuit", () => {
    const unitary = computeTrialUnitary([], 2);
    expect(probabilitiesFromColumn(columnFromUnitary(unitary, 0))).toEqual([1, 0, 0, 0]);
    expect(probabilitiesFromColumn(columnFromUnitary(unitary, 3))).toEqual([0, 0, 0, 1]);
  });
});

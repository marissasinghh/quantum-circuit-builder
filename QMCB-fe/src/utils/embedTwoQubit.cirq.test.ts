/**
 * Cirq-verified goldens for embedTwoQubit on arbitrary wire pairs (3-qubit space).
 *
 * Reference values generated with Cirq via QMCB-be/venv:
 *   qs = cirq.LineQubit.range(3)
 *   U = cirq.Circuit(...).unitary(qubit_order=qs)
 *   probs = round(|U[:, i]|^2, 3)
 * Idle qubits included with cirq.I so the matrix is always 8×8.
 * Do not hand-edit these numbers without re-running Cirq.
 */

import { describe, expect, it } from "vitest";

import { Gate, type PlacedGate } from "../types/global";
import { cabs, type ComplexMatrix } from "./complexMath";
import {
  basisInputLabel,
  columnFromUnitary,
  computeTrialUnitary,
  probabilitiesFromColumn,
} from "./trialUnitary";

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

function diagPhase(unitary: ComplexMatrix, index: number): { re: number; im: number } {
  const amp = unitary[index][index];
  return { re: Number(amp.re.toFixed(6)), im: Number(amp.im.toFixed(6)) };
}

/** Cirq: CNOT(q0,q1) ⊗ I(q2) — probs rounded to 3 decimals. */
const CNOT_01_3Q: Record<string, number[]> = {
  "|000⟩": [1, 0, 0, 0, 0, 0, 0, 0],
  "|001⟩": [0, 1, 0, 0, 0, 0, 0, 0],
  "|010⟩": [0, 0, 1, 0, 0, 0, 0, 0],
  "|011⟩": [0, 0, 0, 1, 0, 0, 0, 0],
  "|100⟩": [0, 0, 0, 0, 0, 0, 1, 0],
  "|101⟩": [0, 0, 0, 0, 0, 0, 0, 1],
  "|110⟩": [0, 0, 0, 0, 1, 0, 0, 0],
  "|111⟩": [0, 0, 0, 0, 0, 1, 0, 0],
};

/** Cirq: CNOT(q1,q0) ⊗ I(q2). */
const CNOT_10_3Q: Record<string, number[]> = {
  "|000⟩": [1, 0, 0, 0, 0, 0, 0, 0],
  "|001⟩": [0, 1, 0, 0, 0, 0, 0, 0],
  "|010⟩": [0, 0, 0, 0, 0, 0, 1, 0],
  "|011⟩": [0, 0, 0, 0, 0, 0, 0, 1],
  "|100⟩": [0, 0, 0, 0, 1, 0, 0, 0],
  "|101⟩": [0, 0, 0, 0, 0, 1, 0, 0],
  "|110⟩": [0, 0, 1, 0, 0, 0, 0, 0],
  "|111⟩": [0, 0, 0, 1, 0, 0, 0, 0],
};

/** Cirq: CNOT(q1,q2) with I(q0). */
const CNOT_12_3Q: Record<string, number[]> = {
  "|000⟩": [1, 0, 0, 0, 0, 0, 0, 0],
  "|001⟩": [0, 1, 0, 0, 0, 0, 0, 0],
  "|010⟩": [0, 0, 0, 1, 0, 0, 0, 0],
  "|011⟩": [0, 0, 1, 0, 0, 0, 0, 0],
  "|100⟩": [0, 0, 0, 0, 1, 0, 0, 0],
  "|101⟩": [0, 0, 0, 0, 0, 1, 0, 0],
  "|110⟩": [0, 0, 0, 0, 0, 0, 0, 1],
  "|111⟩": [0, 0, 0, 0, 0, 0, 1, 0],
};

/** Cirq: CNOT(q2,q1) with I(q0). */
const CNOT_21_3Q: Record<string, number[]> = {
  "|000⟩": [1, 0, 0, 0, 0, 0, 0, 0],
  "|001⟩": [0, 0, 0, 1, 0, 0, 0, 0],
  "|010⟩": [0, 0, 1, 0, 0, 0, 0, 0],
  "|011⟩": [0, 1, 0, 0, 0, 0, 0, 0],
  "|100⟩": [0, 0, 0, 0, 1, 0, 0, 0],
  "|101⟩": [0, 0, 0, 0, 0, 0, 0, 1],
  "|110⟩": [0, 0, 0, 0, 0, 0, 1, 0],
  "|111⟩": [0, 0, 0, 0, 0, 1, 0, 0],
};

/** Cirq: SWAP(q1,q2) with I(q0). */
const SWAP_12_3Q: Record<string, number[]> = {
  "|000⟩": [1, 0, 0, 0, 0, 0, 0, 0],
  "|001⟩": [0, 0, 1, 0, 0, 0, 0, 0],
  "|010⟩": [0, 1, 0, 0, 0, 0, 0, 0],
  "|011⟩": [0, 0, 0, 1, 0, 0, 0, 0],
  "|100⟩": [0, 0, 0, 0, 1, 0, 0, 0],
  "|101⟩": [0, 0, 0, 0, 0, 0, 1, 0],
  "|110⟩": [0, 0, 0, 0, 0, 1, 0, 0],
  "|111⟩": [0, 0, 0, 0, 0, 0, 0, 1],
};

/** Cirq: X(q0) then CNOT(q1,q2). */
const X0_CNOT12_3Q: Record<string, number[]> = {
  "|000⟩": [0, 0, 0, 0, 1, 0, 0, 0],
  "|001⟩": [0, 0, 0, 0, 0, 1, 0, 0],
  "|010⟩": [0, 0, 0, 0, 0, 0, 0, 1],
  "|011⟩": [0, 0, 0, 0, 0, 0, 1, 0],
  "|100⟩": [1, 0, 0, 0, 0, 0, 0, 0],
  "|101⟩": [0, 1, 0, 0, 0, 0, 0, 0],
  "|110⟩": [0, 0, 0, 1, 0, 0, 0, 0],
  "|111⟩": [0, 0, 1, 0, 0, 0, 0, 0],
};

describe("embedTwoQubit / baseWire local preview (Cirq goldens)", () => {
  it("CNOT baseWire 0 order [0,1] matches Cirq CNOT(0,1) on 3 qubits", () => {
    const gates: PlacedGate[] = [
      { id: "c", type: Gate.CNOT, order: [0, 1], baseWire: 0, column: 0 },
    ];
    assertAllRowProbs(gates, 3, CNOT_01_3Q);
  });

  it("CNOT baseWire 0 order [1,0] matches Cirq CNOT(1,0) on 3 qubits", () => {
    const gates: PlacedGate[] = [
      { id: "c", type: Gate.CNOT, order: [1, 0], baseWire: 0, column: 0 },
    ];
    assertAllRowProbs(gates, 3, CNOT_10_3Q);
  });

  it("CNOT baseWire 1 order [0,1] matches Cirq CNOT(1,2) on 3 qubits", () => {
    const gates: PlacedGate[] = [
      { id: "c", type: Gate.CNOT, order: [0, 1], baseWire: 1, column: 0 },
    ];
    assertAllRowProbs(gates, 3, CNOT_12_3Q);
  });

  it("CNOT baseWire 1 order [1,0] matches Cirq CNOT(2,1) on 3 qubits", () => {
    const gates: PlacedGate[] = [
      { id: "c", type: Gate.CNOT, order: [1, 0], baseWire: 1, column: 0 },
    ];
    assertAllRowProbs(gates, 3, CNOT_21_3Q);
  });

  it("SWAP baseWire 1 matches Cirq SWAP(1,2) on 3 qubits", () => {
    const gates: PlacedGate[] = [
      { id: "s", type: Gate.SWAP, order: [0, 1], baseWire: 1, column: 0 },
    ];
    assertAllRowProbs(gates, 3, SWAP_12_3Q);
  });

  it("CZ baseWire 1 matches Cirq CZ(1,2) phases on |011⟩ and |111⟩", () => {
    // Probabilities alone are identity-like for CZ; Cirq diagonal: U[3,3]=U[7,7]=-1.
    const gates: PlacedGate[] = [
      { id: "cz", type: Gate.CONTROLLED_Z, order: [0, 1], baseWire: 1, column: 0 },
    ];
    const U = computeTrialUnitary(gates, 3);
    expect(diagPhase(U, 0)).toEqual({ re: 1, im: 0 });
    expect(diagPhase(U, 3)).toEqual({ re: -1, im: 0 }); // |011⟩
    expect(diagPhase(U, 6)).toEqual({ re: 1, im: 0 }); // |110⟩
    expect(diagPhase(U, 7)).toEqual({ re: -1, im: 0 }); // |111⟩
    // Still probability-preserving
    for (let i = 0; i < 8; i++) {
      const col = columnFromUnitary(U, i);
      const p = probabilitiesFromColumn(col);
      expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
      expect(cabs(U[i][i])).toBeCloseTo(1, 5);
    }
  });

  it("composite X on wire 0 then CNOT on wires 1-2 matches Cirq", () => {
    const gates: PlacedGate[] = [
      { id: "x", type: Gate.X, wire: 0, column: 0 },
      { id: "c", type: Gate.CNOT, order: [0, 1], baseWire: 1, column: 1 },
    ];
    assertAllRowProbs(gates, 3, X0_CNOT12_3Q);
  });
});

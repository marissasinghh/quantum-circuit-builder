/**
 * Cirq-verified goldens for embedTwoQubit on arbitrary wire pairs (3-qubit space).
 *
 * Reference values generated with Cirq via QMCB-be/venv:
 *   qs = cirq.LineQubit.range(3)
 *   U = cirq.Circuit(...).unitary(qubit_order=qs)
 *   probs = round(|U[:, i]|^2, 3)
 * Idle qubits included with cirq.I so the matrix is always 8×8.
 * Do not hand-edit these numbers without re-running Cirq.
 *
 * Adjacent-pair cases exercise the placed-gate → trialUnitary path (baseWire).
 * Non-adjacent (0,2)/(2,0) cases are covered both via direct embedTwoQubit calls
 * and via placed gates with extended: true (Phase 4 serialize/preview wiring).
 */

import { describe, expect, it } from "vitest";

import { Gate, type PlacedGate } from "../types/global";
import { cabs, embedTwoQubit, type ComplexMatrix } from "./complexMath";
import { twoQubitGateMatrix } from "./gateMatrices";
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

/** Assert column probabilities of a raw embedded unitary against Cirq goldens. */
function assertEmbeddedProbs(
  unitary: ComplexMatrix,
  qubitCount: number,
  expectedByInput: Record<string, number[]>
) {
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

/** Cirq: CNOT(q0,q2) with I(q1) — non-adjacent skip-wire pair. */
const CNOT_02_3Q: Record<string, number[]> = {
  "|000⟩": [1, 0, 0, 0, 0, 0, 0, 0],
  "|001⟩": [0, 1, 0, 0, 0, 0, 0, 0],
  "|010⟩": [0, 0, 1, 0, 0, 0, 0, 0],
  "|011⟩": [0, 0, 0, 1, 0, 0, 0, 0],
  "|100⟩": [0, 0, 0, 0, 0, 1, 0, 0],
  "|101⟩": [0, 0, 0, 0, 1, 0, 0, 0],
  "|110⟩": [0, 0, 0, 0, 0, 0, 0, 1],
  "|111⟩": [0, 0, 0, 0, 0, 0, 1, 0],
};

/** Cirq: CNOT(q2,q0) with I(q1) — non-adjacent skip-wire pair flipped. */
const CNOT_20_3Q: Record<string, number[]> = {
  "|000⟩": [1, 0, 0, 0, 0, 0, 0, 0],
  "|001⟩": [0, 0, 0, 0, 0, 1, 0, 0],
  "|010⟩": [0, 0, 1, 0, 0, 0, 0, 0],
  "|011⟩": [0, 0, 0, 0, 0, 0, 0, 1],
  "|100⟩": [0, 0, 0, 0, 1, 0, 0, 0],
  "|101⟩": [0, 1, 0, 0, 0, 0, 0, 0],
  "|110⟩": [0, 0, 0, 0, 0, 0, 1, 0],
  "|111⟩": [0, 0, 0, 1, 0, 0, 0, 0],
};

/** Cirq: SWAP(q0,q2) with I(q1). */
const SWAP_02_3Q: Record<string, number[]> = {
  "|000⟩": [1, 0, 0, 0, 0, 0, 0, 0],
  "|001⟩": [0, 0, 0, 0, 1, 0, 0, 0],
  "|010⟩": [0, 0, 1, 0, 0, 0, 0, 0],
  "|011⟩": [0, 0, 0, 0, 0, 0, 1, 0],
  "|100⟩": [0, 1, 0, 0, 0, 0, 0, 0],
  "|101⟩": [0, 0, 0, 0, 0, 1, 0, 0],
  "|110⟩": [0, 0, 0, 1, 0, 0, 0, 0],
  "|111⟩": [0, 0, 0, 0, 0, 0, 0, 1],
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

describe("embedTwoQubit non-adjacent (0,2) Cirq goldens", () => {
  // Relative order [0,1] baked into u4: local MSB = control, local LSB = target.
  // embedTwoQubit maps local MSB → wire0, local LSB → wire1.

  it("CNOT embedTwoQubit(u4, 0, 2, 3) matches Cirq CNOT(0,2) with I(1)", () => {
    const u4 = twoQubitGateMatrix(Gate.CNOT, [0, 1]);
    expect(u4).not.toBeNull();
    const U = embedTwoQubit(u4!, 0, 2, 3);
    assertEmbeddedProbs(U, 3, CNOT_02_3Q);
  });

  it("CNOT embedTwoQubit(u4, 2, 0, 3) matches Cirq CNOT(2,0) with I(1)", () => {
    const u4 = twoQubitGateMatrix(Gate.CNOT, [0, 1]);
    expect(u4).not.toBeNull();
    const U = embedTwoQubit(u4!, 2, 0, 3);
    assertEmbeddedProbs(U, 3, CNOT_20_3Q);
  });

  it("SWAP embedTwoQubit(u4, 0, 2, 3) matches Cirq SWAP(0,2) with I(1)", () => {
    const u4 = twoQubitGateMatrix(Gate.SWAP, [0, 1]);
    expect(u4).not.toBeNull();
    const U = embedTwoQubit(u4!, 0, 2, 3);
    assertEmbeddedProbs(U, 3, SWAP_02_3Q);
  });

  it("CZ embedTwoQubit(u4, 0, 2, 3) matches Cirq CZ(0,2) phases on |101⟩ and |111⟩", () => {
    // Probabilities alone are identity-like for CZ; Cirq diagonal: U[5,5]=U[7,7]=-1.
    const u4 = twoQubitGateMatrix(Gate.CONTROLLED_Z, [0, 1]);
    expect(u4).not.toBeNull();
    const U = embedTwoQubit(u4!, 0, 2, 3);
    expect(diagPhase(U, 0)).toEqual({ re: 1, im: 0 });
    expect(diagPhase(U, 5)).toEqual({ re: -1, im: 0 }); // |101⟩ — both endpoints |1⟩
    expect(diagPhase(U, 6)).toEqual({ re: 1, im: 0 }); // |110⟩ — idle wire 1 set, no phase
    expect(diagPhase(U, 7)).toEqual({ re: -1, im: 0 }); // |111⟩
    for (let i = 0; i < 8; i++) {
      const col = columnFromUnitary(U, i);
      const p = probabilitiesFromColumn(col);
      expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
      expect(cabs(U[i][i])).toBeCloseTo(1, 5);
    }
  });
});

describe("placed extended gate → trialUnitary (Phase 4 wiring)", () => {
  it("CNOT extended order [0,1] matches Cirq CNOT(0,2)", () => {
    const gates: PlacedGate[] = [
      { id: "c", type: Gate.CNOT, order: [0, 1], baseWire: 0, extended: true, column: 0 },
    ];
    assertAllRowProbs(gates, 3, CNOT_02_3Q);
  });

  it("CNOT extended order [1,0] matches Cirq CNOT(2,0)", () => {
    const gates: PlacedGate[] = [
      { id: "c", type: Gate.CNOT, order: [1, 0], baseWire: 0, extended: true, column: 0 },
    ];
    assertAllRowProbs(gates, 3, CNOT_20_3Q);
  });

  it("SWAP extended matches Cirq SWAP(0,2)", () => {
    const gates: PlacedGate[] = [
      { id: "s", type: Gate.SWAP, order: [0, 1], baseWire: 1, extended: true, column: 0 },
    ];
    assertAllRowProbs(gates, 3, SWAP_02_3Q);
  });

  it("CZ extended matches Cirq CZ(0,2) phases", () => {
    const gates: PlacedGate[] = [
      { id: "cz", type: Gate.CONTROLLED_Z, order: [0, 1], baseWire: 0, extended: true, column: 0 },
    ];
    const U = computeTrialUnitary(gates, 3);
    expect(diagPhase(U, 5)).toEqual({ re: -1, im: 0 });
    expect(diagPhase(U, 7)).toEqual({ re: -1, im: 0 });
    expect(diagPhase(U, 6)).toEqual({ re: 1, im: 0 });
  });
});

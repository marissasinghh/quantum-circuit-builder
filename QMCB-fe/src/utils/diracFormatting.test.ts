import { describe, expect, it } from "vitest";

import { Gate, type PlacedGate } from "../types/global";
import { c } from "./complexMath";
import {
  formatStateVectorAsDirac,
  normalizeUnitaryLeadingPhase,
} from "./diracFormatting";
import { columnFromUnitary, computeTrialUnitary } from "./trialUnitary";

function approxComplex(a: { re: number; im: number }, b: { re: number; im: number }) {
  expect(a.re).toBeCloseTo(b.re, 3);
  expect(a.im).toBeCloseTo(b.im, 3);
}

function previewTrialKet(gates: PlacedGate[], qubitCount: number, inputIndex: number): string {
  const unitary = computeTrialUnitary(gates, qubitCount);
  const normalized = normalizeUnitaryLeadingPhase(unitary);
  const col = columnFromUnitary(normalized, inputIndex);
  return formatStateVectorAsDirac(col, qubitCount);
}

describe("normalizeUnitaryLeadingPhase", () => {
  it("is idempotent", () => {
    const gates: PlacedGate[] = [
      { id: "rz", type: Gate.RZ, wire: 0, column: 0, theta: Math.PI / 2 },
    ];
    const unitary = computeTrialUnitary(gates, 1);
    const once = normalizeUnitaryLeadingPhase(unitary);
    const twice = normalizeUnitaryLeadingPhase(once);
    for (let i = 0; i < once.length; i++) {
      for (let j = 0; j < once[i].length; j++) {
        approxComplex(twice[i][j], once[i][j]);
      }
    }
  });

  it("uses first nonzero entry in row-major order when U[0][0] is zero (X gate)", () => {
    const xMatrix = [
      [c(0), c(1)],
      [c(1), c(0)],
    ];
    const normalized = normalizeUnitaryLeadingPhase(xMatrix);
    approxComplex(normalized[0][0], c(0, 0));
    approxComplex(normalized[0][1], c(1, 0));
    approxComplex(normalized[1][0], c(1, 0));
    approxComplex(normalized[1][1], c(0, 0));
  });

  it("anchors on U[0][1] when U[0][0] is zero in an explicit 2x2 matrix", () => {
    const matrix = [
      [c(0), c(0, 1)],
      [c(1), c(0)],
    ];
    const normalized = normalizeUnitaryLeadingPhase(matrix);
    approxComplex(normalized[0][1], c(1, 0));
    approxComplex(normalized[1][0], c(0, -1));
  });
});

describe("whole-matrix preview formatting", () => {
  it("Rz(π/2) matches S target on both |0⟩ and |1⟩ rows", () => {
    const gates: PlacedGate[] = [
      { id: "rz", type: Gate.RZ, wire: 0, column: 0, theta: Math.PI / 2 },
    ];
    expect(previewTrialKet(gates, 1, 0)).toBe("|0⟩");
    expect(previewTrialKet(gates, 1, 1)).toBe("1j|1⟩");
  });

  it("shows different |1⟩ row strings when Rz angle changes", () => {
    const halfPi: PlacedGate[] = [
      { id: "rz-a", type: Gate.RZ, wire: 0, column: 0, theta: Math.PI / 2 },
    ];
    const quarterPi: PlacedGate[] = [
      { id: "rz-b", type: Gate.RZ, wire: 0, column: 0, theta: Math.PI / 4 },
    ];
    const halfOnOne = previewTrialKet(halfPi, 1, 1);
    const quarterOnOne = previewTrialKet(quarterPi, 1, 1);
    expect(halfOnOne).not.toBe(quarterOnOne);
    expect(halfOnOne).toBe("1j|1⟩");
  });

  it("Rz(π) |1⟩ row does not match S target 1j|1⟩", () => {
    const gates: PlacedGate[] = [
      { id: "rz", type: Gate.RZ, wire: 0, column: 0, theta: Math.PI },
    ];
    expect(previewTrialKet(gates, 1, 1)).not.toBe("1j|1⟩");
  });

  it("X gate preview rows swap basis states after normalization", () => {
    const gates: PlacedGate[] = [{ id: "x", type: Gate.X, wire: 0, column: 0 }];
    expect(previewTrialKet(gates, 1, 0)).toBe("|1⟩");
    expect(previewTrialKet(gates, 1, 1)).toBe("|0⟩");
  });
});

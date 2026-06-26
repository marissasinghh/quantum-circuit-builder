import { describe, expect, it } from "vitest";

import { Gate, type PlacedGate } from "../types/global";
import { c } from "./complexMath";
import {
  formatColumnAsDiracNormalized,
  normalizeLeadingPhase,
} from "./diracFormatting";
import { columnFromUnitary, computeTrialUnitary } from "./trialUnitary";

function approxComplex(a: { re: number; im: number }, b: { re: number; im: number }) {
  expect(a.re).toBeCloseTo(b.re, 3);
  expect(a.im).toBeCloseTo(b.im, 3);
}

describe("normalizeLeadingPhase", () => {
  it("is idempotent", () => {
    const raw = [c(0.707, -0.707), c(0.707, 0.707)];
    const once = normalizeLeadingPhase(raw);
    const twice = normalizeLeadingPhase(once);
    expect(twice).toHaveLength(once.length);
    for (let i = 0; i < once.length; i++) {
      approxComplex(twice[i], once[i]);
    }
  });

  it("normalizes symmetric Rz(π/2) superposition to [1, 1j]", () => {
    const raw = [c(0.707, -0.707), c(0.707, 0.707)];
    const normalized = normalizeLeadingPhase(raw);
    approxComplex(normalized[0], c(1, 0));
    approxComplex(normalized[1], c(0, 1));
  });

  it("returns a copy unchanged when all amplitudes are zero", () => {
    const raw = [c(0), c(0)];
    const normalized = normalizeLeadingPhase(raw);
    expect(normalized).toHaveLength(2);
    approxComplex(normalized[0], c(0, 0));
    approxComplex(normalized[1], c(0, 0));
  });
});

describe("formatColumnAsDiracNormalized", () => {
  it("formats normalized S-equivalent superposition like Cirq", () => {
    const raw = [c(0.707, -0.707), c(0.707, 0.707)];
    const formatted = formatColumnAsDiracNormalized(raw, 1);
    expect(formatted).toBe("|0⟩ + 1j|1⟩");
  });

  it("formats Rz(π/2) on |0⟩ as |0⟩", () => {
    const gates: PlacedGate[] = [
      { id: "rz", type: Gate.RZ, wire: 0, column: 0, theta: Math.PI / 2 },
    ];
    const unitary = computeTrialUnitary(gates, 1);
    const col = columnFromUnitary(unitary, 0);
    expect(formatColumnAsDiracNormalized(col, 1)).toBe("|0⟩");
  });

  it("does not normalize Rz(π) on |1⟩ into the S target string 1j|1⟩", () => {
    const gates: PlacedGate[] = [
      { id: "rz", type: Gate.RZ, wire: 0, column: 0, theta: Math.PI },
    ];
    const unitary = computeTrialUnitary(gates, 1);
    const col = columnFromUnitary(unitary, 1);
    const trial = formatColumnAsDiracNormalized(col, 1);
    const sTarget = "1j|1⟩";
    expect(trial).not.toBe(sTarget);
    expect(trial).toBe("|1⟩");
  });
});

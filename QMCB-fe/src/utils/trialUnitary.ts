/**
 * Client-side trial unitary simulation for live output-table preview.
 * DISPLAY-ONLY — grading still goes through Cirq on the backend.
 */

import type { PlacedGate, PlacedSingleQubitGate } from "../types/global";
import { Gate } from "../types/global";
import { gatesInColumnOrder } from "./circuit";
import {
  cabs,
  embedSingleQubit,
  embedTwoQubitOn01,
  identityMatrix,
  matMul,
  type C,
  type ComplexMatrix,
} from "./complexMath";
import { singleQubitGateMatrix, twoQubitGateMatrix } from "./gateMatrices";

export type { C as Complex };

function isSingleQubitGate(g: PlacedGate): g is PlacedSingleQubitGate {
  return "wire" in g;
}

function embeddedGateMatrix(gate: PlacedGate, qubitCount: number): ComplexMatrix | null {
  if (isSingleQubitGate(gate)) {
    const u2 = singleQubitGateMatrix(gate.type as Gate, gate.theta);
    if (!u2) return null;
    return embedSingleQubit(u2, gate.wire, qubitCount);
  }

  const u4 = twoQubitGateMatrix(gate.type as Gate, gate.order);
  if (!u4) return null;
  return embedTwoQubitOn01(u4, qubitCount);
}

/**
 * Compute the full trial unitary for a placed circuit.
 * Column j is the output amplitude vector for basis input |j⟩.
 */
export function computeTrialUnitary(gates: PlacedGate[], qubitCount: number): ComplexMatrix {
  const dim = 2 ** qubitCount;
  let unitary = identityMatrix(dim);

  for (const gate of gatesInColumnOrder(gates)) {
    const embedded = embeddedGateMatrix(gate, qubitCount);
    if (!embedded) continue;
    unitary = matMul(embedded, unitary);
  }

  return unitary;
}

/** Basis-state bit string for index i (MSB = q0), matching backend generate_basis_states. */
export function indexToBasisBits(index: number, qubitCount: number): number[] {
  return index
    .toString(2)
    .padStart(qubitCount, "0")
    .split("")
    .map(Number);
}

export function basisInputLabel(qubitCount: number, index: number): string {
  const bits = indexToBasisBits(index, qubitCount);
  return `|${bits.join("")}⟩`;
}

export function columnFromUnitary(unitary: ComplexMatrix, inputIndex: number): C[] {
  return unitary.map((row) => row[inputIndex]);
}

export function probabilitiesFromColumn(col: readonly C[], decimals = 3): number[] {
  return col.map((amp) => {
    const p = cabs(amp) ** 2;
    return Number(p.toFixed(decimals));
  });
}

function formatComplexCoeff(amp: C, decimals: number): string {
  const re = Number(amp.re.toFixed(decimals));
  const im = Number(amp.im.toFixed(decimals));

  if (Math.abs(re) < 10 ** -decimals && Math.abs(im) < 10 ** -decimals) {
    return "0";
  }
  if (Math.abs(im) < 10 ** -decimals) {
    return `${re}`;
  }
  if (Math.abs(re) < 10 ** -decimals) {
    return im === 1 ? "j" : im === -1 ? "-j" : `${im}j`;
  }
  const imPart = im === 1 ? "+j" : im === -1 ? "-j" : im >= 0 ? `+${im}j` : `${im}j`;
  return `(${re}${imPart})`;
}

/** Format an amplitude column as a Dirac string (decimals=3, Cirq-style). */
export function formatColumnAsDirac(col: readonly C[], qubitCount: number, decimals = 3): string {
  const terms: string[] = [];

  for (let i = 0; i < col.length; i++) {
    const amp = col[i];
    if (cabs(amp) < 10 ** -decimals) continue;

    const ket = basisInputLabel(qubitCount, i);
    const coeff = formatComplexCoeff(amp, decimals);

    if (coeff === "1") {
      terms.push(ket);
    } else if (coeff === "-1") {
      terms.push(`-${ket}`);
    } else {
      terms.push(`${coeff}${ket}`);
    }
  }

  if (terms.length === 0) return "0";
  return terms.join(" + ").replace(/\+ -/g, "- ");
}

export function roundProbabilities(probs: readonly number[], decimals = 3): number[] {
  return probs.map((p) => Number(p.toFixed(decimals)));
}

/** Probabilities for a single expected-output Dirac string (definite or superposition). */
export function probabilitiesFromDiracString(
  output: string,
  qubitCount: number,
  decimals = 3
): number[] {
  const dim = 2 ** qubitCount;
  const probs = Array(dim).fill(0);
  const trimmed = output.trim();

  if (!trimmed || trimmed === "0") {
    return roundProbabilities(probs, decimals);
  }

  const parts = trimmed.split(/\s+(?=[+-])/);
  for (const rawPart of parts) {
    let part = rawPart.trim();
    if (!part) continue;

    let sign = 1;
    if (part.startsWith("-")) {
      sign = -1;
      part = part.slice(1).trim();
    } else if (part.startsWith("+")) {
      part = part.slice(1).trim();
    }

    const ketMatch = part.match(/\|([01]+)⟩/);
    if (!ketMatch) continue;

    const coeffStr = part.slice(0, part.indexOf("|")).trim();
    let re = 1;
    let im = 0;

    if (coeffStr) {
      const cleaned = coeffStr.replace(/[()]/g, "");
      if (cleaned.endsWith("j")) {
        const body = cleaned.slice(0, -1);
        if (body === "" || body === "+") {
          im = 1;
        } else if (body === "-") {
          im = -1;
        } else {
          im = parseFloat(body);
        }
      } else if (cleaned.includes("+") || cleaned.includes("-")) {
        const complexMatch = cleaned.match(/^([+-]?\d*\.?\d+)([+-]\d*\.?\d+)j$/);
        if (complexMatch) {
          re = parseFloat(complexMatch[1] || "0");
          im = parseFloat(complexMatch[2]);
        }
      } else {
        re = parseFloat(cleaned);
      }
    }

    re *= sign;
    im *= sign;
    const magSq = re * re + im * im;

    const bits = ketMatch[1].split("").map(Number);
    let index = 0;
    for (const b of bits) {
      index = index * 2 + b;
    }
    probs[index] += magSq;
  }

  return roundProbabilities(probs, decimals);
}

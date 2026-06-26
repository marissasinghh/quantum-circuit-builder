/**
 * Dirac ket string formatting for client-side preview.
 * Mirrors Cirq dirac_notation(decimals=3) on whole-matrix phase-normalized unitaries.
 * Graded output uses backend Cirq strings directly — see toTruthRows().
 */

import { cabs, cconj, cmul, type C, type ComplexMatrix } from "./complexMath";
import { basisInputLabel } from "./trialUnitary";

function roundTo(val: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

/** Python-style general format with fixed precision (Cirq uses "{:.Ng}"). */
function formatGeneral(n: number, decimals: number): string {
  if (Object.is(n, -0) || n === 0) return "0";
  return Number(n.toPrecision(decimals)).toString();
}

/**
 * Divide every entry in the unitary by the phase of the first nonzero entry
 * found in row-major order. One global scalar per circuit — not per column.
 */
export function normalizeUnitaryLeadingPhase(
  unitary: ComplexMatrix,
  epsilon = 1e-9
): ComplexMatrix {
  let anchor: C | null = null;

  for (const row of unitary) {
    for (const entry of row) {
      if (cabs(entry) > epsilon) {
        anchor = entry;
        break;
      }
    }
    if (anchor) break;
  }

  if (!anchor) {
    return unitary.map((row) => row.map((cell) => ({ re: cell.re, im: cell.im })));
  }

  const mag = cabs(anchor);
  const phase = { re: anchor.re / mag, im: anchor.im / mag };
  const phaseConj = cconj(phase);

  return unitary.map((row) => row.map((cell) => cmul(cell, phaseConj)));
}

/**
 * Format a state vector as a Dirac string using Cirq dirac_notation rules.
 * Callers must apply normalizeUnitaryLeadingPhase to the trial unitary first.
 */
export function formatStateVectorAsDirac(
  amplitudes: readonly C[],
  qubitCount: number,
  decimals = 3
): string {
  const components: string[] = [];

  for (let i = 0; i < amplitudes.length; i++) {
    const raw = amplitudes[i];
    const re = roundTo(raw.re, decimals);
    const im = roundTo(raw.im, decimals);

    let val: number | null = null;
    let coeffStr: string | null = null;

    if (re === 0 && im !== 0) {
      val = im;
      coeffStr = `${formatGeneral(im, decimals)}j`;
    } else if (im === 0 && re !== 0) {
      val = re;
      coeffStr = formatGeneral(re, decimals);
    } else if (re !== 0 || im !== 0) {
      val = 1;
      const imPart =
        im === 0 ? "" : im > 0 ? `+${formatGeneral(im, decimals)}j` : `${formatGeneral(im, decimals)}j`;
      coeffStr = `(${formatGeneral(re, decimals)}${imPart})`;
    }

    if (val === null || val === 0) continue;

    const ket = basisInputLabel(qubitCount, i);
    if (roundTo(raw.re, decimals) === 1 && roundTo(raw.im, decimals) === 0) {
      components.push(ket);
    } else {
      components.push(`${coeffStr}${ket}`);
    }
  }

  if (components.length === 0) return "0";
  return components.join(" + ").replace(/ \+ -/g, " - ");
}

/** Format raw amplitudes without phase normalization. */
export function formatColumnAsDirac(
  col: readonly C[],
  qubitCount: number,
  decimals = 3
): string {
  return formatStateVectorAsDirac(col, qubitCount, decimals);
}

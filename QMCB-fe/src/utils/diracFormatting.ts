/**
 * Dirac ket string formatting for client-side preview.
 * Mirrors Cirq dirac_notation(decimals=3) after optional leading-phase normalization.
 * Graded output uses backend Cirq strings directly — see toTruthRows().
 */

import { cabs, cconj, cmul, type C } from "./complexMath";
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
 * Divide the amplitude vector by the phase of its first nonzero entry.
 * Removes global phase so equivalent states share a canonical representation.
 */
export function normalizeLeadingPhase(amplitudes: readonly C[], epsilon = 1e-9): C[] {
  let k = -1;
  for (let i = 0; i < amplitudes.length; i++) {
    if (cabs(amplitudes[i]) > epsilon) {
      k = i;
      break;
    }
  }
  if (k === -1) {
    return amplitudes.map((a) => ({ re: a.re, im: a.im }));
  }

  const mag = cabs(amplitudes[k]);
  const phase = { re: amplitudes[k].re / mag, im: amplitudes[k].im / mag };
  return amplitudes.map((amp) => cmul(amp, cconj(phase)));
}

/**
 * Format a state vector as a Dirac string using Cirq dirac_notation rules.
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

/** Leading-phase normalization then Cirq-style Dirac formatting (preview trial kets). */
export function formatColumnAsDiracNormalized(
  col: readonly C[],
  qubitCount: number,
  decimals = 3
): string {
  return formatStateVectorAsDirac(normalizeLeadingPhase(col), qubitCount, decimals);
}

/** Format raw amplitudes without phase normalization (legacy / non-preview use). */
export function formatColumnAsDirac(
  col: readonly C[],
  qubitCount: number,
  decimals = 3
): string {
  return formatStateVectorAsDirac(col, qubitCount, decimals);
}

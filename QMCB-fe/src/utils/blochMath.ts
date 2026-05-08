/**
 * Pure-frontend Bloch sphere math.
 *
 * Computes the Bloch-sphere angles (θ, φ) for a sequence of single-qubit
 * gates by simulating a 2-element complex state vector.
 *
 * This is DISPLAY-ONLY — truth-table grading still goes through Cirq on the backend.
 *
 * How a qubit state maps to the Bloch sphere:
 *   |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)·sin(θ/2)|1⟩
 *
 * Cardinal states for reference:
 *   |0⟩  →  θ=0,   φ=0       (north pole)
 *   |1⟩  →  θ=π,   φ=0       (south pole)
 *   |+⟩  →  θ=π/2, φ=0       (equator, +X)
 *   |−⟩  →  θ=π/2, φ=π       (equator, −X)
 *   |i⟩  →  θ=π/2, φ=π/2     (equator, +Y)
 *   |−i⟩ →  θ=π/2, φ=3π/2    (equator, −Y)
 */

import { Gate } from "../types/global";
import type { PlacedGate, PlacedSingleQubitGate } from "../types/global";

// ---------------------------------------------------------------------------
// Complex number arithmetic
// ---------------------------------------------------------------------------

/** A complex number { re, im }. */
type C = { re: number; im: number };

const c = (re: number, im = 0): C => ({ re, im });

/** Complex addition. */
const cadd = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im });

/** Complex multiplication. */
const cmul = (a: C, b: C): C => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

/** Magnitude (absolute value) of a complex number. */
const cabs = (a: C): number => Math.sqrt(a.re * a.re + a.im * a.im);

/** Phase angle of a complex number (arg). */
const carg = (a: C): number => Math.atan2(a.im, a.re);

// ---------------------------------------------------------------------------
// 2×2 complex matrix × 2-element complex vector
// ---------------------------------------------------------------------------

/** A 2×2 matrix stored as [[row0col0, row0col1], [row1col0, row1col1]]. */
type Mat2 = [[C, C], [C, C]];

/** State vector [α, β] where the qubit is α|0⟩ + β|1⟩. */
type StateVec = [C, C];

/** Apply a 2×2 matrix to a 2-element state vector: result = M · v. */
function applyMatrix(m: Mat2, v: StateVec): StateVec {
  return [
    cadd(cmul(m[0][0], v[0]), cmul(m[0][1], v[1])),
    cadd(cmul(m[1][0], v[0]), cmul(m[1][1], v[1])),
  ];
}

// ---------------------------------------------------------------------------
// Gate matrices
// ---------------------------------------------------------------------------

/**
 * Returns the 2×2 unitary matrix for the given gate.
 * Two-qubit gates return null — they are silently skipped by the caller.
 */
function gateMatrix(gate: Gate, theta?: number): Mat2 | null {
  const ONE = c(1);
  const ZERO = c(0);

  switch (gate) {
    case Gate.X:
      return [
        [ZERO, ONE],
        [ONE, ZERO],
      ];

    case Gate.SQRT_X: {
      // [[1+i, 1−i],[1−i, 1+i]] / 2
      const a: C = c(0.5, 0.5);  // (1+i)/2
      const b: C = c(0.5, -0.5); // (1−i)/2
      return [
        [a, b],
        [b, a],
      ];
    }

    case Gate.H: {
      const s = c(1 / Math.SQRT2);
      const sn = c(-1 / Math.SQRT2);
      return [
        [s, s],
        [s, sn],
      ];
    }

    case Gate.S:
      // [[1,0],[0,i]]
      return [
        [ONE, ZERO],
        [ZERO, c(0, 1)],
      ];

    case Gate.T: {
      // [[1,0],[0,e^(iπ/4)]]
      const t = c(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4));
      return [
        [ONE, ZERO],
        [ZERO, t],
      ];
    }

    case Gate.RZ: {
      // [[e^(−iθ/2), 0],[0, e^(iθ/2)]]
      const ang = (theta ?? 0) / 2;
      return [
        [c(Math.cos(ang), -Math.sin(ang)), ZERO],
        [ZERO, c(Math.cos(ang), Math.sin(ang))],
      ];
    }

    case Gate.RX: {
      // [[cos(θ/2), −i·sin(θ/2)],[−i·sin(θ/2), cos(θ/2)]]
      const ang = (theta ?? 0) / 2;
      const cosA = c(Math.cos(ang));
      const isinA = c(0, -Math.sin(ang));
      return [
        [cosA, isinA],
        [isinA, cosA],
      ];
    }

    case Gate.RY: {
      // [[cos(θ/2), −sin(θ/2)],[sin(θ/2), cos(θ/2)]]
      const ang = (theta ?? 0) / 2;
      const cosA = c(Math.cos(ang));
      const sinA = c(Math.sin(ang));
      const nsinA = c(-Math.sin(ang));
      return [
        [cosA, nsinA],
        [sinA, cosA],
      ];
    }

    case Gate.U: {
      // Treat as identity when no theta is provided (placeholder visual)
      const ang = (theta ?? 0) / 2;
      const cosA = c(Math.cos(ang));
      const sinA = c(Math.sin(ang));
      const nsinA = c(-Math.sin(ang));
      return [
        [cosA, nsinA],
        [sinA, cosA],
      ];
    }

    // Two-qubit gates — not representable on a single-qubit Bloch sphere.
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Type guard: is this gate a single-qubit placement?
// ---------------------------------------------------------------------------

function isSingleQubitGate(g: PlacedGate): g is PlacedSingleQubitGate {
  return "wire" in g;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface BlochState {
  theta: number;
  phi: number;
}

/**
 * Simulate a sequence of placed gates on the |0⟩ initial state and return
 * the resulting Bloch-sphere angles (θ, φ).
 *
 * Only single-qubit gates are processed; two-qubit gates are skipped.
 * If a gate has no matrix representation it is also skipped silently.
 */
export function gateSequenceToBlochState(gates: PlacedGate[]): BlochState {
  // Start at |0⟩ = [1, 0]
  let state: StateVec = [c(1), c(0)];

  for (const gate of gates) {
    if (!isSingleQubitGate(gate)) continue;

    const mat = gateMatrix(gate.type as Gate, gate.theta);
    if (mat === null) continue;

    state = applyMatrix(mat, state);
  }

  const [alpha, beta] = state;

  // θ = 2·arccos(|α|), clamped to avoid floating-point domain errors
  const absAlpha = Math.min(1, Math.max(0, cabs(alpha)));
  const theta = 2 * Math.acos(absAlpha);

  // φ = arg(β) − arg(α), normalised to [0, 2π)
  let phi = carg(beta) - carg(alpha);
  if (phi < 0) phi += 2 * Math.PI;

  return { theta, phi };
}

// ---------------------------------------------------------------------------
// Inline sanity checks (dev only)
// ---------------------------------------------------------------------------

if (import.meta.env.DEV) {
  const eps = 1e-9;
  const approx = (a: number, b: number) => Math.abs(a - b) < 1e-6;

  // Empty circuit → |0⟩ → north pole → θ=0
  const emptyState = gateSequenceToBlochState([]);
  console.assert(approx(emptyState.theta, 0), `[blochMath] empty circuit theta: expected 0, got ${emptyState.theta}`);

  // X gate on |0⟩ → |1⟩ → south pole → θ=π
  const xGate = {
    id: "test-x",
    type: Gate.X,
    wire: 0 as const,
    column: 0,
  };
  const xState = gateSequenceToBlochState([xGate]);
  console.assert(approx(xState.theta, Math.PI), `[blochMath] X gate theta: expected π, got ${xState.theta}`);

  // H gate on |0⟩ → |+⟩ → equator +X → θ=π/2, φ=0
  const hGate = {
    id: "test-h",
    type: Gate.H,
    wire: 0 as const,
    column: 0,
  };
  const hState = gateSequenceToBlochState([hGate]);
  console.assert(approx(hState.theta, Math.PI / 2), `[blochMath] H gate theta: expected π/2, got ${hState.theta}`);
  // φ from |+⟩: arg(1/√2) − arg(1/√2) = 0 (both real positive, normalised to [0,2π))
  console.assert(approx(hState.phi % (2 * Math.PI), 0), `[blochMath] H gate phi: expected 0, got ${hState.phi}`);

  void eps; // suppress unused warning
}

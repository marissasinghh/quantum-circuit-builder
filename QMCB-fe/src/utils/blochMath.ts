/**
 * Pure-frontend Bloch sphere math.
 *
 * Computes the Bloch-sphere angles (θ, φ) for a sequence of single-qubit
 * gates by simulating a 2-element complex state vector.
 *
 * This is DISPLAY-ONLY — truth-table grading still goes through Cirq on the backend.
 */

import { Gate } from "../types/global";
import type { PlacedGate, PlacedSingleQubitGate } from "../types/global";
import { gatesInColumnOrder } from "./circuit";
import { applyMat2, c, cabs, carg, type C } from "./complexMath";
import { singleQubitGateMatrix } from "./gateMatrices";

type StateVec = [C, C];

function isSingleQubitGate(g: PlacedGate): g is PlacedSingleQubitGate {
  return "wire" in g;
}

export interface BlochState {
  theta: number;
  phi: number;
}

export function gateSequenceToBlochState(
  gates: PlacedGate[],
  initialState: 0 | 1 = 0
): BlochState {
  let state: StateVec = initialState === 1 ? [c(0), c(1)] : [c(1), c(0)];

  for (const gate of gatesInColumnOrder(gates)) {
    if (!isSingleQubitGate(gate)) continue;

    const mat = singleQubitGateMatrix(gate.type as Gate, gate.theta);
    if (mat === null) continue;

    state = applyMat2(mat, state);
  }

  const [alpha, beta] = state;

  const absAlpha = Math.min(1, Math.max(0, cabs(alpha)));
  const theta = 2 * Math.acos(absAlpha);

  let phi = carg(beta) - carg(alpha);
  if (phi < 0) phi += 2 * Math.PI;

  return { theta, phi };
}

export function amplitudesToBlochState(
  alpha: readonly [number, number],
  beta: readonly [number, number]
): BlochState {
  const a: C = { re: alpha[0], im: alpha[1] };
  const b: C = { re: beta[0], im: beta[1] };

  const absAlpha = Math.min(1, Math.max(0, cabs(a)));
  const theta = 2 * Math.acos(absAlpha);

  let phi = carg(b) - carg(a);
  if (phi < 0) phi += 2 * Math.PI;

  return { theta, phi };
}

export function canonicalStepsToBlochState(
  canonical: readonly { gate: Gate; order: readonly number[]; theta?: number }[],
  initialState: 0 | 1 = 0
): BlochState {
  const pseudoGates = canonical.map((step, i) => ({
    id: `__target_${i}`,
    type: step.gate,
    wire: (step.order[0] ?? 0) as 0 | 1,
    column: i,
    ...(step.theta !== undefined && { theta: step.theta }),
  })) as unknown as PlacedGate[];
  return gateSequenceToBlochState(pseudoGates, initialState);
}

if (import.meta.env.DEV) {
  const approx = (a: number, b: number) => Math.abs(a - b) < 1e-6;

  const emptyState = gateSequenceToBlochState([]);
  console.assert(approx(emptyState.theta, 0), `[blochMath] empty circuit theta: expected 0, got ${emptyState.theta}`);

  const emptyFromOne = gateSequenceToBlochState([], 1);
  console.assert(approx(emptyFromOne.theta, Math.PI), `[blochMath] empty |1⟩ theta: expected π, got ${emptyFromOne.theta}`);

  const xGate = {
    id: "test-x",
    type: Gate.X,
    wire: 0 as const,
    column: 0,
  } satisfies PlacedSingleQubitGate;
  const xState = gateSequenceToBlochState([xGate]);
  console.assert(approx(xState.theta, Math.PI), `[blochMath] X gate theta: expected π, got ${xState.theta}`);

  const xFromOne = gateSequenceToBlochState([xGate], 1);
  console.assert(approx(xFromOne.theta, 0), `[blochMath] X from |1⟩ theta: expected 0, got ${xFromOne.theta}`);

  const hGate = {
    id: "test-h",
    type: Gate.H,
    wire: 0 as const,
    column: 0,
  } satisfies PlacedSingleQubitGate;
  const hState = gateSequenceToBlochState([hGate]);
  console.assert(approx(hState.theta, Math.PI / 2), `[blochMath] H gate theta: expected π/2, got ${hState.theta}`);
  console.assert(approx(hState.phi % (2 * Math.PI), 0), `[blochMath] H gate phi: expected 0, got ${hState.phi}`);
}

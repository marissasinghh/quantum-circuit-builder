import { Gate, type ControlTargetOrder } from "../types/global";
import { c, type C, type ComplexMatrix, type Mat2 } from "./complexMath";

const ONE = c(1);
const ZERO = c(0);

/** 2×2 unitary for a single-qubit primitive gate. */
export function singleQubitGateMatrix(gate: Gate, theta?: number): Mat2 | null {
  switch (gate) {
    case Gate.X:
      return [
        [ZERO, ONE],
        [ONE, ZERO],
      ];

    case Gate.SQRT_X: {
      const a: C = c(0.5, 0.5);
      const b: C = c(0.5, -0.5);
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
      return [
        [ONE, ZERO],
        [ZERO, c(0, 1)],
      ];

    case Gate.T: {
      const t = c(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4));
      return [
        [ONE, ZERO],
        [ZERO, t],
      ];
    }

    case Gate.RZ: {
      const ang = (theta ?? 0) / 2;
      return [
        [c(Math.cos(ang), -Math.sin(ang)), ZERO],
        [ZERO, c(Math.cos(ang), Math.sin(ang))],
      ];
    }

    case Gate.RX: {
      const ang = (theta ?? 0) / 2;
      const cosA = c(Math.cos(ang));
      const isinA = c(0, -Math.sin(ang));
      return [
        [cosA, isinA],
        [isinA, cosA],
      ];
    }

    case Gate.RY: {
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
      const ang = (theta ?? 0) / 2;
      const cosA = c(Math.cos(ang));
      const sinA = c(Math.sin(ang));
      const nsinA = c(-Math.sin(ang));
      return [
        [cosA, nsinA],
        [sinA, cosA],
      ];
    }

    // ── New Tier 1 gates ──────────────────────────────────────────────────────

    case Gate.SQRT_X_DAG: {
      // Conjugate transpose of SQRT_X: [[0.5+0.5i, 0.5-0.5i],[0.5-0.5i, 0.5+0.5i]]
      const a: C = c(0.5, 0.5);
      const b: C = c(0.5, -0.5);
      return [
        [a, b],
        [b, a],
      ];
    }

    case Gate.Z:
      return [
        [ONE, ZERO],
        [ZERO, c(-1)],
      ];

    case Gate.S_DAG:
      return [
        [ONE, ZERO],
        [ZERO, c(0, -1)],
      ];

    case Gate.T_DAG: {
      const t = c(Math.cos(Math.PI / 4), -Math.sin(Math.PI / 4));
      return [
        [ONE, ZERO],
        [ZERO, t],
      ];
    }

    case Gate.Y:
      return [
        [ZERO, c(0, -1)],
        [c(0, 1), ZERO],
      ];

    // Dagger aliases — physically identical to parent gate.
    // Delegates here mirror DAG_ALIAS_TO_PARENT in circuit.ts.
    case Gate.Z_DAG:
      return singleQubitGateMatrix(Gate.Z);
    case Gate.H_DAG:
      return singleQubitGateMatrix(Gate.H);
    case Gate.Y_DAG:
      return singleQubitGateMatrix(Gate.Y);

    default:
      return null;
  }
}

function bitAt(index: number, qubit: number): number {
  return (index >> (1 - qubit)) & 1;
}

function buildTwoQubitMatrix(
  transform: (controlBit: number, targetBit: number, amp: C) => { outIndex: number; amp: C }[]
): ComplexMatrix {
  const m: ComplexMatrix = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => c(0)));
  for (let inIdx = 0; inIdx < 4; inIdx++) {
    const b0 = bitAt(inIdx, 0);
    const b1 = bitAt(inIdx, 1);
    const results = transform(b0, b1, c(1));
    for (const { outIndex, amp } of results) {
      m[outIndex][inIdx] = amp;
    }
  }
  return m;
}

function cnotMatrix(control: 0 | 1, target: 0 | 1): ComplexMatrix {
  return buildTwoQubitMatrix((b0, b1) => {
    const controlBit = control === 0 ? b0 : b1;
    const targetBit = target === 0 ? b0 : b1;
    const inIdx = (b0 << 1) | b1;
    if (controlBit === 0) {
      return [{ outIndex: inIdx, amp: c(1) }];
    }
    const newTarget = targetBit ^ 1;
    const outB0 = target === 0 ? newTarget : b0;
    const outB1 = target === 1 ? newTarget : b1;
    const outIdx = (outB0 << 1) | outB1;
    return [{ outIndex: outIdx, amp: c(1) }];
  });
}

function czMatrix(control: 0 | 1, target: 0 | 1): ComplexMatrix {
  return buildTwoQubitMatrix((b0, b1) => {
    const controlBit = control === 0 ? b0 : b1;
    const targetBit = target === 0 ? b0 : b1;
    const inIdx = (b0 << 1) | b1;
    const phase = controlBit === 1 && targetBit === 1 ? -1 : 1;
    return [{ outIndex: inIdx, amp: c(phase) }];
  });
}

function swapMatrix(): ComplexMatrix {
  const m: ComplexMatrix = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => c(0)));
  m[0][0] = c(1);
  m[3][3] = c(1);
  m[1][2] = c(1);
  m[2][1] = c(1);
  return m;
}

function controlledHMatrix(control: 0 | 1, target: 0 | 1): ComplexMatrix {
  const h = singleQubitGateMatrix(Gate.H);
  if (!h) return swapMatrix();

  const m: ComplexMatrix = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => c(0)));
  for (let inIdx = 0; inIdx < 4; inIdx++) {
    const b0 = bitAt(inIdx, 0);
    const b1 = bitAt(inIdx, 1);
    const controlBit = control === 0 ? b0 : b1;
    const targetBit = target === 0 ? b0 : b1;

    if (controlBit === 0) {
      m[inIdx][inIdx] = c(1);
      continue;
    }

    const tgt = targetBit;
    for (let outTgt = 0; outTgt <= 1; outTgt++) {
      const outB0 = target === 0 ? outTgt : b0;
      const outB1 = target === 1 ? outTgt : b1;
      const outIdx = (outB0 << 1) | outB1;
      const hElem = h[outTgt][tgt];
      m[outIdx][inIdx] = hElem;
    }
  }
  return m;
}

/** 4×4 unitary for a two-qubit gate on wires 0 and 1 only. */
export function twoQubitGateMatrix(
  gate: Gate,
  order: ControlTargetOrder
): ComplexMatrix | null {
  const [control, target] = order;

  switch (gate) {
    case Gate.CNOT:
    case Gate.CNOT_FLIPPED:
      return cnotMatrix(control, target);
    case Gate.CONTROLLED_Z:
      return czMatrix(control, target);
    case Gate.SWAP:
      return swapMatrix();
    case Gate.CONTROLLED_H:
      return controlledHMatrix(control, target);
    default:
      return null;
  }
}

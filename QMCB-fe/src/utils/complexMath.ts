/** A complex number { re, im }. */
export type C = { re: number; im: number };

export const c = (re: number, im = 0): C => ({ re, im });

export const cadd = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im });

export const cmul = (a: C, b: C): C => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

export const cscale = (a: C, s: number): C => ({ re: a.re * s, im: a.im * s });

export const cconj = (a: C): C => ({ re: a.re, im: -a.im });

export const cabs = (a: C): number => Math.sqrt(a.re * a.re + a.im * a.im);

export const carg = (a: C): number => Math.atan2(a.im, a.re);

/** A 2×2 matrix stored as [[row0col0, row0col1], [row1col0, row1col1]]. */
export type Mat2 = [[C, C], [C, C]];

export type ComplexMatrix = C[][];

export const I2: Mat2 = [
  [c(1), c(0)],
  [c(0), c(1)],
];

export function identityMatrix(size: number): ComplexMatrix {
  const m: ComplexMatrix = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => c(0))
  );
  for (let i = 0; i < size; i++) {
    m[i][i] = c(1);
  }
  return m;
}

export function applyMat2(m: Mat2, v: [C, C]): [C, C] {
  return [
    cadd(cmul(m[0][0], v[0]), cmul(m[0][1], v[1])),
    cadd(cmul(m[1][0], v[0]), cmul(m[1][1], v[1])),
  ];
}

export function matMul(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  const n = a.length;
  const result = identityMatrix(n).map((row) => row.map(() => c(0)));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = c(0);
      for (let k = 0; k < n; k++) {
        sum = cadd(sum, cmul(a[i][k], b[k][j]));
      }
      result[i][j] = sum;
    }
  }
  return result;
}

export function kron(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  const ar = a.length;
  const ac = a[0]?.length ?? 0;
  const br = b.length;
  const bc = b[0]?.length ?? 0;
  const result: ComplexMatrix = Array.from({ length: ar * br }, () =>
    Array.from({ length: ac * bc }, () => c(0))
  );

  for (let i = 0; i < ar; i++) {
    for (let j = 0; j < ac; j++) {
      for (let p = 0; p < br; p++) {
        for (let q = 0; q < bc; q++) {
          result[i * br + p][j * bc + q] = cmul(a[i][j], b[p][q]);
        }
      }
    }
  }
  return result;
}

/** Embed a 2×2 gate on the given wire in an n-qubit Hilbert space (q0 leftmost in kron). */
export function embedSingleQubit(u: Mat2, wire: number, qubitCount: number): ComplexMatrix {
  let result: ComplexMatrix = [[c(1)]];
  for (let i = 0; i < qubitCount; i++) {
    result = kron(result, i === wire ? u : I2);
  }
  return result;
}

/** Bit of `index` on `wire` when q0 is MSB (matches kron / Cirq qubit_order). */
function bitAtWire(index: number, wire: number, qubitCount: number): number {
  return (index >> (qubitCount - 1 - wire)) & 1;
}

function withBitAtWire(
  index: number,
  wire: number,
  qubitCount: number,
  bit: number
): number {
  const shift = qubitCount - 1 - wire;
  return (index & ~(1 << shift)) | ((bit & 1) << shift);
}

/**
 * Embed a 4×4 two-qubit gate on absolute wires (wire0, wire1) in an n-qubit space.
 * Local MSB of `u4` maps to `wire0`; local LSB maps to `wire1` (same convention as
 * twoQubitGateMatrix / kron with q0 leftmost).
 */
export function embedTwoQubit(
  u4: ComplexMatrix,
  wire0: number,
  wire1: number,
  qubitCount: number
): ComplexMatrix {
  if (qubitCount < 2) {
    throw new Error("embedTwoQubit requires qubitCount >= 2");
  }
  if (wire0 === wire1) {
    throw new Error("embedTwoQubit requires distinct wires");
  }
  if (qubitCount === 2 && wire0 === 0 && wire1 === 1) {
    return u4;
  }

  const dim = 2 ** qubitCount;
  const result = identityMatrix(dim).map((row) => row.map(() => c(0)));

  for (let inIdx = 0; inIdx < dim; inIdx++) {
    const b0 = bitAtWire(inIdx, wire0, qubitCount);
    const b1 = bitAtWire(inIdx, wire1, qubitCount);
    const localIn = (b0 << 1) | b1;

    for (let localOut = 0; localOut < 4; localOut++) {
      const amp = u4[localOut]?.[localIn];
      if (!amp || (amp.re === 0 && amp.im === 0)) continue;

      const outB0 = (localOut >> 1) & 1;
      const outB1 = localOut & 1;
      let outIdx = inIdx;
      outIdx = withBitAtWire(outIdx, wire0, qubitCount, outB0);
      outIdx = withBitAtWire(outIdx, wire1, qubitCount, outB1);
      result[outIdx][inIdx] = cadd(result[outIdx][inIdx], amp);
    }
  }

  return result;
}

/** @deprecated Prefer embedTwoQubit(u4, 0, 1, qubitCount). Kept as a thin alias. */
export function embedTwoQubitOn01(u4: ComplexMatrix, qubitCount: number): ComplexMatrix {
  return embedTwoQubit(u4, 0, 1, qubitCount);
}

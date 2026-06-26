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

/** Embed a 4×4 two-qubit gate on wires 0 and 1; remaining wires get identity. */
export function embedTwoQubitOn01(u4: ComplexMatrix, qubitCount: number): ComplexMatrix {
  if (qubitCount === 2) return u4;
  return kron(u4, I2);
}

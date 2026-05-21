# Gate Level Reference

**Sources:** `QMCB-fe/src/config/levels.ts` (toolbox, canonical, description, hints),
`QMCB-be/app/config/target_library.py` + test files (backend-verified truth table strings),
`QMCB-be/tests/test_tier1_targets.py` (canonical output strings for global-phase levels).

All truth table output strings use Cirq `dirac_notation(decimals=3)` format.

---

## Flags legend

- **Global phase** — the canonical circuit's output strings differ from the target's output strings
  by an unobservable global phase factor. The backend accepts these via `_match_up_to_global_phase`.
  This is physically correct behaviour, not a bug.
- **Frontend/backend discrepancy** — the `expectedTruth` in `levels.ts` does not match the
  backend-verified truth table. Flagged for awareness; not a runtime bug unless noted otherwise.
- **Backend only** — the level exists in `target_library.py` and passes all tests but has not yet
  been added to `levels.ts`.

---

## Tier 1 — Single-Qubit Levels

---

### Level 1.0 · X Gate

**Description:** The X gate flips |0⟩ to |1⟩ and |1⟩ to |0⟩ — the quantum equivalent of a
classical NOT. Synthesize a circuit whose unitary matches X exactly.

**Toolbox:** `Rz`, `√X`

**Canonical circuit:** `√X[Q0]  →  √X[Q0]`

**Truth table:**

| Input | Target output | Canonical output | Match |
|-------|--------------|-----------------|-------|
| \|0⟩  | \|1⟩         | \|1⟩            | Exact |
| \|1⟩  | \|0⟩         | \|0⟩            | Exact |

**Global phase:** None. `√X · √X = X` exactly in Cirq — no phase difference.

**Hint 1:** Check how √X moves the state on the Bloch sphere.

**Hint 2:** How could you use √X to move the state further south?

**Learning goal:** Introduce gate synthesis from primitives. Two half-NOT steps produce a full NOT
with no global phase — the first confirmation that composition works exactly.

---

### Level 1.1 · S Gate

**Description:** The S gate leaves |0⟩ unchanged and multiplies |1⟩ by i — a π/2 phase rotation
around the Z-axis. Synthesize a circuit whose unitary matches S exactly.

**Toolbox:** `Rz`, `√X`, `X`

**Canonical circuit:** `Rz(π/2)[Q0]`

**Truth table:**

| Input | Target output | Canonical output | Match |
|-------|--------------|-----------------|-------|
| \|0⟩  | \|0⟩         | \|0⟩            | Exact |
| \|1⟩  | 1j\|1⟩       | 1j\|1⟩          | Exact |

**Global phase:** None. `Rz(π/2)` = `Z^(1/2)` = S exactly in Cirq's Z-power convention.

**Hint 1:** S is a pure Z-axis rotation; place a √X gate first to visualise how Rz(θ) rotates the state.

**Hint 2:** What angle do you need to make the π/2 phase rotation?

**Learning goal:** `Rz(π/2)` maps directly to S in Cirq's Z-power convention. No global phase —
the canonical output is bit-for-bit identical to the target.

---

### Level 1.2 · T Gate

**Description:** The T gate leaves |0⟩ unchanged and applies a phase of e^(iπ/4) to |1⟩ — a π/4
phase rotation around the Z-axis. Synthesize a circuit whose unitary matches T exactly.

**Toolbox:** `Rz`, `√X`, `X`, `S`

**Canonical circuit:** `Rz(π/4)[Q0]`

**Truth table:**

| Input | Target output          | Canonical output       | Match |
|-------|----------------------|----------------------|-------|
| \|0⟩  | \|0⟩                 | \|0⟩                 | Exact |
| \|1⟩  | (0.707+0.707j)\|1⟩   | (0.707+0.707j)\|1⟩   | Exact |

**Global phase:** None. `Rz(π/4)` = `Z^(1/4)` = T exactly.

**Hint 1:** The T gate is very similar to the S gate — use the same visualisation method.

**Hint 2:** T is Rz at precisely half the angle you used for S.

**Learning goal:** Reinforces that the Z-rotation spectrum spans S → T at half angle. No global phase.

---

### Level 1.3 · H Gate  ⚠ FIRST GLOBAL PHASE ENCOUNTER

**Description:** The Hadamard gate creates equal superposition: |0⟩ maps to (|0⟩+|1⟩)/√2 and |1⟩
maps to (|0⟩−|1⟩)/√2. Synthesize a circuit whose unitary matches H exactly.

**Toolbox:** `Rz`, `√X`, `X`, `S`, `T`

**Canonical circuit:** `Rz(π/2)[Q0]  →  √X[Q0]  →  Rz(π/2)[Q0]`

**Truth table:**

| Input | Target output                   | Canonical output                    | Match                  |
|-------|---------------------------------|-------------------------------------|------------------------|
| \|0⟩  | 0.707\|0⟩ + 0.707\|1⟩          | (0.5+0.5j)\|0⟩ + (0.5+0.5j)\|1⟩   | Global phase e^(iπ/4)  |
| \|1⟩  | 0.707\|0⟩ - 0.707\|1⟩          | (0.5+0.5j)\|0⟩ - (0.5+0.5j)\|1⟩   | Global phase e^(iπ/4)  |

> **Global phase:** `e^(iπ/4)`. Every amplitude is scaled by `(0.5+0.5j)` instead of `0.707`
> because `0.707 × e^(iπ/4) = 0.707 × (0.707+0.707j) = 0.5+0.5j`. The backend accepts the
> canonical circuit via `_match_up_to_global_phase` — a single global factor `φ` such that
> `canonical[i] = φ × target[i]` for every row.

**Hint 1:** H requires both rotation axes — combine Rz and √X in sequence.

**Hint 2:** Conjugating √X by Rz rotations changes the effective rotation axis — try sandwiching
√X between two Rz gates.

**Learning goal:** First exposure to global phase in the curriculum. The ZXZ canonical
`Rz(π/2) · √X · Rz(π/2)` implements H up to a global phase `e^(iπ/4)`. Physically identical to
H — the string representation differs, but no measurement can distinguish them.

---

### Level 1.4 · Rx Gate  ⚠ GLOBAL PHASE (parameterized)

**Description:** Rx(θ) rotates a qubit by angle θ around the X-axis of the Bloch sphere.
Synthesize a parameterized circuit whose unitary matches Rx(θ) for any angle θ.

**Toolbox:** `Rz`, `√X`, `X`, `S`, `T`, `H`

**Canonical circuit:** `H[Q0]  →  Rz(θ)[Q0]  →  H[Q0]`

**Truth table (target outputs, two sample angles):**

| Input          | Target output                    | Canonical output         | Match                     |
|----------------|----------------------------------|--------------------------|---------------------------|
| \|0⟩  (θ=π/4)  | 0.924\|0⟩ - 0.383j\|1⟩          | carries global e^(iθ/2)  | Global phase (θ-dep.)     |
| \|1⟩  (θ=π/4)  | -0.383j\|0⟩ + 0.924\|1⟩         | carries global e^(iθ/2)  | Global phase (θ-dep.)     |
| \|0⟩  (θ=π/2)  | 0.707\|0⟩ - 0.707j\|1⟩          | carries global e^(iθ/2)  | Global phase (θ-dep.)     |
| \|1⟩  (θ=π/2)  | -0.707j\|0⟩ + 0.707\|1⟩         | carries global e^(iθ/2)  | Global phase (θ-dep.)     |

> **Global phase:** θ-dependent factor `e^(iθ/2)`. Because Rx is parameterized, the backend
> always simulates both circuits live and applies the global-phase fallback — the canonical
> solution is always accepted.

**Hint 1:** Which gates will translate the state to the proper axis of rotation?

**Hint 2:** Conjugating a Z-axis rotation by Hadamards changes the rotation axis to X.

**Learning goal:** `H · Rz(θ) · H = Rx(θ)` up to a θ-dependent global phase `e^(iθ/2)`.
Parameterized targets always use live simulation — no stored expected outputs.

---

### Level 1.5 · Ry Gate  ⚠ GLOBAL PHASE (parameterized)

**Description:** Ry(θ) rotates a qubit by angle θ around the Y-axis; unlike Rx, its matrix
entries are entirely real with no complex phases. Synthesize a parameterized circuit whose
unitary matches Ry(θ) for any angle θ.

**Toolbox:** `Rz`, `√X`, `X`, `S`, `T`, `H`, `Rx`

**Canonical circuit:** `Rz(-π/2)[Q0]  →  Rx(θ)[Q0]  →  Rz(π/2)[Q0]`

**Truth table (target outputs, two sample angles — all amplitudes are purely real):**

| Input          | Target output              | Canonical output    | Match                 |
|----------------|----------------------------|---------------------|-----------------------|
| \|0⟩  (θ=π/4)  | 0.924\|0⟩ + 0.383\|1⟩     | carries global phase | Global phase (θ-dep.) |
| \|1⟩  (θ=π/4)  | -0.383\|0⟩ + 0.924\|1⟩    | carries global phase | Global phase (θ-dep.) |
| \|0⟩  (θ=π/2)  | 0.707\|0⟩ + 0.707\|1⟩     | carries global phase | Global phase (θ-dep.) |
| \|1⟩  (θ=π/2)  | -0.707\|0⟩ + 0.707\|1⟩    | carries global phase | Global phase (θ-dep.) |

> Note: all Ry target outputs are real-valued (no `j` terms), unlike Rx. This is a useful
> sanity check when building the canonical circuit.

> **Global phase:** θ-dependent. Backend always simulates parameterized targets live and
> applies the global-phase fallback.

**Hint 1:** Which gates will translate the state to the proper axis of rotation?

**Hint 2:** Conjugating an X-axis rotation by Rz changes the rotation axis to Y.

**Learning goal:** Ry outputs are purely real. The canonical `Rz(-π/2) · Rx(θ) · Rz(π/2)` carries
a global phase handled live by the backend.

---

### Level 1.6 · Random Unitary

**Description:** A random single-qubit unitary has been generated for you. Synthesize a circuit
whose truth table matches it exactly. Use any combination of your unlocked gates.

**Toolbox:** `Rz`, `√X`, `X`, `S`, `T`, `H`, `Rx`, `Ry`

**Canonical circuit:** `Rz(α)  →  Rx(β)  →  Rz(γ)`   (angles derived from session seed)

**Truth table:** Varies per session seed — no fixed outputs. The backend generates the target fresh
from `angles_from_seed(seed)` on each request.

> **Note:** Global-phase fallback does NOT apply to `RANDOM_U` (by design) — the target is
> seeded per session and compared exactly.

**Hint 1:** Any single-qubit unitary can be decomposed into at most three rotation gates (ZXZ decomposition).

**Hint 2:** Try Rz(α) · Rx(β) · Rz(γ) — adjust the three angles until the outputs match.

**Learning goal:** Any single-qubit unitary is fully described by three real angles (Euler ZXZ
decomposition). This is the universal single-qubit synthesis challenge.

---

## Tier 2 — Two-Qubit Levels

Convention: input notation `|q0q1⟩` — leftmost digit is qubit 0, rightmost is qubit 1.
Inputs are enumerated in the order `[|00⟩, |01⟩, |10⟩, |11⟩]`.

---

### Level 2.1 · CNOT Flipped  ⚠ FRONTEND/BACKEND DISCREPANCY

**Description:** CNOT_FLIPPED is a CNOT gate with its control and target reversed: qubit 1
controls qubit 0 instead of the usual direction. Synthesize a circuit whose unitary matches
the flipped CNOT exactly.

**Toolbox:** all single-qubit gates + `CNOT`

**Canonical circuit:**
```
H[Q0], H[Q1]  →  CNOT[ctrl=Q1, tgt=Q0]  →  H[Q0], H[Q1]
```

**Truth table (backend-verified):**

| Input | Target output | Canonical output | Match |
|-------|--------------|-----------------|-------|
| \|00⟩ | \|00⟩        | \|00⟩           | Exact |
| \|01⟩ | \|01⟩        | \|01⟩           | Exact |
| \|10⟩ | \|11⟩        | \|11⟩           | Exact |
| \|11⟩ | \|10⟩        | \|10⟩           | Exact |

> **Flag — frontend/backend discrepancy:**
> `levels.ts` `expectedTruth` shows `[|00⟩, |11⟩, |10⟩, |01⟩]` — the truth table for
> CNOT(ctrl=Q1, tgt=Q0). The backend-verified output is `[|00⟩, |01⟩, |11⟩, |10⟩]` — the
> truth table for a standard CNOT(ctrl=Q0, tgt=Q1).
>
> **Why:** `H⊗H · CNOT(ctrl=Q1, tgt=Q0) · H⊗H = CNOT(ctrl=Q0, tgt=Q1)` by the H-conjugation
> identity. The circuit uses a flipped CNOT as a building block, but the net result is a
> standard CNOT truth table. This is not a runtime bug — grading tests pass.

**Hint 1:** Think about how conjugating a gate by single-qubit operations can change which qubit
plays which role.

**Hint 2:** Hadamards can swap the control and target roles of a CNOT.

**Learning goal:** The H-conjugation identity `H⊗H · CNOT(flipped) · H⊗H = CNOT(standard)`.
Students discover that circuit structure and truth table can be decoupled.

---

### Level 2.2 · Controlled-Z  ⚠ FRONTEND/BACKEND DISCREPANCY

**Description:** The CZ gate applies a phase flip of −1 to the |11⟩ state and leaves all other
basis states unchanged — unlike CNOT, it is fully symmetric between its two qubits. Synthesize
a circuit whose unitary matches CZ exactly.

**Toolbox:** all single-qubit gates + `CNOT`

**Canonical circuit:** `H[Q1]  →  CNOT[ctrl=Q0, tgt=Q1]  →  H[Q1]`

**Truth table (backend-verified):**

| Input | Target output | Canonical output | Match |
|-------|--------------|-----------------|-------|
| \|00⟩ | \|00⟩        | \|00⟩           | Exact |
| \|01⟩ | \|01⟩        | \|01⟩           | Exact |
| \|10⟩ | \|10⟩        | \|10⟩           | Exact |
| \|11⟩ | -1\|11⟩      | -1\|11⟩         | Exact (relative phase −1) |

> **Flag — frontend/backend discrepancy:**
> `levels.ts` `expectedTruth` shows `|11⟩ → |11⟩` — the `−1` phase is omitted. The
> backend-verified output is `−1|11⟩`. This is a **relative phase** (not global), meaning it
> IS observable and IS the defining behaviour of CZ. Likely a display simplification in the
> frontend constants rather than a correctness issue. Confirm before using frontend truth table
> as ground truth for CZ.

**Hint 1:** CZ applies a phase flip — think about which single-qubit gate converts between
the X and Z bases.

**Hint 2:** Wrapping a CNOT with Hadamards on one qubit converts a bit-flip into a phase-flip.

**Learning goal:** The `−1` on `|11⟩` is a relative phase — observable and physically meaningful,
not a global phase. CZ is symmetric between qubits. H·CNOT·H converts a Z-basis bit-flip into an
X-basis phase-flip.

---

### Level 2.3 · SWAP

**Description:** The SWAP gate exchanges the states of two qubits: |a,b⟩ maps to |b,a⟩ for all
inputs. Synthesize a circuit whose unitary matches SWAP exactly.

**Toolbox:** all single-qubit gates + `CNOT`, `CZ`

**Canonical circuit:**
```
CNOT[ctrl=Q0, tgt=Q1]  →  CNOT[ctrl=Q1, tgt=Q0]  →  CNOT[ctrl=Q0, tgt=Q1]
```

**Truth table:**

| Input | Target output | Canonical output | Match |
|-------|--------------|-----------------|-------|
| \|00⟩ | \|00⟩        | \|00⟩           | Exact |
| \|01⟩ | \|10⟩        | \|10⟩           | Exact |
| \|10⟩ | \|01⟩        | \|01⟩           | Exact |
| \|11⟩ | \|11⟩        | \|11⟩           | Exact |

Frontend and backend truth tables are consistent. ✓

**Hint 1:** Think about how you can use CNOT to transfer information between qubits in both
directions.

**Hint 2:** Three CNOTs applied in alternating control/target directions are sufficient.

**Learning goal:** SWAP decomposes into exactly three CNOTs in alternating directions. No global
phase. Frontend and backend are consistent — clean reference level.

---

### Level 2.4 · Controlled-H  ⚠ BACKEND ONLY

**Description:** The CH gate applies H to the target qubit (Q1) when the control qubit (Q0) is
|1⟩, and passes through unchanged otherwise. control=Q0, target=Q1.

**Toolbox:** *(not yet defined in `levels.ts`)*

**Canonical circuit:** `Ry(π/4)[Q1]  →  CNOT[ctrl=Q0, tgt=Q1]  →  Ry(-π/4)[Q1]`

**Decomposition proof (for |10⟩ → H|0⟩ on target):**
1. `Ry(π/4)|0⟩ = cos(π/8)|0⟩ + sin(π/8)|1⟩`  →  state `cos(π/8)|10⟩ + sin(π/8)|11⟩`
2. CNOT (ctrl=Q0=1) flips Q1: `cos(π/8)|11⟩ + sin(π/8)|10⟩`
3. `Ry(-π/4)` on Q1: `2·sin(π/8)cos(π/8)|10⟩ + (cos²-sin²)|11⟩ = 0.707|10⟩ + 0.707|11⟩` ✓

**Truth table:**

| Input | Target output                   | Canonical output                | Match |
|-------|---------------------------------|---------------------------------|-------|
| \|00⟩ | \|00⟩                          | \|00⟩                          | Exact |
| \|01⟩ | \|01⟩                          | \|01⟩                          | Exact |
| \|10⟩ | 0.707\|10⟩ + 0.707\|11⟩        | 0.707\|10⟩ + 0.707\|11⟩        | Exact |
| \|11⟩ | 0.707\|10⟩ - 0.707\|11⟩        | 0.707\|10⟩ - 0.707\|11⟩        | Exact |

> **Flag — backend only:**
> Level 2.4 is implemented in `target_library.py` (added in Week 7) and all five tests in
> `test_tier2_targets.py` pass. `levels.ts` has not yet been updated — no frontend entry,
> no toolbox definition, no canonical reference in the UI.

**Hint 1:** Controlled gates can often be decomposed using rotation gates sandwiched around a CNOT.

**Hint 2:** Ry(π/4) · CNOT · Ry(-π/4) on the target qubit — verify the math for |10⟩ and |11⟩.

**Learning goal:** Introduces controlled rotation gates. The Ry-CNOT-Ry decomposition is the
standard textbook CH decomposition. Exact match (no global phase). Backend tests confirmed by
`test_tier2_targets.py` and auto-picked up by `test_target_library.py`.

---

## Summary table

| Level | Gate          | Qubits | Global phase       | Frontend/backend flag               |
|-------|---------------|--------|--------------------|-------------------------------------|
| 1.0   | X             | 1      | None               | —                                   |
| 1.1   | S             | 1      | None               | —                                   |
| 1.2   | T             | 1      | None               | —                                   |
| 1.3   | H             | 1      | e^(iπ/4)           | —                                   |
| 1.4   | Rx            | 1      | e^(iθ/2) (θ-dep.)  | —                                   |
| 1.5   | Ry            | 1      | θ-dependent        | —                                   |
| 1.6   | Random U      | 1      | n/a (no fallback)  | —                                   |
| 2.1   | CNOT Flipped  | 2      | None               | Frontend truth table differs        |
| 2.2   | Controlled-Z  | 2      | None               | Frontend omits −1 phase on \|11⟩    |
| 2.3   | SWAP          | 2      | None               | —                                   |
| 2.4   | Controlled-H  | 2      | None               | Backend only — not yet in levels.ts |

---

*Generated from live-verified backend data. Last updated: Week 7 (Level 2.4 added).*

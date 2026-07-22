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

Numbering matches `QMCB-fe/src/config/levels.ts` `LEVEL_ORDER` (1.0–1.15).

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

---

### Level 1.1 · √X† Gate (SQRT_X_DAG)

**Description:** √X† is the inverse of the square-root-of-X gate — apply it twice and you undo
a half-X rotation. Build it from the gates unlocked so far.

**Toolbox:** `Rz`, `√X`, `X`

**Canonical circuit:** `√X[Q0]  →  X[Q0]`

**Backend grading:** `grading_mode: unitary_global_phase` — full unitary comparison up to
global phase (same path as Y / H). Bare `√X` alone fails (same Born probs, not phase-equivalent).

**Other accepted solutions:**
- `X[Q0]  →  √X[Q0]` — same net unitary (both equal √X³ = √X† in Cirq).
- Placing a single `√X†` chip once it is available as the target also passes (identity
  solution against the library reference).

**Sign / angle note:** Not a parameterized level. Bare `√X` alone fails under unitary GP.

**Truth table (backend-verified display strings):**

| Input | Target output                                      | Match |
|-------|----------------------------------------------------|-------|
| \|0⟩  | (0.5-0.5j)\|0⟩ + (0.5+0.5j)\|1⟩                   | Unitary GP |
| \|1⟩  | (0.5+0.5j)\|0⟩ + (0.5-0.5j)\|1⟩                   | Unitary GP |

**Global phase:** Canonical `√X → X` matches exactly; unitary GP still applies for equivalent forms.

**Hint 1:** Rx(π/2) is already a square root of X. What happens if you follow it with a full X flip?

**Hint 2:** Try √X, then X, in that order.

**Learning goal:** Inverses of half-rotations can be built by composing the half-rotation with a
full Pauli X. Completing the level unlocks √X† in the toolbox (`noGatesetUnlock` is false).

---

---

### Level 1.2 · X† Gate (config-only — X† = X)

**Description:** X† is the inverse of X. X is its own inverse (X² = I), so X† and X are the
same operation. Pedagogical config-only level: grades against backend target `X`.

**Toolbox:** `Rz`, `√X`, `X`, `√X†`

**Canonical circuit:** `X†[Q0]` (or simply `X[Q0]`)

**Other accepted solutions:** Any circuit that implements X (e.g. `√X → √X`). Because X† = X,
there is no distinct inverse to discover.

**Sign / angle note:** Negating nothing here — Paulis are involutions. Completing this level
does **not** add a new toolbox chip (`noGatesetUnlock: true`); the insight copy explains why.

**Truth table:** Same as X — `|0⟩ → |1⟩`, `|1⟩ → |0⟩`. Exact match.

**Learning goal:** Pauli X is Hermitian and unitary; the dagger adds nothing new to the gateset.

---

---

### Level 1.3 · Z Gate

**Description:** The Z gate flips the phase of |1⟩ and leaves |0⟩ untouched. Dial the general
Z-rotation to the right angle.

**Toolbox:** `Rz`, `√X`, `X`, `√X†`

**Canonical circuit:** `Rz(π)[Q0]`

**Other accepted solutions:**
- `S → S` (two S gates = Z up to Cirq’s phase convention; accepted when Dirac / global-phase
  rules match the target).
- Placing a single `Z` chip once unlocked also passes.

**Sign / angle note — negatives matter for grading intent:**
- On `|1⟩`, Z produces `-1|1⟩`. Measurement probabilities match identity (`P(|1⟩)=1`), but
  the Dirac string differs. The grader requires amplitude (string) equality on definite-state
  rows, so **identity is rejected** even though probabilities match.
- This is a **relative** phase on the computational basis when compared inside a larger
  circuit; do not treat it like an unobservable global phase of the whole state.

**Truth table (backend-verified):**

| Input | Target output | Match |
|-------|--------------|-------|
| \|0⟩  | \|0⟩         | Exact |
| \|1⟩  | -1\|1⟩       | Exact (phase −1 required) |

**Hint 1:** Z doesn’t change measurement probabilities on its own — it’s a pure phase flip.
Which of your gates rotates around the Z-axis?

**Hint 2:** Rz(θ) at θ = π gives a Z-axis half-turn.

**Learning goal:** Phase-only gates are invisible in probability columns on basis states; the
truth-table amplitudes still encode the defining behaviour.

---

---

### Level 1.4 · Z† Gate (config-only — Z† = Z)

**Description:** Z† is the inverse of Z. Z² = I, so Z† = Z. Grades against backend target `Z`.

**Toolbox:** prior singles including `Z`, `Z†`

**Canonical circuit:** `Z†[Q0]` (or `Z[Q0]`)

**Other accepted solutions:** Same as Z (`Rz(π)`, `S → S`, etc.).

**Sign / angle note:** Same `-1|1⟩` requirement as Z. No new toolbox unlock
(`noGatesetUnlock: true`).

**Truth table:** Same as Z.

**Learning goal:** Another Pauli involution — dagger does not expand the gateset.

---

---

### Level 1.5 · S Gate

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

---

### Level 1.6 · S† Gate (S_DAG)

**Description:** S† undoes S — a quarter-turn phase rotation in the opposite direction.

**Toolbox:** `Rz`, `√X`, `X`, `√X†`, `Z`, `S`

**Canonical circuit:** `Rz(-π/2)[Q0]`

**Other accepted solutions:**
- `S → S → S` (S³ = S†).
- Placing `S†` directly once unlocked.

**Sign / angle note — sign matters:**
- `Rz(-π/2)` is correct; `Rz(+π/2)` is S, **not** S†, and is rejected.
- On `|1⟩`, target is `-1j|1⟩`. Probabilities match identity / S magnitude, but the Dirac
  phase must match — identity and bare S fail.

**Truth table (backend-verified):**

| Input | Target output | Match |
|-------|--------------|-------|
| \|0⟩  | \|0⟩         | Exact |
| \|1⟩  | -1j\|1⟩      | Exact (phase required) |

**Hint 1:** S rotates by +90° around Z. S† rotates the other way.

**Hint 2:** Set Rz to −π/2 (−90°).

**Learning goal:** Inverse phase rotations are opposite angles on Rz; sign is physically
meaningful here (not a global-phase freebie).

---

---

### Level 1.7 · T Gate

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

---

### Level 1.8 · T† Gate (T_DAG)

**Description:** T† undoes T — an eighth-turn phase rotation in reverse.

**Toolbox:** prior singles through `T` (includes `S`, `S†`, …)

**Canonical circuit:** `Rz(-π/4)[Q0]`

**Other accepted solutions:**
- Seven `T` gates in a row (T⁷ = T†), or other equivalent phase compositions.
- Placing `T†` directly once unlocked.

**Sign / angle note — sign matters:**
- `Rz(-π/4)` is correct; `Rz(+π/4)` is T and is **rejected**.
- On `|1⟩`, target is `(0.707-0.707j)|1⟩` (complex conjugate of T’s `|1⟩` amplitude).
  Probabilities match identity; amplitude string must match.

**Truth table (backend-verified):**

| Input | Target output            | Match |
|-------|--------------------------|-------|
| \|0⟩  | \|0⟩                     | Exact |
| \|1⟩  | (0.707-0.707j)\|1⟩       | Exact (conjugate phase required) |

**Hint 1:** T rotates by +45° around Z. T† is the reverse.

**Hint 2:** Set Rz to −π/4 (−45°).

**Learning goal:** Reinforces signed Rz angles for dagger phase gates; conjugate of T on `|1⟩`.

---

---

### Level 1.9 · H Gate  ⚠ FIRST GLOBAL PHASE ENCOUNTER

**Description:** The Hadamard gate creates equal superposition: |0⟩ maps to (|0⟩+|1⟩)/√2 and |1⟩
maps to (|0⟩−|1⟩)/√2. Synthesize a circuit whose unitary matches H up to global phase.

**Toolbox:** `Rz`, `√X`, `X`, `S`, `T`

**Canonical circuit:** `Rz(π/2)[Q0]  →  √X[Q0]  →  Rz(π/2)[Q0]`

**Backend grading:** `grading_mode: unitary_global_phase` — `cirq.allclose_up_to_global_phase`
on full trial vs target unitaries. Closes the Born-probability hole where S→H previously passed.

**Truth table:**

| Input | Target output                   | Canonical output                    | Match                  |
|-------|---------------------------------|-------------------------------------|------------------------|
| \|0⟩  | 0.707\|0⟩ + 0.707\|1⟩          | (0.5+0.5j)\|0⟩ + (0.5+0.5j)\|1⟩   | Global phase e^(iπ/4)  |
| \|1⟩  | 0.707\|0⟩ - 0.707\|1⟩          | (0.5+0.5j)\|0⟩ - (0.5+0.5j)\|1⟩   | Global phase e^(iπ/4)  |

> **Global phase:** `e^(iπ/4)`. Every amplitude is scaled by `(0.5+0.5j)` instead of `0.707`
> because `0.707 × e^(iπ/4) = 0.707 × (0.707+0.707j) = 0.5+0.5j`. The backend accepts the
> canonical circuit via unitary global-phase comparison (not Born-probability fallback).
> S→H matches probabilities but is not phase-equivalent and is rejected.

**Hint 1:** H requires both rotation axes — combine Rz and √X in sequence.

**Hint 2:** Conjugating √X by Rz rotations changes the effective rotation axis — try sandwiching
√X between two Rz gates.

**Learning goal:** First exposure to global phase in the curriculum. The ZXZ canonical
`Rz(π/2) · √X · Rz(π/2)` implements H up to a global phase `e^(iπ/4)`. Physically identical to
H — the string representation differs, but no measurement can distinguish them.

---

---

### Level 1.10 · H† Gate (config-only — H† = H)

**Description:** H† is the inverse of H. H² = I, so H† = H. Grades against backend target `H`.

**Toolbox:** prior singles including `H`, `H†`

**Canonical circuit:** `H†[Q0]` (or `H[Q0]`)

**Other accepted solutions:** Same decompositions as H (e.g. `Rz(π/2) → √X → Rz(π/2)`),
including the usual global-phase acceptance for that synthesis.

**Sign / angle note:** No distinct inverse. `noGatesetUnlock: true` — H† is not added as a
new primitive beyond H.

**Truth table:** Same as H (superposition rows; global-phase fallback applies to equivalent
syntheses the same way as the H level).

**Learning goal:** Hadamard is involutory; dagger does not expand the gateset.

---

---

### Level 1.11 · Y Gate

**Description:** Y is the third Pauli — a full-turn rotation around the Y-axis. Build it by
combining gates already unlocked.

**Toolbox:** prior singles through `H` (no Rx/Ry yet at this point in the chain)

**Canonical circuit:** `X[Q0]  →  Z[Q0]`

**Backend grading:** `grading_mode: unitary_global_phase` — pass/fail uses
`cirq.allclose_up_to_global_phase` on the full trial vs target unitaries (not Dirac-string /
Born-probability fallback). Config-only Y† grades against this same `Y` library entry.

**Other accepted solutions:**
- `Z[Q0]  →  X[Q0]` — equals Y up to global phase (−i); accepted via unitary GP.
- `S† → X → S` (exact matrix match).
- Placing a single `Y` chip once unlocked.

**Sign / angle note:**
- Target Dirac strings remain `1j|1⟩` / `-1j|0⟩` for display; X→Z / Z→X differ by ±i globally
  and still pass.
- Bare `X` fails: same Born probabilities as Y on \|0⟩/\|1⟩, but not phase-equivalent.

**Truth table (backend-verified display strings):**

| Input | Target output | Match |
|-------|--------------|-------|
| \|0⟩  | 1j\|1⟩       | Unitary GP (canonical X→Z differs by global phase) |
| \|1⟩  | -1j\|0⟩      | Unitary GP (same) |

**Hint 1:** Y is closely related to X and Z — flip the bit, then flip the phase.

**Hint 2:** Try X, then Z, in that order.

**Learning goal:** Pauli Y from X and Z; first multi-Pauli synthesis with explicit complex
amplitudes on basis states.

---

---

### Level 1.12 · Y† Gate (config-only — Y† = Y)

**Description:** Y† is the inverse of Y. Y² = I, so Y† = Y. Grades against backend target `Y`.

**Toolbox:** prior singles including `Y`, `Y†`

**Canonical circuit:** `Y†[Q0]` (or `Y[Q0]`)

**Other accepted solutions:** Same as Y (`X → Z`, `Z → X` up to global phase).

**Sign / angle note:** Same amplitude strings as Y. `noGatesetUnlock: true`.

**Truth table:** Same as Y.

**Learning goal:** Completes the Pauli dagger set — all four Paulis are their own inverses.

---

---

### Level 1.13 · Rx Gate  ⚠ GLOBAL PHASE (parameterized)

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

---

### Level 1.14 · Ry Gate  ⚠ GLOBAL PHASE (parameterized)

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

**Alternative H/S/Rz decomposition (same gates, order matters):** With `S ≡ Rz(π/2)` and
`S·S·S ≡ Rz(-π/2)`, a valid Ry synthesis using only H, S, and Rz is:

`S · S · S · H · Rz(θ) · H · S`  (left-to-right canvas order)

The visually similar but **wrong** order `H · S · Rz(θ) · H · S · S · S` is **not** Ry(θ) and
is not fixable by global phase. Random-theta grading substitutes sampled θ into the student's
parameter gate; the frontend may send `parameter_gate_index` to mark which gate carries θ when
multiple Rx/Rz gates are present.

---

---

### Level 1.15 · Random Unitary

**Description:** A random single-qubit unitary has been generated for you. Synthesize a circuit
whose truth table matches it exactly. Use any combination of your unlocked gates.

**Toolbox:** `Rz`, `√X`, `X`, `S`, `T`, `H`, `Rx`, `Ry`

**Canonical circuit:** `Rz(δ)  →  Ry(γ)  →  Rz(β)`   (angles derived from session seed via ZYZ)

**Backend grading:** `grading_mode: unitary_global_phase` with `grading_atol: 1e-3` —
full unitary comparison up to global phase (same path as Y / H / √X† / CH). Closes
Born-probability holes (negated middle Ry, Rx-middle, Ry-only, outer sign/order errors).
FE CircuitCanvas slider step is `0.001` for this level only so rounded-correct ZYZ
stays inside the clean atol band.

**Backend:** `TARGET_LIBRARY["RANDOM_U"]` with `parameter_mode: seed_zyz`.
Target built via `TargetParameterResolver` → `TargetUnitaryBuilder`.
POST `/api/simulate` uses `SimulateRequestDTO.target_params.seed` (and optional angle round-trip).

**Truth table:** Varies per session seed — no fixed outputs. Angles from
`angles_from_seed_zyz(seed)` in `app/utils/euler_angles.py`. Display table from
`GET /api/levels/random-unitary` uses the same resolver/builder path as grading.

**Hint 1:** Any single-qubit unitary can be decomposed into at most three rotation gates (ZYZ decomposition).

**Hint 2:** Try Rz(δ) · Ry(γ) · Rz(β) — adjust the three angles until the outputs match.

**Learning goal:** Any single-qubit unitary is fully described by three real angles (Euler ZYZ
decomposition). This is the universal single-qubit synthesis challenge.

---

---

## Canonical solution ±θ test matrix

Tests run against the live grading path (simulate_unitaries() called directly, no HTTP
layer). Negated-angle tests use θ = π/2 unless otherwise noted.
Full test file: tests/test_negated_theta_diagnostic.py

| Level | Test case | Result | Reason |
|-------|-----------|--------|--------|
| 1.9 H | Submit ZXZ canonical — Rz(π/2) → √X → Rz(π/2) — which matches H up to global phase e^(iπ/4) | Accepted ✓ | Global-phase fallback fires; single constant φ = e^(iπ/4) across all rows |
| 1.13 Rx | Submit canonical H → Rz(π/2) → H (correct decomposition, global phase e^(iθ/2)) | Accepted ✓ | trial_has_canonical_gate = False; allow_global_phase = True; probability fallback accepts |
| 1.13 Rx | Submit Rx(−π/2) when target is Rx(+π/2) | Rejected ✓ | target normalised to abs(θ) = +π/2; allow_global_phase = False for direct canonical submissions; strings differ and no fallback runs |
| 1.14 Ry | Submit Ry(−π/2) when target is Ry(+π/2) | Rejected ✓ | same fix as Rx |
| 1.15 Random U | Negate any single ZXZ angle (e.g. Rz(−α)) | Rejected ✓ | parameter_mode = seed_zxz; allow_global_phase = False; exact string match required |

**Design note — global phase vs. inverse gate:**
Global phase (e.g. H vs ZXZ canonical): every amplitude in the trial output equals
φ × the corresponding target amplitude for a single constant φ. This is physically
unobservable and the grading correctly accepts it via the probability fallback.

Negated-angle inverse (e.g. Rx(−θ) vs Rx(+θ)): the trial produces a genuinely different
unitary. Measurement probabilities happen to be identical (|cos(θ/2)|² is even in θ),
so a probability-only fallback would incorrectly accept these. The fix has two parts
working together: (1) the target is normalised to abs(θ) when the student submits the
canonical gate directly, so trial and target are no longer string-identical; (2)
allow_global_phase is set to False for that submission path, disabling the probability
fallback entirely. Canonical decomposition circuits (e.g. H·Rz·H for the Rx level)
contain no RX gate, so trial_has_canonical_gate = False, allow_global_phase stays True,
and the fallback correctly accepts them.

**Bug fixed June 4, 2026:** Prior to this fix, TRIAL_THETA levels (Rx, Ry) built the
target circuit from the student's own submitted theta, making trial and target
string-identical regardless of sign. This caused Rx(−θ) to be accepted as a correct
solution for an Rx(+θ) level. Fixed by normalising the target theta to abs(θ) when the
trial contains the canonical gate directly, and disabling the global-phase fallback for
that submission path.
Regression test: tests/test_negated_theta_diagnostic.py — all four cases must pass on
every CI run.

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
> identity. The canonical reference circuit uses a flipped CNOT as a building block, but the
> net target unitary is standard CNOT.
>
> **Conclusion — pedagogical display mismatch (OK, not a grading bug):** The TaskCard shows
> the flipped-CNOT basis mapping to match the level description, while the backend grades
> against the canonical circuit’s unitary (standard CNOT). Live check: canonical
> H–H–CNOT(flipped)–H–H → `all_match=True`; a single flipped CNOT → `all_match=False`.
> Grading is correct; only the static frontend preview differs from what the backend expects.

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
> IS observable and IS the defining behaviour of CZ.
>
> **Conclusion — display-only simplification (OK, not a grading bug):** The TaskCard omits
> the `−1` sign because ket labels hide relative phase on a definite basis state. Grading is
> unaffected: the `|11⟩` row is a definite state (not a superposition), so the
> `allow_global_phase` probability fallback does **not** apply there — trial `|11⟩` vs target
> `−1|11⟩` yields `all_match=False`. Canonical H–CNOT–H passes with exact string match on
> `−1|11⟩`. Do not use frontend `expectedTruth` as ground truth for CZ phase behaviour.

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

### Level 2.4 · Controlled-H

**Description:** The CH gate applies H to the target qubit (Q1) when the control qubit (Q0) is
|1⟩, and passes through unchanged otherwise. control=Q0, target=Q1.

**Toolbox:** `RZ, SQRT_X, X, S, T, H, RX, RY, U, CNOT, CONTROLLED_Z, SWAP` (all prior tier-2 gates; not CH itself)

**Canonical circuit:** `Ry(π/4)[Q1]  →  CNOT[ctrl=Q0, tgt=Q1]  →  Ry(-π/4)[Q1]`

**Backend grading:** `grading_mode: unitary_global_phase` — full 4×4 unitary comparison up to
global phase (same path as Y / H / √X†). Rejects Born-probability-only matches such as swapped
Ry angles or canonical CH followed by CZ (relative phase on the control=1 subspace).

**Decomposition proof (for |10⟩ → H|0⟩ on target):**
1. `Ry(π/4)|0⟩ = cos(π/8)|0⟩ + sin(π/8)|1⟩`  →  state `cos(π/8)|10⟩ + sin(π/8)|11⟩`
2. CNOT (ctrl=Q0=1) flips Q1: `cos(π/8)|11⟩ + sin(π/8)|10⟩`
3. `Ry(-π/4)` on Q1: `2·sin(π/8)cos(π/8)|10⟩ + (cos²-sin²)|11⟩ = 0.707|10⟩ + 0.707|11⟩` ✓

**Truth table:**

| Input | Target output                   | Canonical output                | Match |
|-------|---------------------------------|---------------------------------|-------|
| \|00⟩ | \|00⟩                          | \|00⟩                          | Exact (canonical) |
| \|01⟩ | \|01⟩                          | \|01⟩                          | Exact (canonical) |
| \|10⟩ | 0.707\|10⟩ + 0.707\|11⟩        | 0.707\|10⟩ + 0.707\|11⟩        | Exact (canonical); pass/fail via unitary GP |
| \|11⟩ | 0.707\|10⟩ - 0.707\|11⟩        | 0.707\|10⟩ - 0.707\|11⟩        | Exact (canonical); pass/fail via unitary GP |

**Frontend `expectedTruth`:** `[|00⟩, |01⟩, 0.707|10⟩+0.707|11⟩, 0.707|10⟩−0.707|11⟩]` — matches backend `expected_outputs`.

**Hint 1:** Controlled gates can often be decomposed using rotation gates sandwiched around a CNOT.

**Hint 2:** Ry(π/4) · CNOT · Ry(-π/4) on the target qubit — verify the math for |10⟩ and |11⟩.

**Learning goal:** Introduces controlled rotation gates. The Ry-CNOT-Ry decomposition is the
standard textbook CH decomposition. Canonical matches Cirq CH exactly; grading allows only a
true global phase on the full two-qubit unitary.

---

### Level 2.5 · Controlled-U

**Description:** A random Controlled-U gate is generated from the session seed. When the control
qubit (Q0) is |1⟩, an arbitrary single-qubit unitary U is applied to the target (Q1); when the
control is |0⟩, both qubits pass through unchanged. Synthesize a circuit whose truth table
matches that CU exactly.

**Toolbox:** all single-qubit gates + `CNOT`, `CZ`, `SWAP`, `CH`

**Backend:** `TARGET_LIBRARY["CONTROLLED_U"]` with `parameter_mode: seed_zxz`,
`composite_gate: true`, `allow_global_phase: false`. Angles `(α, β, γ)` come from
`SimulateRequestDTO.target_params.seed` via `angles_from_seed`. Target built as
`ControlledGate(MatrixGate(U_ZXZ(α,β,γ)))` on order `[0, 1]` (control Q0, target Q1).

**Frontend:** `parameterMode: SEED_ZXZ` (shipped in `LEVEL_ORDER` after Controlled-H). Display
table from the controlled-unitary API uses the same seed/angles path as grading.

**Canonical / common solutions:**
- Submit a parameterized `CONTROLLED_U` chip with the session’s `(α, β, γ)` (direct match used
  in backend end-to-end tests).
- Decompose the inner U the same way as Level 1.15 / Random U (ZXZ / ZYZ rotations), then wrap
  that single-qubit synthesis in a controlled structure with the two-qubit gateset (CNOT-based
  controlled-rotation pattern). Control-`|0⟩` rows must remain pass-through.

**Sign / angle note — signs matter:**
- `allow_global_phase` is **false** for this level: exact Dirac-string match is required; a
  global re-phase of the whole output is not enough.
- Negating any of α, β, or γ (or otherwise changing the seed angles) produces a different CU
  and is rejected — same spirit as the Random-U / ±θ matrix for seeded unitaries.
- Control-`|0⟩` rows are always `|00⟩` and `|01⟩` for every seed; focus synthesis effort on
  control-`|1⟩` rows, which reveal U|0⟩ and U|1⟩.

**Truth table:** Varies per seed. Invariants for every seed:
- `|00⟩ → |00⟩`, `|01⟩ → |01⟩` (control 0, pass-through)
- `|10⟩` / `|11⟩` outputs equal applying U to the target while control stays |1⟩

**Hint 1:** Rows where the control is |0⟩ always pass through. Rows where control is |1⟩ reveal
what U does to |0⟩ and |1⟩.

**Hint 2:** Once you know U from the truth table, decompose it as in the arbitrary-U level,
then wrap that decomposition in a controlled structure.

**Learning goal:** Controlled arbitrary unitaries — seed-parameterized CU with exact grading
(no global-phase fallback).

---

---

## Tier 3 · Three-qubit gates

---

### Level 3.1 · Toffoli (CCX)

**Description:** The Toffoli gate applies X to the target qubit (Q2) only when both control qubits
(Q0 and Q1) are |1⟩. It is the 3-qubit universal reversible gate.

**Toolbox:** all single-qubit gates + `CNOT`, `CZ`, `SWAP`, `CH` (Tier 3 toolbox in `levels.ts`;
Toffoli itself is the target, not a starting toolbox chip)

**Qubit order:** `C0_C1_T2 = [0, 1, 2]` — control0=Q0, control1=Q1, target=Q2

**CirqGateMapper:** `cirq.CCX(q0, q1, q2)`

**Reference circuit:** single `TOFFOLI` step with `C0_C1_T2`

**Canonical decomposition (Nielsen & Chuang §4.3, Fig 4.9):**
```
H[Q2] · CNOT[C1_T2] · T†[Q2] · CNOT[C0_T2] · T[Q2] · CNOT[C1_T2] · T†[Q2] ·
CNOT[C0_T2] · T[Q1] · T[Q2] · H[Q2] · CNOT[C0_T1] · T[Q0] · T†[Q1] · CNOT[C0_T1]
```
(15 gates; students build this decomposition in level 3.1)

**Truth table** (verified against live Cirq output, `decimals=3`):

| Input  | Expected output | Notes |
|--------|-----------------|-------|
| \|000⟩ | \|000⟩          | both controls 0 |
| \|001⟩ | \|001⟩          | both controls 0 |
| \|010⟩ | \|010⟩          | c0=0, c1=1 — not both 1 |
| \|011⟩ | \|011⟩          | c0=0, c1=1 — not both 1 |
| \|100⟩ | \|100⟩          | c0=1, c1=0 — not both 1 |
| \|101⟩ | \|101⟩          | c0=1, c1=0 — not both 1 |
| \|110⟩ | \|111⟩          | c0=1, c1=1 → flip target (0→1) |
| \|111⟩ | \|110⟩          | c0=1, c1=1 → flip target (1→0) |

**`allow_global_phase`: true**

**Learning goal:** The Toffoli gate is universal for classical reversible computation and a key
primitive for fault-tolerant quantum computing. Its decomposition into {CNOT, H, T, T†} is the
canonical textbook exercise (N&C §4.3). Backend tests confirmed by `test_tier3_targets.py` and
auto-picked up by `test_target_library.py`.

---

### Level 3.2 · Fredkin (CSWAP)

**Description:** The Fredkin gate swaps qubit1 (Q1) and qubit2 (Q2) only when the control qubit
(Q0) is |1⟩. It is the 3-qubit controlled-SWAP.

**Toolbox:** all single-qubit gates + `CNOT`, `CZ`, `SWAP`, `CH` (same Tier 3 toolbox;
Fredkin is the target)

**Qubit order:** `C0_T1_T2 = [0, 1, 2]` — control=Q0, swap-target0=Q1, swap-target1=Q2

**CirqGateMapper:** `cirq.CSWAP(q0, q1, q2)`

**Reference circuit:** single `FREDKIN` step with `C0_T1_T2`

**Canonical decomposition:**
```
CNOT[C1_T2] · Toffoli[C0_C2_T1] · CNOT[C1_T2]
```
(Toffoli sandwiched by two CNOTs; students may also use the 7-gate CNOT+T decomposition)

**Truth table** (verified against live Cirq output, `decimals=3`):

| Input  | Expected output | Notes |
|--------|-----------------|-------|
| \|000⟩ | \|000⟩          | control=0, pass-through |
| \|001⟩ | \|001⟩          | control=0, pass-through |
| \|010⟩ | \|010⟩          | control=0, pass-through |
| \|011⟩ | \|011⟩          | control=0, pass-through |
| \|100⟩ | \|100⟩          | control=1, swap(0,0) → unchanged |
| \|101⟩ | \|110⟩          | control=1, swap q1=0,q2=1 → q1=1,q2=0 |
| \|110⟩ | \|101⟩          | control=1, swap q1=1,q2=0 → q1=0,q2=1 |
| \|111⟩ | \|111⟩          | control=1, swap(1,1) → unchanged |

**`allow_global_phase`: true**

**Learning goal:** The Fredkin gate conserves the number of 1s in the input — a useful property
for reversible computation and quantum error correction. Its decomposition reduces to a Toffoli
sandwiched between two CNOTs. Backend tests confirmed by `test_tier3_targets.py` and auto-picked
up by `test_target_library.py`.

---

## Parameter modes (unified architecture)

Each `TARGET_LIBRARY` entry declares how target parameters are resolved:

| `parameter_mode` | Levels | Runtime source |
|------------------|--------|----------------|
| `fixed` | X, SQRT_X_DAG, Z, S, S_DAG, T, T_DAG, H, Y, CNOT_FLIPPED, CZ, SWAP, CH, TOFFOLI, FREDKIN | Baked into `steps` / `expected_outputs` |
| `trial_theta` / `random_theta` | RX, RY | Student's submitted θ (via `extract_theta_from_trial`) |
| `seed_zxz` / `seed_zyz` | RANDOM_U, CONTROLLED_U | `SimulateRequestDTO.target_params.seed` → `(α,β,γ)` |

Grading flow: `SimulateRequestDTO` → `resolve_target_params()` → `TargetUnitaryBuilder.build()`.

Config-only dagger levels (X†, Z†, H†, Y†) are frontend progression entries that grade against
the matching Pauli / H backend target; they are not separate `TARGET_LIBRARY` keys.

---

## Summary table

| Level | Gate          | Qubits | Global phase       | Frontend/backend flag               |
|-------|---------------|--------|--------------------|-------------------------------------|
| 1.0   | X             | 1      | None               | —                                   |
| 1.1   | √X†           | 1      | unitary_global_phase (bare √X rejected) | —                    |
| 1.2   | X†            | 1      | None               | Config-only; grades as X; no gateset unlock |
| 1.3   | Z             | 1      | None               | Phase −1 on \|1⟩ required; probs match identity |
| 1.4   | Z†            | 1      | None               | Config-only; grades as Z; no gateset unlock |
| 1.5   | S             | 1      | None               | —                                   |
| 1.6   | S†            | 1      | None               | Rz(−π/2) OK; Rz(+π/2) rejected |
| 1.7   | T             | 1      | None               | —                                   |
| 1.8   | T†            | 1      | None               | Rz(−π/4) OK; Rz(+π/4) rejected |
| 1.9   | H             | 1      | unitary_global_phase (ZXZ OK; S→H rejected) | —              |
| 1.10  | H†            | 1      | Same as H          | Config-only; grades as H; no gateset unlock |
| 1.11  | Y             | 1      | unitary_global_phase (X→Z / Z→X OK) | Complex basis amplitudes |
| 1.12  | Y†            | 1      | Same as Y          | Config-only; grades as Y; no gateset unlock |
| 1.13  | Rx            | 1      | e^(iθ/2) — accepted via global-phase check; negated-angle inverse rejected (see ±θ matrix) | —                                   |
| 1.14  | Ry            | 1      | e^(iθ/2) — accepted via global-phase check; negated-angle inverse rejected (see ±θ matrix) | —                                   |
| 1.15  | Random U      | 1      | unitary_global_phase (`grading_atol: 1e-3`; FE θ step 0.001) | `parameter_mode: seed_zyz` |
| 2.1   | CNOT Flipped  | 2      | None               | Display mismatch (OK) — FE shows flipped-CNOT map, BE grades standard CNOT unitary |
| 2.2   | Controlled-Z  | 2      | None               | Display simplification (OK) — FE omits −1 on \|11⟩; grading requires exact `-1\|11⟩` |
| 2.3   | SWAP          | 2      | None               | —                                   |
| 2.4   | Controlled-H  | 2      | unitary_global_phase (swapped Ry / CH+CZ rejected) | — |
| 2.5   | Controlled-U  | 2      | None (fallback off)| Shipped; `seed_zxz`; exact Dirac match |
| 3.1   | Toffoli (CCX) | 3      | None               | Shipped in UI (`LEVEL_ORDER`)       |
| 3.2   | Fredkin (CSWAP)| 3     | None               | Shipped in UI (`LEVEL_ORDER`)       |

---

*Generated from live-verified backend data. Last updated: Tier 1 reordered to LEVEL_ORDER 1.0–1.15; Controlled-U shipped docs; Tier 3 UI status.*

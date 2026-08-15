# QMCB Educational Content

Compiled from `QMCB-fe` — all player-facing educational copy, hints, tips, info tooltips, and level insights.

Last extracted: August 14, 2026 (23 levels: Tier 1 `1.0`–`1.15`, Tier 2 `2.0`–`2.4`, Tier 3 `3.0`–`3.1`).

---

## About Page

**Eyebrow:** `// about`

**Title:** About

**Subtitle:** A quick intro to how this app thinks about qubits.

The About page renders the same onboarding content as the first-run welcome screen (without the page header or CTA button). See [First-Run Welcome & Onboarding](#first-run-welcome--onboarding) below.

---

## First-Run Welcome & Onboarding

Shown on first launch before the main game. The About page reuses this content inline.

**Eyebrow (first run only):** `// welcome`

**Title (first run only):** Welcome

**Welcome subtitle:** A quick intro before you start building circuits.

### Bits vs. qubits

In classical computing, the most basic unit of information is the **bit**. A bit is always either 0 or 1. No in between, no ambiguity. A quantum computer works with **qubits**, the quantum version of bits. Qubits can do something classical bits fundamentally cannot: they can exist in a **superposition** of 0 and 1 at the same time! A qubit carries a probability of being measured as 0 and a probability of being measured as 1, and it holds both simultaneously until the moment you actually measure it. The best part? Nature stores that full state for you automatically. Not your hardware. Nature!

### The Bloch sphere

To visualize a qubit's state, we use the **Bloch sphere**.

*Caption under illustration:* The Bloch sphere — state vector at |0⟩

It is a unit sphere where every possible single-qubit state maps to exactly one point on its surface. The north pole is |0⟩, the south pole is |1⟩, and the equator is where things get interesting! |+⟩, |−⟩, |i⟩, and |−i⟩ all live there. Each points in a different direction around the middle and represents a different equal superposition of 0 and 1. The X axis captures one flavor of superposition, the Y axis another, and the Z axis is your classical north/south pole axis. State vector pointing straight up? You are at |0⟩. Straight down? |1⟩. Anywhere else on the sphere and you are in superposition.

**Equatorial superposition table** (shown under the Bloch sphere copy):

| State | Superposition | Bloch direction | Axis |
|-------|---------------|-----------------|------|
| \|+⟩ | 1/√2 (\|0⟩ + \|1⟩) | +X direction | X |
| \|−⟩ | 1/√2 (\|0⟩ − \|1⟩) | −X direction | X |
| \|i⟩ | 1/√2 (\|0⟩ + i\|1⟩) | +Y direction | Y |
| \|−i⟩ | 1/√2 (\|0⟩ − i\|1⟩) | −Y direction | Y |

*Table caption:* |0⟩ = +Z (north pole) · |1⟩ = −Z (south pole)

### Gates are rotations

In classical computing, logic gates change the state of bits. A classical NOT gate flips 0 to 1 and 1 to 0. Quantum gates do the same thing for qubits, but with a twist: every single-qubit quantum gate is a **rotation** on the Bloch sphere! Apply a gate to your qubit and the state vector swings to a new point on the surface. Gates are rotations. States are points. The sphere is your map.

### Why quantum gates are special

There is one more thing that makes quantum gates special, and it is huge: they are **invertible**! In classical computing, if someone hands you the output of a logic gate you often cannot figure out what the input was. Information gets lost. In quantum computing every gate operation can be undone. The math is reversible by design. This means quantum circuits can preserve and manipulate information in ways that classical circuits simply cannot. This is not an engineering trick. It is baked into the physics!

### What we're doing here

So here is what we are going to do. We are starting from the simplest quantum gates and building up one level at a time. Each level gives you a target transformation to implement. Your job is to assemble a circuit from the gates in your gateset, watch the Bloch sphere update in real time as you place and tune each gate, and match the target output. You will build intuition for what each gate does, how rotations combine, and how to engineer a specific quantum transformation from scratch!

Build circuits. Watch the state vector on the bloch sphere move. Match the goal. Learn.

**Closing:** // Good luck!

**CTA (first run only):** Got it, start playing

---

## Levels

Level numbering follows `getLevelNumber()`: 0-based within each tier from `LEVEL_ORDER`. Tier 1 is `1.0`–`1.15` (16 levels), Tier 2 is `2.0`–`2.4` (5 levels), Tier 3 is `3.0`–`3.1` (2 levels).

Task headings: Tier 1 levels display as `Gate X`, `Gate √X†`, etc. Two- and three-qubit levels display the gate name only (e.g. `CNOT↕`, `TOFFOLI`).

Hints are shown from the task card. Hint 2 is locked until Hint 1 has been viewed.

**Level insight** copy (when present) is shown in the Circuit Output panel after a successful check, under the heading `LEVEL INSIGHT`.

For parameterized levels without a static expected truth table (Rx, Ry), the expected output section shows:

> Parameterized gate — output depends on θ. The backend checks your unitary for any angle.

RANDOM_U and CONTROLLED_U generate a dynamic expected truth table and also show a **Try a different unitary** button.

---

### Level 1.0 — X Gate

**Target:** X

**Description:** The X gate flips a qubit: |0⟩ ↦ |1⟩ and |1⟩ ↦ |0⟩. It is the quantum NOT gate. Synthesize a circuit whose unitary matches X exactly.

**Hint 1:** Check how Sqrt_X moves the state on the Bloch sphere.

**Hint 2:** How could you use Sqrt_X to move the state further south?

---

### Level 1.1 — √X† Gate

**Target:** SQRT_X_DAG (`√X†`)

**Does not unlock a new gateset chip** (`noGatesetUnlock: true`).

**Description:** √X† is the inverse of the square-root-of-X gate — apply it twice and you undo a half-X rotation. Build it using only the gates you have so far.

**Hint 1:** Rx(π/2) is already a square root of X. What happens if you follow it with a full X flip?

**Hint 2:** Try Rx(π/2), then X, in that order.

---

### Level 1.2 — X† Gate

**Target:** X_DAG (`X†`); backend grades against `X`.

**Does not unlock a new gateset chip** (`noGatesetUnlock: true`). Config-only: X† = X.

**Description:** X-dag is the inverse of the X gate. But X is its own inverse — applying it twice gets you back to where you started. So X-dag and X are the exact same operation.

**Hint 1:** What is the inverse of a bit-flip?

**Hint 2:** X flips |0⟩ ↔ |1⟩. Applying X again flips it back. So X⁻¹ = X.

**Level insight (shown after successful completion):**

> Notice! The target vector for X† is identical to the target vector for X. That's because Pauli gates are their own inverses (X² = I), so there's nothing new for X† to add — you already built it. This is why X† won't appear in your toolbox. The same logic holds for all three Pauli gates (X, Y, Z): whenever you see a dagger on one of them, you already have it — no pauli-daggers needed!

---

### Level 1.3 — Z Gate

**Target:** Z

**Description:** The Z gate flips the phase of |1⟩ and leaves |0⟩ untouched. You already have a general Z-axis rotation — dial it to the right angle.

**Hint 1:** Z doesn't change measurement probabilities on its own — it's a pure phase flip. Which of your gates rotates around the Z-axis?

**Hint 2:** Rz(θ) at θ = π gives you a Z-axis half-turn.

---

### Level 1.4 — Z† Gate

**Target:** Z_DAG (`Z†`); backend grades against `Z`.

**Does not unlock a new gateset chip** (`noGatesetUnlock: true`). Config-only: Z† = Z.

**Description:** Z-dag is the inverse of Z. Since Z applies a phase of −1, applying it again cancels that phase — Z is its own inverse too.

**Hint 1:** Z multiplies |1⟩ by −1. What do you get if you apply −1 twice?

**Hint 2:** Z² = I, so Z⁻¹ = Z.

---

### Level 1.5 — S Gate

**Target:** S

**Description:** The S gate applies a π/2 phase rotation: |0⟩ ↦ |0⟩ and |1⟩ ↦ i|1⟩. Synthesize a circuit whose unitary matches S exactly.

**Hint 1:** S is a pure Z-axis rotation; to better visualize this rotation, place a Sqrt_X gate first to see how Rz(θ) rotates the state.

**Hint 2:** What angle do you need to use to make the π/2 phase rotation?

**Contextual tip (Bloch sphere, Level 1.5 only):**

> Gate order matters — to visually see how Rz(θ) rotates the Bloch sphere, try placing Sqrt_X first.

*This tip appears when the player adjusts an Rz gate's θ while only Rz gates are on the circuit.*

---

### Level 1.6 — S† Gate

**Target:** S_DAG (`S†`)

**Description:** S-dag undoes an S gate — a quarter-turn phase rotation in the opposite direction. Use your general Z-rotation to dial in the exact angle.

**Hint 1:** S rotates by +90° around the Z-axis. S-dag rotates the other way.

**Hint 2:** Set Rz to −π/2 (−90°).

---

### Level 1.7 — T Gate

**Target:** T

**Description:** The T gate applies a π/4 phase rotation: |0⟩ ↦ |0⟩ and |1⟩ ↦ e^(iπ/4)|1⟩. Synthesize a circuit whose unitary matches T exactly.

**Hint 1:** The T gate is very similar to the S gate — use the same method for visualizing the Rz rotation.

**Hint 2:** T is Rz at precisely half the angle you used for S.

---

### Level 1.8 — T† Gate

**Target:** T_DAG (`T†`)

**Description:** T-dag undoes a T gate — an eighth-turn phase rotation in reverse.

**Hint 1:** T rotates by +45° around the Z-axis. T-dag is the reverse of that.

**Hint 2:** Set Rz to −π/4 (−45°).

---

### Level 1.9 — H Gate (Hadamard)

**Target:** H

**Description:** The Hadamard gate creates equal superposition: |0⟩ ↦ (|0⟩ + |1⟩)/√2 and |1⟩ ↦ (|0⟩ − |1⟩)/√2. Synthesize a circuit whose unitary matches H up to global phase.

**Hint 1:** H requires both rotation axes — combine Rz and Sqrt_X in sequence.

**Hint 2:** Conjugating Sqrt_X by Rz rotations changes the effective rotation axis — try sandwiching Sqrt_X between two Rz gates.

**Level insight (shown after successful completion):**

> Notice! The outputs show different complex amplitudes but the circuit still passed. This is because the circuits differed by a global phase. Global phase differences are physically unobservable — the circuits will still have identical probability columns and be physically equivalent!

---

### Level 1.10 — H† Gate

**Target:** H_DAG (`H†`); backend grades against `H`.

**Does not unlock a new gateset chip** (`noGatesetUnlock: true`). Config-only: H† = H.

**Description:** H-dag is the inverse of the Hadamard gate. H is its own inverse — apply it twice and you are back where you started.

**Hint 1:** H creates an even superposition. What happens if you apply H to that superposition again?

**Hint 2:** H² = I, so H⁻¹ = H.

---

### Level 1.11 — Y Gate

**Target:** Y

**Description:** Y is the third Pauli gate — a full-turn rotation around the Y-axis of the Bloch sphere. You can build it by combining two gates you already have.

**Hint 1:** Y is closely related to X and Z — think about what happens if you flip the bit, then flip the phase.

**Hint 2:** Try applying X, then Z, in that order.

---

### Level 1.12 — Y† Gate

**Target:** Y_DAG (`Y†`); backend grades against `Y`.

**Does not unlock a new gateset chip** (`noGatesetUnlock: true`). Config-only: Y† = Y.

**Description:** Y-dag is the inverse of Y. Like the other Pauli gates, Y is its own inverse.

**Hint 1:** Pauli gates square to identity. What does that tell you about Y's inverse?

**Hint 2:** Y² = I, so Y⁻¹ = Y.

---

### Level 1.13 — Rx Gate

**Target:** RX

**Parameterized:** `RANDOM_THETA` — no static expected truth table.

**Description:** The R_x(θ) gate rotates the Bloch sphere around the X axis by angle θ. Synthesize a parameterized circuit whose unitary matches R_x(θ) for any angle θ.

**Hint 1:** Which gates will translate the state to the proper axis of rotation?

**Hint 2:** Conjugating a Z-axis rotation by Hadamards changes the rotation axis to X.

---

### Level 1.14 — Ry Gate

**Target:** RY

**Parameterized:** `RANDOM_THETA` — no static expected truth table.

**Description:** The R_y(θ) gate rotates the Bloch sphere around the Y axis by angle θ. Synthesize a parameterized circuit whose unitary matches R_y(θ) for any angle θ.

**Hint 1:** Which gates will translate the state to the proper axis of rotation?

**Hint 2:** Conjugating an X-axis rotation by Rz changes the rotation axis to Y.

---

### Level 1.15 — Arbitrary U

**Target:** RANDOM_U (display name: **ARBITRARY U**)

**Parameterized:** `SEED_ZYZ`. Does not unlock `Gate.U` into the toolbox (`noGatesetUnlock: true`).

**Description:** A random single-qubit unitary has been generated for you. Synthesize a circuit whose truth table matches it exactly. Use any combination of your unlocked gates.

**Hint 1:** Any single-qubit gate can be expressed as rotations about the X, Y, and Z axes for some angles θ_X, θ_Y, and θ_Z.

**Hint 2:** The angles θ_X, θ_Y, and θ_Z can be solved for given the matrix elements.

**Additional UI:** "Try a different unitary" button to generate a new random target.

---

### Level 2.0 — CNOT Flipped

**Target:** CNOT_FLIPPED (`CNOT↕`)

**Description:** CNOT with flipped control and target: if |q₁⟩ = |1⟩, flip |q₀⟩. Synthesize a circuit whose unitary matches the flipped CNOT exactly.

**Hint 1:** Think about how conjugating a gate by single-qubit operations can change which qubit plays which role.

**Hint 2:** Hadamards can swap the control and target roles of a CNOT.

**Level insight (shown after successful completion):**

> A flipped CNOT and a standard CNOT are the same gate in disguise. Wrap both qubits with Hadamards on either side (H⊗H · CNOT · H⊗H) and the control and target roles effectively swap. This is called H-conjugation. It is your first look at a powerful idea: you can change what a gate does just by choosing what surrounds it.

---

### Level 2.1 — Controlled Z (CZ)

**Target:** CONTROLLED_Z

**Description:** The CZ gate applies a π phase flip when both qubits are |1⟩: |11⟩ ↦ −|11⟩. Synthesize a circuit whose unitary matches CZ exactly.

**Hint 1:** CZ applies a phase flip — think about which single-qubit gate converts between the X and Z bases.

**Hint 2:** Wrapping a CNOT with Hadamards on one qubit converts a bit-flip into a phase-flip.

**Level insight (shown after successful completion):**

> The truth table shows |11⟩ mapping to |11⟩, but something is hidden: CZ actually applies a phase flip, sending |11⟩ to −1|11⟩. You cannot see this in the output label, but the grader enforces it. In a larger circuit, that sign would affect how states interfere with each other. This is relative phase. It is invisible on its own, but physically real the moment other gates get involved.

---

### Level 2.2 — SWAP

**Target:** SWAP

**Description:** SWAP exchanges two qubits: |01⟩ ↦ |10⟩ and |10⟩ ↦ |01⟩. Synthesize a circuit whose unitary matches SWAP exactly.

**Hint 1:** Think about how you can use CNOT to transfer information between qubits in both directions.

**Hint 2:** Three CNOTs applied in alternating control/target directions are sufficient.

---

### Level 2.3 — Controlled Hadamard (CH)

**Target:** CONTROLLED_H

**Description:** The CH gate applies H to the target qubit (Q1) when the control qubit (Q0) is |1⟩, and passes through unchanged otherwise. Synthesize a circuit whose unitary matches CH up to global phase.

**Hint 1:** Controlled gates can often be decomposed using rotation gates sandwiched around a CNOT.

**Hint 2:** Ry(π/4) · CNOT · Ry(−π/4) on the target qubit — verify the math for |10⟩ and |11⟩.

---

### Level 2.4 — Controlled U (CU)

**Target:** CONTROLLED_U

**Parameterized:** `SEED_ZXZ`. Does not unlock a reusable CU chip (`noGatesetUnlock: true`).

**Description:** A random Controlled-U gate has been generated. When the control qubit is |1⟩, an arbitrary single-qubit unitary U is applied to the target. Synthesize a circuit whose truth table matches it exactly.

**Hint 1:** The rows where the control is |0⟩ always pass through unchanged. Focus on the rows where control is |1⟩ — those reveal what U does to |0⟩ and |1⟩.

**Hint 2:** Once you know what U is from the truth table, you already know how to decompose it — you solved the same problem in Level 1.15. Then wrap that single-qubit decomposition in a controlled structure using the gates in your gateset.

**Additional UI:** "Try a different unitary" button to generate a new random target.

---

### Level 3.0 — Toffoli (CCX)

**Target:** TOFFOLI

**Description:** The Toffoli gate applies X to the target qubit (Q2) only when both control qubits (Q0 and Q1) are |1⟩. Synthesize a circuit whose unitary matches the Toffoli (CCX) gate exactly.

**Hint 1:** The Toffoli is universal for classical reversible computation. Think about how you can build a doubly-controlled NOT from CNOTs and single-qubit gates.

**Hint 2:** The canonical Nielsen & Chuang decomposition uses H, CNOT, T, and T† gates — fifteen gates in total. Can you find a shorter construction with your gateset?

---

### Level 3.1 — Fredkin (CSWAP)

**Target:** FREDKIN

**Description:** The Fredkin gate swaps qubits Q1 and Q2 only when the control qubit Q0 is |1⟩. Synthesize a circuit whose unitary matches the Fredkin (CSWAP) gate exactly.

**Hint 1:** When the control is |0⟩, all three qubits pass through unchanged. Focus on what happens when Q0 is |1⟩.

**Hint 2:** A Fredkin gate can be built from a Toffoli sandwiched between two CNOTs on the swap wires.

---

## Info Tooltips (ⓘ buttons)

These appear when clicking the info icon next to various UI elements.

### Circuit canvas

> A qubit is the quantum version of a classical bit. Unlike a bit which is always 0 or 1, a qubit can exist in a superposition of both until it is measured.

### Bloch sphere

> Every possible state of a single qubit lives somewhere on this sphere. The north pole is |0⟩, the south pole is |1⟩, and the equator is where superpositions live — |+⟩, |−⟩, |i⟩, and |−i⟩.

The Bloch tooltip also embeds a compact version of the equatorial superposition table (state, Bloch direction, and axis columns only — no superposition formula column and no pole caption).

### Circuit output table

> Quantum gates are linear operations. This means if your circuit produces the right output for every basis state — |0⟩ and |1⟩ — it is guaranteed to work correctly on any superposition too. That is why matching all rows here is enough to prove your circuit is correct.

### Expected probability column (P(e) header)

> Measurement probabilities: the chance of observing each output state. Calculated as P = |amplitude|². A definite state like |1⟩ gives P = 1.000. A superposition splits probability across states. Your trial probabilities must match expected for the level to pass.

---

## Gate Toolbox (Gateset)

**Heading:** GATESET

**Helper text below toolbox:**

- 1-qubit levels: Drag a gate onto the wires.
- 2-qubit levels: Drag a gate onto the wires. For 2-qubit gates, set the order after placement.

### Gate short descriptions (shown in toolbox labels)

| Gate | Label | Short description |
|------|-------|-------------------|
| X | X | Pauli bit flip |
| SQRT_X | √X | Sqrt_X gate |
| SQRT_X_DAG | √X† | Inverse square-root-of-X |
| Z | Z | Pauli Z phase flip |
| Z_DAG | Z† | Z-dag (equals Z) |
| S | S | π/2 phase on \|1⟩ |
| S_DAG | S† | −π/2 phase on \|1⟩ |
| T | T | π/4 phase on \|1⟩ |
| T_DAG | T† | −π/4 phase on \|1⟩ |
| H | H | Hadamard superposition |
| H_DAG | H† | H-dag (equals H) |
| Y | Y | Pauli Y rotation |
| Y_DAG | Y† | Y-dag (equals Y) |
| RX | Rx(θ) | Rotate around X axis |
| RY | Ry(θ) | Rotate around Y axis |
| RZ | Rz(θ) | Rotate around Z axis |
| U | U | General single-qubit unitary |
| CNOT | CNOT | Controlled NOT gate |
| CNOT_FLIPPED | CNOT↕ | Flipped control & target |
| CONTROLLED_Z | CZ | Controlled phase on \|11⟩ |
| SWAP | SWAP | Exchange two qubits |
| CONTROLLED_H | CH | Controlled Hadamard |
| CONTROLLED_U | CU | Controlled unitary |
| TOFFOLI | TOFFOLI | Doubly-controlled NOT (CCX) |

*FREDKIN has a display name but no `GATE_UI_CONFIG` entry (not yet a toolbox chip).*

*X† (`X_DAG`) is intentionally absent from the toolbox config — level 1.2 uses the plain X chip because X† = X.*

### Gate info tooltips (ⓘ on toolbox gates)

Tooltips appear on gates once the student has completed or skipped the level named in **Unlock condition**. Completing and skipping both reveal the icon.

| Gate | Unlock condition | Tooltip text |
|------|------------------|--------------|
| X | Complete Level 1.0 (X) | Sends \|0⟩ to \|1⟩ and \|1⟩ to \|0⟩. A half-turn rotation around the X-axis of the Bloch sphere — the quantum NOT gate. |
| √X (SQRT_X) | Complete Level 1.0 (X) | Sends \|0⟩ to \|−i⟩ and \|1⟩ to \|+i⟩. A quarter-turn rotation around the X-axis of the Bloch sphere — apply it twice and you get a full X flip. |
| Z | Complete Level 1.3 (Z) | Leaves \|0⟩ unchanged and sends \|1⟩ to −\|1⟩. A half-turn rotation around the Z-axis — flips relative phase without changing measurement probabilities. |
| S | Complete Level 1.5 (S) | Rotates the state vector around the Z axis by 90° (π/2). A quarter turn of phase — useful for fine-tuning where on the equator your state ends up. |
| S† (S_DAG) | Complete Level 1.6 (S†) | Leaves \|0⟩ unchanged and sends \|1⟩ to −i\|1⟩. A quarter-turn rotation around the Z-axis, in the opposite direction from S. |
| Rz(θ) (RZ) | Complete Level 1.6 (S†) | A tunable rotation around the Z-axis of the Bloch sphere by angle θ. Every phase gate you've built so far — S, S-dag — is a special case of this one gate. |
| T | Complete Level 1.7 (T) | Rotates the state vector around the Z axis by 45° (π/4). Half of what the S gate does — handy for precision phase adjustments. |
| T† (T_DAG) | Complete Level 1.8 (T†) | Leaves \|0⟩ unchanged and sends \|1⟩ to e^(−iπ/4)\|1⟩. An eighth-turn rotation around the Z-axis, in the opposite direction from T. |
| H | Complete Level 1.9 (H) | Sends \|0⟩ to \|+⟩ and \|1⟩ to \|−⟩. It is a combination of rotations that lands you exactly on the equator of the Bloch sphere. |
| Y | Complete Level 1.11 (Y) | Sends \|0⟩ to i\|1⟩ and \|1⟩ to −i\|0⟩. A half-turn rotation around the Y-axis of the Bloch sphere — combines a bit flip with a phase flip. |
| Rx(θ) (RX) | Complete Level 1.13 (Rx) | Rotates the state vector around the X axis by angle θ. Adjust θ using the slider after placing it on the wire. |
| Ry(θ) (RY) | Complete Level 1.14 (Ry) | Rotates the state vector around the Y axis by angle θ. Adjust θ using the slider after placing it on the wire. |
| U | Complete Level 1.15 (Arbitrary U) | The most general single-qubit gate — any combination of rotations around the Bloch sphere can be expressed as a U gate with the right parameters. |
| CNOT | Complete Level 1.15 (Arbitrary U) | A two-qubit gate. If the control qubit is \|1⟩, it flips the target qubit. The Bloch sphere only visualizes single-qubit states, so watch the truth table for this one. |
| CZ (CONTROLLED_Z) | Complete Level 2.1 (CZ) | A two-qubit gate. Applies a phase flip to the target qubit when both qubits are \|1⟩. Check the truth table to see its effect. |
| SWAP | Complete Level 2.2 (SWAP) | Exchanges the states of two qubits. Whatever qubit 0 was holding, qubit 1 now has, and vice versa. |

*Gates without ⓘ tooltips: √X†, X†, Z†, H†, Y†, CNOT↕, CH, CU, TOFFOLI, FREDKIN*

---

## Other UI Copy

### Levels page

**Eyebrow:** `// levels`

**Title:** Choose a Level

**Subtitle:** Pick a level from the grid to start building.

**Status legend:** Available · Completed · Skipped · Locked

**Tier headings:**
- Tier 1 — Single Qubit
- Tier 2 — Two Qubit
- Tier 3 — Three Qubit

### Circuit canvas (empty state)

> Drag a gate from the gateset to the wires, then click "Check Solution".

*(When Check Solution is hidden: "Drag a gate from the gateset to the wires.")*

### Parameterized-level hint (Vary θ)

Shown when a rotation gate is on the canvas but no parameter slot has been chosen:

> Choose **Vary θ** on the gate whose angle should vary before checking your solution.

### Circuit output (before submission)

> Submit to see the truth tables.

*(Preview mode: "Build a circuit to preview outputs.")*

### Circuit output (success)

> All rows match — circuit verified ✓

### Circuit output (parameterized success)

> N/M angles passed — circuit verified ✓

### Circuit output (partial mismatch)

> N/M rows match

**Button:** Clear and try again

### Circuit output (checking)

> Checking circuit…

### Level complete modal

**Title:** Level Complete!

**Body:** Target circuit successfully verified ✓ Proceed to the next level or repeat this one.

**Buttons:** Repeat level · Next level →

### Bloch sphere preview toggle

**Label:** Preview from: |0⟩ |1⟩

---

## Source Files

| Content | Primary source |
|---------|----------------|
| About / onboarding | `QMCB-fe/src/components/FirstRunOnboarding.tsx`, `QMCB-fe/src/pages/AboutPage.tsx` |
| Equatorial superposition table | `QMCB-fe/src/components/SuperpositionTable.tsx` |
| Level descriptions, hints, insights | `QMCB-fe/src/config/levels.ts` |
| Level 1.5 order tip | `QMCB-fe/src/pages/SolveLevelPage.tsx`, `QMCB-fe/src/components/MobileSolveLayout.tsx` |
| Gate short descriptions | `QMCB-fe/src/config/gateUiConfig.ts` |
| Gate ⓘ tooltips | `QMCB-fe/src/config/gateTooltips.tsx` |
| Bloch sphere ⓘ tooltip | `QMCB-fe/src/components/Gateset.tsx` |
| Circuit canvas ⓘ tooltip | `QMCB-fe/src/components/CircuitCanvas.tsx` |
| Circuit / probability ⓘ tooltips | `QMCB-fe/src/components/OutputTable.tsx` |
| Task card / hints UI | `QMCB-fe/src/components/TaskCard.tsx` |
| Levels page copy | `QMCB-fe/src/pages/LevelsPage.tsx` |
| Level complete modal | `QMCB-fe/src/components/LevelCompleteModal.tsx` |

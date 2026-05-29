# QMCB Educational Content

Compiled from `QMCB-fe` — all player-facing educational copy, hints, tips, info tooltips, and level insights.

---

## About Page

**Subtitle:** A quick intro to how this app thinks about qubits.

The About page renders the same onboarding content as the first-run welcome screen (without the page header or CTA button). See [First-Run Welcome & Onboarding](#first-run-welcome--onboarding) below.

---

## First-Run Welcome & Onboarding

Shown on first launch before the main game. The About page reuses this content inline.

**Welcome subtitle:** A quick intro before you start building circuits.

### Bits vs. qubits

In classical computing, the most basic unit of information is the **bit**. A bit is always either 0 or 1. No in between, no ambiguity. A quantum computer works with **qubits**, the quantum version of bits. Qubits can do something classical bits fundamentally cannot: they can exist in a **superposition** of 0 and 1 at the same time! A qubit carries a probability of being measured as 0 and a probability of being measured as 1, and it holds both simultaneously until the moment you actually measure it. The best part? Nature stores that full state for you automatically. Not your hardware. Nature!

### The Bloch sphere

To visualize a qubit's state, we use the **Bloch sphere**.

*Caption under illustration:* The Bloch sphere — state vector at |0⟩

It is a unit sphere where every possible single-qubit state maps to exactly one point on its surface. The north pole is |0⟩, the south pole is |1⟩, and the equator is where things get interesting! |+⟩, |−⟩, |i⟩, and |−i⟩ all live there. Each points in a different direction around the middle and represents a different equal superposition of 0 and 1. The X axis captures one flavor of superposition, the Y axis another, and the Z axis is your classical north/south pole axis. State vector pointing straight up? You are at |0⟩. Straight down? |1⟩. Anywhere else on the sphere and you are in superposition.

### Gates are rotations

In classical computing, logic gates change the state of bits. A classical NOT gate flips 0 to 1 and 1 to 0. Quantum gates do the same thing for qubits, but with a twist: every single-qubit quantum gate is a **rotation** on the Bloch sphere! Apply a gate to your qubit and the state vector swings to a new point on the surface. Gates are rotations. States are points. The sphere is your map.

### Why quantum gates are special

There is one more thing that makes quantum gates special, and it is huge: they are **invertible**! In classical computing, if someone hands you the output of a logic gate you often cannot figure out what the input was. Information gets lost. In quantum computing every gate operation can be undone. The math is reversible by design. This means quantum circuits can preserve and manipulate information in ways that classical circuits simply cannot. This is not an engineering trick. It is baked into the physics!

### What we're doing here

So here is what we are going to do. We are starting from the simplest quantum gates and building up one level at a time. Each level gives you a target transformation to implement. Your job is to assemble a circuit from the gates in your toolbox, watch the Bloch sphere update in real time as you place and tune each gate, and match the target output. You will build intuition for what each gate does, how rotations combine, and how to engineer a specific quantum transformation from scratch!

Build circuits. Watch the state vector on the bloch sphere move. Match the goal. Learn.

**Closing:** // Good luck!

**CTA (first run only):** Got it, start playing

---

## Levels

Level numbering follows the in-app convention: Tier 1 levels are `1.0`–`1.6`, Tier 2 levels are `2.1`–`2.5`.

For parameterized levels (Rx, Ry, Random U), the expected output section shows:

> Parameterized gate — output depends on θ. The backend checks your unitary for any angle.

---

### Level 1.0 — X Gate

**Target:** X

**Description:** The X gate flips a qubit: |0⟩ ↦ |1⟩ and |1⟩ ↦ |0⟩. It is the quantum NOT gate. Synthesize a circuit whose unitary matches X exactly.

**Hint 1:** Check how Sqrt_X moves the state on the Bloch sphere.

**Hint 2:** How could you use Sqrt_X to move the state further south?

---

### Level 1.1 — S Gate

**Target:** S

**Description:** The S gate applies a π/2 phase rotation: |0⟩ ↦ |0⟩ and |1⟩ ↦ i|1⟩. Synthesize a circuit whose unitary matches S exactly.

**Hint 1:** S is a pure Z-axis rotation; to better visualize this rotation, place a Sqrt_X gate first to see how Rz(θ) rotates the state.

**Hint 2:** What angle do you need to use to make the π/2 phase rotation?

**Contextual tip (Bloch sphere, Level 1.1 only):**

> Gate order matters — to visually see how Rz(θ) rotates the Bloch sphere, try placing Sqrt_X first.

*This tip appears when the player adjusts an Rz gate's θ while only Rz gates are on the circuit.*

---

### Level 1.2 — T Gate

**Target:** T

**Description:** The T gate applies a π/4 phase rotation: |0⟩ ↦ |0⟩ and |1⟩ ↦ e^(iπ/4)|1⟩. Synthesize a circuit whose unitary matches T exactly.

**Hint 1:** The T gate is very similar to the S gate — use the same method for visualizing the Rz rotation.

**Hint 2:** T is Rz at precisely half the angle you used for S.

---

### Level 1.3 — H Gate (Hadamard)

**Target:** H

**Description:** The Hadamard gate creates equal superposition: |0⟩ ↦ (|0⟩ + |1⟩)/√2 and |1⟩ ↦ (|0⟩ − |1⟩)/√2. Synthesize a circuit whose unitary matches H exactly.

**Hint 1:** H requires both rotation axes — combine Rz and Sqrt_X in sequence.

**Hint 2:** Conjugating Sqrt_X by Rz rotations changes the effective rotation axis — try sandwiching Sqrt_X between two Rz gates.

**Level insight (shown after successful completion):**

> Notice! The outputs show different complex amplitudes but the circuit still passed. This is because the circuits differed by a **global phase**. Global phase differences are physically unobservable — the circuits will still have identical **probability** columns and be physically equivalent!

---

### Level 1.4 — Rx Gate

**Target:** RX

**Description:** The R_x(θ) gate rotates the Bloch sphere around the X axis by angle θ. Synthesize a parameterized circuit whose unitary matches R_x(θ) for any angle θ.

**Hint 1:** Which gates will translate the state to the proper axis of rotation?

**Hint 2:** Conjugating a Z-axis rotation by Hadamards changes the rotation axis to X.

---

### Level 1.5 — Ry Gate

**Target:** RY

**Description:** The R_y(θ) gate rotates the Bloch sphere around the Y axis by angle θ. Synthesize a parameterized circuit whose unitary matches R_y(θ) for any angle θ.

**Hint 1:** Which gates will translate the state to the proper axis of rotation?

**Hint 2:** Conjugating an X-axis rotation by Rz changes the rotation axis to Y.

---

### Level 1.6 — Random Unitary

**Target:** RANDOM_U

**Description:** A random single-qubit unitary has been generated for you. Synthesize a circuit whose truth table matches it exactly. Use any combination of your unlocked gates.

**Hint 1:** Any single-qubit unitary can be decomposed into at most three rotation gates (ZXZ decomposition).

**Hint 2:** Try Rz(α) · Rx(β) · Rz(γ) — adjust the three angles until the outputs match.

**Additional UI:** "Try a different unitary" button to generate a new random target.

---

### Level 2.1 — CNOT Flipped

**Target:** CNOT_FLIPPED

**Description:** CNOT with flipped control and target: if |q₁⟩ = |1⟩, flip |q₀⟩. Synthesize a circuit whose unitary matches the flipped CNOT exactly.

**Hint 1:** Think about how conjugating a gate by single-qubit operations can change which qubit plays which role.

**Hint 2:** Hadamards can swap the control and target roles of a CNOT.

---

### Level 2.2 — Controlled Z (CZ)

**Target:** CONTROLLED_Z

**Description:** The CZ gate applies a π phase flip when both qubits are |1⟩: |11⟩ ↦ −|11⟩. Synthesize a circuit whose unitary matches CZ exactly.

**Hint 1:** CZ applies a phase flip — think about which single-qubit gate converts between the X and Z bases.

**Hint 2:** Wrapping a CNOT with Hadamards on one qubit converts a bit-flip into a phase-flip.

---

### Level 2.3 — SWAP

**Target:** SWAP

**Description:** SWAP exchanges two qubits: |01⟩ ↦ |10⟩ and |10⟩ ↦ |01⟩. Synthesize a circuit whose unitary matches SWAP exactly.

**Hint 1:** Think about how you can use CNOT to transfer information between qubits in both directions.

**Hint 2:** Three CNOTs applied in alternating control/target directions are sufficient.

---

### Level 2.4 — Controlled Hadamard (CH)

**Target:** CONTROLLED_H

**Description:** The CH gate applies H to the target qubit (Q1) when the control qubit (Q0) is |1⟩, and passes through unchanged otherwise. Synthesize a circuit whose unitary matches CH exactly.

**Hint 1:** Controlled gates can often be decomposed using rotation gates sandwiched around a CNOT.

**Hint 2:** Ry(π/4) · CNOT · Ry(−π/4) on the target qubit — verify the math for |10⟩ and |11⟩.

---

### Level 2.5 — Controlled U (placeholder)

**Target:** CONTROLLED_U

**Status:** Locked / coming soon

**Description:** Controlled-U applies an arbitrary single-qubit unitary to the target when the control is |1⟩. This optional level is coming soon.

**Hint 1:** Coming soon.

**Hint 2:** Coming soon.

---

## Info Tooltips (ⓘ buttons)

These appear when clicking the info icon next to various UI elements.

### Circuit canvas

> A qubit is the quantum version of a classical bit. Unlike a bit which is always 0 or 1, a qubit can exist in a superposition of both until it is measured.

### Bloch sphere

> Every possible state of a single qubit lives somewhere on this sphere. The north pole is |0⟩, the south pole is |1⟩, and the equator is where superpositions live — |+⟩, |−⟩, |i⟩, and |−i⟩. When you place gates, watch the state vector move.

### Circuit output table

> Quantum gates are linear operations. This means if your circuit produces the right output for every basis state — |0⟩ and |1⟩ — it is guaranteed to work correctly on any superposition too. That is why matching all rows here is enough to prove your circuit is correct.

### Expected probability column (P(e) header)

> Measurement probabilities: the chance of observing each output state. Calculated as P = |amplitude|². A definite state like |1⟩ gives P = 1.000. A superposition splits probability across states. Your trial probabilities must match expected for the level to pass.

---

## Gate Toolbox

**Helper text below toolbox:**

> Drag a gate onto the wires. For 2-qubit gates, set the order after placement.

### Gate short descriptions (shown in toolbox labels)

| Gate | Label | Short description |
|------|-------|-------------------|
| X | X | Pauli bit flip |
| SQRT_X | √X | Sqrt_X gate |
| CNOT | CNOT | Controlled NOT gate |
| CNOT_FLIPPED | CNOT↕ | Flipped control & target |
| CONTROLLED_Z | CZ | Controlled phase on \|11⟩ |
| SWAP | SWAP | Exchange two qubits |
| S | S | π/2 phase on \|1⟩ |
| T | T | π/4 phase on \|1⟩ |
| H | H | Hadamard superposition |
| RX | Rx(θ) | Rotate around X axis |
| RY | Ry(θ) | Rotate around Y axis |
| RZ | Rz(θ) | Rotate around Z axis |
| U | U | General single-qubit unitary |
| CONTROLLED_H | CH | Controlled Hadamard |
| CONTROLLED_U | CU | Controlled unitary |

### Gate info tooltips (ⓘ on toolbox gates)

Tooltips appear on gates once they are unlocked in the toolbox. Some are gated behind completing a prior level:

| Gate | Unlock condition for tooltip | Tooltip text |
|------|------------------------------|--------------|
| √X (SQRT_X) | Complete Level 1.0 (X) | Rotates the state vector around the X axis by 90°. This is your main tool for moving a state off the Z axis and into superposition. |
| Rz(θ) (RZ) | Complete Level 1.1 (S) | Rotates the state vector around the Z axis by angle θ. This changes the phase of your qubit without moving it off the Z axis if you start at a pole. Adjust θ using the slider after placing it on the wire. |
| H | Available when unlocked | Sends \|0⟩ to \|+⟩ and \|1⟩ to \|−⟩. It is a combination of rotations that lands you exactly on the equator of the Bloch sphere. |
| S | Available when unlocked | Rotates the state vector around the Z axis by 90° (π/2). A quarter turn of phase — useful for fine-tuning where on the equator your state ends up. |
| T | Available when unlocked | Rotates the state vector around the Z axis by 45° (π/4). Half of what the S gate does — handy for precision phase adjustments. |
| Rx(θ) (RX) | Available when unlocked | Rotates the state vector around the X axis by angle θ. Adjust θ using the slider after placing it on the wire. |
| Ry(θ) (RY) | Available when unlocked | Rotates the state vector around the Y axis by angle θ. Adjust θ using the slider after placing it on the wire. |
| CNOT | Available when unlocked | A two-qubit gate. If the control qubit is \|1⟩, it flips the target qubit. The Bloch sphere only visualizes single-qubit states, so watch the truth table for this one. |
| CZ (CONTROLLED_Z) | Available when unlocked | A two-qubit gate. Applies a phase flip to the target qubit when both qubits are \|1⟩. Check the truth table to see its effect. |
| SWAP | Available when unlocked | Exchanges the states of two qubits. Whatever qubit 0 was holding, qubit 1 now has, and vice versa. |

*Gates without tooltips: X, CNOT↕, U, CH, CU*

---

## Other UI Copy

### Levels page

**Subtitle:** Pick a level from the grid to start building.

**Tier headings:**
- Tier 1 — Single Qubit
- Tier 2 — Two Qubit

### Circuit canvas (empty state)

> Drag a gate from the toolbox to the wires, then click "Check Solution".

### Circuit output (before submission)

> Submit to see the truth tables.

### Circuit output (success)

> All rows match — circuit verified ✓

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
| About / onboarding | `QMCB-fe/src/components/FirstRunOnboarding.tsx` |
| Level descriptions, hints | `QMCB-fe/src/config/levels.ts` |
| Level 1.1 order tip | `QMCB-fe/src/pages/SolveLevelPage.tsx` |
| Level 1.3 insight | `QMCB-fe/src/pages/SolveLevelPage.tsx` |
| Gate tooltips & Bloch tooltip | `QMCB-fe/src/components/Toolbox.tsx` |
| Circuit / output info tooltips | `QMCB-fe/src/components/CircuitCanvas.tsx`, `OutputTable.tsx` |

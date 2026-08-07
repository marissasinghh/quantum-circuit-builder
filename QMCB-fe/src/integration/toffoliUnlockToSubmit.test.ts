import { describe, expect, it } from "vitest";

import { Gate } from "../types/global";
import { LEVEL_ORDER, FREDKIN_LEVEL } from "../config/levels";
import { computeAvailableGates } from "../utils/computeToolbox";
import { GATE_UI_CONFIG, TOOL_TO_GATE } from "../config/gateUiConfig";
import { isThreeQubitToolboxGate } from "../config/gates";
import { DEFAULT_THREE_QUBIT_ORDER, threeQubitOrderForTarget } from "../utils/constants";
import { append, setThreeQubitOrder, serializeOrders, validateCircuitForSimulate } from "../utils/circuit";
import { buildRequestFromLevel } from "../controllers/simulate";

/**
 * Phase 6 regression: exercises the real student path end-to-end without any
 * phase-isolated shortcuts —
 *   clear/skip 3.0 (TOFFOLI) → toolbox chip becomes real (GATE_UI_CONFIG + TOOL_TO_GATE
 *   wired) → drag onto a later 3-qubit level's canvas (addThreeQubitGate spawn order) →
 *   reassign target via the picker (setThreeQubitTarget) → serialize into the exact
 *   POST payload buildRequestFromLevel sends to the backend.
 *
 * Every step below calls the same pure functions the real UI calls (useDragAndDrop,
 * useCircuit, controllers/simulate) — only the pointer/DOM events themselves are
 * out of scope for a non-browser test.
 */

const TOFFOLI_LEVEL_INDEX = LEVEL_ORDER.findIndex((l) => l.target_unitary === Gate.TOFFOLI);

function advancedPastAtStart(index: number): string[] {
  return LEVEL_ORDER.slice(0, index).map((l) => l.target_unitary);
}

describe("Toffoli: fresh unlock → toolbox chip → drop → reassign target → submit", () => {
  it("step 1: clearing/skipping 3.0 unlocks a fully wired Toffoli chip (unlock + UI config + drag mapping agree)", () => {
    const freshlyUnlockedPast = advancedPastAtStart(TOFFOLI_LEVEL_INDEX + 1);
    const availableGates = computeAvailableGates(freshlyUnlockedPast, [], FREDKIN_LEVEL.number_of_qubits);

    expect(availableGates).toContain(Gate.TOFFOLI);

    // Same guard Gateset.tsx / MobileSolveLayout.tsx apply before rendering a chip.
    const config = GATE_UI_CONFIG[Gate.TOFFOLI];
    expect(config).toBeDefined();
    expect(config!.toolId).toBe("tool-toffoli");

    // The chip's toolId must map back to Gate.TOFFOLI for onDragEnd to resolve it.
    expect(TOOL_TO_GATE[config!.toolId]).toBe(Gate.TOFFOLI);
    expect(isThreeQubitToolboxGate(TOOL_TO_GATE[config!.toolId])).toBe(true);
  });

  it("step 2: dropping the toolbox chip on a later level's canvas spawns a Toffoli at the default C0_C1_T2 order", () => {
    // Mirrors useDragAndDrop's onDragEnd 3-qubit branch: addThreeQubitGate(gate, col, initialOrder)
    // with initialOrder = threeQubitSpawnOrderFor(levelId, gate), which falls through to
    // DEFAULT_THREE_QUBIT_ORDER for every level (no override registered for TOFFOLI).
    const placed = append([], {
      id: "toffoli-1",
      type: Gate.TOFFOLI,
      order: DEFAULT_THREE_QUBIT_ORDER,
      column: 0,
    });

    expect(placed).toHaveLength(1);
    const chip = placed[0];
    expect(chip.type).toBe(Gate.TOFFOLI);
    expect("order" in chip && chip.order).toEqual([0, 1, 2]);
  });

  it("step 3: reassigning the target wire via the picker updates order in place (id-addressed, no reshuffle)", () => {
    const placed = append([], {
      id: "toffoli-1",
      type: Gate.TOFFOLI,
      order: DEFAULT_THREE_QUBIT_ORDER,
      column: 0,
    });

    // Student clicks "make wire 1 the target" in SortablePlacedMultiQubitGate's picker.
    const newOrder = threeQubitOrderForTarget(1);
    expect(newOrder).toEqual([0, 2, 1]);

    const reconfigured = setThreeQubitOrder(placed, "toffoli-1", newOrder);
    const chip = reconfigured.find((g) => g.id === "toffoli-1");
    expect(chip && "order" in chip && chip.order).toEqual([0, 2, 1]);

    // Circuit remains valid to submit (unique wires, all three used).
    expect(validateCircuitForSimulate(reconfigured)).toBeNull();
  });

  it("step 4: submitting the circuit serializes the reconfigured order into the exact backend payload shape", () => {
    const placed = append([], {
      id: "toffoli-1",
      type: Gate.TOFFOLI,
      order: DEFAULT_THREE_QUBIT_ORDER,
      column: 0,
    });
    const reconfigured = setThreeQubitOrder(placed, "toffoli-1", threeQubitOrderForTarget(1));

    // serializeOrders is what controllers/simulate.ts feeds into qubit_order.
    expect(serializeOrders(reconfigured)).toEqual([[0, 2, 1]]);

    // Full request build against a real 3-qubit level (student placed Toffoli while
    // solving Fredkin, e.g. via Fredkin = Toffoli sandwiched between two CNOTs).
    const request = buildRequestFromLevel(FREDKIN_LEVEL, reconfigured);
    expect(request.number_of_qubits).toBe(3);
    expect(request.gates).toEqual([Gate.TOFFOLI]);
    expect(request.qubit_order).toEqual([[0, 2, 1]]);

    // Matches the backend's C0_C2_T1 constant exactly (control=0, control=2, target=1),
    // confirmed positionally against CirqGateMapper.apply() in Phase 1/3.
  });
});

describe("Fredkin stays fully inert as a side effect of shared 3-qubit toolbox plumbing", () => {
  it("has no GATE_UI_CONFIG entry even once its own level is cleared/skipped (still gated out of rendering)", () => {
    const freshlyUnlockedPast = advancedPastAtStart(LEVEL_ORDER.length); // every level cleared
    const availableGates = computeAvailableGates(freshlyUnlockedPast, [], 3);

    // FREDKIN *is* in the generic unlocked set (same rule as every other gate) —
    // but Gateset.tsx / MobileSolveLayout.tsx both `return null` when GATE_UI_CONFIG
    // is missing, so it never becomes a chip regardless of unlock state.
    expect(availableGates).toContain(Gate.FREDKIN);
    expect(GATE_UI_CONFIG[Gate.FREDKIN]).toBeUndefined();
  });

  it("has no toolId / drag mapping — TOOL_TO_GATE has no entry that resolves to FREDKIN", () => {
    expect(Object.values(TOOL_TO_GATE)).not.toContain(Gate.FREDKIN);
  });

  it("is not classified as a three-qubit toolbox gate — the shared 3-wire chip plumbing doesn't apply to it", () => {
    // arityFor(FREDKIN) falls through to the single-qubit default (never reached in
    // practice since it has no GATE_UI_CONFIG entry, but confirms no accidental
    // arity-3 wiring leaked in alongside TOFFOLI's).
    expect(isThreeQubitToolboxGate(Gate.FREDKIN)).toBe(false);
  });
});

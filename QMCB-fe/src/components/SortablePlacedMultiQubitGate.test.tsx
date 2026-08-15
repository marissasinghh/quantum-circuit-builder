import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { Gate, type PlacedThreeQubitGate, type PlacedTwoQubitGate } from "../types/global";
import { SortablePlacedMultiQubitGate } from "./SortablePlacedMultiQubitGate";

const toffoli: PlacedThreeQubitGate = {
  id: "toffoli",
  type: Gate.TOFFOLI,
  order: [0, 1, 2],
  column: 0,
};

const cnot: PlacedTwoQubitGate = {
  id: "cnot",
  type: Gate.CNOT,
  order: [0, 1],
  baseWire: 0,
  column: 0,
};

const swap: PlacedTwoQubitGate = {
  id: "swap",
  type: Gate.SWAP,
  order: [0, 1],
  baseWire: 0,
  column: 0,
};

describe("SortablePlacedMultiQubitGate target-wire picker", () => {
  it("renders 3 picker buttons for a placed Toffoli, marking the current target wire", () => {
    const markup = renderToStaticMarkup(
      <SortablePlacedMultiQubitGate
        gate={toffoli}
        left={0}
        top={0}
        width={80}
        height={90}
        numberOfQubits={3}
        onRemoveGate={vi.fn()}
        onSetThreeQubitTarget={vi.fn()}
      />
    );

    // Default order [0,1,2] → wire 2 is target.
    expect(markup).toContain('aria-label="Wire 2 is the target (click a different wire to change it)"');
    expect(markup).toContain('aria-label="Make wire 0 the target"');
    expect(markup).toContain('aria-label="Make wire 1 the target"');
    expect((markup.match(/aria-pressed="true"/g) ?? []).length).toBe(1);
    expect((markup.match(/aria-pressed="false"/g) ?? []).length).toBe(2);
  });

  it("reflects a reconfigured order (target=wire 1) in the picker's pressed state", () => {
    const reconfigured: PlacedThreeQubitGate = { ...toffoli, order: [0, 2, 1] };
    const markup = renderToStaticMarkup(
      <SortablePlacedMultiQubitGate
        gate={reconfigured}
        left={0}
        top={0}
        width={80}
        height={90}
        numberOfQubits={3}
        onRemoveGate={vi.fn()}
        onSetThreeQubitTarget={vi.fn()}
      />
    );

    expect(markup).toContain('aria-label="Wire 1 is the target (click a different wire to change it)"');
    expect(markup).toContain('aria-label="Make wire 0 the target"');
    expect(markup).toContain('aria-label="Make wire 2 the target"');
  });

  it("does not render the picker when onSetThreeQubitTarget is not provided", () => {
    const markup = renderToStaticMarkup(
      <SortablePlacedMultiQubitGate
        gate={toffoli}
        left={0}
        top={0}
        width={80}
        height={90}
        numberOfQubits={3}
        onRemoveGate={vi.fn()}
      />
    );
    expect(markup).not.toContain("the target");
  });

  it("anchors the picker flush with the chip's own right edge (right-0), not outside it", () => {
    // Fix C regression guard: the old `-right-[20px]` offset overshot the real
    // ~10px inter-column gap (CANVAS_COL_W 90 - chip width 80) and visually
    // drifted into the next gate's column. The picker must now sit at right-0,
    // the same anchor convention CHIP_CTRL_BTN/the flip icon already use.
    const markup = renderToStaticMarkup(
      <SortablePlacedMultiQubitGate
        gate={toffoli}
        left={0}
        top={0}
        width={80}
        height={90}
        numberOfQubits={3}
        onRemoveGate={vi.fn()}
        onSetThreeQubitTarget={vi.fn()}
      />
    );
    expect(markup).not.toContain("-right-[20px]");
    // Flush "right-0" anchor (no flip icon rendered here — onSetGateOrder isn't
    // passed — so all 3 occurrences must be the picker's own buttons).
    const rightZeroCount = (markup.match(/right-0/g) ?? []).length;
    expect(rightZeroCount).toBe(3);
  });

  it("does not render the picker for a 2-qubit gate (CNOT) even if the handler is provided", () => {
    const markup = renderToStaticMarkup(
      <SortablePlacedMultiQubitGate
        gate={cnot}
        left={0}
        top={0}
        width={80}
        height={60}
        numberOfQubits={2}
        onRemoveGate={vi.fn()}
        onSetThreeQubitTarget={vi.fn()}
      />
    );
    expect(markup).not.toContain("the target");
  });
});

/**
 * SWAP redesign: SWAP is no longer in ORDER_BEARING_GATES (flip is functionally
 * inert for SWAP — cirq.SWAP(a,b) ≡ cirq.SWAP(b,a)), but it must keep its
 * extend/retract span controls on a 3-qubit canvas since wire-pair placement is
 * still a real, functional distinction.
 */
describe("SortablePlacedMultiQubitGate — SWAP flip icon removal & span controls", () => {
  it("does NOT render the flip icon for a placed SWAP chip, even with cnotFlipUnlocked", () => {
    const markup = renderToStaticMarkup(
      <SortablePlacedMultiQubitGate
        gate={swap}
        left={0}
        top={0}
        width={80}
        height={52}
        numberOfQubits={3}
        onRemoveGate={vi.fn()}
        cnotFlipUnlocked
        onSetGateOrder={vi.fn()}
      />
    );
    expect(markup).not.toContain("Flip control/target order");
  });

  it("still renders the flip icon for a placed CNOT chip with cnotFlipUnlocked (scoped correctly)", () => {
    const markup = renderToStaticMarkup(
      <SortablePlacedMultiQubitGate
        gate={cnot}
        left={0}
        top={0}
        width={80}
        height={52}
        numberOfQubits={3}
        onRemoveGate={vi.fn()}
        cnotFlipUnlocked
        onSetGateOrder={vi.fn()}
      />
    );
    expect(markup).toContain('aria-label="Flip control/target order"');
  });

  it("still renders the flip icon for a placed CONTROLLED_Z chip with cnotFlipUnlocked", () => {
    const cz: PlacedTwoQubitGate = { ...cnot, id: "cz", type: Gate.CONTROLLED_Z };
    const markup = renderToStaticMarkup(
      <SortablePlacedMultiQubitGate
        gate={cz}
        left={0}
        top={0}
        width={80}
        height={52}
        numberOfQubits={3}
        onRemoveGate={vi.fn()}
        cnotFlipUnlocked
        onSetGateOrder={vi.fn()}
      />
    );
    expect(markup).toContain('aria-label="Flip control/target order"');
  });

  it("still renders extend/retract span controls for a placed SWAP chip on a 3-qubit canvas", () => {
    const markup = renderToStaticMarkup(
      <SortablePlacedMultiQubitGate
        gate={swap}
        left={0}
        top={0}
        width={80}
        height={52}
        numberOfQubits={3}
        onRemoveGate={vi.fn()}
        onSetGateSpan={vi.fn()}
      />
    );
    // swap.baseWire=0, not extended → occupies wires 0-1 → only "extend down" control shows.
    expect(markup).toContain('aria-label="Extend gate to wires 0–2"');
  });

  it("does not render span controls for SWAP on a 2-qubit canvas", () => {
    const markup = renderToStaticMarkup(
      <SortablePlacedMultiQubitGate
        gate={swap}
        left={0}
        top={0}
        width={80}
        height={52}
        numberOfQubits={2}
        onRemoveGate={vi.fn()}
        onSetGateSpan={vi.fn()}
      />
    );
    expect(markup).not.toContain("Extend gate");
  });
});

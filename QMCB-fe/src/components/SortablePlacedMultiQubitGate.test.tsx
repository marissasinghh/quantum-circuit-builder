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

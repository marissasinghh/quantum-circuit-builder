import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ToffoliGlyph } from "./GateDesign";
import { Gate } from "../types/global";
import { append, serializeOrders, setThreeQubitOrder } from "../utils/circuit";
import { threeQubitOrderForTarget } from "../utils/constants";

/**
 * Toffoli glyph order-awareness (Phase 3).
 * Regression-safety: order=[0,1,2] must render identically to the pre-existing
 * hardcoded appearance (controls on wires 0 & 1, target ⊕ on wire 2).
 * order=[0,2,1] must move the controls to wires 0 & 2, target ⊕ to wire 1.
 */

function circleCys(markup: string): number[] {
  return [...markup.matchAll(/<circle cx="[\d.]+" cy="([\d.]+)"/g)].map((m) => Number(m[1]));
}

describe("ToffoliGlyph", () => {
  it("order=[0,1,2] (default) renders controls on wires 0 & 1, target on wire 2", () => {
    const defaultMarkup = renderToStaticMarkup(<ToffoliGlyph width={80} height={90} />);
    const explicitMarkup = renderToStaticMarkup(
      <ToffoliGlyph order={[0, 1, 2]} width={80} height={90} />
    );
    // Regression guard: omitting `order` must be pixel-identical to passing [0,1,2] explicitly.
    expect(explicitMarkup).toEqual(defaultMarkup);

    const cys = circleCys(defaultMarkup);
    expect(cys).toHaveLength(3);
    // First two circles are the control dots (wires 0, 1); third is the target ⊕ backing circle.
    const [controlY0, controlY1, targetY] = cys;
    expect(controlY0).toBeLessThan(controlY1);
    expect(controlY1).toBeLessThan(targetY);
  });

  it("order=[0,2,1] renders controls on wires 0 & 2, target ⊕ on wire 1", () => {
    const markup = renderToStaticMarkup(<ToffoliGlyph order={[0, 2, 1]} width={80} height={90} />);
    const cys = circleCys(markup);
    expect(cys).toHaveLength(3);
    const [controlY0, controlY1, targetY] = cys;

    // Control dots on the extreme wires (0 and 2, i.e. top and bottom), target in the middle.
    expect(controlY0).toBeLessThan(targetY);
    expect(controlY1).toBeGreaterThan(targetY);
  });

  it("target ⊕ symbol (Plus) tracks the target wire, not a fixed wire", () => {
    const defaultMarkup = renderToStaticMarkup(<ToffoliGlyph order={[0, 1, 2]} width={80} height={90} />);
    const reconfiguredMarkup = renderToStaticMarkup(
      <ToffoliGlyph order={[0, 2, 1]} width={80} height={90} />
    );
    // Plus is the only element drawn with stroke-width="1.5" in this glyph; its
    // horizontal-stroke y1 is the target wire's y — should move when target changes.
    const plusY = (markup: string) => {
      const match = markup.match(/y1="(\d+(?:\.\d+)?)" x2="[\d.]+" y2="\1" stroke="[^"]*" stroke-width="1\.5"/);
      return match ? Number(match[1]) : null;
    };
    expect(plusY(defaultMarkup)).not.toBeNull();
    expect(plusY(defaultMarkup)).not.toEqual(plusY(reconfiguredMarkup));
  });

  /**
   * End-to-end positional-convention check (not three separate assumptions
   * agreeing by luck): drives a SINGLE order value produced by
   * `threeQubitOrderForTarget` through state (`setThreeQubitOrder`), rendering
   * (`ToffoliGlyph`), and wire serialization (`serializeOrders`), asserting all
   * three agree that index 0/1 = controls and index 2 = target BY POSITION —
   * the same convention confirmed against the live backend in chat (Phase 1/2):
   * `CirqGateMapper.apply()` does `selected_qubits = [qubits[i] for i in qubit_order]`
   * then `cirq.CCX(selected_qubits[0], selected_qubits[1], selected_qubits[2])` —
   * i.e. positions 0/1 are always controls, position 2 is always target,
   * regardless of the index *values* stored there. This test's `order` (produced
   * by asking for target=Q1) is `[0, 2, 1]`, matching the backend's
   * `qubit_orders.py` constant `C0_C2_T1 = [0, 2, 1]` exactly — same array,
   * same positional meaning, on both ends.
   */
  it("threeQubitOrderForTarget → setThreeQubitOrder → glyph → serializeOrders agree positionally", () => {
    const order = threeQubitOrderForTarget(1); // "make Q1 the target"
    expect(order).toEqual([0, 2, 1]); // matches backend qubit_orders.C0_C2_T1 verbatim

    // 1) State: setThreeQubitOrder stores it verbatim (no re-sorting/re-mapping).
    const gates = setThreeQubitOrder(
      append([], { id: "toffoli", type: Gate.TOFFOLI, order: [0, 1, 2], column: 0 }),
      "toffoli",
      order
    );
    const chip = gates.find((g) => g.id === "toffoli");
    expect(chip && "order" in chip && chip.order).toEqual(order);

    // 2) Render: glyph destructures the SAME array as [control, control, target] by position.
    const markup = renderToStaticMarkup(<ToffoliGlyph order={order} width={80} height={90} />);
    const cys = circleCys(markup);
    const [controlY0, controlY1, targetY] = cys;
    // Target requested was Q1 (the middle wire) → target circle must be the middle y.
    expect(controlY0).toBeLessThan(targetY);
    expect(controlY1).toBeGreaterThan(targetY);

    // 3) Wire payload: serializeOrders must pass the array through unmodified —
    // this is literally what gets POSTed as `qubit_order` and fed to the backend's
    // `CirqGateMapper.apply()`, which is positional in the identical way (see docblock).
    expect(serializeOrders(gates)).toEqual([order]);
  });
});

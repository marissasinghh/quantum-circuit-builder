import { describe, expect, it } from "vitest";
import { Gate } from "../types/global";
import { GATE_UI_CONFIG } from "../config/gateUiConfig";
import { feedbackAvailableGates } from "./feedbackToolbox";

describe("feedbackAvailableGates", () => {
  it("excludes FREDKIN, which has no GATE_UI_CONFIG entry (not yet supported)", () => {
    const gates = feedbackAvailableGates(3);
    expect(gates).not.toContain(Gate.FREDKIN);
    expect(GATE_UI_CONFIG[Gate.FREDKIN]).toBeUndefined();
  });

  it("includes TOFFOLI on 3-qubit levels now that it has a GATE_UI_CONFIG entry", () => {
    expect(GATE_UI_CONFIG[Gate.TOFFOLI]).toBeDefined();
    expect(feedbackAvailableGates(3)).toContain(Gate.TOFFOLI);
  });

  it("filters by qubit count", () => {
    const oneQ = feedbackAvailableGates(1);
    expect(oneQ.every((g) => GATE_UI_CONFIG[g] != null)).toBe(true);
    expect(oneQ).not.toContain(Gate.CNOT);
    expect(oneQ).toContain(Gate.H);

    const twoQ = feedbackAvailableGates(2);
    expect(twoQ).toContain(Gate.CNOT);
    expect(twoQ).toContain(Gate.SWAP);
    expect(twoQ).not.toContain(Gate.TOFFOLI);

    const threeQ = feedbackAvailableGates(3);
    expect(threeQ).toContain(Gate.CNOT);
    expect(threeQ).toContain(Gate.TOFFOLI);
    // 3q toolbox is 2q's set plus TOFFOLI (FREDKIN still excluded — no GATE_UI_CONFIG).
    expect(threeQ).toEqual([...twoQ, Gate.TOFFOLI]);
  });

  it("only returns placeable configured gates", () => {
    for (const n of [1, 2, 3]) {
      for (const g of feedbackAvailableGates(n)) {
        expect(GATE_UI_CONFIG[g]).toBeDefined();
      }
    }
  });
});

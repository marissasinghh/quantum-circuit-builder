import { describe, expect, it } from "vitest";
import { Gate } from "../types/global";
import { GATE_UI_CONFIG } from "../config/gateUiConfig";
import { feedbackAvailableGates } from "./feedbackToolbox";

describe("feedbackAvailableGates", () => {
  it("excludes gates without GATE_UI_CONFIG (TOFFOLI / FREDKIN)", () => {
    const gates = feedbackAvailableGates(3);
    expect(gates).not.toContain(Gate.TOFFOLI);
    expect(gates).not.toContain(Gate.FREDKIN);
    expect(GATE_UI_CONFIG[Gate.TOFFOLI]).toBeUndefined();
    expect(GATE_UI_CONFIG[Gate.FREDKIN]).toBeUndefined();
  });

  it("filters by qubit count", () => {
    const oneQ = feedbackAvailableGates(1);
    expect(oneQ.every((g) => GATE_UI_CONFIG[g] != null)).toBe(true);
    expect(oneQ).not.toContain(Gate.CNOT);
    expect(oneQ).toContain(Gate.H);

    const twoQ = feedbackAvailableGates(2);
    expect(twoQ).toContain(Gate.CNOT);
    expect(twoQ).toContain(Gate.SWAP);

    const threeQ = feedbackAvailableGates(3);
    expect(threeQ).toContain(Gate.CNOT);
    // No 3q chips without GATE_UI_CONFIG — same placeable set as 2q.
    expect(threeQ).toEqual(twoQ);
  });

  it("only returns placeable configured gates", () => {
    for (const n of [1, 2, 3]) {
      for (const g of feedbackAvailableGates(n)) {
        expect(GATE_UI_CONFIG[g]).toBeDefined();
      }
    }
  });
});

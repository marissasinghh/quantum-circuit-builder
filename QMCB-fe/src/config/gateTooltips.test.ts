import { describe, expect, it } from "vitest";

import { Gate } from "../types/global";
import { shouldShowGateTooltip, visibleTooltipGates } from "./gateTooltips";

describe("shouldShowGateTooltip — reveal schedule", () => {
  it("shows no icons at game start", () => {
    expect(visibleTooltipGates([])).toEqual([]);
  });

  it("after 1.0 complete (X): only X has an icon", () => {
    const completed = [Gate.X];
    expect(shouldShowGateTooltip(Gate.X, completed)).toBe(true);
    expect(shouldShowGateTooltip(Gate.SQRT_X, completed)).toBe(false);
    expect(shouldShowGateTooltip(Gate.RZ, completed)).toBe(false);
    expect(visibleTooltipGates(completed)).toEqual([Gate.X]);
  });

  it("after 1.1 complete: X and retroactive sqrt-X; not Z, S, or Rz", () => {
    const completed = [Gate.X, Gate.SQRT_X_DAG];
    expect(shouldShowGateTooltip(Gate.X, completed)).toBe(true);
    expect(shouldShowGateTooltip(Gate.SQRT_X, completed)).toBe(true);
    expect(shouldShowGateTooltip(Gate.Z, completed)).toBe(false);
    expect(shouldShowGateTooltip(Gate.S, completed)).toBe(false);
    expect(shouldShowGateTooltip(Gate.RZ, completed)).toBe(false);
    expect(visibleTooltipGates(completed).sort()).toEqual([Gate.SQRT_X, Gate.X].sort());
  });

  it("after 1.6 complete: adds S, S-dag, and retroactive Rz; not T", () => {
    const completed = [
      Gate.X,
      Gate.SQRT_X_DAG,
      Gate.X_DAG,
      Gate.Z,
      Gate.Z_DAG,
      Gate.S,
      Gate.S_DAG,
    ];
    expect(shouldShowGateTooltip(Gate.S, completed)).toBe(true);
    expect(shouldShowGateTooltip(Gate.S_DAG, completed)).toBe(true);
    expect(shouldShowGateTooltip(Gate.RZ, completed)).toBe(true);
    expect(shouldShowGateTooltip(Gate.T, completed)).toBe(false);
    expect(visibleTooltipGates(completed).sort()).toEqual(
      [Gate.RZ, Gate.S, Gate.S_DAG, Gate.SQRT_X, Gate.X, Gate.Z].sort(),
    );
  });

  it("reveals H only after 1.9 complete", () => {
    const beforeH = [Gate.X, Gate.SQRT_X_DAG, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG];
    expect(shouldShowGateTooltip(Gate.H, beforeH)).toBe(false);
    expect(shouldShowGateTooltip(Gate.H, [...beforeH, Gate.H])).toBe(true);
  });
});

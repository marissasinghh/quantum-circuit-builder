import { describe, expect, it } from "vitest";

import { Gate } from "../types/global";
import { shouldShowGateTooltip, visibleTooltipGates } from "./gateTooltips";

describe("shouldShowGateTooltip — reveal schedule", () => {
  it("shows no icons at game start", () => {
    expect(visibleTooltipGates([])).toEqual([]);
    expect(shouldShowGateTooltip(Gate.SQRT_X, [])).toBe(false);
    expect(shouldShowGateTooltip(Gate.RZ, [])).toBe(false);
  });

  it("after 1.0 complete (X): X and retroactive sqrt-X get icons", () => {
    const completed = [Gate.X];
    expect(shouldShowGateTooltip(Gate.X, completed)).toBe(true);
    expect(shouldShowGateTooltip(Gate.SQRT_X, completed)).toBe(true);
    expect(shouldShowGateTooltip(Gate.RZ, completed)).toBe(false);
    expect(visibleTooltipGates(completed).sort()).toEqual([Gate.SQRT_X, Gate.X].sort());
  });

  it("after 1.1 complete: same insight icons as 1.0; not Z, S, or Rz", () => {
    const completed = [Gate.X, Gate.SQRT_X_DAG];
    expect(shouldShowGateTooltip(Gate.X, completed)).toBe(true);
    expect(shouldShowGateTooltip(Gate.SQRT_X, completed)).toBe(true);
    expect(shouldShowGateTooltip(Gate.Z, completed)).toBe(false);
    expect(shouldShowGateTooltip(Gate.S, completed)).toBe(false);
    expect(shouldShowGateTooltip(Gate.RZ, completed)).toBe(false);
    expect(visibleTooltipGates(completed).sort()).toEqual([Gate.SQRT_X, Gate.X].sort());
  });

  it("after 1.3 complete (Z): Z icon appears", () => {
    const completed = [Gate.X, Gate.SQRT_X_DAG, Gate.X_DAG, Gate.Z];
    expect(shouldShowGateTooltip(Gate.Z, completed)).toBe(true);
    expect(shouldShowGateTooltip(Gate.S, completed)).toBe(false);
  });

  it("after 1.5 complete (S): S icon appears", () => {
    const completed = [Gate.X, Gate.Z, Gate.S];
    expect(shouldShowGateTooltip(Gate.S, completed)).toBe(true);
    expect(shouldShowGateTooltip(Gate.S_DAG, completed)).toBe(false);
  });

  it("after 1.6 complete: adds S-dag and retroactive Rz; not T", () => {
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

  it("reveals T and T-dag on 1.7 and 1.8 complete", () => {
    const afterT = [Gate.X, Gate.Z, Gate.S, Gate.S_DAG, Gate.T];
    expect(shouldShowGateTooltip(Gate.T, afterT)).toBe(true);
    expect(shouldShowGateTooltip(Gate.T_DAG, afterT)).toBe(false);

    const afterTDag = [...afterT, Gate.T_DAG];
    expect(shouldShowGateTooltip(Gate.T_DAG, afterTDag)).toBe(true);
  });

  it("reveals H only after 1.9 complete", () => {
    const beforeH = [Gate.X, Gate.SQRT_X_DAG, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG];
    expect(shouldShowGateTooltip(Gate.H, beforeH)).toBe(false);
    expect(shouldShowGateTooltip(Gate.H, [...beforeH, Gate.H])).toBe(true);
  });

  it("reveals Y on 1.11 complete", () => {
    const beforeY = [Gate.X, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG, Gate.H, Gate.H_DAG];
    expect(shouldShowGateTooltip(Gate.Y, beforeY)).toBe(false);
    expect(shouldShowGateTooltip(Gate.Y, [...beforeY, Gate.Y])).toBe(true);
  });

  it("reveals Rx and Ry on 1.13 and 1.14 complete", () => {
    const beforeRx = [Gate.X, Gate.Z, Gate.S, Gate.H, Gate.Y];
    expect(shouldShowGateTooltip(Gate.RX, beforeRx)).toBe(false);
    expect(shouldShowGateTooltip(Gate.RX, [...beforeRx, Gate.RX])).toBe(true);

    const beforeRy = [...beforeRx, Gate.RX];
    expect(shouldShowGateTooltip(Gate.RY, beforeRy)).toBe(false);
    expect(shouldShowGateTooltip(Gate.RY, [...beforeRy, Gate.RY])).toBe(true);
  });

  it("reveals U only after 1.15 (RANDOM_U) complete", () => {
    const beforeU = [Gate.X, Gate.Z, Gate.S, Gate.H, Gate.Y, Gate.RX, Gate.RY];
    expect(shouldShowGateTooltip(Gate.U, beforeU)).toBe(false);
    expect(shouldShowGateTooltip(Gate.U, [...beforeU, Gate.RANDOM_U])).toBe(true);
  });
});

describe("shouldShowGateTooltip — skip reveals same as complete", () => {
  it("skip 1.0 (X): X and retroactive sqrt-X get icons", () => {
    const skipped = [Gate.X];
    expect(shouldShowGateTooltip(Gate.X, [], skipped)).toBe(true);
    expect(shouldShowGateTooltip(Gate.SQRT_X, [], skipped)).toBe(true);
    expect(shouldShowGateTooltip(Gate.RZ, [], skipped)).toBe(false);
    expect(visibleTooltipGates([], skipped).sort()).toEqual([Gate.SQRT_X, Gate.X].sort());
  });

  it("skip 1.6 (S-dag): S-dag and retroactive Rz; not T", () => {
    const skipped = [Gate.S_DAG];
    expect(shouldShowGateTooltip(Gate.S_DAG, [], skipped)).toBe(true);
    expect(shouldShowGateTooltip(Gate.RZ, [], skipped)).toBe(true);
    expect(shouldShowGateTooltip(Gate.T, [], skipped)).toBe(false);
  });

  it("skip does not reveal gates whose milestone was not skipped or completed", () => {
    expect(shouldShowGateTooltip(Gate.Z, [], [Gate.X])).toBe(false);
    expect(shouldShowGateTooltip(Gate.H, [], [Gate.S])).toBe(false);
  });

  it("complete and skip are unioned for reveal", () => {
    expect(shouldShowGateTooltip(Gate.X, [Gate.X], [])).toBe(true);
    expect(shouldShowGateTooltip(Gate.Z, [], [Gate.Z])).toBe(true);
    expect(shouldShowGateTooltip(Gate.Z, [Gate.X], [Gate.Z])).toBe(true);
  });
});

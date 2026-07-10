import { describe, expect, it } from "vitest";

import { LEVEL_ORDER } from "../config/levels";
import { Gate } from "../types/global";
import { computeAvailableGates } from "./computeToolbox";

const TIER1_COUNT = 16;
const ONE_QUBIT = 1;

/** advancedPastLevels at the start of LEVEL_ORDER[index] (all prior levels advanced past). */
function advancedPastAtStart(index: number): string[] {
  return LEVEL_ORDER.slice(0, index).map((l) => l.target_unitary);
}

const TIER1_TOOLBOX_AT_START: Gate[][] = [
  // 1.0
  [Gate.RZ, Gate.SQRT_X],
  // 1.1 — + X
  [Gate.RZ, Gate.SQRT_X, Gate.X],
  // 1.2 — same (SQRT_X_DAG noGatesetUnlock)
  [Gate.RZ, Gate.SQRT_X, Gate.X],
  // 1.3 — same (X_DAG noGatesetUnlock)
  [Gate.RZ, Gate.SQRT_X, Gate.X],
  // 1.4 — + Z
  [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z],
  // 1.5 — same (Z_DAG noGatesetUnlock)
  [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z],
  // 1.6 — + S
  [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z, Gate.S],
  // 1.7 — + S_DAG
  [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z, Gate.S, Gate.S_DAG],
  // 1.8 — + T
  [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z, Gate.S, Gate.S_DAG, Gate.T],
  // 1.9 — + T_DAG
  [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG],
  // 1.10 — + H
  [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG, Gate.H],
  // 1.11 — same (H_DAG noGatesetUnlock)
  [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG, Gate.H],
  // 1.12 — + Y
  [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG, Gate.H, Gate.Y],
  // 1.13 — same (Y_DAG noGatesetUnlock)
  [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG, Gate.H, Gate.Y],
  // 1.14 — + RX
  [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG, Gate.H, Gate.Y, Gate.RX],
  // 1.15 — + RY (RANDOM_U does not add a chip)
  [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG, Gate.H, Gate.Y, Gate.RX, Gate.RY],
];

describe("computeAvailableGates — Tier 1 progression", () => {
  it("matches expected toolbox at the start of each of 16 Tier 1 levels", () => {
    expect(TIER1_TOOLBOX_AT_START).toHaveLength(TIER1_COUNT);

    for (let i = 0; i < TIER1_COUNT; i++) {
      const past = advancedPastAtStart(i);
      const toolbox = computeAvailableGates(past, [], ONE_QUBIT);
      const level = LEVEL_ORDER[i];

      expect(toolbox, `level index ${i} (${level.target_unitary})`).toEqual(
        TIER1_TOOLBOX_AT_START[i],
      );
    }
  });

  it("never includes dagger config-only gates or RANDOM_U", () => {
    const fullPast = LEVEL_ORDER.slice(0, TIER1_COUNT).map((l) => l.target_unitary);
    const toolbox = computeAvailableGates(fullPast, [], ONE_QUBIT);

    expect(toolbox).not.toContain(Gate.SQRT_X_DAG);
    expect(toolbox).not.toContain(Gate.X_DAG);
    expect(toolbox).not.toContain(Gate.Z_DAG);
    expect(toolbox).not.toContain(Gate.H_DAG);
    expect(toolbox).not.toContain(Gate.Y_DAG);
    expect(toolbox).not.toContain(Gate.RANDOM_U);
  });

  it("dagger no-op levels do not grow toolbox vs previous level", () => {
    const noOpIndices = [2, 4, 10, 12]; // X_DAG, Z_DAG, H_DAG, Y_DAG
    for (const i of noOpIndices) {
      const prev = computeAvailableGates(advancedPastAtStart(i), [], ONE_QUBIT);
      const curr = computeAvailableGates(advancedPastAtStart(i + 1), [], ONE_QUBIT);
      expect(curr, `start of level after index ${i - 1}`).toEqual(prev);
    }
  });
});

describe("computeAvailableGates — skip level", () => {
  it("grants a gate when its level is skipped (without advancing past)", () => {
    expect(computeAvailableGates([], [Gate.X], ONE_QUBIT)).toEqual([
      Gate.RZ,
      Gate.SQRT_X,
      Gate.X,
    ]);
  });

  it("does not grant a chip for skipped noGatesetUnlock levels", () => {
    expect(computeAvailableGates([], [Gate.X_DAG], ONE_QUBIT)).toEqual([
      Gate.RZ,
      Gate.SQRT_X,
    ]);
  });

  it("combines skipped and advanced-past without duplicating gates", () => {
    expect(
      computeAvailableGates([Gate.X], [Gate.Z], ONE_QUBIT).sort(),
    ).toEqual([Gate.RZ, Gate.SQRT_X, Gate.X, Gate.Z].sort());
  });
});

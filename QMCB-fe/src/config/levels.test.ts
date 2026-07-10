import { describe, expect, it } from "vitest";

import {
  LEVEL_ORDER,
  TIER2_LEVELS,
  allTier2Complete,
  getGateHeadingLabel,
  getLevelDisplayName,
  getLevelStatus,
  isLevelUnlocked,
} from "./levels";
import { Gate } from "../types/global";

// LEVEL_ORDER[0] = X_LEVEL        (target_unitary: Gate.X)
// LEVEL_ORDER[1] = SQRT_X_DAG_LEVEL (target_unitary: Gate.SQRT_X_DAG)

describe("level skip status", () => {
  it('getLevelStatus returns "skipped" when in skippedLevels but not completedLevels', () => {
    const level = LEVEL_ORDER[1];
    expect(getLevelStatus(1, level, [], [Gate.SQRT_X_DAG])).toBe("skipped");
  });

  it("completed takes precedence over skipped", () => {
    const level = LEVEL_ORDER[1];
    expect(getLevelStatus(1, level, [Gate.SQRT_X_DAG], [Gate.SQRT_X_DAG])).toBe("completed");
  });

  it("isLevelUnlocked opens the next level after a skip", () => {
    // Skipping LEVEL_ORDER[0] (X) should unlock LEVEL_ORDER[1] (SQRT_X_DAG)
    const skippedX = [Gate.X];
    const sqrtXDagLevel = LEVEL_ORDER[1];
    expect(isLevelUnlocked(1, sqrtXDagLevel, [], skippedX)).toBe(true);
  });

  it("does not unlock the next level when the previous is only completed", () => {
    // Completing X without advancing past it does not unlock SQRT_X_DAG
    const sqrtXDagLevel = LEVEL_ORDER[1];
    expect(isLevelUnlocked(1, sqrtXDagLevel, [Gate.X], [], [])).toBe(false);
    expect(getLevelStatus(1, sqrtXDagLevel, [Gate.X], [], [])).toBe("locked");
  });

  it("unlocks the next level when the previous is in advancedPastLevels", () => {
    // Advancing past X unlocks SQRT_X_DAG
    const sqrtXDagLevel = LEVEL_ORDER[1];
    expect(isLevelUnlocked(1, sqrtXDagLevel, [Gate.X], [], [Gate.X])).toBe(true);
    expect(getLevelStatus(1, sqrtXDagLevel, [Gate.X], [], [Gate.X])).toBe("unlocked");
  });

  it("allTier2Complete returns true when Tier 2 levels are skipped", () => {
    const skippedTier2 = TIER2_LEVELS.map((l) => l.target_unitary);
    expect(allTier2Complete([], skippedTier2)).toBe(true);
  });

  it("first Tier 3 level unlocks when all Tier 2 levels are skipped", () => {
    const skippedTier2 = TIER2_LEVELS.map((l) => l.target_unitary);
    const firstTier3Index = LEVEL_ORDER.findIndex((l) => l.number_of_qubits === 3);
    const tier3Level = LEVEL_ORDER[firstTier3Index];
    expect(isLevelUnlocked(firstTier3Index, tier3Level, [], skippedTier2)).toBe(true);
  });
});

describe("getLevelDisplayName", () => {
  it("formats dagger target levels with † labels instead of enum strings", () => {
    const daggerCases: Array<[Gate, string]> = [
      [Gate.SQRT_X_DAG, "√X†"],
      [Gate.X_DAG, "X†"],
      [Gate.Z_DAG, "Z†"],
      [Gate.S_DAG, "S†"],
      [Gate.T_DAG, "T†"],
      [Gate.H_DAG, "H†"],
      [Gate.Y_DAG, "Y†"],
    ];

    for (const [gate, label] of daggerCases) {
      const level = LEVEL_ORDER.find((l) => l.target_unitary === gate);
      expect(level).toBeDefined();
      expect(getLevelDisplayName(level!)).toBe(label);
      expect(getGateHeadingLabel(level!)).toBe(`Gate ${label}`);
    }
  });
});

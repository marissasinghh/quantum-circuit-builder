import { describe, expect, it } from "vitest";

import {
  LEVEL_ORDER,
  TIER2_LEVELS,
  allTier2Complete,
  getLevelStatus,
  isLevelUnlocked,
} from "./levels";
import { Gate } from "../types/global";

describe("level skip status", () => {
  it('getLevelStatus returns "skipped" when in skippedLevels but not completedLevels', () => {
    const level = LEVEL_ORDER[1];
    expect(getLevelStatus(1, level, [], [Gate.S])).toBe("skipped");
  });

  it("completed takes precedence over skipped", () => {
    const level = LEVEL_ORDER[1];
    expect(getLevelStatus(1, level, [Gate.S], [Gate.S])).toBe("completed");
  });

  it("isLevelUnlocked opens the next level after a skip", () => {
    const skippedX = [Gate.X];
    const sLevel = LEVEL_ORDER[1];
    expect(isLevelUnlocked(1, sLevel, [], skippedX)).toBe(true);
  });

  it("does not unlock the next level when the previous is only completed", () => {
    const sLevel = LEVEL_ORDER[1];
    expect(isLevelUnlocked(1, sLevel, [Gate.X], [], [])).toBe(false);
    expect(getLevelStatus(1, sLevel, [Gate.X], [], [])).toBe("locked");
  });

  it("unlocks the next level when the previous is in advancedPastLevels", () => {
    const sLevel = LEVEL_ORDER[1];
    expect(isLevelUnlocked(1, sLevel, [Gate.X], [], [Gate.X])).toBe(true);
    expect(getLevelStatus(1, sLevel, [Gate.X], [], [Gate.X])).toBe("unlocked");
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

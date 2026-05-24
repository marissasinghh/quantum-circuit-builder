/**
 * Persists gate-unlock progression to localStorage.
 * Starting gates: [RZ, SQRT_X]. Each completed level unlocks its target gate.
 */

import { useState, useCallback } from "react";
import { Gate } from "../types/global";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import { LEVEL_PROGRESS_KEY } from "../utils/constants";
const STARTING_GATES: Gate[] = [Gate.RZ, Gate.SQRT_X];

interface ProgressState {
  completedLevels: string[];
  unlockedGates: Gate[];
}

function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProgressState;
  } catch {}
  return { completedLevels: [], unlockedGates: [...STARTING_GATES] };
}

export function useLevelProgress() {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  /**
   * Idempotent: calling this multiple times for the same level is safe.
   * RANDOM_U is a sentinel (not a real toolbox gate) and is skipped for unlock.
   */
  const markLevelComplete = useCallback((level: LevelDefinition) => {
    const levelId = level.target_unitary;
    setProgress((prev) => {
      if (prev.completedLevels.includes(levelId)) return prev;
      const isRealGate = levelId !== Gate.RANDOM_U;
      const alreadyUnlocked = prev.unlockedGates.includes(levelId as Gate);
      const next: ProgressState = {
        completedLevels: [...prev.completedLevels, levelId],
        unlockedGates:
          isRealGate && !alreadyUnlocked
            ? [...prev.unlockedGates, levelId as Gate]
            : prev.unlockedGates,
      };
      localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const fresh: ProgressState = {
      completedLevels: [],
      unlockedGates: [...STARTING_GATES],
    };
    localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(fresh));
    setProgress(fresh);
  }, []);

  return {
    completedLevels: progress.completedLevels,
    unlockedGates: progress.unlockedGates,
    markLevelComplete,
    resetProgress,
  };
}

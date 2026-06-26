/**
 * Persists gate-unlock progression to localStorage.
 * Starting gates: [RZ, SQRT_X]. Each completed level unlocks its target gate.
 */

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Gate } from "../types/global";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import { LEVEL_PROGRESS_KEY } from "../utils/constants";
import { deriveAdvancedPastLevels } from "../config/levels";

const STARTING_GATES: Gate[] = [Gate.RZ, Gate.SQRT_X];

interface ProgressState {
  completedLevels: string[];
  skippedLevels: string[];
  advancedPastLevels: string[];
  unlockedGates: Gate[];
}

function defaultProgress(): ProgressState {
  return {
    completedLevels: [],
    skippedLevels: [],
    advancedPastLevels: [],
    unlockedGates: [...STARTING_GATES],
  };
}

function isValidProgressState(value: unknown): value is ProgressState {
  if (!value || typeof value !== "object") return false;
  const v = value as ProgressState;
  return (
    Array.isArray(v.completedLevels) &&
    v.completedLevels.every((id) => typeof id === "string") &&
    Array.isArray(v.unlockedGates) &&
    (v.skippedLevels === undefined ||
      (Array.isArray(v.skippedLevels) && v.skippedLevels.every((id) => typeof id === "string"))) &&
    (v.advancedPastLevels === undefined ||
      (Array.isArray(v.advancedPastLevels) &&
        v.advancedPastLevels.every((id) => typeof id === "string")))
  );
}

function normalizeProgress(value: ProgressState): ProgressState {
  const skippedLevels = value.skippedLevels ?? [];
  const completedLevels = value.completedLevels;
  return {
    ...value,
    skippedLevels,
    advancedPastLevels:
      value.advancedPastLevels ??
      deriveAdvancedPastLevels(completedLevels, skippedLevels),
  };
}

function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(LEVEL_PROGRESS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidProgressState(parsed)) return normalizeProgress(parsed);
    }
  } catch {}
  return defaultProgress();
}

interface LevelProgressContextValue {
  completedLevels: string[];
  skippedLevels: string[];
  advancedPastLevels: string[];
  unlockedGates: Gate[];
  markLevelComplete: (level: LevelDefinition) => void;
  markLevelSkipped: (level: LevelDefinition) => void;
  advancePastLevel: (level: LevelDefinition) => void;
  unlockGateForLevel: (level: LevelDefinition) => void;
  skipLevel: (level: LevelDefinition) => void;
  resetProgress: () => void;
}

const LevelProgressContext = createContext<LevelProgressContextValue | null>(null);

export function LevelProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  /**
   * Records level completion without updating the toolbox.
   * Idempotent: calling this multiple times for the same level is safe.
   */
  const markLevelComplete = useCallback((level: LevelDefinition) => {
    const levelId = level.target_unitary;
    setProgress((prev) => {
      if (prev.completedLevels.includes(levelId)) return prev;
      const next: ProgressState = {
        ...prev,
        completedLevels: [...prev.completedLevels, levelId],
      };
      localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /**
   * Records that the player skipped a level without marking it completed.
   * Idempotent: calling this multiple times for the same level is safe.
   */
  const markLevelSkipped = useCallback((level: LevelDefinition) => {
    const levelId = level.target_unitary;
    setProgress((prev) => {
      if (prev.skippedLevels.includes(levelId)) return prev;
      const next: ProgressState = {
        ...prev,
        skippedLevels: [...prev.skippedLevels, levelId],
      };
      localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /**
   * Records that the player clicked Next past this level, unlocking the following level.
   * Idempotent: calling this multiple times for the same level is safe.
   */
  const advancePastLevel = useCallback((level: LevelDefinition) => {
    const levelId = level.target_unitary;
    setProgress((prev) => {
      if (prev.advancedPastLevels.includes(levelId)) return prev;
      const next: ProgressState = {
        ...prev,
        advancedPastLevels: [...prev.advancedPastLevels, levelId],
      };
      localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /**
   * Adds the completed level's target gate to the toolbox.
   * RANDOM_U is a sentinel (not a real toolbox gate) and is skipped.
   */
  const unlockGateForLevel = useCallback((level: LevelDefinition) => {
    const levelId = level.target_unitary;
    const isRealGate = levelId !== Gate.RANDOM_U;
    setProgress((prev) => {
      if (!isRealGate || prev.unlockedGates.includes(levelId as Gate)) return prev;
      const next: ProgressState = {
        ...prev,
        unlockedGates: [...prev.unlockedGates, levelId as Gate],
      };
      localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /**
   * Marks a level skipped and unlocks its gate in a single localStorage write.
   */
  const skipLevel = useCallback((level: LevelDefinition) => {
    const levelId = level.target_unitary;
    const isRealGate = levelId !== Gate.RANDOM_U;
    setProgress((prev) => {
      const alreadySkipped = prev.skippedLevels.includes(levelId);
      const gateAlreadyUnlocked = !isRealGate || prev.unlockedGates.includes(levelId as Gate);
      if (alreadySkipped && gateAlreadyUnlocked) return prev;

      const next: ProgressState = {
        ...prev,
        skippedLevels: alreadySkipped ? prev.skippedLevels : [...prev.skippedLevels, levelId],
        unlockedGates:
          gateAlreadyUnlocked || !isRealGate
            ? prev.unlockedGates
            : [...prev.unlockedGates, levelId as Gate],
      };
      localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = defaultProgress();
    localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(fresh));
    setProgress(fresh);
  }, []);

  const value: LevelProgressContextValue = {
    completedLevels: progress.completedLevels,
    skippedLevels: progress.skippedLevels,
    advancedPastLevels: progress.advancedPastLevels,
    unlockedGates: progress.unlockedGates,
    markLevelComplete,
    markLevelSkipped,
    advancePastLevel,
    unlockGateForLevel,
    skipLevel,
    resetProgress,
  };

  return createElement(LevelProgressContext.Provider, { value }, children);
}

export function useLevelProgress(): LevelProgressContextValue {
  const ctx = useContext(LevelProgressContext);
  if (!ctx) {
    throw new Error("useLevelProgress must be used within a LevelProgressProvider");
  }
  return ctx;
}

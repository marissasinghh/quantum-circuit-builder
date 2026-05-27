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

const STARTING_GATES: Gate[] = [Gate.RZ, Gate.SQRT_X];

interface ProgressState {
  completedLevels: string[];
  unlockedGates: Gate[];
}

function defaultProgress(): ProgressState {
  return { completedLevels: [], unlockedGates: [...STARTING_GATES] };
}

function isValidProgressState(value: unknown): value is ProgressState {
  if (!value || typeof value !== "object") return false;
  const v = value as ProgressState;
  return (
    Array.isArray(v.completedLevels) &&
    v.completedLevels.every((id) => typeof id === "string") &&
    Array.isArray(v.unlockedGates)
  );
}

function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(LEVEL_PROGRESS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidProgressState(parsed)) return parsed;
    }
  } catch {}
  return defaultProgress();
}

interface LevelProgressContextValue {
  completedLevels: string[];
  unlockedGates: Gate[];
  markLevelComplete: (level: LevelDefinition) => void;
  resetProgress: () => void;
}

const LevelProgressContext = createContext<LevelProgressContextValue | null>(null);

export function LevelProgressProvider({ children }: { children: ReactNode }) {
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
    const fresh = defaultProgress();
    localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(fresh));
    setProgress(fresh);
  }, []);

  const value: LevelProgressContextValue = {
    completedLevels: progress.completedLevels,
    unlockedGates: progress.unlockedGates,
    markLevelComplete,
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

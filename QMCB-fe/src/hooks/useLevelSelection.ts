/**
 * Manages level selection state.
 * Automatically clears the circuit when switching levels.
 */

import { useState, useCallback } from "react";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import { X_LEVEL } from "../config/levels";

export function useLevelSelection(onLevelChange?: () => void) {
  const [currentLevel, setCurrentLevel] = useState<LevelDefinition>(X_LEVEL);

  const changeLevel = useCallback(
    (newLevel: LevelDefinition) => {
      setCurrentLevel(newLevel);
      onLevelChange?.();
    },
    [onLevelChange]
  );

  return {
    currentLevel,
    changeLevel,
  };
}

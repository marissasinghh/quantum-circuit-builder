/**
 * Persists per-level circuit solutions to localStorage.
 */

import { arityFor } from "../config/gates";
import type { ControlTargetOrder, PlacedGate, SingleWire } from "../types/global";
import { Gate } from "../types/global";
import { LEVEL_SOLUTIONS_KEY } from "./constants";

export type LevelSolutionsMap = Record<string, PlacedGate[]>;

const VALID_GATE_TYPES = new Set<string>(Object.values(Gate));

function isSingleWire(value: unknown): value is SingleWire {
  return value === 0 || value === 1 || value === 2;
}

function isControlTargetOrder(value: unknown): value is ControlTargetOrder {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const [a, b] = value;
  return (a === 0 && b === 1) || (a === 1 && b === 0);
}

export function isValidPlacedGate(value: unknown): value is PlacedGate {
  if (!value || typeof value !== "object") return false;

  const g = value as Record<string, unknown>;
  if (typeof g.id !== "string" || typeof g.type !== "string" || typeof g.column !== "number") {
    return false;
  }
  if (!VALID_GATE_TYPES.has(g.type)) return false;

  const gateType = g.type as Gate;
  const arity = arityFor(gateType);

  if (arity === 1) {
    if (!isSingleWire(g.wire)) return false;
    if ("order" in g && g.order !== undefined) return false;
    if (g.theta !== undefined && typeof g.theta !== "number") return false;
    if (g.isParameterSlot !== undefined && typeof g.isParameterSlot !== "boolean") return false;
    return true;
  }

  if (!isControlTargetOrder(g.order)) return false;
  if ("wire" in g && g.wire !== undefined) return false;
  return true;
}

function isValidLevelSolutionsMap(value: unknown): value is LevelSolutionsMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  return Object.entries(value as Record<string, unknown>).every(
    ([levelId, gates]) =>
      typeof levelId === "string" &&
      Array.isArray(gates) &&
      gates.every((g) => isValidPlacedGate(g))
  );
}

function defaultLevelSolutions(): LevelSolutionsMap {
  return {};
}

export function loadLevelSolutions(): LevelSolutionsMap {
  try {
    const raw = localStorage.getItem(LEVEL_SOLUTIONS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidLevelSolutionsMap(parsed)) return parsed;
    }
  } catch {}
  return defaultLevelSolutions();
}

export function saveLevelSolution(levelId: string, gates: PlacedGate[]): void {
  try {
    const current = loadLevelSolutions();
    const next: LevelSolutionsMap = { ...current, [levelId]: gates };
    localStorage.setItem(LEVEL_SOLUTIONS_KEY, JSON.stringify(next));
  } catch {}
}

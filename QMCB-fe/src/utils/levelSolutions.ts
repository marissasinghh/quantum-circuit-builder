/**
 * Persists per-level circuit solutions to localStorage.
 */

import { arityFor } from "../config/gates";
import type { ControlTargetOrder, PlacedGate, SingleWire, TwoQubitBaseWire } from "../types/global";
import { Gate } from "../types/global";
import { LEVEL_SOLUTIONS_KEY } from "./constants";

export type LevelSolutionsMap = Record<string, PlacedGate[]>;

const VALID_GATE_TYPES = new Set<string>(Object.values(Gate));

function isSingleWire(value: unknown): value is SingleWire {
  return value === 0 || value === 1 || value === 2;
}

function isTwoQubitBaseWire(value: unknown): value is TwoQubitBaseWire {
  return value === 0 || value === 1;
}

function isControlTargetOrder(value: unknown): value is ControlTargetOrder {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const [a, b] = value;
  return (a === 0 && b === 1) || (a === 1 && b === 0);
}

/** Legacy saves may omit baseWire; coerce to 0 before validation. */
function coerceGateRecord(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const g = value as Record<string, unknown>;
  if (!("order" in g) || g.order === undefined) return value;
  if (g.baseWire !== undefined) return value;
  return { ...g, baseWire: 0 };
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
    if ("baseWire" in g && g.baseWire !== undefined) return false;
    if (g.theta !== undefined && typeof g.theta !== "number") return false;
    if (g.isParameterSlot !== undefined && typeof g.isParameterSlot !== "boolean") return false;
    return true;
  }

  if (!isControlTargetOrder(g.order)) return false;
  // Reject the single-qubit `wire` field; 2q placement uses `baseWire` only.
  if ("wire" in g && g.wire !== undefined) return false;
  if (!isTwoQubitBaseWire(g.baseWire)) return false;
  return true;
}

function defaultLevelSolutions(): LevelSolutionsMap {
  return {};
}

export function loadLevelSolutions(): LevelSolutionsMap {
  try {
    const raw = localStorage.getItem(LEVEL_SOLUTIONS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return defaultLevelSolutions();
      }
      const coerced: LevelSolutionsMap = {};
      for (const [levelId, gates] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof levelId !== "string" || !Array.isArray(gates)) {
          return defaultLevelSolutions();
        }
        const nextGates = gates.map((g) => coerceGateRecord(g));
        if (!nextGates.every((g) => isValidPlacedGate(g))) {
          return defaultLevelSolutions();
        }
        coerced[levelId] = nextGates as PlacedGate[];
      }
      return coerced;
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

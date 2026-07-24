/**
 * CIRCUIT UTILITIES:
 * Pure, immutable helpers for building the student’s circuit state.
 * - Invariant: `column` is always re-numbered to 0..n-1 (gapless, sorted left→right).
 * - Serialization returns arrays in column order, matching backend expectations.
 */

import type {
  PlacedGate,
  PlacedSingleQubitGate,
  ControlTargetOrder,
  AnyQubitOrder,
  TwoQubitBaseWire,
} from "../types/global";
import { isValidOrderFor, isTwoQubitToolboxGate } from "../config/gates";
import { Gate } from "../types/global";
import type { UnitaryGateEntry } from "../interfaces/unitary";
import { DEFAULT_QUBIT_ORDER } from "./constants";

/**
 * FE-only dagger aliases that have no backend CirqGateMapper entry.
 * The backend receives the parent gate string instead.
 * (X_DAG, Z_DAG, H_DAG, Y_DAG are pedagogical config-only levels whose
 * target gate is physically identical to the parent — X†=X, etc.)
 */
const DAG_ALIAS_TO_PARENT: Partial<Record<Gate, Gate>> = {
  [Gate.X_DAG]: Gate.X,
  [Gate.Z_DAG]: Gate.Z,
  [Gate.H_DAG]: Gate.H,
  [Gate.Y_DAG]: Gate.Y,
};

/** When set on a placed RX/RY/RZ, the API expects `{"gate","theta"}` instead of a bare string. */
function placedGateToUnitaryEntry(g: PlacedGate): UnitaryGateEntry {
  if ("order" in g) {
    return g.type;
  }
  const effectiveType = DAG_ALIAS_TO_PARENT[g.type] ?? g.type;
  if (
    (effectiveType === Gate.RX || effectiveType === Gate.RY || effectiveType === Gate.RZ) &&
    typeof g.theta === "number"
  ) {
    return { gate: effectiveType, theta: g.theta };
  }
  return effectiveType;
}

/** Return a new array sorted by column (ascending) */
function sortByColumn(gates: PlacedGate[]) {
  return [...gates].sort((a, b) => a.column - b.column);
}

/** Canonical gate sequence for rendering, simulation, and Bloch preview. */
export function gatesInColumnOrder(gates: PlacedGate[]): PlacedGate[] {
  return sortByColumn(gates);
}

/** Normalize columns to 0..n-1 after any change; preserves array order (caller must supply sequence order). */
function renumberColumns(gates: PlacedGate[]): PlacedGate[] {
  return gates.map((g, i) => ({ ...g, column: i }));
}

/**
 * Append a gate at the end of the sequence
 * @param gates current circuit
 * @param gate a fully-specified gate (id/type/order); column is ignored
 * @returns new circuit with normalized columns
 */
export function append(gates: PlacedGate[], gate: PlacedGate): PlacedGate[] {
  const next = { ...gate, column: gates.length };
  return renumberColumns([...gates, next]);
}

/**
 * Insert a new gate at a specific position (0-indexed) in the global sequence.
 * Existing gates at that position and beyond shift right; columns renumber.
 */
export function insertAt(gates: PlacedGate[], gate: PlacedGate, position: number): PlacedGate[] {
  const list = sortByColumn(gates);
  const pos = Math.max(0, Math.min(position, list.length));
  list.splice(pos, 0, { ...gate, column: pos });
  return renumberColumns(list);
}

/** Remove a gate by id and re-number columns */
export function remove(gates: PlacedGate[], id: string): PlacedGate[] {
  return renumberColumns(gates.filter((g) => g.id !== id));
}

/**
 * Move a gate to a target column index (clamped to [0, n])
 * Useful for drag & drop where `to` may be out of bounds
 */
export function moveToColumn(gates: PlacedGate[], id: string, to: number): PlacedGate[] {
  const list = sortByColumn(gates);
  const i = list.findIndex((g) => g.id === id);
  if (i < 0) return gates; // id not found → no-op
  const [item] = list.splice(i, 1);
  const pos = Math.max(0, Math.min(to, list.length));
  list.splice(pos, 0, item);
  return renumberColumns(list);
}

/** Set the control–target order ([0,1] or [1,0]) for a gate */
export function setOrder(gates: PlacedGate[], id: string, order: ControlTargetOrder): PlacedGate[] {
  return gates.map((g) => {
    if (g.id !== id) return g;
    const next = isValidOrderFor(g.type, order) ? order : DEFAULT_QUBIT_ORDER;
    return { ...g, order: next };
  });
}

/** Move a single-qubit gate to a different wire without changing its column. */
export function setWire(
  gates: PlacedGate[],
  id: string,
  wire: PlacedSingleQubitGate["wire"]
): PlacedGate[] {
  return gates.map((g) => (g.id === id && "wire" in g ? { ...g, wire } : g));
}

/** Move a two-qubit gate to a different adjacent pair without changing its column. */
export function setBaseWire(
  gates: PlacedGate[],
  id: string,
  baseWire: TwoQubitBaseWire
): PlacedGate[] {
  return gates.map((g) => (g.id === id && "order" in g ? { ...g, baseWire } : g));
}

/**
 * Reorder a gate and optionally change its vertical placement.
 * - Single-qubit: `wire` updates the `wire` field.
 * - Two-qubit: `wire` is treated as the new `baseWire` (caller maps drop → pair).
 */
export function moveGate(
  gates: PlacedGate[],
  id: string,
  to: number,
  wire?: PlacedSingleQubitGate["wire"] | TwoQubitBaseWire
): PlacedGate[] {
  if (wire === undefined) return moveToColumn(gates, id, to);

  const target = gates.find((g) => g.id === id);
  const withPlacement =
    target && "order" in target
      ? setBaseWire(gates, id, wire === 0 ? 0 : 1)
      : setWire(gates, id, wire as PlacedSingleQubitGate["wire"]);
  return moveToColumn(withPlacement, id, to);
}

/** Reset the circuit to empty */
export function clear(): PlacedGate[] {
  return [];
}

/** Column-ordered `gates[]` for `UnitaryRequestDTO` (strings or `{ gate, theta }`). */
export function serializeUnitaryGateEntries(gates: PlacedGate[]): UnitaryGateEntry[] {
  return sortByColumn(gates).map(placedGateToUnitaryEntry);
}

/** Column-ordered qubit orders for the API request body */
export function serializeOrders(gates: PlacedGate[]): AnyQubitOrder[] {
  return sortByColumn(gates).map((g) => {
    if ("order" in g) {
      // Absolute control/target = baseWire + relative order indices.
      const [relC, relT] = g.order;
      return [g.baseWire + relC, g.baseWire + relT] as AnyQubitOrder;
    }
    // Single-qubit gates: encode wire as [wire, wire]
    return [g.wire, g.wire] as AnyQubitOrder;
  });
}

/**
 * Pre-POST FE guard: catch misclassified 2q chips and equal-index pairs.
 * Returns an error message, or null when the circuit is safe to submit.
 */
export function validateCircuitForSimulate(gates: PlacedGate[]): string | null {
  for (const g of sortByColumn(gates)) {
    // 2q type stored as a 1q placement → serializeOrders would emit [w,w].
    if ("wire" in g && isTwoQubitToolboxGate(g.type as Gate)) {
      return (
        `${g.type} was placed as a single-qubit gate. ` +
        "Remove it and place it again from the toolbox."
      );
    }

    if ("order" in g) {
      const a = g.baseWire + g.order[0];
      const b = g.baseWire + g.order[1];
      if (a === b) {
        return `${g.type}: invalid qubit pair [${a}, ${b}] (control and target must differ).`;
      }
    }

    // Option (a): CU is never a reusable chip; if somehow present, block clearly.
    if (g.type === Gate.CONTROLLED_U) {
      return (
        "CONTROLLED_U cannot be checked from the toolbox (it needs seeded angles). " +
        "Remove it and synthesize Controlled-U with the gates available on this level."
      );
    }
  }
  return null;
}

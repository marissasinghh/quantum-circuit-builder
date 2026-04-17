/**
 * CIRCUIT UTILITIES:
 * Pure, immutable helpers for building the student’s circuit state.
 * - Invariant: `column` is always re-numbered to 0..n-1 (gapless, sorted left→right).
 * - Serialization returns arrays in column order, matching backend expectations.
 */

import type { PlacedGate, ControlTargetOrder, AnyQubitOrder } from "../types/global";
import { isValidOrderFor } from "../config/gates";
import { Gate } from "../types/global";
import type { UnitaryGateEntry } from "../interfaces/unitary";
import { DEFAULT_QUBIT_ORDER } from "./constants";

/** When set on a placed RX/RY, the API expects `{"gate","theta"}` instead of a bare string. */
function placedGateToUnitaryEntry(g: PlacedGate): UnitaryGateEntry {
  if ("order" in g) {
    return g.type;
  }
  if (
    (g.type === Gate.RX || g.type === Gate.RY) &&
    typeof g.theta === "number"
  ) {
    return { gate: g.type, theta: g.theta };
  }
  return g.type;
}

/** Return a new array sorted by column (ascending) */
function sortByColumn(gates: PlacedGate[]) {
  return [...gates].sort((a, b) => a.column - b.column);
}

/** Normalize columns to 0..n-1 after any change */
function renumberColumns(gates: PlacedGate[]): PlacedGate[] {
  return sortByColumn(gates).map((g, i) => ({ ...g, column: i }));
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
      // 2-qubit gates have an order property
      return g.order;
    }
    // Single-qubit gates: encode wire as [wire, wire]
    return [g.wire, g.wire] as const as AnyQubitOrder;
  });
}

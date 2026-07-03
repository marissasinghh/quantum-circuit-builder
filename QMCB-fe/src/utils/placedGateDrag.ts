/**
 * Helpers for placed-gate drag-and-drop (wire containers → global moveGate index).
 */

import { arrayMove } from "@dnd-kit/sortable";

import type { PlacedGate, PlacedSingleQubitGate, SingleWire } from "../types/global";
import { gatesInColumnOrder } from "./circuit";
import { isValidSingleWire } from "./wireValidation";

export type WireContainers = Record<number, string[]>;

export function isToolboxDragId(id: string): boolean {
  return id.startsWith("tool-");
}

export function isPlacedGateId(id: string, gates: PlacedGate[]): boolean {
  return gates.some((g) => g.id === id);
}

export function wireFromDropId(id: string): number | null {
  const match = id.match(/^drop-wire-(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

export function isSingleQubitGate(g: PlacedGate): g is PlacedSingleQubitGate {
  return "wire" in g;
}

/** Gates that live in a single wire's sortable list (not cross-wire draggable). */
export function isMultiQubitGate(g: PlacedGate): boolean {
  return !("wire" in g);
}

/** Wire-0 owns all multi-qubit chips for dnd-kit (one context, no duplication). */
export const MULTI_QUBIT_OWNER_WIRE = 0;

export function sortableOwnerWire(g: PlacedGate): number {
  if (isSingleQubitGate(g)) return g.wire;
  return MULTI_QUBIT_OWNER_WIRE;
}

export function isMultiQubitGateId(id: string, gates: PlacedGate[]): boolean {
  const g = gates.find((gate) => gate.id === id);
  return g !== undefined && isMultiQubitGate(g);
}

/** Per-wire sortable id lists in global column order. Wire 0 also owns all multi-qubit gates. */
export function buildWireContainers(gates: PlacedGate[], numberOfQubits: number): WireContainers {
  const ordered = gatesInColumnOrder(gates);
  const containers: WireContainers = {};
  for (let w = 0; w < numberOfQubits; w++) {
    if (w === MULTI_QUBIT_OWNER_WIRE) {
      containers[w] = ordered
        .filter((g) => isMultiQubitGate(g) || (isSingleQubitGate(g) && g.wire === w))
        .map((g) => g.id);
    } else {
      containers[w] = ordered
        .filter((g): g is PlacedSingleQubitGate => isSingleQubitGate(g) && g.wire === w)
        .map((g) => g.id);
    }
  }
  return containers;
}

function sortableGatesForWire(global: PlacedGate[], targetWire: number): PlacedGate[] {
  if (targetWire === MULTI_QUBIT_OWNER_WIRE) {
    return global.filter((g) => isMultiQubitGate(g) || (isSingleQubitGate(g) && g.wire === 0));
  }
  return global.filter((g): g is PlacedSingleQubitGate => isSingleQubitGate(g) && g.wire === targetWire);
}

export function findWireForGate(containers: WireContainers, gateId: string): number | null {
  for (const [wire, ids] of Object.entries(containers)) {
    if (ids.includes(gateId)) return Number(wire);
  }
  return null;
}

/** Immutable preview move for onDragOver (does not touch circuit state). */
export function moveBetweenContainers(
  containers: WireContainers,
  activeId: string,
  fromWire: number,
  toWire: number,
  overIndex: number
): WireContainers {
  const next: WireContainers = {};
  for (const [wire, ids] of Object.entries(containers)) {
    next[Number(wire)] = [...ids];
  }

  const fromList = next[fromWire] ?? [];
  const fromIndex = fromList.indexOf(activeId);
  if (fromIndex < 0) return containers;

  fromList.splice(fromIndex, 1);
  next[fromWire] = fromList;

  const toList = next[toWire] ?? [];
  const clampedIndex = Math.max(0, Math.min(overIndex, toList.length));
  toList.splice(clampedIndex, 0, activeId);
  next[toWire] = toList;

  return next;
}

/**
 * Returns the index at which activeId should be inserted relative to overId in containerIds.
 * activeId is expected to be absent from containerIds (cross-wire / toolbox drop scenario).
 * Returns containerIds.length when overId is not found (append to end).
 */
export function insertIndexForOver(
  containerIds: string[],
  _activeId: string,
  overId: string
): number {
  const idx = containerIds.indexOf(overId);
  return idx >= 0 ? idx : containerIds.length;
}

/**
 * Immutable helper: move activeId to insertIndex within wire, removing it first if already
 * present. All other wires in containers are left unchanged.
 */
export function insertAtIndex(
  containers: WireContainers,
  wire: number,
  activeId: string,
  insertIndex: number
): WireContainers {
  const list = [...(containers[wire] ?? [])];
  const oldIdx = list.indexOf(activeId);
  if (oldIdx >= 0) list.splice(oldIdx, 1);
  const pos = Math.max(0, Math.min(insertIndex, list.length));
  list.splice(pos, 0, activeId);
  return { ...containers, [wire]: list };
}

/** Convert wire-local insert index to global moveGate `to` (and optional wire for cross-wire). */
export function globalIndexForWireDrop(
  gates: PlacedGate[],
  movedId: string,
  targetWire: number,
  insertIndex: number,
  numberOfQubits: number
): { to: number; wire?: SingleWire } {
  const global = gatesInColumnOrder(gates).filter((g) => g.id !== movedId);
  const inContainer = sortableGatesForWire(global, targetWire);

  const moved = gates.find((g) => g.id === movedId);
  const sameWire =
    moved && isSingleQubitGate(moved) && moved.wire === targetWire;

  let to: number;
  if (insertIndex >= inContainer.length) {
    if (inContainer.length === 0) {
      to = global.length;
    } else {
      const lastInContainer = inContainer[inContainer.length - 1];
      to = global.findIndex((g) => g.id === lastInContainer.id) + 1;
    }
  } else {
    const beforeGate = inContainer[insertIndex];
    to = global.findIndex((g) => g.id === beforeGate.id);
  }

  if (sameWire) {
    return { to };
  }
  if (!isValidSingleWire(targetWire, numberOfQubits)) {
    return { to };
  }
  return { to, wire: targetWire };
}

/** Resolve final insert index from preview containers after a drag. */
export function insertIndexFromContainers(containers: WireContainers, gateId: string): {
  wire: number;
  index: number;
} | null {
  for (const [wire, ids] of Object.entries(containers)) {
    const index = ids.indexOf(gateId);
    if (index >= 0) return { wire: Number(wire), index };
  }
  return null;
}

export function reorderWithinContainer(
  containers: WireContainers,
  wire: number,
  activeId: string,
  overId: string
): WireContainers {
  const list = [...(containers[wire] ?? [])];
  const oldIndex = list.indexOf(activeId);
  const newIndex = list.indexOf(overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return containers;
  return { ...containers, [wire]: arrayMove(list, oldIndex, newIndex) };
}

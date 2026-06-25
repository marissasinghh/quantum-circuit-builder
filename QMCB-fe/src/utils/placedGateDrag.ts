/**
 * Helpers for placed-gate drag-and-drop (wire containers → global moveGate index).
 */

import { arrayMove } from "@dnd-kit/sortable";

import type { PlacedGate, PlacedSingleQubitGate, SingleWire } from "../types/global";
import { gatesInColumnOrder } from "./circuit";

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

/** Per-wire lists of 1q gate ids sorted by global column (2q gates excluded). */
export function buildWireContainers(gates: PlacedGate[], numberOfQubits: number): WireContainers {
  const ordered = gatesInColumnOrder(gates);
  const containers: WireContainers = {};
  for (let w = 0; w < numberOfQubits; w++) {
    containers[w] = ordered.filter((g): g is PlacedSingleQubitGate => isSingleQubitGate(g) && g.wire === w).map((g) => g.id);
  }
  return containers;
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

export function insertIndexForOver(
  containerIds: string[],
  activeId: string,
  overId: string
): number {
  const overIndex = containerIds.indexOf(overId);
  if (overIndex < 0) return containerIds.length;

  const activeIndex = containerIds.indexOf(activeId);
  if (activeIndex >= 0 && activeIndex < overIndex) {
    return overIndex;
  }
  return overIndex;
}

/** Convert wire-local insert index to global moveGate `to` (and optional wire for cross-wire). */
export function globalIndexForWireDrop(
  gates: PlacedGate[],
  movedId: string,
  targetWire: number,
  insertIndex: number
): { to: number; wire?: SingleWire } {
  const global = gatesInColumnOrder(gates).filter((g) => g.id !== movedId);
  const onWire = global.filter((g): g is PlacedSingleQubitGate => isSingleQubitGate(g) && g.wire === targetWire);

  const moved = gates.find((g) => g.id === movedId);
  const sameWire = moved && isSingleQubitGate(moved) && moved.wire === targetWire;

  let to: number;
  if (insertIndex >= onWire.length) {
    if (onWire.length === 0) {
      to = global.length;
    } else {
      const lastOnWire = onWire[onWire.length - 1];
      to = global.findIndex((g) => g.id === lastOnWire.id) + 1;
    }
  } else {
    const beforeGate = onWire[insertIndex];
    to = global.findIndex((g) => g.id === beforeGate.id);
  }

  if (sameWire) {
    return { to };
  }
  return { to, wire: targetWire as SingleWire };
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

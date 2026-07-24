/**
 * Custom dnd-kit collision detection for the discrete grid-cell canvas.
 *
 * Cell droppables have IDs of the form `cell-col{N}-wire{W}`.
 * One cell exists per (column-slot × wire) combination.
 *
 * Strategy:
 *   1. Trash can wins when the pointer is physically inside its bounding rect.
 *   2. Column (X): pick the cell whose 2D centre is closest to the pointer
 *      (same as before for every gate type).
 *   3. Wire (Y):
 *      - Single-qubit / unknown: use that nearest cell's wire (unchanged).
 *      - Two-qubit: ignore grab height on the glyph; pick the adjacent pair
 *        whose vertical midpoint is closest to the pointer Y, then return the
 *        cell for that column + the pair's top wire (baseWire). Downstream
 *        `baseWireFromDropWire` still applies and is a no-op when fed the
 *        pair top index.
 *
 * Flip / relative `order` never participates — grab point only mattered under
 * the old nearest-single-wire rule.
 */

import type { Active, CollisionDetection } from "@dnd-kit/core";
import { TOOL_TO_GATE } from "../config/gateUiConfig";
import { isTwoQubitToolboxGate } from "../config/gates";

const CELL_ID_RE = /^cell-col(\d+)-wire(\d+)$/;

/** True when the active drag should use pair-midpoint Y targeting. */
export function isTwoQubitActiveDrag(active: Active | null | undefined): boolean {
  if (!active) return false;
  const data = active.data.current as { multiQubit?: boolean } | undefined;
  if (data?.multiQubit === true) return true;
  if (data?.multiQubit === false) return false;
  const gate = TOOL_TO_GATE[String(active.id)];
  return gate != null && isTwoQubitToolboxGate(gate);
}

/**
 * Among adjacent wire pairs, return the baseWire (top index) whose midpoint
 * Y is closest to `pointerY`. Ties prefer the lower baseWire (pair 0–1).
 */
export function resolvePairBaseWireFromPointerY(
  pointerY: number,
  wireCentersY: readonly number[]
): number {
  const n = wireCentersY.length;
  if (n < 2) return 0;

  let bestBase = 0;
  let bestDist = Infinity;
  for (let base = 0; base <= n - 2; base++) {
    const mid = (wireCentersY[base]! + wireCentersY[base + 1]!) / 2;
    const dist = Math.abs(pointerY - mid);
    if (dist < bestDist) {
      bestDist = dist;
      bestBase = base;
    }
  }
  return bestBase;
}

function parseCellId(id: string): { col: number; wire: number } | null {
  const m = id.match(CELL_ID_RE);
  if (!m) return null;
  return { col: parseInt(m[1], 10), wire: parseInt(m[2], 10) };
}

export const cellFirstCollision: CollisionDetection = ({
  active,
  droppableContainers,
  droppableRects,
  pointerCoordinates,
}) => {
  if (!pointerCoordinates) return [];

  // Trash can wins if the pointer is inside its bounding rect.
  const trashContainer = droppableContainers.find(
    (c) => String(c.id) === "trash-can"
  );
  if (trashContainer) {
    const r = droppableRects.get(trashContainer.id);
    if (
      r &&
      pointerCoordinates.x >= r.left &&
      pointerCoordinates.x <= r.right &&
      pointerCoordinates.y >= r.top &&
      pointerCoordinates.y <= r.bottom
    ) {
      return [{ id: trashContainer.id }];
    }
  }

  const cells = droppableContainers.filter((c) =>
    CELL_ID_RE.test(String(c.id))
  );
  if (cells.length === 0) return [];

  // Nearest cell by 2D centre — also supplies the column for 2q pair targeting.
  let closestId: string | null = null;
  let minDist = Infinity;

  for (const cell of cells) {
    const rect = droppableRects.get(cell.id);
    if (!rect) continue;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = pointerCoordinates.x - cx;
    const dy = pointerCoordinates.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      closestId = String(cell.id);
    }
  }

  if (!closestId) return [];

  if (!isTwoQubitActiveDrag(active)) {
    return [{ id: closestId }];
  }

  const nearest = parseCellId(closestId);
  if (!nearest) return [{ id: closestId }];

  // Wire-centre Ys for this column (sorted by wire index).
  const wireCenterByIndex = new Map<number, number>();
  for (const cell of cells) {
    const parsed = parseCellId(String(cell.id));
    if (!parsed || parsed.col !== nearest.col) continue;
    const rect = droppableRects.get(cell.id);
    if (!rect) continue;
    wireCenterByIndex.set(parsed.wire, rect.top + rect.height / 2);
  }

  const maxWire = Math.max(...wireCenterByIndex.keys(), -1);
  if (maxWire < 0) return [{ id: closestId }];

  const wireCentersY: number[] = [];
  for (let w = 0; w <= maxWire; w++) {
    const cy = wireCenterByIndex.get(w);
    if (cy === undefined) return [{ id: closestId }];
    wireCentersY.push(cy);
  }

  const baseWire = resolvePairBaseWireFromPointerY(
    pointerCoordinates.y,
    wireCentersY
  );
  return [{ id: `cell-col${nearest.col}-wire${baseWire}` }];
};

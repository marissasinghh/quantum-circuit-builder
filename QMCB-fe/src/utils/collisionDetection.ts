/**
 * Custom dnd-kit collision detection for the discrete grid-cell canvas.
 *
 * Cell droppables have IDs of the form `cell-col{N}-wire{W}`.
 * One cell exists per (column-slot × wire) combination.
 *
 * Strategy:
 *   1. Trash can wins when the pointer is physically inside its bounding rect.
 *   2. All other droppables are grid cells.  Pick the cell whose 2D centre
 *      (Euclidean distance) is closest to the pointer.
 *
 * Why 2D nearest-centre vs y-only (old wireFirstCollision):
 *   - 2D gives correct results for multi-qubit gates whose visual footprint
 *     spans two wires — either wire's cell is an acceptable target, and the
 *     one physically closest to the pointer wins.
 *   - No special multi-qubit filtering is needed: onDragEnd ignores the wire
 *     component for multi-qubit gates and uses only the column.
 */

import type { CollisionDetection } from "@dnd-kit/core";

export const cellFirstCollision: CollisionDetection = ({
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

  // Among cell droppables, pick the one whose 2D centre is nearest the pointer.
  const cells = droppableContainers.filter((c) =>
    /^cell-col\d+-wire\d+$/.test(String(c.id))
  );
  if (cells.length === 0) return [];

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
  return [{ id: closestId }];
};

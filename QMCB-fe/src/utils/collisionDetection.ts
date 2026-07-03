/**
 * Custom dnd-kit collision detection that replaces closestCenter for the circuit canvas.
 *
 * Problem with closestCenter: every placed gate chip registers as a droppable via useSortable,
 * so the strip's "winning zone" shrinks to a narrow geometric band that doesn't track the pointer.
 *
 * Fix: ignore chips entirely. Only wire strips (drop-wire-N) and the trash can compete.
 * - Trash can wins when the pointer is physically inside it.
 * - Otherwise the strip whose y-centre is closest to the pointer wins.
 * This guarantees DroppableStrip.isOver is always true for exactly one wire (or trash),
 * giving a consistent full-width indicator regardless of gate count.
 */

import type { CollisionDetection } from "@dnd-kit/core";

export const wireFirstCollision: CollisionDetection = ({
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

  // Among wire strips, pick the one whose y-centre is closest to the pointer.
  const strips = droppableContainers.filter((c) =>
    /^drop-wire-\d+$/.test(String(c.id))
  );
  if (strips.length === 0) return [];

  let closestId: string | null = null;
  let minDist = Infinity;

  for (const strip of strips) {
    const rect = droppableRects.get(strip.id);
    if (!rect) continue;
    const centerY = rect.top + rect.height / 2;
    const dist = Math.abs(pointerCoordinates.y - centerY);
    if (dist < minDist) {
      minDist = dist;
      closestId = String(strip.id);
    }
  }

  if (!closestId) return [];
  return [{ id: closestId }];
};

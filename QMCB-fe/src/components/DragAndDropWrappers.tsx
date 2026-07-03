import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

/** Wrap any toolbox glyph to make it draggable by id. */
export function DraggableTool({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
      aria-label={`drag ${id}`}
    >
      {children}
    </div>
  );
}

/**
 * A measurable droppable strip (absolute inside a relatively positioned container).
 *
 * Visual state is driven by the `isActiveTarget` prop rather than dnd-kit's own
 * `isOver` flag.  With the wireFirstCollision strategy, `isOver` is always correct
 * (the strip wins over chips), but we make the data flow explicit so the indicator
 * and the functional drop path share the same computed {wire, index} source of truth.
 * useDroppable is still called so dnd-kit can measure the strip's bounding rect
 * (used by wireFirstCollision and by onDragMove to compute canvas-relative x).
 */
export function DroppableStrip({
  id,
  top,
  height,
  isActiveTarget = false,
}: {
  id: string;
  top: number;
  height: number;
  isActiveTarget?: boolean;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        height,
        outline: isActiveTarget ? "2px dashed #7dc4e0" : "none",
        outlineOffset: 2,
      }}
    />
  );
}

interface TrashDropZoneProps {
  visible: boolean;
}

export function TrashDropZone({ visible }: TrashDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "trash-can" });

  return (
    <div
      ref={setNodeRef}
      className={[
        "absolute bottom-3 right-3 z-30 flex items-center justify-center w-12 h-12 rounded-panel border-2 transition-all duration-200",
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        isOver
          ? "border-error-action bg-error-action/20 scale-110"
          : "border-tier2 bg-bg-elevated/90",
      ].join(" ")}
      aria-label="Drop gate here to remove"
      aria-hidden={!visible}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={isOver ? "text-error-action" : "text-tier2"}
        aria-hidden
      >
        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
      </svg>
    </div>
  );
}

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

/** A measurable droppable strip (absolute inside a relatively positioned container). */
export function DroppableStrip({ id, top, height }: { id: string; top: number; height: number }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        height,
        outline: isOver ? "2px dashed #7dc4e0" : "none",
        outlineOffset: 2,
      }}
    />
  );
}

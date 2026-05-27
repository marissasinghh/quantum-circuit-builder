import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

/** Wrap any toolbox glyph to make it draggable by id. */
export function DraggableTool({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  return (
    <div className="relative inline-block">
      {/* static visual */}
      <div>{children}</div>
      {/* invisible drag handle that sits on top */}
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ background: "transparent" }}
        aria-label={`drag ${id}`}
      />
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
        outline: isOver ? "2px dashed #4fc3f7" : "none",
        outlineOffset: 2,
      }}
    />
  );
}

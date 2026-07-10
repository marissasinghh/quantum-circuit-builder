/**
 * Drag-and-drop logic for the circuit canvas (grid-cell model).
 *
 * Architecture:
 * - The canvas is divided into a discrete grid of droppable cells, one per
 *   (column-slot × wire) combination, with IDs like `cell-col2-wire1`.
 * - cellFirstCollision resolves every drag to the nearest cell centre (2D),
 *   so `over.id` is always a cell ID or "trash-can" — never a chip.
 * - onDragMove/onDragOver record whichever cell is currently hovered.
 * - onDragEnd reads the final cell ID directly; no coordinate math is needed.
 *   For placed-gate reorders: moveGate(id, col, wire).  Wire is ignored for
 *   multi-qubit gates, which use moveGate(id, col) only.
 * - For toolbox drags the wire is read from the cell; gates are still appended
 *   to the end of the sequence (position-aware insertion is Phase 2+).
 *
 * Structural guarantee re: "wire change without column change":
 *   If the user drags a gate vertically with no horizontal movement, the
 *   pointer stays over the same column slot → the cell ID encodes the same
 *   col value → moveGate(id, col, newWire) calls moveToColumn with `to`
 *   equal to the gate's current index → renumberColumns leaves it in place.
 *   The only thing that changes is the wire field. This is structural, not
 *   incidental: the cell column directly becomes the `to` argument.
 */

import { useState, useCallback, useRef } from "react";
import type { DragEndEvent, DragMoveEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import {
  Gate,
  type TwoQubitGate,
  type SingleQubitGate,
  type PlacedGate,
  type SingleWire,
} from "../types/global";
import { isToolboxDragId, isPlacedGateId } from "../utils/placedGateDrag";
import { isValidSingleWire } from "../utils/wireValidation";
import { TOOL_TO_GATE } from "../config/gateUiConfig";

const TWO_QUBIT_GATES = new Set<Gate>([
  Gate.CNOT,
  Gate.CNOT_FLIPPED,
  Gate.CONTROLLED_Z,
  Gate.SWAP,
]);

// ── Cell ID parsing ───────────────────────────────────────────────────────────

/**
 * Parse a cell droppable ID of the form `cell-col{N}-wire{W}`.
 * Returns null for any other ID (trash-can, legacy strip IDs, etc.).
 */
function parseCellId(id: string): { col: number; wire: number } | null {
  const m = id.match(/^cell-col(\d+)-wire(\d+)$/);
  if (!m) return null;
  return { col: parseInt(m[1], 10), wire: parseInt(m[2], 10) };
}

/** Returns true when the placed gate has no `wire` field (i.e. it's a multi-qubit gate). */
function isMultiQubitPlacedGate(id: string, gates: PlacedGate[]): boolean {
  const g = gates.find((gate) => gate.id === id);
  return g !== undefined && !("wire" in g);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDragAndDrop(
  gates: PlacedGate[],
  numberOfQubits: number,
  addSingleQubitGate: (gate: SingleQubitGate, wire: SingleWire, column?: number) => void,
  addTwoQubitGate: (gate: TwoQubitGate, column?: number) => void,
  moveGate: (id: string, to: number, wire?: SingleWire) => void,
  removeGate: (id: string) => void
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);

  // Ref-backed mirror of hoveredCellId so onDragEnd always reads the latest
  // value without a stale closure (React state updates are async).
  const hoveredCellRef = useRef<string | null>(null);

  const isDraggingPlacedGate = activeId !== null && isPlacedGateId(activeId, gates);

  // ── helpers ────────────────────────────────────────────────────────────────

  const updateHoveredCell = useCallback((overId: string | null) => {
    if (overId === hoveredCellRef.current) return;
    hoveredCellRef.current = overId;
    setHoveredCellId(overId);
  }, []);

  // ── drag start ─────────────────────────────────────────────────────────────

  const onDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    hoveredCellRef.current = null;
    setHoveredCellId(null);
  }, []);

  // ── drag move (every pointer move) ────────────────────────────────────────
  //
  // event.over is the droppable resolved by cellFirstCollision at this frame.
  // We just record it; no coordinate math needed here.

  const onDragMove = useCallback(
    (event: DragMoveEvent) => {
      updateHoveredCell(event.over?.id ? String(event.over.id) : null);
    },
    [updateHoveredCell]
  );

  // ── drag over (fires when over changes) ───────────────────────────────────

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      updateHoveredCell(event.over?.id ? String(event.over.id) : null);
    },
    [updateHoveredCell]
  );

  // ── drag cancel ───────────────────────────────────────────────────────────

  const onDragCancel = useCallback(() => {
    setActiveId(null);
    setHoveredCellId(null);
    hoveredCellRef.current = null;
  }, []);

  // ── drag end ──────────────────────────────────────────────────────────────

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const id = String(event.active.id);
      // Prefer the ref over event.over so we never get a stale value even if
      // the pointer lifted before the last onDragMove state flush.
      const overId = hoveredCellRef.current ?? (event.over?.id ? String(event.over.id) : null);

      setActiveId(null);
      setHoveredCellId(null);
      hoveredCellRef.current = null;

      if (!overId) return;

      // ── trash can ────────────────────────────────────────────────────────

      if (overId === "trash-can") {
        if (isPlacedGateId(id, gates)) removeGate(id);
        return;
      }

      // ── parse cell ───────────────────────────────────────────────────────

      const cell = parseCellId(overId);
      if (!cell) return;

      const { col, wire } = cell;

      // ── placed gate reorder ──────────────────────────────────────────────

      if (isPlacedGateId(id, gates)) {
        if (isMultiQubitPlacedGate(id, gates)) {
          // Multi-qubit gates have no wire field; only column matters.
          moveGate(id, col);
        } else {
          // Single-qubit gate: both column and wire come straight from the cell.
          // isValidSingleWire narrows `wire` to SingleWire for the type system.
          if (isValidSingleWire(wire, numberOfQubits)) {
            moveGate(id, col, wire);
          } else {
            moveGate(id, col);
          }
        }
        return;
      }

      // ── toolbox gate placement ────────────────────────────────────────────

      if (!isToolboxDragId(id)) return;

      const gateType = TOOL_TO_GATE[id];
      if (!gateType) return;

      if (TWO_QUBIT_GATES.has(gateType)) {
        addTwoQubitGate(gateType as TwoQubitGate, col);
      } else if (isValidSingleWire(wire, numberOfQubits)) {
        addSingleQubitGate(gateType as SingleQubitGate, wire, col);
      }
    },
    [gates, numberOfQubits, moveGate, removeGate, addTwoQubitGate, addSingleQubitGate]
  );

  return {
    activeId,
    hoveredCellId,
    isDraggingPlacedGate,
    onDragStart,
    onDragOver,
    onDragMove,
    onDragCancel,
    onDragEnd,
  };
}

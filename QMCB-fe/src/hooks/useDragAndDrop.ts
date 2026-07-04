/**
 * Handles drag-and-drop logic for placing gates on the circuit and reordering placed gates.
 *
 * Architecture (post coordinate-based collision overhaul):
 * - wireFirstCollision (collisionDetection.ts) returns only the y-closest DroppableStrip,
 *   so over.id is always "drop-wire-N" or "trash-can" — never a chip.
 * - onDragMove fires on every pointer move. It computes {wire, index} directly from pointer
 *   x-coordinates (canvas-relative) and updates:
 *     1. dropTarget (shared state → drives indicator via activeTargetWire)
 *     2. dragContainers (preview chip ordering → drives order-based chip positions in canvas)
 *   Both are derived from the same pointer position, so they always agree.
 * - onDragEnd consumes lastDropTargetRef (a ref, not state, to avoid stale-closure) for the
 *   final committed placement.
 * - onDragOver is kept as a no-op for backward compatibility with callers.
 */

import { useState, useCallback, useRef } from "react";
import type { DragEndEvent, DragMoveEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { Gate, type TwoQubitGate, type SingleQubitGate, type PlacedGate, type SingleWire } from "../types/global";
import {
  isToolboxDragId,
  isPlacedGateId,
  buildWireContainers,
  findWireForGate,
  moveBetweenContainers,
  insertAtIndex,
  globalIndexForWireDrop,
  insertIndexFromContainers,
  wireFromDropId,
  isMultiQubitGateId,
  isSingleQubitGate,
  MULTI_QUBIT_OWNER_WIRE,
  type WireContainers,
} from "../utils/placedGateDrag";
import { isValidSingleWire } from "../utils/wireValidation";
import { CANVAS_PAD_X, CANVAS_COL_W } from "../utils/canvasGeometry";

const TOOL_TO_GATE: Record<string, Gate> = {
  "tool-x": Gate.X,
  "tool-sqrt-x": Gate.SQRT_X,
  "tool-cnot": Gate.CNOT,
  "tool-cnot-flipped": Gate.CNOT_FLIPPED,
  "tool-cz": Gate.CONTROLLED_Z,
  "tool-swap": Gate.SWAP,
  "tool-h": Gate.H,
  "tool-t": Gate.T,
  "tool-s": Gate.S,
  "tool-rx": Gate.RX,
  "tool-ry": Gate.RY,
  "tool-rz": Gate.RZ,
  "tool-u": Gate.U,
};

const TWO_QUBIT_GATES = new Set<Gate>([Gate.CNOT, Gate.CNOT_FLIPPED, Gate.CONTROLLED_Z, Gate.SWAP]);

interface DropTarget {
  wire: number;
  index: number;
}

export function useDragAndDrop(
  gates: PlacedGate[],
  numberOfQubits: number,
  addSingleQubitGate: (gate: SingleQubitGate, wire: SingleWire) => void,
  addTwoQubitGate: (gate: TwoQubitGate) => void,
  moveGate: (id: string, to: number, wire?: SingleWire) => void,
  removeGate: (id: string) => void
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragContainers, setDragContainers] = useState<WireContainers | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Ref-backed mirror of dropTarget so onDragEnd can read the latest value
  // without a stale closure (state updates are async; refs are synchronous).
  const lastDropTargetRef = useRef<DropTarget | null>(null);

  const isDraggingPlacedGate = activeId !== null && isPlacedGateId(activeId, gates);

  // ── drag start ──────────────────────────────────────────────────────────

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setActiveId(id);
      setDropTarget(null);
      lastDropTargetRef.current = null;
      if (isPlacedGateId(id, gates)) {
        setDragContainers(buildWireContainers(gates, numberOfQubits));
      }
    },
    [gates, numberOfQubits]
  );

  // ── drag move (fires on every pointer move) ──────────────────────────────
  //
  // Computes {wire, index} directly from pointer x/y coordinates — completely
  // independent of which chip droppable closestCenter would have chosen.
  //
  // Wire  = determined by wireFirstCollision already (over.id = "drop-wire-N")
  // Index = pointer x vs committed gate column positions on that wire

  const onDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { active, over } = event;

      if (!over) {
        if (lastDropTargetRef.current !== null) {
          lastDropTargetRef.current = null;
          setDropTarget(null);
        }
        return;
      }

      const activeGateId = String(active.id);
      const overId = String(over.id);

      if (overId === "trash-can") {
        if (lastDropTargetRef.current !== null) {
          lastDropTargetRef.current = null;
          setDropTarget(null);
        }
        return;
      }

      const targetWire = wireFromDropId(overId);
      if (targetWire === null) return;

      // Pointer x relative to the canvas left edge.
      // over.rect is the DroppableStrip's viewport rect; its left edge IS the canvas left edge
      // (strip uses left:0 / right:0 inside div.relative).  This stays correct even when the
      // canvas panel is scrolled horizontally because getBoundingClientRect() updates live.
      const activeRect = active.rect.current.translated;
      if (!activeRect) return;
      const activeCenterX = (activeRect.left + activeRect.right) / 2;
      const pointerCanvasX = activeCenterX - over.rect.left;

      // Gates on target wire (committed state, excluding the active gate itself).
      const targetWireGates = gates.filter((g) => {
        if (g.id === activeGateId) return false;
        if (isSingleQubitGate(g)) return g.wire === targetWire;
        return targetWire === MULTI_QUBIT_OWNER_WIRE;
      });

      // Insertion index: insert before the first chip whose centre is to the right of the pointer.
      const sortedColumns = targetWireGates
        .map((g) => g.column)
        .sort((a, b) => a - b);
      let insertionIndex = sortedColumns.length;
      for (let i = 0; i < sortedColumns.length; i++) {
        if (pointerCanvasX < CANVAS_PAD_X + (sortedColumns[i] - 0.5) * CANVAS_COL_W) {
          insertionIndex = i;
          break;
        }
      }

      // Dedup: skip state updates when nothing changed (avoids thrashing renders
      // on every pixel move when the effective slot hasn't changed).
      const prev = lastDropTargetRef.current;
      if (prev?.wire === targetWire && prev?.index === insertionIndex) return;

      lastDropTargetRef.current = { wire: targetWire, index: insertionIndex };
      setDropTarget({ wire: targetWire, index: insertionIndex });

      // dragContainers preview: only meaningful for placed-gate reorders/moves.
      if (!isPlacedGateId(activeGateId, gates)) return;
      if (isMultiQubitGateId(activeGateId, gates) && targetWire !== MULTI_QUBIT_OWNER_WIRE) return;

      // Always rebuild from committed gate state for a fresh, deterministic preview.
      setDragContainers(() => {
        const fresh = buildWireContainers(gates, numberOfQubits);
        const fromWire = findWireForGate(fresh, activeGateId);
        if (fromWire === null) return fresh;
        if (fromWire === targetWire) {
          return insertAtIndex(fresh, targetWire, activeGateId, insertionIndex);
        }
        return moveBetweenContainers(fresh, activeGateId, fromWire, targetWire, insertionIndex);
      });
    },
    [gates, numberOfQubits]
  );

  // ── drag over (no-op; all logic moved to onDragMove) ─────────────────────

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onDragOver = useCallback((_event: DragOverEvent) => {
    // Intentionally empty. Coordinate-based targeting is handled in onDragMove.
  }, []);

  // ── drag cancel ──────────────────────────────────────────────────────────

  const onDragCancel = useCallback(() => {
    setActiveId(null);
    setDragContainers(null);
    setDropTarget(null);
    lastDropTargetRef.current = null;
  }, []);

  // ── drag end ─────────────────────────────────────────────────────────────

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const id = String(event.active.id);
      const overId = event.over?.id ? String(event.over.id) : undefined;

      setActiveId(null);
      setDragContainers(null);

      // Read the last computed drop target from the ref (not state) to avoid
      // stale-closure issues with React's async state scheduling.
      const target: DropTarget | null = (() => {
        if (lastDropTargetRef.current) return lastDropTargetRef.current;
        // Fallback: strip id encodes the wire; append to end of that wire.
        const dropWire = overId ? wireFromDropId(overId) : null;
        if (dropWire !== null) {
          const fresh = buildWireContainers(gates, numberOfQubits);
          return { wire: dropWire, index: fresh[dropWire]?.length ?? 0 };
        }
        return null;
      })();

      setDropTarget(null);
      lastDropTargetRef.current = null;

      if (!overId) return;

      // ── placed gate ────────────────────────────────────────────────────

      if (isPlacedGateId(id, gates)) {
        if (overId === "trash-can") {
          removeGate(id);
          return;
        }

        if (!target) return;

        const containers = buildWireContainers(gates, numberOfQubits);
        const fromWire = findWireForGate(containers, id);
        if (fromWire === null) return;

        let finalContainers: WireContainers;
        if (isMultiQubitGateId(id, gates) && target.wire !== MULTI_QUBIT_OWNER_WIRE) {
          finalContainers = containers;
        } else if (fromWire === target.wire) {
          finalContainers = insertAtIndex(containers, target.wire, id, target.index);
        } else {
          finalContainers = moveBetweenContainers(
            containers,
            id,
            fromWire,
            target.wire,
            target.index
          );
        }

        const placement = insertIndexFromContainers(finalContainers, id);
        if (placement) {
          const { to, wire } = globalIndexForWireDrop(
            gates,
            id,
            placement.wire,
            placement.index,
            numberOfQubits
          );
          if (wire !== undefined && !isMultiQubitGateId(id, gates)) {
            moveGate(id, to, wire);
          } else {
            moveGate(id, to);
          }
        }

        return;
      }

      // ── toolbox gate ───────────────────────────────────────────────────

      if (!isToolboxDragId(id)) return;

      // Wire from lastDropTargetRef (most accurate) or from strip id in overId.
      const wire =
        target?.wire ??
        (overId ? wireFromDropId(overId) : null);
      if (wire === null || wire === undefined) return;

      const gateType = TOOL_TO_GATE[id];
      if (!gateType) return;

      if (TWO_QUBIT_GATES.has(gateType)) {
        addTwoQubitGate(gateType as TwoQubitGate);
      } else if (isValidSingleWire(wire, numberOfQubits)) {
        addSingleQubitGate(gateType as SingleQubitGate, wire);
      }
    },
    [gates, numberOfQubits, moveGate, removeGate, addTwoQubitGate, addSingleQubitGate]
  );

  // activeTargetWire is consumed by CircuitCanvas → DroppableStrip for the indicator.
  const activeTargetWire = dropTarget?.wire ?? null;

  return {
    activeId,
    dragContainers,
    isDraggingPlacedGate,
    activeTargetWire,
    onDragStart,
    onDragOver,
    onDragMove,
    onDragCancel,
    onDragEnd,
  };
}

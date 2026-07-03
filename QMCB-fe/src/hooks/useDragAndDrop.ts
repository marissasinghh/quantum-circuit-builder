/**
 * Handles drag-and-drop logic for placing gates on the circuit and reordering placed gates.
 */

import { useState, useCallback } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { Gate, type TwoQubitGate, type SingleQubitGate, type PlacedGate, type SingleWire } from "../types/global";
import {
  isToolboxDragId,
  isPlacedGateId,
  buildWireContainers,
  findWireForGate,
  moveBetweenContainers,
  insertIndexForOver,
  globalIndexForWireDrop,
  insertIndexFromContainers,
  reorderWithinContainer,
  wireFromDropId,
  isMultiQubitGateId,
  MULTI_QUBIT_OWNER_WIRE,
  type WireContainers,
} from "../utils/placedGateDrag";
import { isValidSingleWire } from "../utils/wireValidation";

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

  const isDraggingPlacedGate = activeId !== null && isPlacedGateId(activeId, gates);

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setActiveId(id);
      if (isPlacedGateId(id, gates)) {
        setDragContainers(buildWireContainers(gates, numberOfQubits));
      }
    },
    [gates, numberOfQubits]
  );

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || !dragContainers) return;

      const activeGateId = String(active.id);
      if (!isPlacedGateId(activeGateId, gates)) return;

      const overId = String(over.id);
      if (overId === "trash-can") return;

      const fromWire = findWireForGate(dragContainers, activeGateId);
      if (fromWire === null) return;

      let toWire: number | null = null;
      let overIndex: number | null = null;

      const dropWire = wireFromDropId(overId);
      if (dropWire !== null) {
        toWire = dropWire;
        overIndex = (dragContainers[toWire] ?? []).length;
      } else if (isPlacedGateId(overId, gates)) {
        toWire = findWireForGate(dragContainers, overId);
        if (toWire === null) return;
        const containerIds = dragContainers[toWire] ?? [];
        overIndex = insertIndexForOver(containerIds, activeGateId, overId);
      }

      if (toWire === null || overIndex === null) return;

      if (isMultiQubitGateId(activeGateId, gates) && toWire !== MULTI_QUBIT_OWNER_WIRE) return;

      setDragContainers((prev) => {
        if (!prev) return prev;
        if (fromWire === toWire && isPlacedGateId(overId, gates)) {
          return reorderWithinContainer(prev, toWire, activeGateId, overId);
        }
        if (isMultiQubitGateId(activeGateId, gates) && toWire !== fromWire) return prev;
        return moveBetweenContainers(prev, activeGateId, fromWire, toWire, overIndex);
      });
    },
    [dragContainers, gates]
  );

  const onDragCancel = useCallback(() => {
    setActiveId(null);
    setDragContainers(null);
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const id = String(event.active.id);
      const overId = event.over?.id ? String(event.over.id) : undefined;

      setActiveId(null);

      if (!overId) {
        setDragContainers(null);
        return;
      }

      if (isPlacedGateId(id, gates)) {
        if (overId === "trash-can") {
          removeGate(id);
          setDragContainers(null);
          return;
        }

        // Always rebuild from committed gate state so the result is deterministic
        // regardless of whether onDragOver's setDragContainers has committed yet.
        let containers = buildWireContainers(gates, numberOfQubits);
        const dropWire = wireFromDropId(overId);
        if (dropWire !== null) {
          const fromWire = findWireForGate(containers, id);
          if (
            fromWire !== null &&
            !(isMultiQubitGateId(id, gates) && dropWire !== MULTI_QUBIT_OWNER_WIRE)
          ) {
            containers = moveBetweenContainers(
              containers,
              id,
              fromWire,
              dropWire,
              containers[dropWire]?.length ?? 0
            );
          }
        } else if (isPlacedGateId(overId, gates)) {
          const toWire = findWireForGate(containers, overId);
          const fromWire = findWireForGate(containers, id);
          if (toWire !== null && fromWire !== null) {
            if (isMultiQubitGateId(id, gates) && toWire !== MULTI_QUBIT_OWNER_WIRE) {
              // multi-qubit gates reorder only within wire-0 ownership context
            } else {
              const overIndex = insertIndexForOver(containers[toWire] ?? [], id, overId);
              if (fromWire === toWire) {
                containers = reorderWithinContainer(containers, toWire, id, overId);
              } else if (!isMultiQubitGateId(id, gates)) {
                containers = moveBetweenContainers(containers, id, fromWire, toWire, overIndex);
              }
            }
          }
        }

        const placement = insertIndexFromContainers(containers, id);

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

        setDragContainers(null);
        return;
      }

      setDragContainers(null);

      if (!isToolboxDragId(id)) return;

      // Resolve target wire from drop-wire-N OR from a placed gate chip that
      // closestCenter selected instead of the DroppableStrip (dead-zone fix).
      let wire: number | undefined;
      const wireMatch = overId.match(/^drop-wire-(\d+)$/);
      if (wireMatch) {
        wire = parseInt(wireMatch[1], 10);
      } else if (isPlacedGateId(overId, gates)) {
        const overGate = gates.find((g) => g.id === overId);
        if (overGate && "wire" in overGate) {
          wire = overGate.wire;
        }
        // multi-qubit chip has no single wire — leave wire undefined → no-op
      }

      if (wire === undefined) return;

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

  return {
    activeId,
    dragContainers,
    isDraggingPlacedGate,
    onDragStart,
    onDragOver,
    onDragCancel,
    onDragEnd,
  };
}

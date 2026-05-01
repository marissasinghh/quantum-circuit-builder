/**
 * Handles drag-and-drop logic for placing gates on the circuit.
 */

import { useState, useCallback } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { Gate, type TwoQubitGate, type SingleQubitGate } from "../types/global";

// Map drag tool IDs to gate types
const TOOL_TO_GATE: Record<string, Gate> = {
  "tool-cnot": Gate.CNOT,
  "tool-cnot-flipped": Gate.CNOT_FLIPPED,
  "tool-cz": Gate.CONTROLLED_Z,
  "tool-swap": Gate.SWAP,
  "tool-h": Gate.H,
  "tool-t": Gate.T,
  "tool-s": Gate.S,
  "tool-rx": Gate.RX,
  "tool-ry": Gate.RY,
  "tool-u": Gate.U,
};

// 2-qubit gates
const TWO_QUBIT_GATES = new Set<Gate>([Gate.CNOT, Gate.CNOT_FLIPPED, Gate.CONTROLLED_Z, Gate.SWAP]);

export function useDragAndDrop(
  addSingleQubitGate: (gate: SingleQubitGate, wire: 0 | 1) => void,
  addTwoQubitGate: (gate: TwoQubitGate) => void
) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const id = String(event.active.id);
      const overId = event.over?.id ? String(event.over.id) : undefined;
      if (!overId) return;

      // Determine which wire was dropped on by parsing "drop-wire-N" → N
      const wireMatch = overId.match(/^drop-wire-(\d+)$/);
      if (!wireMatch) return;
      const wire = parseInt(wireMatch[1], 10) as 0 | 1;

      // Get gate type from tool ID
      const gateType = TOOL_TO_GATE[id];
      if (!gateType) return;

      // Handle 2-qubit vs single-qubit gates
      if (TWO_QUBIT_GATES.has(gateType)) {
        addTwoQubitGate(gateType as TwoQubitGate);
      } else {
        addSingleQubitGate(gateType as SingleQubitGate, wire);
      }
    },
    [addTwoQubitGate, addSingleQubitGate]
  );

  return {
    activeId,
    setActiveId,
    onDragEnd,
  };
}

/**
 * Computes speculative gate positions for the live drag preview.
 *
 * During a placed-gate drag, calls the same moveGate logic that onDragEnd
 * will call on commit, so the preview and final placement always agree.
 * During a toolbox drag, calls the same insertAt logic that onDragEnd uses
 * to spawn, on a local copy — neighbors slide to make room without mutating
 * real gates[] state. The temp insert id is omitted from the returned Map
 * (DragOverlay already shows the dragged glyph).
 *
 * Returns a Map<id, gate> of existing gates at their speculative positions,
 * or null when no valid preview is available (not dragging, hovering over a
 * non-cell zone such as the trash can, unknown tool id, invalid 1q wire, etc.).
 *
 * Mirrors onDragEnd's multi-qubit / isValidSingleWire guards exactly.
 */

import { useMemo } from "react";
import { insertAt, moveGate } from "../utils/circuit";
import { isPlacedGateId, isSingleQubitGate, isToolboxDragId } from "../utils/placedGateDrag";
import { isValidSingleWire, baseWireFromDropWire } from "../utils/wireValidation";
import { isTwoQubitToolboxGate, isThreeQubitToolboxGate } from "../config/gates";
import { TOOL_TO_GATE } from "../config/gateUiConfig";
import { DEFAULT_QUBIT_ORDER, DEFAULT_THREE_QUBIT_ORDER } from "../utils/constants";
import type { PlacedGate, SingleQubitGate, SingleWire } from "../types/global";

const CELL_RE = /^cell-col(\d+)-wire(\d+)$/;

/** Stable id for the hypothetical insert; never present in real gates[]. */
const TOOLBOX_PREVIEW_ID = "preview-toolbox";

export function useCircuitPreview(
  gates: PlacedGate[],
  activeId: string | null,
  hoveredCellId: string | null,
  numberOfQubits: number
): Map<string, PlacedGate> | null {
  return useMemo(() => {
    if (!activeId || !hoveredCellId) return null;

    if (isPlacedGateId(activeId, gates)) {
      const m = hoveredCellId.match(CELL_RE);
      if (!m) return null;
      const col = parseInt(m[1], 10);
      const wire = parseInt(m[2], 10);

      const activeGate = gates.find((g) => g.id === activeId);
      const isMulti = activeGate !== undefined && !isSingleQubitGate(activeGate);

      const speculative = isMulti
        ? moveGate(gates, activeId, col, baseWireFromDropWire(wire, numberOfQubits))
        : isValidSingleWire(wire as SingleWire, numberOfQubits)
          ? moveGate(gates, activeId, col, wire as SingleWire)
          : moveGate(gates, activeId, col);

      return new Map(speculative.map((g) => [g.id, g]));
    }

    if (isToolboxDragId(activeId)) {
      const m = hoveredCellId.match(CELL_RE);
      if (!m) return null;
      const col = parseInt(m[1], 10);
      const wire = parseInt(m[2], 10);

      const gateType = TOOL_TO_GATE[activeId];
      if (!gateType) return null;

      let temp: PlacedGate;
      if (isThreeQubitToolboxGate(gateType)) {
        temp = {
          id: TOOLBOX_PREVIEW_ID,
          type: gateType,
          order: DEFAULT_THREE_QUBIT_ORDER,
          column: 0,
        };
      } else if (isTwoQubitToolboxGate(gateType)) {
        temp = {
          id: TOOLBOX_PREVIEW_ID,
          type: gateType,
          order: DEFAULT_QUBIT_ORDER,
          baseWire: baseWireFromDropWire(wire, numberOfQubits),
          column: 0,
        };
      } else if (isValidSingleWire(wire, numberOfQubits)) {
        temp = {
          id: TOOLBOX_PREVIEW_ID,
          type: gateType as SingleQubitGate,
          wire,
          column: 0,
        };
      } else {
        return null;
      }

      const speculative = insertAt(gates, temp, col);
      return new Map(
        speculative.filter((g) => g.id !== TOOLBOX_PREVIEW_ID).map((g) => [g.id, g]),
      );
    }

    return null;
  }, [gates, activeId, hoveredCellId, numberOfQubits]);
}

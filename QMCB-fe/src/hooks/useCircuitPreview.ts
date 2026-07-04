/**
 * Computes speculative gate positions for the live drag preview.
 *
 * During a placed-gate drag, calls the same moveGate logic that onDragEnd
 * will call on commit, so the preview and final placement always agree.
 * Returns a Map<id, gate> of every gate at its speculative position,
 * or null when no valid preview is available (not dragging, toolbox drag,
 * hovering over a non-cell zone such as the trash can, etc.).
 *
 * Mirrors onDragEnd's multi-qubit / isValidSingleWire guards exactly.
 */

import { useMemo } from "react";
import { moveGate } from "../utils/circuit";
import { isPlacedGateId, isSingleQubitGate } from "../utils/placedGateDrag";
import { isValidSingleWire } from "../utils/wireValidation";
import type { PlacedGate, SingleWire } from "../types/global";

const CELL_RE = /^cell-col(\d+)-wire(\d+)$/;

export function useCircuitPreview(
  gates: PlacedGate[],
  activeId: string | null,
  hoveredCellId: string | null,
  numberOfQubits: number
): Map<string, PlacedGate> | null {
  return useMemo(() => {
    if (!activeId || !hoveredCellId) return null;
    if (!isPlacedGateId(activeId, gates)) return null;

    const m = hoveredCellId.match(CELL_RE);
    if (!m) return null;
    const col = parseInt(m[1], 10);
    const wire = parseInt(m[2], 10);

    const activeGate = gates.find((g) => g.id === activeId);
    const isMulti = activeGate !== undefined && !isSingleQubitGate(activeGate);

    const speculative = isMulti
      ? moveGate(gates, activeId, col)
      : isValidSingleWire(wire as SingleWire, numberOfQubits)
        ? moveGate(gates, activeId, col, wire as SingleWire)
        : moveGate(gates, activeId, col);

    return new Map(speculative.map((g) => [g.id, g]));
  }, [gates, activeId, hoveredCellId, numberOfQubits]);
}

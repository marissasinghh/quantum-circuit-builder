/**
 * Toolbox gate chip: draggable label + optional insight "i" outside the drag handle.
 * Keeps dnd-kit listeners off the tooltip so the icon stays visible and clickable.
 */

import { useDraggable } from "@dnd-kit/core";
import { Gate } from "../types/global";
import { GATE_TOOLTIPS, shouldShowGateTooltip } from "../config/gateTooltips";
import { GateDisplayLabel } from "./GateDisplayLabel";
import { Tooltip } from "./Tooltip";

/** Shared toolbox chip chrome — one label style for every gate (matches Rz / √X / X). */
export const TOOLBOX_CHIP_CLASS =
  "relative grid grid-cols-[1fr_auto] items-center bg-bg-elevated border border-tier1 rounded px-2 py-1.5 hover:border-tier2 shrink-0 min-w-[72px] min-h-[36px] sm:min-w-0 sm:w-full overflow-visible";

export const TOOLBOX_CHIP_LABEL_CLASS =
  "font-mono font-medium text-[13px] text-tier3 leading-tight select-none";

interface ToolboxDraggableChipProps {
  gate: Gate;
  toolId: string;
  completedLevels: readonly string[];
  skippedLevels: readonly string[];
  tooltipIdPrefix?: string;
}

export function ToolboxDraggableChip({
  gate,
  toolId,
  completedLevels,
  skippedLevels,
  tooltipIdPrefix = "gate",
}: ToolboxDraggableChipProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef } = useDraggable({
    id: toolId,
  });
  const tooltipCfg = GATE_TOOLTIPS[gate];
  const showTooltip =
    tooltipCfg != null &&
    shouldShowGateTooltip(gate, completedLevels, skippedLevels);

  return (
    <div
      ref={setNodeRef}
      className={TOOLBOX_CHIP_CLASS}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className="flex items-center min-w-0 cursor-grab active:cursor-grabbing select-none [@media(pointer:coarse)]:touch-none"
        aria-label={`drag ${toolId}`}
      >
        <GateDisplayLabel gate={gate} className={TOOLBOX_CHIP_LABEL_CLASS} />
      </div>
      {showTooltip && (
        <div className="shrink-0 flex items-center justify-center pl-1 self-center">
          <Tooltip id={`${tooltipIdPrefix}-${gate}`} variant="inline">
            {tooltipCfg.content}
          </Tooltip>
        </div>
      )}
    </div>
  );
}

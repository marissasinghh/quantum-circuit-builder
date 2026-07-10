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
  "relative flex items-center bg-bg-elevated border border-tier1 rounded px-2 py-1.5 hover:border-tier2 shrink-0 min-w-[72px] min-h-[36px] sm:min-w-0 sm:w-full";

export const TOOLBOX_CHIP_LABEL_CLASS =
  "font-mono font-medium text-[13px] text-tier3 leading-tight pr-4 select-none";

interface ToolboxDraggableChipProps {
  gate: Gate;
  toolId: string;
  completedLevels: readonly string[];
  tooltipIdPrefix?: string;
}

export function ToolboxDraggableChip({
  gate,
  toolId,
  completedLevels,
  tooltipIdPrefix = "gate",
}: ToolboxDraggableChipProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: toolId });
  const tooltipCfg = GATE_TOOLTIPS[gate];
  const showTooltip = tooltipCfg != null && shouldShowGateTooltip(gate, completedLevels);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={`${TOOLBOX_CHIP_CLASS} overflow-visible`}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <div
        {...listeners}
        className="flex flex-1 items-center min-w-0 cursor-grab active:cursor-grabbing select-none [@media(pointer:coarse)]:touch-none"
        aria-label={`drag ${toolId}`}
      >
        <GateDisplayLabel gate={gate} className={TOOLBOX_CHIP_LABEL_CLASS} />
      </div>
      {showTooltip && (
        <Tooltip id={`${tooltipIdPrefix}-${gate}`}>{tooltipCfg.content}</Tooltip>
      )}
    </div>
  );
}

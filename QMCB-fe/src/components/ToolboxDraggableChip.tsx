/**
 * Toolbox gate chip: draggable label/glyph + optional insight "i" outside the drag handle.
 * Keeps dnd-kit listeners off the tooltip so the icon stays visible and clickable.
 */

import { useDraggable } from "@dnd-kit/core";
import { Gate } from "../types/global";
import { GATE_TOOLTIPS, shouldShowGateTooltip } from "../config/gateTooltips";
import { isTwoQubitToolboxGate } from "../config/gates";
import { CNOTGlyph, ControlledZGlyph, SwapGlyph } from "./GateDesign";
import { GateDisplayLabel } from "./GateDisplayLabel";
import { Tooltip } from "./Tooltip";

/** Shared chrome; height applied separately for single vs two-qubit tiles. */
export const TOOLBOX_CHIP_CLASS =
  "relative grid grid-cols-[1fr_auto] items-center bg-bg-elevated border border-tier1 rounded px-1 py-0.5 hover:border-tier2 shrink-0 min-w-[48px] sm:min-w-0 sm:w-full overflow-visible";

const TOOLBOX_CHIP_SINGLE_H = "h-[56px] min-h-[56px]";
const TOOLBOX_CHIP_TWO_Q_H = "h-[60px] min-h-[60px]";

export const TOOLBOX_CHIP_LABEL_CLASS =
  "font-mono font-medium text-[15px] text-tier3 leading-tight select-none";

/** Compact glyph footprint so symbols don't dominate the row. */
const TOOLBOX_GLYPH_W = 40;
const TOOLBOX_GLYPH_H = 48;

/** Gates that render a circuit glyph instead of a text label. */
function isGlyphToolboxGate(gate: Gate): boolean {
  return (
    gate === Gate.CNOT ||
    gate === Gate.CNOT_FLIPPED ||
    gate === Gate.CONTROLLED_Z ||
    gate === Gate.SWAP
  );
}

interface ToolboxDraggableChipProps {
  gate: Gate;
  toolId: string;
  completedLevels: readonly string[];
  skippedLevels: readonly string[];
  tooltipIdPrefix?: string;
}

function ToolboxGateContent({ gate }: { gate: Gate }) {
  switch (gate) {
    case Gate.CNOT:
    case Gate.CNOT_FLIPPED:
      return <CNOTGlyph order={[0, 1]} width={TOOLBOX_GLYPH_W} height={TOOLBOX_GLYPH_H} />;
    case Gate.CONTROLLED_Z:
      return <ControlledZGlyph order={[0, 1]} width={TOOLBOX_GLYPH_W} height={TOOLBOX_GLYPH_H} />;
    case Gate.SWAP:
      return (
        <SwapGlyph
          order={[0, 1]}
          width={TOOLBOX_GLYPH_W}
          height={TOOLBOX_GLYPH_H}
          primaryMarkSize={5}
          secondaryMarkSize={4}
        />
      );
    default:
      return <GateDisplayLabel gate={gate} className={TOOLBOX_CHIP_LABEL_CLASS} />;
  }
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
    data: { type: "toolbox", multiQubit: isTwoQubitToolboxGate(gate) },
  });
  const tooltipCfg = GATE_TOOLTIPS[gate];
  const showTooltip =
    tooltipCfg != null &&
    shouldShowGateTooltip(gate, completedLevels, skippedLevels);
  const heightClass = isGlyphToolboxGate(gate) ? TOOLBOX_CHIP_TWO_Q_H : TOOLBOX_CHIP_SINGLE_H;

  return (
    <div
      ref={setNodeRef}
      className={`${TOOLBOX_CHIP_CLASS} ${heightClass}`}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className="flex items-center justify-center min-w-0 h-full cursor-grab active:cursor-grabbing select-none [@media(pointer:coarse)]:touch-none"
        aria-label={`drag ${toolId}`}
      >
        <ToolboxGateContent gate={gate} />
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

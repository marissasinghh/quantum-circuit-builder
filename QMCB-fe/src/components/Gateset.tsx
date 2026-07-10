/**
 * Gateset: contains draggable gate components.
 */

import { Gate } from "../types/global";
import { BASIS_0, BASIS_1 } from "../utils/constants";
import { useLevelProgress } from "../hooks/useLevelProgress";
import { TooltipMath } from "./Tooltip";
import SuperpositionTable from "./SuperpositionTable";
import { GATE_UI_CONFIG } from "../config/gateUiConfig";
import { ToolboxDraggableChip } from "./ToolboxDraggableChip";

interface GatesetProps {
  availableGates: readonly Gate[];
  activeId: string | null;
  numberOfQubits: number;
}

export const BLOCH_SPHERE_TOOLTIP = (
  <>
    Every possible state of a single qubit lives somewhere on this sphere. The north pole is{" "}
    <TooltipMath>|0⟩</TooltipMath>, the south pole is <TooltipMath>|1⟩</TooltipMath>, and the
    equator is where superpositions live — <TooltipMath>|+⟩</TooltipMath>,{" "}
    <TooltipMath>|−⟩</TooltipMath>, <TooltipMath>|i⟩</TooltipMath>, and{" "}
    <TooltipMath>|−i⟩</TooltipMath>.
    <SuperpositionTable compact />
  </>
);

const blochToggleBtn = (active: boolean) =>
  `font-mono text-[10px] px-2 py-0.5 rounded-gate border transition-colors ${
    active
      ? "bg-bg-hover text-tier3 border-tier3/40"
      : "text-text-muted border-tier1 hover:border-tier2"
  }`;

/** Bloch sphere section header */
export function BlochSphereHeader() {
  return (
    <p className="panel-heading mb-2 w-full text-left">
      BLOCH SPHERE
    </p>
  );
}

/** Bloch basis toggle — rendered above the sphere in the right panel */
export function BlochPreviewToggle({
  initialState,
  onSelect0,
  onSelect1,
}: {
  initialState: 0 | 1;
  onSelect0: () => void;
  onSelect1: () => void;
}) {
  return (
    <div className="flex items-center gap-2 w-full mt-1.5">
      <span className="font-sans text-[11px] text-tier2 shrink-0">Preview from:</span>
      <button type="button" onClick={onSelect0} className={blochToggleBtn(initialState === 0)}>
        {BASIS_0}
      </button>
      <button type="button" onClick={onSelect1} className={blochToggleBtn(initialState === 1)}>
        {BASIS_1}
      </button>
    </div>
  );
}

export function Gateset({ availableGates, numberOfQubits }: GatesetProps) {
  const { completedLevels, skippedLevels } = useLevelProgress();

  return (
    <div className="relative shrink-0 min-w-0">
      <h2 className="panel-heading mb-2">
        GATESET
      </h2>
      <div className="flex flex-nowrap overflow-x-auto gap-2 pb-1 shrink-0 min-w-0 sm:grid sm:grid-cols-2 sm:max-h-[160px] sm:overflow-y-auto sm:pb-0">
        {availableGates.map((gate) => {
          const config = GATE_UI_CONFIG[gate];
          if (!config) return null;

          return (
            <ToolboxDraggableChip
              key={gate}
              gate={gate}
              toolId={config.toolId}
              completedLevels={completedLevels}
              skippedLevels={skippedLevels}
            />
          );
        })}
      </div>
      <p className="mt-2 font-sans text-xs text-text-muted leading-relaxed">
        {numberOfQubits === 1
          ? "Drag a gate onto the wires."
          : "Drag a gate onto the wires. For 2-qubit gates, set the order after placement."}
      </p>
    </div>
  );
}

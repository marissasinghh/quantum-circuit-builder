/**
 * Gateset: contains draggable gate components.
 */

import type { ReactNode } from "react";
import { Gate } from "../types/global";
import { GatesetCNOTGlyph } from "./GateDesign";
import { BASIS_0, BASIS_1 } from "../utils/constants";
import { useLevelProgress } from "../hooks/useLevelProgress";
import { DraggableTool } from "./DragAndDropWrappers";
import { Tooltip, TooltipMath } from "./Tooltip";
import SuperpositionTable from "./SuperpositionTable";

interface GatesetProps {
  availableGates: readonly Gate[];
  activeId: string | null;
  numberOfQubits: number;
}

const GATE_CONFIG = {
  [Gate.X]: {
    label: "X",
    description: "Pauli bit flip",
    toolId: "tool-x",
  },
  [Gate.SQRT_X]: {
    label: "√X",
    description: "Sqrt_X gate",
    toolId: "tool-sqrt-x",
  },
  [Gate.CNOT]: {
    label: "CNOT",
    description: "Controlled NOT gate",
    toolId: "tool-cnot",
  },
  [Gate.CNOT_FLIPPED]: {
    label: "CNOT↕",
    description: "Flipped control & target",
    toolId: "tool-cnot-flipped",
  },
  [Gate.CONTROLLED_Z]: {
    label: "CZ",
    description: "Controlled phase on |11⟩",
    toolId: "tool-cz",
  },
  [Gate.SWAP]: {
    label: "SWAP",
    description: "Exchange two qubits",
    toolId: "tool-swap",
  },
  [Gate.S]: {
    label: "S",
    description: "π/2 phase on |1⟩",
    toolId: "tool-s",
  },
  [Gate.T]: {
    label: "T",
    description: "π/4 phase on |1⟩",
    toolId: "tool-t",
  },
  [Gate.H]: {
    label: "H",
    description: "Hadamard superposition",
    toolId: "tool-h",
  },
  [Gate.RX]: {
    label: "Rx(θ)",
    description: "Rotate around X axis",
    toolId: "tool-rx",
  },
  [Gate.RY]: {
    label: "Ry(θ)",
    description: "Rotate around Y axis",
    toolId: "tool-ry",
  },
  [Gate.RZ]: {
    label: "Rz(θ)",
    description: "Rotate around Z axis",
    toolId: "tool-rz",
  },
  [Gate.U]: {
    label: "U",
    description: "General single-qubit unitary",
    toolId: "tool-u",
  },
  [Gate.CONTROLLED_H]: {
    label: "CH",
    description: "Controlled Hadamard",
    toolId: "tool-ch",
  },
  [Gate.CONTROLLED_U]: {
    label: "CU",
    description: "Controlled unitary",
    toolId: "tool-cu",
  },
} as const;

const GATE_GLYPHS: Partial<Record<Gate, ReactNode>> = {
  [Gate.CNOT]: <GatesetCNOTGlyph order={[0, 1]} />,
  [Gate.CNOT_FLIPPED]: <GatesetCNOTGlyph order={[1, 0]} />,
};

const GATE_TOOLTIPS: Partial<Record<Gate, { content: ReactNode; gatedBy?: Gate }>> = {
  [Gate.SQRT_X]: {
    content: (
      <>
        Rotates the state vector around the X axis by 90°. This is your main tool for moving a
        state off the Z axis and into superposition.
      </>
    ),
    gatedBy: Gate.X,
  },
  [Gate.RZ]: {
    content: (
      <>
        Rotates the state vector around the Z axis by angle <TooltipMath>θ</TooltipMath>. This
        changes the phase of your qubit without moving it off the Z axis if you start at a pole.
        Adjust <TooltipMath>θ</TooltipMath> using the slider after placing it on the wire.
      </>
    ),
    gatedBy: Gate.S,
  },
  [Gate.H]: {
    content: (
      <>
        Sends <TooltipMath>|0⟩</TooltipMath> to <TooltipMath>|+⟩</TooltipMath> and{" "}
        <TooltipMath>|1⟩</TooltipMath> to <TooltipMath>|−⟩</TooltipMath>. It is a combination of
        rotations that lands you exactly on the equator of the Bloch sphere.
      </>
    ),
  },
  [Gate.S]: {
    content: (
      <>
        Rotates the state vector around the Z axis by 90° (<TooltipMath>π/2</TooltipMath>). A
        quarter turn of phase — useful for fine-tuning where on the equator your state ends up.
      </>
    ),
  },
  [Gate.T]: {
    content: (
      <>
        Rotates the state vector around the Z axis by 45° (<TooltipMath>π/4</TooltipMath>). Half of
        what the S gate does — handy for precision phase adjustments.
      </>
    ),
  },
  [Gate.RX]: {
    content: (
      <>
        Rotates the state vector around the X axis by angle <TooltipMath>θ</TooltipMath>. Adjust{" "}
        <TooltipMath>θ</TooltipMath> using the slider after placing it on the wire.
      </>
    ),
  },
  [Gate.RY]: {
    content: (
      <>
        Rotates the state vector around the Y axis by angle <TooltipMath>θ</TooltipMath>. Adjust{" "}
        <TooltipMath>θ</TooltipMath> using the slider after placing it on the wire.
      </>
    ),
  },
  [Gate.CNOT]: {
    content: (
      <>
        A two-qubit gate. If the control qubit is <TooltipMath>|1⟩</TooltipMath>, it flips the
        target qubit. The Bloch sphere only visualizes single-qubit states, so watch the truth
        table for this one.
      </>
    ),
  },
  [Gate.CONTROLLED_Z]: {
    content: (
      <>
        A two-qubit gate. Applies a phase flip to the target qubit when both qubits are{" "}
        <TooltipMath>|1⟩</TooltipMath>. Check the truth table to see its effect.
      </>
    ),
  },
  [Gate.SWAP]: {
    content: (
      <>
        Exchanges the states of two qubits. Whatever qubit 0 was holding, qubit 1 now has, and vice
        versa.
      </>
    ),
  },
};

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

function shouldShowGateTooltip(gate: Gate, completed: string[]): boolean {
  const cfg = GATE_TOOLTIPS[gate];
  if (!cfg) return false;
  if (cfg.gatedBy) return completed.includes(cfg.gatedBy);
  return true;
}

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
  const { completedLevels } = useLevelProgress();

  return (
    <div className="relative shrink-0 min-w-0">
      <h2 className="panel-heading mb-2">
        GATESET
      </h2>
      <div className="flex flex-nowrap overflow-x-auto gap-2 pb-1 shrink-0 min-w-0 sm:grid sm:grid-cols-2 sm:max-h-[160px] sm:overflow-y-auto sm:overflow-x-hidden sm:pb-0">
        {availableGates.map((gate) => {
          const config = GATE_CONFIG[gate as keyof typeof GATE_CONFIG];
          if (!config) return null;

          const tooltipCfg = GATE_TOOLTIPS[gate];

          return (
            <DraggableTool
              key={gate}
              id={config.toolId}
              className="relative flex items-center bg-bg-elevated border border-tier1 rounded px-2 py-1.5 hover:border-tier2 shrink-0 min-w-[72px] sm:min-w-0 sm:w-full"
            >
              {GATE_GLYPHS[gate] != null ? (
                <span
                  draggable={false}
                  className="inline-flex items-center pointer-events-none select-none pr-4"
                >
                  {GATE_GLYPHS[gate]}
                </span>
              ) : (
                <span
                  draggable={false}
                  className="font-mono font-medium text-[13px] text-tier3 leading-tight pr-4 pointer-events-none select-none"
                >
                  {config.label}
                </span>
              )}
              {tooltipCfg && shouldShowGateTooltip(gate, completedLevels) && (
                <Tooltip id={`gate-${gate}`}>{tooltipCfg.content}</Tooltip>
              )}
            </DraggableTool>
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

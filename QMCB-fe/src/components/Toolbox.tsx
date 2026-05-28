/**
 * Toolbox: contains draggable gate components.
 */

import { Gate } from "../types/global";
import { BASIS_0, BASIS_1 } from "../utils/constants";
import { useLevelProgress } from "../hooks/useLevelProgress";
import { DraggableTool } from "./DragAndDropWrappers";
import { Tooltip } from "./Tooltip";

interface ToolboxProps {
  availableGates: readonly Gate[];
  activeId: string | null;
}

const GATE_CONFIG = {
  [Gate.X]: {
    label: "X",
    description: "Pauli bit flip",
    toolId: "tool-x",
  },
  [Gate.SQRT_X]: {
    label: "√X",
    description: "Square-root of X",
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

const GATE_TOOLTIPS: Partial<Record<Gate, { text: string; gatedBy?: Gate }>> = {
  [Gate.SQRT_X]: {
    text: "Rotates the state vector around the X axis by 90°. This is your main tool for moving a state off the Z axis and into superposition.",
    gatedBy: Gate.X,
  },
  [Gate.RZ]: {
    text: "Rotates the state vector around the Z axis by angle θ. This changes the phase of your qubit without moving it off the Z axis if you start at a pole. Adjust θ using the slider after placing it on the wire.",
    gatedBy: Gate.S,
  },
  [Gate.H]: {
    text: "Sends |0⟩ to |+⟩ and |1⟩ to |−⟩. It is a combination of rotations that lands you exactly on the equator of the Bloch sphere.",
  },
  [Gate.S]: {
    text: "Rotates the state vector around the Z axis by 90° (π/2). A quarter turn of phase — useful for fine-tuning where on the equator your state ends up.",
  },
  [Gate.T]: {
    text: "Rotates the state vector around the Z axis by 45° (π/4). Half of what the S gate does — handy for precision phase adjustments.",
  },
  [Gate.RX]: {
    text: "Rotates the state vector around the X axis by angle θ. Adjust θ using the slider after placing it on the wire.",
  },
  [Gate.RY]: {
    text: "Rotates the state vector around the Y axis by angle θ. Adjust θ using the slider after placing it on the wire.",
  },
  [Gate.CNOT]: {
    text: "A two-qubit gate. If the control qubit is |1⟩, it flips the target qubit. The Bloch sphere only visualizes single-qubit states, so watch the truth table for this one.",
  },
  [Gate.CONTROLLED_Z]: {
    text: "A two-qubit gate. Applies a phase flip to the target qubit when both qubits are |1⟩. Check the truth table to see its effect.",
  },
  [Gate.SWAP]: {
    text: "Exchanges the states of two qubits. Whatever qubit 0 was holding, qubit 1 now has, and vice versa.",
  },
};

function shouldShowGateTooltip(gate: Gate, completed: string[]): boolean {
  const cfg = GATE_TOOLTIPS[gate];
  if (!cfg) return false;
  if (cfg.gatedBy) return completed.includes(cfg.gatedBy);
  return true;
}

function iconAbbrev(label: string): string {
  if (label === "√X") return "√X";
  if (label.startsWith("R")) return label.slice(0, 2);
  if (label.includes("(")) return label.split("(")[0];
  return label.length > 3 ? label.slice(0, 3) : label;
}

const blochToggleBtn = (active: boolean) =>
  `font-mono text-[10px] px-2 py-0.5 rounded-gate border transition-colors ${
    active
      ? "bg-grid border-cyan text-cyan"
      : "border-grid text-slate hover:border-cyan-muted hover:text-cyan-muted"
  }`;

const BLOCH_SPHERE_TOOLTIP =
  "Every possible state of a single qubit lives somewhere on this sphere. The north pole is |0⟩, the south pole is |1⟩, and the equator is where superpositions live — |+⟩, |−⟩, |i⟩, and |−i⟩. When you place gates, watch the state vector move.";

/** Bloch sphere section header with info tooltip */
export function BlochSphereHeader() {
  return (
    <p className="font-mono text-[10px] tracking-[0.12em] text-slate-muted uppercase w-full text-left flex items-center">
      Bloch Sphere
      <Tooltip text={BLOCH_SPHERE_TOOLTIP} />
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
      <span className="font-sans text-[11px] text-slate shrink-0">Preview from:</span>
      <button type="button" onClick={onSelect0} className={blochToggleBtn(initialState === 0)}>
        {BASIS_0}
      </button>
      <button type="button" onClick={onSelect1} className={blochToggleBtn(initialState === 1)}>
        {BASIS_1}
      </button>
    </div>
  );
}

export function Toolbox({ availableGates }: ToolboxProps) {
  const { completedLevels } = useLevelProgress();

  return (
    <div className="shrink-0">
      <h2 className="font-mono text-[10px] tracking-[0.12em] text-slate-muted uppercase mb-2">
        Toolbox
      </h2>
      <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto shrink-0">
        {availableGates.map((gate) => {
          const config = GATE_CONFIG[gate as keyof typeof GATE_CONFIG];
          if (!config) return null;

          const abbrev = iconAbbrev(config.label);
          const tooltipCfg = GATE_TOOLTIPS[gate];

          return (
            <div
              key={gate}
              className="flex items-center gap-1 bg-[#0a1628] border border-grid rounded-[5px] px-2 py-2 hover:border-cyan transition-colors min-w-0"
            >
              <DraggableTool id={config.toolId}>
                <div className="flex items-center gap-2 flex-1 min-w-0 cursor-grab">
                  <span className="w-9 h-9 shrink-0 bg-grid border border-cyan rounded-[5px] flex items-center justify-center pointer-events-none">
                    <span className="font-mono text-[13px] font-bold text-cyan-muted">
                      {abbrev}
                    </span>
                  </span>
                  <span className="font-mono text-[13px] font-bold text-cyan leading-tight truncate min-w-0 pointer-events-none">
                    {config.label}
                  </span>
                </div>
              </DraggableTool>
              {tooltipCfg && shouldShowGateTooltip(gate, completedLevels) && (
                <Tooltip text={tooltipCfg.text} />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 font-sans text-[12px] text-slate leading-relaxed">
        Drag a gate onto the wires. For 2-qubit gates, set the order after placement.
      </p>
    </div>
  );
}

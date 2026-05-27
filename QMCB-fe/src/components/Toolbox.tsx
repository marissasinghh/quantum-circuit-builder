/**
 * Toolbox: contains draggable gate components.
 */

import { Gate } from "../types/global";
import { DraggableTool } from "./DragAndDropWrappers";

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

function iconAbbrev(label: string): string {
  if (label === "√X") return "√X";
  if (label.startsWith("R")) return label.slice(0, 2);
  if (label.includes("(")) return label.split("(")[0];
  return label.length > 3 ? label.slice(0, 3) : label;
}

export function Toolbox({ availableGates }: ToolboxProps) {
  return (
    <div>
      <h2 className="font-mono text-[9px] tracking-[0.12em] text-slate-muted uppercase mb-2">
        Toolbox
      </h2>
      <div className="flex flex-col">
        {availableGates.map((gate) => {
          const config = GATE_CONFIG[gate as keyof typeof GATE_CONFIG];
          if (!config) return null;

          const abbrev = iconAbbrev(config.label);

          return (
            <DraggableTool key={gate} id={config.toolId}>
              <div className="flex items-center gap-2.5 bg-[#0a1628] border border-grid rounded-[5px] px-3 py-2.5 mb-2 hover:border-cyan transition-colors cursor-grab">
                <span className="w-9 h-9 shrink-0 bg-grid border border-cyan rounded-[5px] flex items-center justify-center pointer-events-none">
                  <span className="font-mono text-[11px] font-bold text-cyan-muted">
                    {abbrev}
                  </span>
                </span>
                <div className="flex flex-col gap-0.5 min-w-0 pointer-events-none">
                  <span className="font-mono text-[11px] font-bold text-cyan leading-tight">
                    {config.label}
                  </span>
                  <span className="font-sans text-[10px] text-slate leading-snug">
                    {config.description}
                  </span>
                </div>
              </div>
            </DraggableTool>
          );
        })}
      </div>
      <p className="mt-2 font-sans text-[9px] text-slate leading-relaxed">
        Drag a gate onto the wires. For 2-qubit gates, set the order after placement.
      </p>
    </div>
  );
}

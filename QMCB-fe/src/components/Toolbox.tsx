/**
 * Toolbox: contains draggable gate components.
 */

import { Gate } from "../types/global";
import { CNOTGlyph, ControlledZGlyph, HGlyph, TGlyph, SGlyph, RXGlyph, RYGlyph, UGlyph, RZGlyph, XGlyph, SqrtXGlyph } from "./GateDesign";
import { DraggableTool } from "./DragAndDropWrappers";

interface ToolboxProps {
  availableGates: readonly Gate[];
  activeId: string | null;
}

const GATE_CONFIG = {
  [Gate.X]: {
    component: <XGlyph width={32} height={28} />,
    label: "X",
    toolId: "tool-x",
  },
  [Gate.SQRT_X]: {
    component: <SqrtXGlyph width={32} height={28} />,
    label: "√X",
    toolId: "tool-sqrt-x",
  },
  [Gate.CNOT]: {
    component: <CNOTGlyph order={[0, 1]} width={48} height={40} />,
    label: "CNOT",
    toolId: "tool-cnot",
  },
  [Gate.CNOT_FLIPPED]: {
    component: <CNOTGlyph order={[1, 0]} width={48} height={40} />,
    label: "CNOT↕",
    toolId: "tool-cnot-flipped",
  },
  [Gate.CONTROLLED_Z]: {
    component: <ControlledZGlyph order={[0, 1]} width={48} height={40} />,
    label: "CZ",
    toolId: "tool-cz",
  },
  [Gate.SWAP]: {
    component: <CNOTGlyph order={[0, 1]} width={48} height={40} />,
    label: "SWAP",
    toolId: "tool-swap",
  },
  [Gate.S]: {
    component: <SGlyph width={36} height={28} />,
    label: "S",
    toolId: "tool-s",
  },
  [Gate.T]: {
    component: <TGlyph width={36} height={28} />,
    label: "T",
    toolId: "tool-t",
  },
  [Gate.H]: {
    component: <HGlyph width={32} height={28} />,
    label: "H",
    toolId: "tool-h",
  },
  [Gate.RX]: {
    component: <RXGlyph width={36} height={28} />,
    label: "Rx",
    toolId: "tool-rx",
  },
  [Gate.RY]: {
    component: <RYGlyph width={36} height={28} />,
    label: "Ry",
    toolId: "tool-ry",
  },
  [Gate.RZ]: {
    component: <RZGlyph width={36} height={28} />,
    label: "Rz",
    toolId: "tool-rz",
  },
  [Gate.U]: {
    component: <UGlyph width={32} height={28} />,
    label: "U",
    toolId: "tool-u",
  },
  [Gate.CONTROLLED_H]: {
    component: <CNOTGlyph order={[0, 1]} width={48} height={40} />,
    label: "CH",
    toolId: "tool-ch",
  },
  [Gate.CONTROLLED_U]: {
    component: <CNOTGlyph order={[0, 1]} width={48} height={40} />,
    label: "CU",
    toolId: "tool-cu",
  },
} as const;

export function Toolbox({ availableGates }: ToolboxProps) {
  return (
    <div>
      <h2 className="font-mono text-[9px] tracking-[0.12em] text-slate-muted uppercase mb-2">
        Toolbox
      </h2>
      <div className="flex flex-col gap-2">
        {availableGates.map((gate) => {
          const config = GATE_CONFIG[gate as keyof typeof GATE_CONFIG];
          if (!config) return null;

          return (
            <DraggableTool key={gate} id={config.toolId}>
              <div className="flex items-center gap-2 bg-navy border border-grid rounded-gate px-2 py-1.5 hover:border-cyan-muted transition-colors cursor-grab">
                <span className="w-[18px] h-[18px] shrink-0 bg-grid rounded-[3px] flex items-center justify-center overflow-hidden pointer-events-none">
                  <span className="scale-[0.5] origin-center leading-none">
                    {config.component}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-cyan pointer-events-none">
                  {config.label}
                </span>
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

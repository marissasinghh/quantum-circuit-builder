/**
 * Toolbox: contains draggable gate components.
 */

import { Gate } from "../types/global";
import { CNOTGlyph, ControlledZGlyph, HGlyph, TGlyph, SGlyph, RXGlyph, RYGlyph, UGlyph, RZGlyph } from "./GateDesign";
import { DraggableTool } from "./DragAndDropWrappers";

interface ToolboxProps {
  availableGates: readonly Gate[];
  activeId: string | null;
}

// Map gate types to their visual components and display info
const GATE_CONFIG = {
  [Gate.CNOT]: {
    component: <CNOTGlyph order={[0, 1]} width={84} height={64} />,
    label: "CNOT",
    toolId: "tool-cnot",
  },
  [Gate.CNOT_FLIPPED]: {
    component: <CNOTGlyph order={[1, 0]} width={84} height={64} />,
    label: "CNOT↕",
    toolId: "tool-cnot-flipped",
  },
  [Gate.CONTROLLED_Z]: {
    component: <ControlledZGlyph order={[0, 1]} width={84} height={64} />,
    label: "CZ",
    toolId: "tool-cz",
  },
  [Gate.SWAP]: {
    component: <CNOTGlyph order={[0, 1]} width={84} height={64} />,
    label: "SWAP",
    toolId: "tool-swap",
  },
  [Gate.S]: {
    component: <SGlyph width={76} height={44} />,
    label: "S",
    toolId: "tool-s",
  },
  [Gate.T]: {
    component: <TGlyph width={76} height={44} />,
    label: "T",
    toolId: "tool-t",
  },
  [Gate.H]: {
    component: <HGlyph width={64} height={44} />,
    label: "H",
    toolId: "tool-h",
  },
  [Gate.RX]: {
    component: <RXGlyph width={76} height={44} />,
    label: "Rx(θ)",
    toolId: "tool-rx",
  },
  [Gate.RY]: {
    component: <RYGlyph width={76} height={44} />,
    label: "Ry(θ)",
    toolId: "tool-ry",
  },
  [Gate.RZ]: {
    component: <RZGlyph width={76} height={44} />,
    label: "Rz(θ)",
    toolId: "tool-rz",
  },
  [Gate.U]: {
    component: <UGlyph width={64} height={44} />,
    label: "U",
    toolId: "tool-u",
  },
  [Gate.CONTROLLED_H]: {
    component: <CNOTGlyph order={[0, 1]} width={84} height={64} />,
    label: "CH",
    toolId: "tool-ch",
  },
  [Gate.CONTROLLED_U]: {
    component: <CNOTGlyph order={[0, 1]} width={84} height={64} />,
    label: "CU",
    toolId: "tool-cu",
  },
} as const;

export function Toolbox({ availableGates }: ToolboxProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-2xl font-semibold mb-3">Toolbox</h2>
      <div className="grid grid-cols-3 gap-6">
        {availableGates.map((gate) => {
          const config = GATE_CONFIG[gate as keyof typeof GATE_CONFIG];
          if (!config) return null; // Skip unknown gates

          return (
            <div key={gate} className="flex flex-col items-center">
              <DraggableTool id={config.toolId}>{config.component}</DraggableTool>
              <div className="mt-1 text-sm">{config.label}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Tip: drag a gate onto the wires at right. For 2-qubit gates, set the order after placement.
      </p>
    </div>
  );
}

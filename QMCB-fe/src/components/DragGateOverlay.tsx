import type { PlacedGate, PlacedSingleQubitGate } from "../types/global";
import { isToolboxDragId, isSingleQubitGate } from "../utils/placedGateDrag";
import {
  CNOTGlyph,
  ControlledZGlyph,
  HGlyph,
  TGlyph,
  SGlyph,
  RXGlyph,
  RYGlyph,
  UGlyph,
  RZGlyph,
  XGlyph,
  SqrtXGlyph,
} from "./GateDesign";
import { PlacedGateOverlayContent } from "./SortablePlacedGate";

interface DragGateOverlayProps {
  activeId: string | null;
  gates: PlacedGate[];
}

export function DragGateOverlay({ activeId, gates }: DragGateOverlayProps) {
  if (!activeId) return null;

  if (isToolboxDragId(activeId)) {
    switch (activeId) {
      case "tool-x":
        return <XGlyph width={64} height={44} />;
      case "tool-sqrt-x":
        return <SqrtXGlyph width={64} height={44} />;
      case "tool-cnot":
        return <CNOTGlyph order={[0, 1]} width={84} height={64} />;
      case "tool-cnot-flipped":
        return <CNOTGlyph order={[1, 0]} width={84} height={64} />;
      case "tool-cz":
        return <ControlledZGlyph order={[0, 1]} width={84} height={64} />;
      case "tool-swap":
        return <CNOTGlyph order={[0, 1]} width={84} height={64} />;
      case "tool-h":
        return <HGlyph width={64} height={44} />;
      case "tool-t":
        return <TGlyph width={76} height={44} />;
      case "tool-s":
        return <SGlyph width={76} height={44} />;
      case "tool-rx":
        return <RXGlyph width={76} height={44} />;
      case "tool-ry":
        return <RYGlyph width={76} height={44} />;
      case "tool-rz":
        return <RZGlyph width={76} height={44} />;
      case "tool-u":
        return <UGlyph width={64} height={44} />;
      default:
        return null;
    }
  }

  const gate = gates.find((g) => g.id === activeId);
  if (gate && isSingleQubitGate(gate)) {
    return <PlacedGateOverlayContent gate={gate as PlacedSingleQubitGate} />;
  }

  return null;
}

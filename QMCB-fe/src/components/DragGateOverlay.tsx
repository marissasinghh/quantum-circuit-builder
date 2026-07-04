import type { PlacedGate, PlacedSingleQubitGate } from "../types/global";
import { isToolboxDragId, isSingleQubitGate, isMultiQubitGate } from "../utils/placedGateDrag";
import {
  CNOTGlyph,
  ControlledZGlyph,
  SwapGlyph,
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
import {
  PlacedMultiQubitOverlayContent,
  multiQubitGlyphDimensions,
} from "./SortablePlacedMultiQubitGate";

interface DragGateOverlayProps {
  activeId: string | null;
  gates: PlacedGate[];
  numberOfQubits?: number;
}

export function DragGateOverlay({ activeId, gates, numberOfQubits = 2 }: DragGateOverlayProps) {
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
        return <SwapGlyph width={84} height={64} />;
      case "tool-h":
        return <HGlyph width={64} height={44} />;
      case "tool-t":
        return <TGlyph width={64} height={44} />;
      case "tool-s":
        return <SGlyph width={64} height={44} />;
      case "tool-rx":
        return <RXGlyph width={64} height={44} />;
      case "tool-ry":
        return <RYGlyph width={64} height={44} />;
      case "tool-rz":
        return <RZGlyph width={64} height={44} />;
      case "tool-u":
        return <UGlyph width={64} height={44} />;
      default:
        return null;
    }
  }

  const gate = gates.find((g) => g.id === activeId);
  if (!gate) return null;

  if (isSingleQubitGate(gate)) {
    return <PlacedGateOverlayContent gate={gate as PlacedSingleQubitGate} />;
  }

  if (isMultiQubitGate(gate) && "order" in gate) {
    const wireSpan =
      numberOfQubits >= 3 ? 120 : numberOfQubits > 1 ? 80 : 0;
    const { width, height } = multiQubitGlyphDimensions(gate.type, numberOfQubits, wireSpan);
    return <PlacedMultiQubitOverlayContent gate={gate} width={width} height={height} />;
  }

  return null;
}

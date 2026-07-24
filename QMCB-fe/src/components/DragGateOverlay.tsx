import { Gate, type PlacedGate, type PlacedSingleQubitGate } from "../types/global";
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
  SqrtXDagGlyph,
  ZGlyph,
  ZDagGlyph,
  SDagGlyph,
  TDagGlyph,
  HDagGlyph,
  YGlyph,
  YDagGlyph,
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

/**
 * Adjacent wire-0→wire-1 span, mirroring CircuitCanvas wire Y math.
 * On 3-qubit canvases this is 60 (not first→last 120). On 2-qubit levels the
 * overlay keeps the historical ~80 approx so Tier 2 drag chrome is unchanged.
 */
function twoQubitWireSpan(numberOfQubits: number): number {
  if (numberOfQubits >= 3) {
    const canvasH = 240;
    const y0 = (canvasH * 1) / (numberOfQubits + 1);
    const y1 = (canvasH * 2) / (numberOfQubits + 1);
    return y1 - y0;
  }
  return numberOfQubits > 1 ? 80 : 0;
}

export function DragGateOverlay({ activeId, gates, numberOfQubits = 2 }: DragGateOverlayProps) {
  if (!activeId) return null;

  if (isToolboxDragId(activeId)) {
    // On 3q levels, size toolbox 2q previews to the adjacent 0–1 span so they
    // match the placed glyph. Tier 2 keeps the historical fixed 64px height.
    const twoQDims =
      numberOfQubits >= 3
        ? multiQubitGlyphDimensions(Gate.CNOT, numberOfQubits, twoQubitWireSpan(numberOfQubits))
        : { width: 84, height: 64 };

    switch (activeId) {
      case "tool-x":
        return <XGlyph width={64} height={44} />;
      case "tool-sqrt-x":
        return <SqrtXGlyph width={64} height={44} />;
      case "tool-cnot":
        return <CNOTGlyph order={[0, 1]} width={twoQDims.width} height={twoQDims.height} />;
      case "tool-cnot-flipped":
        return <CNOTGlyph order={[1, 0]} width={twoQDims.width} height={twoQDims.height} />;
      case "tool-cz":
        return <ControlledZGlyph order={[0, 1]} width={twoQDims.width} height={twoQDims.height} />;
      case "tool-swap":
        return <SwapGlyph width={twoQDims.width} height={twoQDims.height} />;
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
      case "tool-sqrt-x-dag":
        return <SqrtXDagGlyph width={64} height={44} />;
      case "tool-z":
        return <ZGlyph width={64} height={44} />;
      case "tool-z-dag":
        return <ZDagGlyph width={64} height={44} />;
      case "tool-s-dag":
        return <SDagGlyph width={64} height={44} />;
      case "tool-t-dag":
        return <TDagGlyph width={64} height={44} />;
      case "tool-h-dag":
        return <HDagGlyph width={64} height={44} />;
      case "tool-y":
        return <YGlyph width={64} height={44} />;
      case "tool-y-dag":
        return <YDagGlyph width={64} height={44} />;
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
    const wireSpan = twoQubitWireSpan(numberOfQubits);
    const { width, height } = multiQubitGlyphDimensions(gate.type, numberOfQubits, wireSpan);
    return <PlacedMultiQubitOverlayContent gate={gate} width={width} height={height} />;
  }

  return null;
}

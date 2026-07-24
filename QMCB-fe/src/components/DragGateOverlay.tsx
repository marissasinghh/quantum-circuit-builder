import { Gate, type PlacedGate, type PlacedSingleQubitGate, type TwoQubitBaseWire } from "../types/global";
import { isToolboxDragId, isSingleQubitGate, isMultiQubitGate } from "../utils/placedGateDrag";
import { twoQubitGlyphLayout } from "../utils/canvasGeometry";
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

/** Overlay wire Ys mirroring CircuitCanvas canvasHeightFor + computeWireYs. */
function overlayWireYs(numberOfQubits: number): number[] {
  const canvasH = numberOfQubits >= 3 ? 240 : 200;
  return Array.from(
    { length: numberOfQubits },
    (_, i) => (canvasH * (i + 1)) / (numberOfQubits + 1),
  );
}

/**
 * Wire-pair span for overlay sizing. On 3q uses real adjacent span for baseWire.
 * On 2q keeps the historical ~80 approx so Tier 2 drag chrome is unchanged.
 */
function twoQubitOverlaySpan(numberOfQubits: number, baseWire: TwoQubitBaseWire = 0): number {
  if (numberOfQubits >= 3) {
    return twoQubitGlyphLayout(overlayWireYs(numberOfQubits), baseWire).wireSpan;
  }
  return numberOfQubits > 1 ? 80 : 0;
}

export function DragGateOverlay({ activeId, gates, numberOfQubits = 2 }: DragGateOverlayProps) {
  if (!activeId) return null;

  if (isToolboxDragId(activeId)) {
    // Toolbox drops always start at baseWire 0; size preview to that pair.
    const twoQDims =
      numberOfQubits >= 3
        ? multiQubitGlyphDimensions(Gate.CNOT, numberOfQubits, twoQubitOverlaySpan(numberOfQubits, 0))
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
    const wireSpan = twoQubitOverlaySpan(numberOfQubits, gate.baseWire);
    const { width, height } = multiQubitGlyphDimensions(gate.type, numberOfQubits, wireSpan);
    return <PlacedMultiQubitOverlayContent gate={gate} width={width} height={height} />;
  }

  return null;
}

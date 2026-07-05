import React from "react";
import { useDraggable } from "@dnd-kit/core";

import { Gate, type PlacedGate, type ControlTargetOrder } from "../types/global";
import {
  CNOTGlyph,
  ControlledZGlyph,
  SwapGlyph,
  ToffoliGlyph,
  FredkinGlyph,
  HGlyph,
} from "./GateDesign";

function useDoubleTap(onDoubleTap: () => void) {
  const lastTapRef = React.useRef<{ time: number; x: number; y: number } | null>(null);

  return React.useCallback(
    (event: React.PointerEvent) => {
      const now = Date.now();
      const prev = lastTapRef.current;
      lastTapRef.current = { time: now, x: event.clientX, y: event.clientY };

      if (!prev || now - prev.time > 300) return;

      const dx = Math.abs(event.clientX - prev.x);
      const dy = Math.abs(event.clientY - prev.y);
      if (dx > 10 || dy > 10) return;

      lastTapRef.current = null;
      onDoubleTap();
    },
    [onDoubleTap]
  );
}

type PlacedMultiQubitGate = Extract<PlacedGate, { order: ControlTargetOrder }>;

function MultiQubitGlyph({
  gate,
  width,
  height,
}: {
  gate: PlacedMultiQubitGate;
  width: number;
  height: number;
}) {
  const order = gate.order;
  switch (gate.type as Gate) {
    case Gate.CONTROLLED_Z:
      return <ControlledZGlyph order={order} width={width} height={height} />;
    case Gate.SWAP:
      return <SwapGlyph width={width} height={height} />;
    case Gate.TOFFOLI:
      return <ToffoliGlyph width={width} height={height} />;
    case Gate.FREDKIN:
      return <FredkinGlyph width={width} height={height} />;
    case Gate.CONTROLLED_H:
      return <HGlyph width={44} height={40} />;
    case Gate.CONTROLLED_U:
      return <CNOTGlyph order={order} width={width} height={height} />;
    case Gate.CNOT:
    case Gate.CNOT_FLIPPED:
    default:
      return <CNOTGlyph order={order} width={width} height={height} />;
  }
}

interface SortablePlacedMultiQubitGateProps {
  gate: PlacedMultiQubitGate;
  left: number;
  top: number;
  width: number;
  height: number;
  onRemoveGate: (id: string) => void;
  /** Unlocked once the student clears CNOT_FLIPPED; enables the on-chip flip icon for CNOT gates. */
  cnotFlipUnlocked?: boolean;
  onSetGateOrder?: (id: string, order: ControlTargetOrder) => void;
}

export function SortablePlacedMultiQubitGate({
  gate,
  left,
  top,
  width,
  height,
  onRemoveGate,
  cnotFlipUnlocked = false,
  onSetGateOrder,
}: SortablePlacedMultiQubitGateProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: gate.id,
    data: { type: "placed", wire: 0, multiQubit: true },
  });

  const handleDoubleTap = useDoubleTap(() => onRemoveGate(gate.id));

  const style: React.CSSProperties = {
    position: "absolute",
    left,
    top,
    width,
    height,
    // left-position transition ready for Phase 2 preview rendering.
    transition: "left 150ms ease, opacity 100ms ease",
    opacity: isDragging ? 0.25 : 1,
    touchAction: "none",
  };

  const showFlipIcon =
    gate.type === Gate.CNOT && cnotFlipUnlocked && onSetGateOrder != null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative cursor-grab active:cursor-grabbing select-none pointer-events-auto"
      {...attributes}
      {...listeners}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onRemoveGate(gate.id);
      }}
      onPointerUp={handleDoubleTap}
      aria-label={`${gate.type} gate`}
    >
      <div className="pointer-events-none">
        <MultiQubitGlyph gate={gate} width={width} height={height} />
      </div>
      {showFlipIcon && (
        <button
          type="button"
          className="absolute top-0 right-0 z-10 w-[18px] h-[18px] flex items-center justify-center rounded-sm bg-bg-panel/80 border border-tier2 font-mono text-[11px] text-tier2 hover:border-tier3 hover:text-tier3 cursor-pointer"
          aria-label="Flip CNOT control/target"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            const flipped: ControlTargetOrder = gate.order[0] === 0 ? [1, 0] : [0, 1];
            onSetGateOrder!(gate.id, flipped);
          }}
        >
          ⇄
        </button>
      )}
    </div>
  );
}

export function PlacedMultiQubitOverlayContent({
  gate,
  width,
  height,
}: {
  gate: PlacedMultiQubitGate;
  width: number;
  height: number;
}) {
  return (
    <div className="opacity-90 drop-shadow-lg">
      <MultiQubitGlyph gate={gate} width={width} height={height} />
    </div>
  );
}

export function multiQubitGlyphDimensions(
  gateType: Gate,
  numberOfQubits: number,
  wireSpan: number
): { width: number; height: number } {
  const width = 80;
  if (gateType === Gate.TOFFOLI || gateType === Gate.FREDKIN) {
    return { width, height: numberOfQubits >= 3 ? 90 : width };
  }
  return { width, height: wireSpan > 0 ? wireSpan + 24 : 52 };
}

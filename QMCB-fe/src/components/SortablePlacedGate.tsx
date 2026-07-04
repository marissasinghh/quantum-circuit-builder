import React, { useCallback, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";

import { Gate, type PlacedSingleQubitGate } from "../types/global";
import {
  HGlyph,
  TGlyph,
  SGlyph,
  RXGlyph,
  RYGlyph,
  RZGlyph,
  UGlyph,
  XGlyph,
  SqrtXGlyph,
} from "./GateDesign";

const PARAMETERIZED_GATES = new Set<Gate>([Gate.RX, Gate.RY, Gate.RZ]);

function singleQubitGlyphWidth(type: Gate): number {
  switch (type) {
    case Gate.S:
    case Gate.T:
    case Gate.RZ:
      return 52;
    case Gate.RX:
    case Gate.RY:
      return 48;
    default:
      return 44;
  }
}

function PlacedGateGlyph({ gate, width, height }: { gate: PlacedSingleQubitGate; width: number; height: number }) {
  switch (gate.type) {
    case Gate.X:
      return <XGlyph width={width} height={height} />;
    case Gate.SQRT_X:
      return <SqrtXGlyph width={width} height={height} />;
    case Gate.S:
      return <SGlyph width={width + 8} height={height} />;
    case Gate.T:
      return <TGlyph width={width + 8} height={height} />;
    case Gate.H:
      return <HGlyph width={width} height={height} />;
    case Gate.RX:
      return <RXGlyph width={width + 4} height={height} />;
    case Gate.RY:
      return <RYGlyph width={width + 4} height={height} />;
    case Gate.RZ:
      return <RZGlyph width={width + 8} height={height} />;
    case Gate.U:
      return <UGlyph width={width} height={height} />;
    default:
      return <HGlyph width={width} height={height} />;
  }
}

function useDoubleTap(onDoubleTap: () => void) {
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  return useCallback(
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

interface SortablePlacedGateProps {
  gate: PlacedSingleQubitGate;
  left: number;
  top: number;
  onRemoveGate: (id: string) => void;
}

export function SortablePlacedGate({ gate, left, top, onRemoveGate }: SortablePlacedGateProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: gate.id,
    data: { type: "placed", wire: gate.wire, multiQubit: false },
  });

  const handleDoubleTap = useDoubleTap(() => onRemoveGate(gate.id));

  const sqW = 44;
  const sqH = 40;
  const glyphW = singleQubitGlyphWidth(gate.type);
  const isParameterized = PARAMETERIZED_GATES.has(gate.type);
  const thetaLabel =
    gate.theta !== undefined ? `${((gate.theta * 180) / Math.PI).toFixed(0)}°` : null;

  const style: React.CSSProperties = {
    position: "absolute",
    left,
    top,
    width: sqW,
    height: sqH,
    // left-position transition is ready for Phase 2 speculative-preview rendering;
    // during Phase 1 (committed positions only) it fires only when moveGate commits.
    transition: "left 150ms ease, opacity 100ms ease",
    opacity: isDragging ? 0.25 : 1,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing select-none pointer-events-auto"
      {...attributes}
      {...listeners}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onRemoveGate(gate.id);
      }}
      onPointerUp={handleDoubleTap}
      aria-label={`${gate.type} gate on wire ${gate.wire}`}
    >
      {isParameterized && thetaLabel && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-3 font-mono text-[9px] text-cyan-muted bg-grid border border-[#2a4a6f] rounded-full px-2 py-0.5 pointer-events-none whitespace-nowrap"
          style={{ color: "#7dc4e0", backgroundColor: "#0d1526" }}
        >
          {thetaLabel}
        </div>
      )}
      {gate.isParameterSlot && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-4 font-mono text-[8px] pointer-events-none whitespace-nowrap"
          style={{ color: "#7dc4e0" }}
        >
          θ slot
        </div>
      )}
      <div className="pointer-events-none" style={{ width: sqW, margin: "0 auto" }}>
        <PlacedGateGlyph gate={gate} width={sqW} height={sqH} />
      </div>
    </div>
  );
}

/** Shared glyph renderer for DragOverlay (placed gates). */
export function PlacedGateOverlayContent({ gate }: { gate: PlacedSingleQubitGate }) {
  const w = 64;
  const h = 44;
  return (
    <div className="opacity-90 drop-shadow-lg">
      <PlacedGateGlyph gate={gate} width={w} height={h} />
    </div>
  );
}

export { singleQubitGlyphWidth };

import React from "react";
import { useDraggable } from "@dnd-kit/core";

import {
  Gate,
  type PlacedGate,
  type ControlTargetOrder,
  type PlacedTwoQubitGate,
  type TwoQubitBaseWire,
} from "../types/global";
import {
  CNOTGlyph,
  ControlledZGlyph,
  SwapGlyph,
  ToffoliGlyph,
  FredkinGlyph,
  HGlyph,
} from "./GateDesign";
import { twoQubitSpanControls } from "../utils/twoQubitPlacement";

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

/** Two-qubit gates whose order is editable via the on-chip flip icon. */
const ORDER_BEARING_GATES = new Set<Gate>([
  Gate.CNOT,
  Gate.CNOT_FLIPPED,
  Gate.CONTROLLED_Z,
  Gate.SWAP,
]);

/** Shared chip-control chrome — flip stays at this size. */
const CHIP_CTRL_BTN =
  "z-10 w-[18px] h-[18px] flex items-center justify-center rounded-sm bg-bg-panel/80 border border-tier2 font-mono text-[11px] text-tier2 hover:border-tier3 hover:text-tier3 cursor-pointer";

/**
 * Extend/retract: slightly smaller than flip, sits just outside the glyph
 * (negative top/bottom) so control/target symbols stay unobscured.
 */
const SPAN_CTRL_BTN =
  "z-10 w-[14px] h-[14px] flex items-center justify-center rounded-sm bg-bg-panel/80 border border-tier2 font-mono text-[9px] leading-none text-tier2 hover:border-tier3 hover:text-tier3 cursor-pointer";

/** Outside-glyph offsets: clear of endpoint marks, still near the chip. */
const SPAN_OUTSIDE_TOP = "absolute left-1/2 -translate-x-1/2 -top-[16px]";
const SPAN_OUTSIDE_BOTTOM = "absolute left-1/2 -translate-x-1/2 -bottom-[16px]";

function stopChipCtrlPointer(e: React.SyntheticEvent) {
  e.stopPropagation();
}

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
      return <SwapGlyph order={order} width={width} height={height} />;
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
  numberOfQubits: number;
  onRemoveGate: (id: string) => void;
  /** Unlocked once the student clears CNOT_FLIPPED; enables the on-chip flip icon. */
  cnotFlipUnlocked?: boolean;
  onSetGateOrder?: (id: string, order: ControlTargetOrder) => void;
  /** Tier-3 extend/retract: set extended + baseWire explicitly. */
  onSetGateSpan?: (id: string, span: { baseWire: TwoQubitBaseWire; extended: boolean }) => void;
}

export function SortablePlacedMultiQubitGate({
  gate,
  left,
  top,
  width,
  height,
  numberOfQubits,
  onRemoveGate,
  cnotFlipUnlocked = false,
  onSetGateOrder,
  onSetGateSpan,
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
    ORDER_BEARING_GATES.has(gate.type) && cnotFlipUnlocked && onSetGateOrder != null;

  // Extend/retract: Tier-3 only + same gate family as flip; never on 2q levels.
  const spanControls =
    ORDER_BEARING_GATES.has(gate.type) && onSetGateSpan != null
      ? twoQubitSpanControls(gate as PlacedTwoQubitGate, numberOfQubits)
      : [];

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
      {/* Flip: top-right on the chip. Span arrows: outside glyph, top/bottom center. */}
      {showFlipIcon && (
        <button
          type="button"
          className={`absolute top-0 right-0 ${CHIP_CTRL_BTN}`}
          aria-label="Flip control/target order"
          onPointerDown={stopChipCtrlPointer}
          onPointerUp={stopChipCtrlPointer}
          onDoubleClick={stopChipCtrlPointer}
          onClick={(e) => {
            e.stopPropagation();
            const flipped: ControlTargetOrder = gate.order[0] === 0 ? [1, 0] : [0, 1];
            onSetGateOrder!(gate.id, flipped);
          }}
        >
          ⇄
        </button>
      )}
      {spanControls.map((ctrl) => {
        if (ctrl.kind === "extend") {
          const isUp = ctrl.direction === "up";
          return (
            <button
              key={`extend-${ctrl.direction}`}
              type="button"
              className={`${isUp ? SPAN_OUTSIDE_TOP : SPAN_OUTSIDE_BOTTOM} ${SPAN_CTRL_BTN}`}
              aria-label="Extend gate to wires 0–2"
              onPointerDown={stopChipCtrlPointer}
              onPointerUp={stopChipCtrlPointer}
              onDoubleClick={stopChipCtrlPointer}
              onClick={(e) => {
                e.stopPropagation();
                onSetGateSpan!(gate.id, {
                  baseWire: (gate as PlacedTwoQubitGate).baseWire,
                  extended: true,
                });
              }}
            >
              {isUp ? "↑" : "↓"}
            </button>
          );
        }
        const isTop = ctrl.position === "top";
        return (
          <button
            key={`retract-${ctrl.targetBaseWire}`}
            type="button"
            className={`${isTop ? SPAN_OUTSIDE_TOP : SPAN_OUTSIDE_BOTTOM} ${SPAN_CTRL_BTN}`}
            aria-label={
              ctrl.targetBaseWire === 0
                ? "Retract gate to wires 0–1"
                : "Retract gate to wires 1–2"
            }
            onPointerDown={stopChipCtrlPointer}
            onPointerUp={stopChipCtrlPointer}
            onDoubleClick={stopChipCtrlPointer}
            onClick={(e) => {
              e.stopPropagation();
              onSetGateSpan!(gate.id, {
                baseWire: ctrl.targetBaseWire,
                extended: false,
              });
            }}
          >
            {isTop ? "↓" : "↑"}
          </button>
        );
      })}
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

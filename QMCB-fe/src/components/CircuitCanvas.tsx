/**
 * Circuit Canvas: SVG wire visualization + placed gate chips + cell droppable grid.
 *
 * Gate chips are positioned absolutely at `PAD_X + column * COL_W` (committed state).
 * An invisible grid of DroppableCell overlays — one per (column-slot × wire) — is
 * rendered below the chips. cellFirstCollision resolves any drag to the nearest cell,
 * giving unambiguous (col, wire) values without coordinate-threshold math.
 *
 * Phase 2 will add speculative-preview rendering: computing `moveGate` on a local
 * copy of `gates` for the hovered cell and rendering chips at those preview positions
 * (CSS `left` transition animates the slide). The `transition: "left 150ms ease"` is
 * already in place on both chip components in anticipation of this.
 */

import { Gate, type PlacedGate, type PlacedSingleQubitGate, type ControlTargetOrder } from "../types/global";
import { DroppableCell, TrashDropZone } from "./DragAndDropWrappers";
import { SortablePlacedGate } from "./SortablePlacedGate";
import {
  SortablePlacedMultiQubitGate,
  multiQubitGlyphDimensions,
} from "./SortablePlacedMultiQubitGate";
import { gatesInColumnOrder } from "../utils/circuit";
import { isSingleQubitGate, isMultiQubitGate } from "../utils/placedGateDrag";
import { CANVAS_PAD_X, CANVAS_COL_W } from "../utils/canvasGeometry";
import { colors, fonts } from "../design-tokens";
import { Tooltip } from "./Tooltip";
import { useCircuitPreview } from "../hooks/useCircuitPreview";

interface CircuitCanvasProps {
  gates: PlacedGate[];
  numberOfQubits: number;
  /** Cell ID currently being hovered during a drag — drives the DroppableCell indicator. */
  hoveredCellId?: string | null;
  /** Active drag ID — used to compute speculative preview positions for other chips. */
  activeId?: string | null;
  isDraggingPlacedGate?: boolean;
  onRemoveGate: (id: string) => void;
  onSetGateOrder: (id: string, order: ControlTargetOrder) => void;
  onSetGateTheta: (id: string, theta: number) => void;
  onSetParameterSlot?: (id: string) => void;
  showParameterSlotControls?: boolean;
  onCheck: () => void;
  onClear: () => void;
  isChecking: boolean;
  onSkip?: () => void;
  showSkip?: boolean;
  /** True once the student has cleared level CNOT_FLIPPED; unlocks on-chip order flip for two-qubit gates. */
  cnotFlipUnlocked?: boolean;
}

const PARAMETERIZED_GATES = new Set<Gate>([Gate.RX, Gate.RY, Gate.RZ]);

const THETA_PRESETS = [
  { label: "π/4", value: Math.PI / 4 },
  { label: "π/2", value: Math.PI / 2 },
  { label: "π",   value: Math.PI },
  { label: "2π",  value: 2 * Math.PI },
] as const;

const LABEL_PAD = 36;
const PAD_X = CANVAS_PAD_X;
const COL_W = CANVAS_COL_W;
const CANVAS_H = 200;
const SQ_W = 44;
const SQ_H = 40;
const WIRE_COLOR = colors.wire;

const controlInputClass =
  "bg-bg-elevated border border-tier1 rounded-gate px-1 py-0.5 text-[10px] font-mono text-tier2 focus:border-tier3 outline-none";

function canvasHeightFor(numberOfQubits: number): number {
  return numberOfQubits >= 3 ? 240 : CANVAS_H;
}

function computeWireYs(numberOfQubits: number, canvasH: number): number[] {
  return Array.from(
    { length: numberOfQubits },
    (_, i) => (canvasH * (i + 1)) / (numberOfQubits + 1),
  );
}

export function CircuitCanvas({
  gates,
  numberOfQubits,
  hoveredCellId = null,
  activeId = null,
  isDraggingPlacedGate = false,
  onRemoveGate,
  onSetGateOrder,
  onSetGateTheta,
  onSetParameterSlot,
  showParameterSlotControls = false,
  onCheck,
  onClear,
  isChecking,
  onSkip,
  showSkip = false,
  cnotFlipUnlocked = false,
}: CircuitCanvasProps) {
  const orderedGates = gatesInColumnOrder(gates);

  // Speculative gate positions for live drag preview (Phase 2).
  // null when not dragging a placed gate or hovering a non-cell zone.
  const speculativeMap = useCircuitPreview(gates, activeId, hoveredCellId, numberOfQubits);

  // One extra slot past the last gate allows "append after all" drops.
  const numSlots = orderedGates.length + 1;
  const CANVAS_W = Math.max(600, PAD_X * 2 + numSlots * COL_W);

  const canvasH = canvasHeightFor(numberOfQubits);
  const wireYs = computeWireYs(numberOfQubits, canvasH);
  const wireTop = wireYs[0];
  const wireSpan = wireYs.length > 1 ? wireYs[wireYs.length - 1] - wireYs[0] : 0;

  const hasRotationGate = gates.some(
    (g) => "wire" in g && PARAMETERIZED_GATES.has(g.type)
  );
  const hasParameterSlot = gates.some(
    (g) => "wire" in g && g.isParameterSlot === true
  );
  const showParameterSlotHint =
    showParameterSlotControls && hasRotationGate && !hasParameterSlot;

  return (
    <div className="flex flex-1 flex-col min-h-0 gap-3">
      <div className="relative flex-1 min-w-0 rounded-panel bg-[#090f1d]" style={{ minHeight: canvasH }}>
        <Tooltip id="circuit-canvas">
          A qubit is the quantum version of a classical bit. Unlike a bit which is always 0 or 1, a
          qubit can exist in a superposition of both until it is measured.
        </Tooltip>
        <div className="absolute inset-0 overflow-x-auto overflow-y-hidden rounded-panel">
        <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <div
          className="relative"
          style={{ minWidth: CANVAS_W, height: canvasH }}
        >
          {/* ── Cell droppable grid ──────────────────────────────────────────
               One DroppableCell per (column-slot × wire). Cells are invisible
               (pointer-events: none) and sit below the chip layer in z-order.
               cellFirstCollision resolves drags to the nearest cell centre.    */}
          {wireYs.map((y, wireIndex) =>
            Array.from({ length: numSlots }, (_, col) => {
              const cellId = `cell-col${col}-wire${wireIndex}`;
              return (
                <DroppableCell
                  key={cellId}
                  id={cellId}
                  left={PAD_X + col * COL_W - SQ_W / 2}
                  top={y - SQ_H / 2}
                  width={SQ_W}
                  height={SQ_H}
                  isActiveTarget={hoveredCellId === cellId}
                />
              );
            })
          )}

          {/* ── Wire lines ───────────────────────────────────────────────── */}
          {wireYs.map((y, i) => (
            <div
              key={`wire-${i}`}
              className="absolute left-[36px] right-5 pointer-events-none"
              style={{ top: y }}
            >
              <div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px]"
                style={{ backgroundColor: WIRE_COLOR }}
              />
              <div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px]"
                style={{
                  backgroundColor: WIRE_COLOR,
                  boxShadow: "0 0 6px rgba(89, 155, 195, 0.30)",
                }}
              />
            </div>
          ))}

          {/* ── SVG wire labels ──────────────────────────────────────────── */}
          <svg
            width={CANVAS_W}
            height={canvasH}
            className="relative block z-10"
            style={{ minWidth: "100%" }}
          >
            {wireYs.map((y, i) => (
              <text
                key={`label-${i}`}
                x={LABEL_PAD - 4}
                y={y + 4}
                fontSize={13}
                fontFamily={fonts.mono}
                fill={colors.muted}
                textAnchor="end"
              >
                {`|q${i}⟩`}
              </text>
            ))}
          </svg>

          {/* ── Gate chips ───────────────────────────────────────────────────
               Absolutely positioned at committed column × wire.  pointer-events-none
               on the wrapper; each chip resets to pointer-events-auto via className.
               Phase 2 will compute speculative preview positions here instead.      */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {orderedGates.map((g) => {
              if (isSingleQubitGate(g)) {
                // Use speculative position for non-dragged gates when a preview is active;
                // the dragged gate's own chip stays at its committed position (dimmed).
                const spec = speculativeMap ? speculativeMap.get(g.id) : undefined;
                const displayCol = spec !== undefined ? spec.column : g.column;
                const displayWire = spec !== undefined && "wire" in spec
                  ? (spec as PlacedSingleQubitGate).wire
                  : g.wire;
                return (
                  <SortablePlacedGate
                    key={g.id}
                    gate={g as PlacedSingleQubitGate}
                    left={PAD_X + displayCol * COL_W - SQ_W / 2}
                    top={wireYs[displayWire] - SQ_H / 2}
                    onRemoveGate={onRemoveGate}
                  />
                );
              }
              if (isMultiQubitGate(g) && "order" in g) {
                const { width, height } = multiQubitGlyphDimensions(
                  g.type,
                  numberOfQubits,
                  wireSpan
                );
                const specMulti = speculativeMap ? speculativeMap.get(g.id) : undefined;
                const displayColMulti = specMulti !== undefined ? specMulti.column : g.column;
                return (
                  <SortablePlacedMultiQubitGate
                    key={g.id}
                    gate={g}
                    left={PAD_X + displayColMulti * COL_W - width / 2}
                    top={wireTop - 12}
                    width={width}
                    height={height}
                    onRemoveGate={onRemoveGate}
                    cnotFlipUnlocked={cnotFlipUnlocked}
                    onSetGateOrder={onSetGateOrder}
                  />
                );
              }
              return null;
            })}
          </div>

          <TrashDropZone visible={isDraggingPlacedGate} />
        </div>
        </div>
        </div>
      </div>

      {/* ── Gate control panel ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col gap-3 pb-5">
      <div className="space-y-1.5">
        {gates.length === 0 && (
          <div className="font-sans text-[12px] text-tier2">
            Drag a gate from the gateset to the wires, then click &quot;Check Solution&quot;.
          </div>
        )}

        {showParameterSlotHint && (
          <div className="font-sans text-[12px] text-tier2 border border-tier1 rounded-gate px-2 py-1.5 bg-bg-elevated">
            Choose <span className="font-semibold text-tier3">Vary θ</span> on the gate whose
            angle should vary before checking your solution.
          </div>
        )}

        {orderedGates
          .filter((g) => PARAMETERIZED_GATES.has(g.type))
          .map((g) => {
            // Panel only lists RX/RY/RZ; two-qubit order controls live on-chip.
            if (!("wire" in g)) return null;

            return (
              <div
                key={g.id}
                className="flex flex-wrap items-center gap-2 border-[1.5px] border-tier3 rounded-gate px-2 py-1.5 bg-bg-elevated"
              >
                <div className="flex items-center gap-2 shrink-0 w-24">
                  <div className="font-mono font-medium text-[10px] text-tier3 shrink-0">{g.type}</div>

                  {numberOfQubits > 1 ? (
                    <div className="flex flex-col font-mono text-[10px] text-tier2 leading-tight shrink-0">
                      <span>wire {g.wire}</span>
                      <span>order {g.column}</span>
                    </div>
                  ) : (
                    <span className="font-mono text-[10px] text-tier2 shrink-0">order {g.column}</span>
                  )}
                </div>

                <div className="self-stretch w-px shrink-0 bg-tier1" aria-hidden="true" />

                <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                  {showParameterSlotControls && onSetParameterSlot && (
                    <button
                      type="button"
                      onClick={() => onSetParameterSlot(g.id)}
                      aria-pressed={g.isParameterSlot === true}
                      className={[
                        "shrink-0 px-2 py-0.5 rounded-full font-sans text-[10px] font-medium border transition-colors",
                      g.isParameterSlot
                        ? "border-tier3 bg-bg-hover text-tier3"
                        : "border-tier1 bg-bg-panel text-text-muted hover:border-tier2 hover:text-tier2",
                      ].join(" ")}
                    >
                      Vary θ
                    </button>
                  )}

                  <div className="flex items-center gap-1 flex-wrap min-w-0">
                    <label className="font-mono text-[9px] text-tier2">θ:</label>
                    <input
                      type="range"
                      min={-2 * Math.PI}
                      max={2 * Math.PI}
                      step={0.01}
                      className="w-24 accent-tier3"
                      value={g.theta ?? 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) onSetGateTheta(g.id, val);
                      }}
                    />
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="rad"
                      className={`${controlInputClass} w-16`}
                      value={g.theta !== undefined ? g.theta : ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) onSetGateTheta(g.id, val);
                      }}
                    />
                    <button
                      onClick={() => onSetGateTheta(g.id, -(g.theta ?? 0))}
                      title="Negate angle"
                      className="px-1.5 py-0.5 font-mono text-[9px] border border-tier1 rounded-gate text-tier2 hover:bg-bg-hover"
                    >
                      ±
                    </button>
                    {THETA_PRESETS.map(({ label, value }) => (
                      <button
                        key={label}
                        onClick={() => onSetGateTheta(g.id, value)}
                        className="px-1.5 py-0.5 font-mono text-[9px] border border-tier1 rounded-gate text-tier2 hover:bg-bg-hover"
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => onRemoveGate(g.id)}
                    className="ml-auto shrink-0 font-sans text-xs text-error-action hover:text-error-action/80"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      <div className="flex flex-col gap-2 bg-bg-panel rounded-panel p-2">
        <button
          onClick={onCheck}
          disabled={isChecking || gates.length === 0}
          className="w-full py-1.5 bg-tier3/5 border border-tier3/35 rounded-gate font-mono text-[12px] uppercase text-text-body tracking-[0.05em] hover:bg-tier3/10 hover:border-tier3/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isChecking ? "CHECKING..." : "CHECK SOLUTION"}
        </button>
        <button
          onClick={onClear}
          className="w-full py-1 bg-transparent border border-tier1 rounded-gate font-mono text-[12px] uppercase text-text-muted hover:border-tier2 hover:text-tier2 transition-colors"
        >
          CLEAR CIRCUIT
        </button>
        {showSkip && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-1 bg-transparent border border-tier1/50 rounded-gate font-mono text-[11px] uppercase text-text-faint hover:border-tier1 hover:text-text-secondary transition-colors"
          >
            ⏭ Skip this level
          </button>
        )}
      </div>
      </div>
    </div>
  );
}

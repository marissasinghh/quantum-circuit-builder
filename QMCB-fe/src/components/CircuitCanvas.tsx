/**
 * Circuit Canvas: contains SVG visualization and gate controls.
 */

import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";

import { Gate, type PlacedGate, type PlacedSingleQubitGate, type ControlTargetOrder } from "../types/global";
import { DroppableStrip, TrashDropZone } from "./DragAndDropWrappers";
import { SortablePlacedGate } from "./SortablePlacedGate";
import {
  SortablePlacedMultiQubitGate,
  multiQubitGlyphDimensions,
} from "./SortablePlacedMultiQubitGate";
import { allowedOrdersFor } from "../config/gates";
import { gatesInColumnOrder } from "../utils/circuit";
import {
  buildWireContainers,
  isSingleQubitGate,
  isMultiQubitGate,
  MULTI_QUBIT_OWNER_WIRE,
  type WireContainers,
} from "../utils/placedGateDrag";
import { colors, fonts } from "../design-tokens";
import { Tooltip } from "./Tooltip";

interface CircuitCanvasProps {
  gates: PlacedGate[];
  numberOfQubits: number;
  dragContainers?: WireContainers | null;
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
}

const TWO_QUBIT_GATES = new Set<Gate>([Gate.CNOT, Gate.CNOT_FLIPPED, Gate.CONTROLLED_Z, Gate.SWAP]);
const PARAMETERIZED_GATES = new Set<Gate>([Gate.RX, Gate.RY, Gate.RZ]);

const THETA_PRESETS = [
  { label: "π/4", value: Math.PI / 4 },
  { label: "π/2", value: Math.PI / 2 },
  { label: "π",   value: Math.PI },
  { label: "2π",  value: 2 * Math.PI },
] as const;

const LABEL_PAD = 36;
const PAD_X = 100;
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
  dragContainers = null,
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
}: CircuitCanvasProps) {
  const COL_W = 90;
  const orderedGates = gatesInColumnOrder(gates);
  const columnCount = orderedGates.length > 0 ? orderedGates[orderedGates.length - 1].column + 1 : 1;
  const CANVAS_W = Math.max(600, PAD_X * 2 + columnCount * COL_W);
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

  const wireContainers = dragContainers ?? buildWireContainers(gates, numberOfQubits);
  const gateById = new Map(gates.map((g) => [g.id, g]));

  return (
    <div className="flex flex-1 flex-col min-h-0 gap-3">
      <div className="relative flex-1 min-h-[180px] min-w-0 rounded-panel bg-[#090f1d]">
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
          {wireYs.map((y, i) => (
            <DroppableStrip key={i} id={`drop-wire-${i}`} top={y - 20} height={40} />
          ))}

          {/* Full-width wires — span drop zone, independent of gate count */}
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

          {wireYs.length > 0 && (
            <SortableContext
              key="sortable-wire-0"
              items={wireContainers[MULTI_QUBIT_OWNER_WIRE] ?? []}
              strategy={horizontalListSortingStrategy}
            >
              <div className="absolute inset-0 z-20 pointer-events-none">
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ top: wireYs[0] - 20, height: 40 }}
                >
                  {(wireContainers[0] ?? []).map((gateId) => {
                    const g = gateById.get(gateId);
                    if (!g || !isSingleQubitGate(g)) return null;
                    const left = PAD_X + g.column * COL_W - SQ_W / 2;
                    return (
                      <SortablePlacedGate
                        key={gateId}
                        gate={g as PlacedSingleQubitGate}
                        left={left}
                        top={20 - SQ_H / 2}
                        onRemoveGate={onRemoveGate}
                      />
                    );
                  })}
                </div>
                {(wireContainers[0] ?? []).map((gateId) => {
                  const g = gateById.get(gateId);
                  if (!g || !isMultiQubitGate(g) || !("order" in g)) return null;
                  const { width, height } = multiQubitGlyphDimensions(g.type, numberOfQubits, wireSpan);
                  const left = PAD_X + g.column * COL_W - width / 2;
                  return (
                    <SortablePlacedMultiQubitGate
                      key={gateId}
                      gate={g}
                      left={left}
                      top={wireTop - 12}
                      width={width}
                      height={height}
                      onRemoveGate={onRemoveGate}
                    />
                  );
                })}
              </div>
            </SortableContext>
          )}

          {wireYs.map((y, wireIndex) => {
            if (wireIndex === 0) return null;
            const wireIds = wireContainers[wireIndex] ?? [];
            return (
              <div
                key={`sortable-wire-${wireIndex}`}
                className="absolute left-0 right-0 z-20"
                style={{ top: y - 20, height: 40 }}
              >
                <SortableContext items={wireIds} strategy={horizontalListSortingStrategy}>
                  {wireIds.map((gateId) => {
                    const g = gateById.get(gateId);
                    if (!g || !isSingleQubitGate(g)) return null;
                    const left = PAD_X + g.column * COL_W - SQ_W / 2;
                    return (
                      <SortablePlacedGate
                        key={gateId}
                        gate={g as PlacedSingleQubitGate}
                        left={left}
                        top={20 - SQ_H / 2}
                        onRemoveGate={onRemoveGate}
                      />
                    );
                  })}
                </SortableContext>
              </div>
            );
          })}

          <TrashDropZone visible={isDraggingPlacedGate} />
        </div>
        </div>
        </div>
      </div>

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

        {orderedGates.map((g) => {
          const isTwoQubit = TWO_QUBIT_GATES.has(g.type);
          const isParameterized = !isTwoQubit && PARAMETERIZED_GATES.has(g.type);
          const orders = isTwoQubit ? allowedOrdersFor(g.type as Gate) : [];

          return (
            <div
              key={g.id}
              className="flex flex-wrap items-center gap-2 border-[1.5px] border-tier3 rounded-gate px-2 py-1.5 bg-bg-elevated"
            >
              <div className="flex items-center gap-2 shrink-0 w-24">
                <div className="font-mono font-medium text-[10px] text-tier3 shrink-0">{g.type}</div>

                {!isTwoQubit && "wire" in g && numberOfQubits > 1 ? (
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
                {isTwoQubit && "order" in g && (
                  <>
                    <label className="font-sans text-[10px] text-tier2 shrink-0">Order:</label>
                    <select
                      className={controlInputClass}
                      value={`${g.order[0]}-${g.order[1]}`}
                      onChange={(e) => {
                        const [a, b] = e.target.value
                          .split("-")
                          .map(Number) as unknown as ControlTargetOrder;
                        onSetGateOrder(g.id, [a, b] as ControlTargetOrder);
                      }}
                    >
                      {orders.map((o) => (
                        <option key={`${o[0]}-${o[1]}`} value={`${o[0]}-${o[1]}`}>
                          [{o[0]},{o[1]}]
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {showParameterSlotControls && isParameterized && "wire" in g && onSetParameterSlot && (
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

                {isParameterized && "wire" in g && (
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
                )}

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

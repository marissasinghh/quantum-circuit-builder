/**
 * Circuit Canvas: contains SVG visualization and gate controls.
 */

import { Gate, type PlacedGate, type ControlTargetOrder } from "../types/global";
import { CNOTGlyph, ControlledZGlyph, HGlyph, TGlyph, SGlyph, RXGlyph, RYGlyph, RZGlyph, UGlyph, XGlyph, SqrtXGlyph } from "./GateDesign";
import { DroppableStrip } from "./DragAndDropWrappers";
import { allowedOrdersFor } from "../config/gates";
import { colors, fonts } from "../design-tokens";
import { Tooltip } from "./Tooltip";

interface CircuitCanvasProps {
  gates: PlacedGate[];
  numberOfQubits: number;
  onRemoveGate: (id: string) => void;
  onSetGateOrder: (id: string, order: ControlTargetOrder) => void;
  onSetGateTheta: (id: string, theta: number) => void;
  onCheck: () => void;
  onClear: () => void;
  isChecking: boolean;
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
const ANGLE_PILL_BORDER = "#2a4a6f";
const WIRE_COLOR = colors.wire;

const controlInputClass =
  "bg-bg-elevated border border-tier1 rounded-gate px-1 py-0.5 text-[10px] font-mono text-tier2 focus:border-tier3 outline-none";

function computeWireYs(numberOfQubits: number): number[] {
  if (numberOfQubits === 1) {
    return [CANVAS_H / 2];
  }
  return [CANVAS_H * 0.38, CANVAS_H * 0.62];
}

export function CircuitCanvas({
  gates,
  numberOfQubits,
  onRemoveGate,
  onSetGateOrder,
  onSetGateTheta,
  onCheck,
  onClear,
  isChecking,
}: CircuitCanvasProps) {
  const COL_W = 90;
  const CANVAS_W = Math.max(600, PAD_X * 2 + Math.max(1, gates.length) * COL_W);

  const wireYs = computeWireYs(numberOfQubits);
  const wireTop = wireYs[0];
  const wireSpan = wireYs.length > 1 ? wireYs[wireYs.length - 1] - wireYs[0] : 0;

  const CNOT_W = 80;
  const CNOT_H = wireSpan > 0 ? wireSpan + 24 : SQ_H + 12;

  return (
    <div className="flex flex-1 flex-col min-h-0 gap-3">
      <div className="relative flex-1 min-h-[180px] min-w-0 rounded-panel bg-[#090f1d]">
        <Tooltip id="circuit-canvas">
          A qubit is the quantum version of a classical bit. Unlike a bit which is always 0 or 1, a
          qubit can exist in a superposition of both until it is measured.
        </Tooltip>
        <div className="absolute inset-0 overflow-x-auto overflow-y-hidden rounded-panel">
        <div
          className="relative w-full h-full"
          style={{ minWidth: CANVAS_W, height: CANVAS_H }}
        >
          {wireYs.map((y, i) => (
            <DroppableStrip key={i} id={`drop-wire-${i}`} top={y - 20} height={40} />
          ))}

          {/* Full-width wires — span drop zone, independent of gate count */}
          {wireYs.map((y, i) => (
            <div
              key={`wire-${i}`}
              className="absolute left-[36px] right-0 pointer-events-none"
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
                  boxShadow: "0 0 6px rgba(89, 155, 195, 0.28)",
                }}
              />
            </div>
          ))}

          <svg
            width={CANVAS_W}
            height={CANVAS_H}
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

            {gates.map((g, i) => {
            const xCenter = PAD_X + i * COL_W;

            if (TWO_QUBIT_GATES.has(g.type) && "order" in g) {
              let GlyphComponent = CNOTGlyph;
              if (g.type === Gate.CONTROLLED_Z) {
                GlyphComponent = ControlledZGlyph;
              }

              return (
                <g key={g.id} transform={`translate(${xCenter - CNOT_W / 2}, ${wireTop - 12})`}>
                  <GlyphComponent order={g.order} width={CNOT_W} height={CNOT_H} />
                </g>
              );
            }

            if ("wire" in g) {
              const y = wireYs[g.wire];
              const x = xCenter - SQ_W / 2;
              const isParameterized = PARAMETERIZED_GATES.has(g.type);
              const thetaLabel =
                g.theta !== undefined
                  ? `${((g.theta * 180) / Math.PI).toFixed(0)}°`
                  : null;

              return (
                <g key={g.id} transform={`translate(${x}, ${y - SQ_H / 2})`}>
                  {isParameterized && thetaLabel && (
                    <g transform={`translate(${SQ_W / 2}, -11)`}>
                      <rect
                        x={-22}
                        y={-9}
                        width={44}
                        height={14}
                        rx={8}
                        fill={colors.grid}
                        stroke={ANGLE_PILL_BORDER}
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily={fonts.mono}
                        fontSize={9}
                        fill={colors.cyanMuted}
                      >
                        {thetaLabel}
                      </text>
                    </g>
                  )}
                  {(() => {
                    switch (g.type) {
                      case Gate.X:
                        return <XGlyph width={SQ_W} height={SQ_H} />;
                      case Gate.SQRT_X:
                        return <SqrtXGlyph width={SQ_W} height={SQ_H} />;
                      case Gate.S:
                        return <SGlyph width={SQ_W + 8} height={SQ_H} />;
                      case Gate.T:
                        return <TGlyph width={SQ_W + 8} height={SQ_H} />;
                      case Gate.H:
                        return <HGlyph width={SQ_W} height={SQ_H} />;
                      case Gate.RX:
                        return <RXGlyph width={SQ_W + 4} height={SQ_H} />;
                      case Gate.RY:
                        return <RYGlyph width={SQ_W + 4} height={SQ_H} />;
                      case Gate.RZ:
                        return <RZGlyph width={SQ_W + 8} height={SQ_H} />;
                      case Gate.U:
                        return <UGlyph width={SQ_W} height={SQ_H} />;
                      default:
                        return <HGlyph width={SQ_W} height={SQ_H} />;
                    }
                  })()}
                </g>
              );
            }

            return null;
          })}
          </svg>
        </div>
        </div>
      </div>

      <div className="shrink-0 flex flex-col gap-3 pb-5">
      <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
        {gates.length === 0 && (
          <div className="font-sans text-[12px] text-tier2">
            Drag a gate from the toolbox to the wires, then click &quot;Check Solution&quot;.
          </div>
        )}

        {gates.map((g, idx) => {
          const isTwoQubit = TWO_QUBIT_GATES.has(g.type);
          const isParameterized = !isTwoQubit && PARAMETERIZED_GATES.has(g.type);
          const orders = isTwoQubit ? allowedOrdersFor(g.type as Gate) : [];

          return (
            <div
              key={g.id}
              className="flex flex-wrap items-center gap-2 border-[1.5px] border-tier3 rounded-gate px-2 py-1.5 bg-bg-elevated"
            >
              <div className="font-mono font-medium text-[10px] text-tier3 w-24">{g.type}</div>

              {isTwoQubit && "order" in g && (
                <>
                  <label className="font-sans text-[10px] text-tier2">Order:</label>
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

              {!isTwoQubit && "wire" in g && (
                <div className="font-mono text-xs text-tier2">wire: {g.wire}</div>
              )}

              {isParameterized && "wire" in g && (
                <div className="flex items-center gap-1 flex-wrap">
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
                    step="0.001"
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

              <span className="font-mono text-xs text-tier2">col {idx}</span>
              <button
                onClick={() => onRemoveGate(g.id)}
                className="ml-auto font-sans text-xs text-error-action hover:text-error-action/80"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 bg-bg-panel rounded-panel p-2">
        <button
          onClick={onCheck}
          disabled={isChecking || gates.length === 0}
          className="w-full py-1.5 bg-tier3/5 border border-tier3/35 rounded-gate font-mono text-[12px] uppercase text-tier3 tracking-[0.05em] hover:bg-tier3/10 hover:border-tier3/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isChecking ? "CHECKING..." : "CHECK SOLUTION"}
        </button>
        <button
          onClick={onClear}
          className="w-full py-1 bg-transparent border border-tier1 rounded-gate font-mono text-[12px] uppercase text-text-muted hover:border-tier2 hover:text-tier2 transition-colors"
        >
          CLEAR CIRCUIT
        </button>
      </div>
      </div>
    </div>
  );
}

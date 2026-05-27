/**
 * Circuit Canvas: contains SVG visualization and gate controls.
 */

import { Gate, type PlacedGate, type ControlTargetOrder } from "../types/global";
import { CNOTGlyph, ControlledZGlyph, HGlyph, TGlyph, SGlyph, RXGlyph, RYGlyph, RZGlyph, UGlyph, XGlyph, SqrtXGlyph } from "./GateDesign";
import { DroppableStrip } from "./DragAndDropWrappers";
import { allowedOrdersFor } from "../config/gates";
import { colors, fonts } from "../design-tokens";

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

const controlInputClass =
  "bg-navy border border-grid rounded-gate px-1 py-0.5 text-[10px] font-mono text-cyan-muted focus:border-cyan outline-none";

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
  const PAD_X = 100;
  const WIRE_TOP_PAD = 80;
  const WIRE_SPACING = 80;
  const WIRE_BOTTOM_PAD = 90;
  const CANVAS_W = Math.max(600, PAD_X * 2 + Math.max(1, gates.length) * COL_W);
  const CANVAS_H = WIRE_TOP_PAD + (numberOfQubits - 1) * WIRE_SPACING + WIRE_BOTTOM_PAD;

  const wireYs = Array.from({ length: numberOfQubits }, (_, i) => WIRE_TOP_PAD + i * WIRE_SPACING);

  const CNOT_W = 80;
  const CNOT_H = WIRE_SPACING + 24;
  const SQ_W = 32;
  const SQ_H = 28;

  return (
    <div className="flex flex-1 flex-col min-h-0 gap-3">
      <div className="relative flex-1 min-h-0 overflow-x-auto overflow-y-hidden rounded-panel">
        {wireYs.map((y, i) => (
          <DroppableStrip key={i} id={`drop-wire-${i}`} top={y - 14} height={28} />
        ))}

        <svg width={CANVAS_W} height={CANVAS_H} className="block">
          <defs>
            <filter id="wireGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {wireYs.map((y, i) => (
            <text
              key={`label-${i}`}
              x={8}
              y={y + 4}
              fontSize={10}
              fontFamily={fonts.mono}
              fill={colors.cyan}
            >
              {`|q${i}⟩`}
            </text>
          ))}

          {wireYs.map((y, i) => (
            <line
              key={`wire-${i}`}
              x1={PAD_X}
              y1={y}
              x2={CANVAS_W - PAD_X}
              y2={y}
              stroke={colors.cyan}
              strokeWidth={1}
              filter="url(#wireGlow)"
            />
          ))}

          {gates.map((g, i) => {
            const xCenter = PAD_X + i * COL_W;

            if (TWO_QUBIT_GATES.has(g.type) && "order" in g) {
              let GlyphComponent = CNOTGlyph;
              if (g.type === Gate.CONTROLLED_Z) {
                GlyphComponent = ControlledZGlyph;
              }

              return (
                <g key={g.id} transform={`translate(${xCenter - CNOT_W / 2}, ${wireYs[0] - 12})`}>
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
                    <g transform={`translate(${SQ_W / 2}, -10)`}>
                      <rect
                        x={-20}
                        y={-8}
                        width={40}
                        height={14}
                        rx={10}
                        fill={colors.grid}
                      />
                      <text
                        x={0}
                        y={2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily={fonts.mono}
                        fontSize={8}
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

      <div className="space-y-1.5 shrink-0 max-h-[120px] overflow-y-auto">
        {gates.length === 0 && (
          <div className="font-sans text-[11px] text-slate">
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
              className="flex flex-wrap items-center gap-2 border border-grid rounded-gate px-2 py-1.5 bg-navy"
            >
              <div className="font-mono text-[10px] text-cyan w-24">{g.type}</div>

              {isTwoQubit && "order" in g && (
                <>
                  <label className="font-sans text-[10px] text-slate">Order:</label>
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
                <div className="font-mono text-[9px] text-slate">wire: {g.wire}</div>
              )}

              {isParameterized && "wire" in g && (
                <div className="flex items-center gap-1 flex-wrap">
                  <label className="font-mono text-[9px] text-slate">θ:</label>
                  <input
                    type="range"
                    min={-2 * Math.PI}
                    max={2 * Math.PI}
                    step={0.01}
                    className="w-24 accent-cyan"
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
                    className="px-1.5 py-0.5 font-mono text-[9px] border border-grid rounded-gate text-cyan-muted hover:bg-grid"
                  >
                    ±
                  </button>
                  {THETA_PRESETS.map(({ label, value }) => (
                    <button
                      key={label}
                      onClick={() => onSetGateTheta(g.id, value)}
                      className="px-1.5 py-0.5 font-mono text-[9px] border border-grid rounded-gate text-cyan-muted hover:bg-grid"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <span className="font-mono text-[9px] text-slate-muted">col {idx}</span>
              <button
                onClick={() => onRemoveGate(g.id)}
                className="ml-auto font-mono text-[9px] text-[#ef5350] hover:text-red-400"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 flex flex-col gap-2">
        <button
          onClick={onCheck}
          disabled={isChecking || gates.length === 0}
          className="w-full py-1.5 bg-navy border border-cyan rounded-gate font-mono text-[10px] text-cyan-muted tracking-[0.05em] hover:bg-grid disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isChecking ? "CHECKING..." : "CHECK SOLUTION"}
        </button>
        <button
          onClick={onClear}
          className="w-full py-1 bg-transparent border border-grid rounded-gate font-mono text-[10px] text-slate hover:border-cyan-muted hover:text-cyan-muted transition-colors"
        >
          CLEAR CIRCUIT
        </button>
      </div>
    </div>
  );
}

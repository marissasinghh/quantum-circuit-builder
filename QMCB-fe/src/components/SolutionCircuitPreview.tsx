import type { ReactNode } from "react";
import { Gate, type PlacedGate, type PlacedSingleQubitGate, type ControlTargetOrder } from "../types/global";
import { gatesInColumnOrder } from "../utils/circuit";
import { CANVAS_COL_W, CANVAS_PAD_X } from "../utils/canvasGeometry";
import { isSingleQubitGate } from "../utils/placedGateDrag";
import {
  CNOTGlyph,
  ControlledZGlyph,
  SwapGlyph,
  ToffoliGlyph,
  FredkinGlyph,
  HGlyph,
  TGlyph,
  SGlyph,
  RXGlyph,
  RYGlyph,
  RZGlyph,
  UGlyph,
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

/** Canvas / placed-gate canonical size — glyphs lay out text for this coordinate space. */
const CANONICAL_SINGLE_W = 44;
const CANONICAL_SINGLE_H = 40;

/** Mini preview display size (slightly larger than initial 20px for legibility). */
const PREVIEW_SINGLE_H = 26;
const PREVIEW_SINGLE_W = PREVIEW_SINGLE_H * (CANONICAL_SINGLE_W / CANONICAL_SINGLE_H);

const CANONICAL_MULTI_W = 80;
const CANONICAL_MULTI_H_2Q = 60;
const CANONICAL_MULTI_H_3Q = 90;

const PREVIEW_COL_W = 34;
/** Same horizontal scale as CircuitCanvas: PAD_X + column * COL_W − gateWidth/2. */
const PREVIEW_CANVAS_SCALE = PREVIEW_COL_W / CANVAS_COL_W;
const PREVIEW_PAD_X = CANVAS_PAD_X * PREVIEW_CANVAS_SCALE;
/** Wire lines start inset (canvas uses 36px label column before the wire run). */
const PREVIEW_WIRE_INSET = 36 * PREVIEW_CANVAS_SCALE;
const PREVIEW_PAD_Y = 6;
const PREVIEW_ROW_H = 28;

type PlacedMultiQubitGate = Extract<PlacedGate, { order: ControlTargetOrder }>;

/**
 * Renders a glyph at its canonical SVG size, then uniformly scales to the preview slot.
 * Avoids passing shrunk width/height into GateDesign (which ties viewBox to props but keeps
 * fixed fontSize values, causing overlap at small sizes).
 */
function ScaledPreviewGlyph({
  canonicalWidth,
  canonicalHeight,
  displayWidth,
  displayHeight,
  children,
}: {
  canonicalWidth: number;
  canonicalHeight: number;
  displayWidth: number;
  displayHeight: number;
  children: ReactNode;
}) {
  const scale = Math.min(displayWidth / canonicalWidth, displayHeight / canonicalHeight);

  return (
    <div
      className="relative overflow-visible"
      style={{ width: displayWidth, height: displayHeight }}
    >
      <div
        className="origin-top-left"
        style={{
          width: canonicalWidth,
          height: canonicalHeight,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SingleQubitPreviewGlyph({ gate }: { gate: PlacedSingleQubitGate }) {
  const w = CANONICAL_SINGLE_W;
  const h = CANONICAL_SINGLE_H;

  switch (gate.type) {
    case Gate.X:
      return <XGlyph width={w} height={h} />;
    case Gate.SQRT_X:
      return <SqrtXGlyph width={w} height={h} />;
    case Gate.S:
      return <SGlyph width={w} height={h} />;
    case Gate.T:
      return <TGlyph width={w} height={h} />;
    case Gate.H:
      return <HGlyph width={w} height={h} />;
    case Gate.RX:
      return <RXGlyph width={w} height={h} />;
    case Gate.RY:
      return <RYGlyph width={w} height={h} />;
    case Gate.RZ:
      return <RZGlyph width={w} height={h} />;
    case Gate.U:
      return <UGlyph width={w} height={h} />;
    case Gate.SQRT_X_DAG:
      return <SqrtXDagGlyph width={w} height={h} />;
    case Gate.Z:
      return <ZGlyph width={w} height={h} />;
    case Gate.Z_DAG:
      return <ZDagGlyph width={w} height={h} />;
    case Gate.S_DAG:
      return <SDagGlyph width={w} height={h} />;
    case Gate.T_DAG:
      return <TDagGlyph width={w} height={h} />;
    case Gate.H_DAG:
      return <HDagGlyph width={w} height={h} />;
    case Gate.Y:
      return <YGlyph width={w} height={h} />;
    case Gate.Y_DAG:
      return <YDagGlyph width={w} height={h} />;
    default:
      return <HGlyph width={w} height={h} />;
  }
}

function MultiQubitPreviewGlyph({
  gate,
  canonicalHeight,
}: {
  gate: PlacedMultiQubitGate;
  canonicalHeight: number;
}) {
  const w = CANONICAL_MULTI_W;
  const h = canonicalHeight;
  const order = gate.order;

  switch (gate.type as Gate) {
    case Gate.CONTROLLED_Z:
      return <ControlledZGlyph order={order} width={w} height={h} />;
    case Gate.SWAP:
      return <SwapGlyph order={order} width={w} height={h} />;
    case Gate.TOFFOLI:
      return <ToffoliGlyph width={w} height={h} />;
    case Gate.FREDKIN:
      return <FredkinGlyph width={w} height={h} />;
    case Gate.CONTROLLED_H:
      return <HGlyph width={CANONICAL_SINGLE_W} height={CANONICAL_SINGLE_H} />;
    case Gate.CONTROLLED_U:
      return <CNOTGlyph order={order} width={w} height={h} />;
    case Gate.CNOT:
    case Gate.CNOT_FLIPPED:
    default:
      return <CNOTGlyph order={order} width={w} height={h} />;
  }
}

interface SolutionCircuitPreviewProps {
  gates: PlacedGate[];
  numberOfQubits: number;
}

export function SolutionCircuitPreview({ gates, numberOfQubits }: SolutionCircuitPreviewProps) {
  const ordered = gatesInColumnOrder(gates);
  const maxColumn = ordered.reduce((max, g) => Math.max(max, g.column), 0);
  const canvasW = PREVIEW_PAD_X * 2 + maxColumn * PREVIEW_COL_W;
  const canvasH = PREVIEW_PAD_Y * 2 + numberOfQubits * PREVIEW_ROW_H;

  const multiCanonicalH =
    numberOfQubits >= 3 ? CANONICAL_MULTI_H_3Q : CANONICAL_MULTI_H_2Q;
  const multiDisplayH = numberOfQubits * PREVIEW_ROW_H;
  const multiDisplayW = CANONICAL_MULTI_W * (multiDisplayH / multiCanonicalH);

  return (
    <div
      className="relative overflow-hidden rounded-gate bg-[#090f1d] border border-tier1"
      style={{ width: canvasW, height: canvasH, maxWidth: "100%" }}
      aria-hidden
    >
      {Array.from({ length: numberOfQubits }, (_, wire) => (
        <div
          key={wire}
          className="absolute border-t border-tier1"
          style={{
            left: PREVIEW_WIRE_INSET,
            right: PREVIEW_WIRE_INSET,
            top: PREVIEW_PAD_Y + wire * PREVIEW_ROW_H + PREVIEW_ROW_H / 2,
          }}
        />
      ))}

      {ordered.map((gate) => {
        if (isSingleQubitGate(gate)) {
          const left = PREVIEW_PAD_X + gate.column * PREVIEW_COL_W - PREVIEW_SINGLE_W / 2;
          const top =
            PREVIEW_PAD_Y + gate.wire * PREVIEW_ROW_H + PREVIEW_ROW_H / 2 - PREVIEW_SINGLE_H / 2;

          return (
            <div
              key={gate.id}
              className="absolute overflow-visible"
              style={{ left, top }}
            >
              <ScaledPreviewGlyph
                canonicalWidth={CANONICAL_SINGLE_W}
                canonicalHeight={CANONICAL_SINGLE_H}
                displayWidth={PREVIEW_SINGLE_W}
                displayHeight={PREVIEW_SINGLE_H}
              >
                <SingleQubitPreviewGlyph gate={gate} />
              </ScaledPreviewGlyph>
            </div>
          );
        }

        const multiLeft = PREVIEW_PAD_X + gate.column * PREVIEW_COL_W - multiDisplayW / 2;
        const multiTop = PREVIEW_PAD_Y;

        return (
          <div
            key={gate.id}
            className="absolute overflow-visible"
            style={{ left: multiLeft, top: multiTop }}
          >
            <ScaledPreviewGlyph
              canonicalWidth={CANONICAL_MULTI_W}
              canonicalHeight={multiCanonicalH}
              displayWidth={multiDisplayW}
              displayHeight={multiDisplayH}
            >
              <MultiQubitPreviewGlyph gate={gate} canonicalHeight={multiCanonicalH} />
            </ScaledPreviewGlyph>
          </div>
        );
      })}
    </div>
  );
}

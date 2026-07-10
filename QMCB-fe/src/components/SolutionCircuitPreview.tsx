import { Gate, type PlacedGate, type PlacedSingleQubitGate, type ControlTargetOrder } from "../types/global";
import { gatesInColumnOrder } from "../utils/circuit";
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

const PREVIEW_PAD = 4;
const PREVIEW_COL_W = 28;
const PREVIEW_ROW_H = 22;
const SINGLE_GLYPH_SIZE = 20;
const MULTI_GLYPH_W = 36;
const MULTI_GLYPH_H = 28;

type PlacedMultiQubitGate = Extract<PlacedGate, { order: ControlTargetOrder }>;

function SingleQubitPreviewGlyph({
  gate,
  width,
  height,
}: {
  gate: PlacedSingleQubitGate;
  width: number;
  height: number;
}) {
  switch (gate.type) {
    case Gate.X:
      return <XGlyph width={width} height={height} />;
    case Gate.SQRT_X:
      return <SqrtXGlyph width={width} height={height} />;
    case Gate.S:
      return <SGlyph width={width} height={height} />;
    case Gate.T:
      return <TGlyph width={width} height={height} />;
    case Gate.H:
      return <HGlyph width={width} height={height} />;
    case Gate.RX:
      return <RXGlyph width={width} height={height} />;
    case Gate.RY:
      return <RYGlyph width={width} height={height} />;
    case Gate.RZ:
      return <RZGlyph width={width} height={height} />;
    case Gate.U:
      return <UGlyph width={width} height={height} />;
    case Gate.SQRT_X_DAG:
      return <SqrtXDagGlyph width={width} height={height} />;
    case Gate.Z:
      return <ZGlyph width={width} height={height} />;
    case Gate.Z_DAG:
      return <ZDagGlyph width={width} height={height} />;
    case Gate.S_DAG:
      return <SDagGlyph width={width} height={height} />;
    case Gate.T_DAG:
      return <TDagGlyph width={width} height={height} />;
    case Gate.H_DAG:
      return <HDagGlyph width={width} height={height} />;
    case Gate.Y:
      return <YGlyph width={width} height={height} />;
    case Gate.Y_DAG:
      return <YDagGlyph width={width} height={height} />;
    default:
      return <HGlyph width={width} height={height} />;
  }
}

function MultiQubitPreviewGlyph({
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
      return <HGlyph width={width} height={height} />;
    case Gate.CONTROLLED_U:
      return <CNOTGlyph order={order} width={width} height={height} />;
    case Gate.CNOT:
    case Gate.CNOT_FLIPPED:
    default:
      return <CNOTGlyph order={order} width={width} height={height} />;
  }
}

interface SolutionCircuitPreviewProps {
  gates: PlacedGate[];
  numberOfQubits: number;
}

export function SolutionCircuitPreview({ gates, numberOfQubits }: SolutionCircuitPreviewProps) {
  const ordered = gatesInColumnOrder(gates);
  const maxColumn = ordered.reduce((max, g) => Math.max(max, g.column), 0);
  const numCols = maxColumn + 1;
  const canvasW = PREVIEW_PAD * 2 + numCols * PREVIEW_COL_W;
  const canvasH = PREVIEW_PAD * 2 + numberOfQubits * PREVIEW_ROW_H;

  return (
    <div
      className="relative overflow-hidden rounded-gate bg-[#090f1d] border border-tier1"
      style={{ width: canvasW, height: canvasH, maxWidth: "100%" }}
      aria-hidden
    >
      {Array.from({ length: numberOfQubits }, (_, wire) => (
        <div
          key={wire}
          className="absolute left-0 right-0 border-t border-tier1"
          style={{ top: PREVIEW_PAD + wire * PREVIEW_ROW_H + PREVIEW_ROW_H / 2 }}
        />
      ))}

      {ordered.map((gate) => {
        const left = PREVIEW_PAD + gate.column * PREVIEW_COL_W - SINGLE_GLYPH_SIZE / 2;

        if (isSingleQubitGate(gate)) {
          const top =
            PREVIEW_PAD + gate.wire * PREVIEW_ROW_H + PREVIEW_ROW_H / 2 - SINGLE_GLYPH_SIZE / 2;
          return (
            <div
              key={gate.id}
              className="absolute flex items-center justify-center"
              style={{ left, top, width: SINGLE_GLYPH_SIZE, height: SINGLE_GLYPH_SIZE }}
            >
              <SingleQubitPreviewGlyph
                gate={gate}
                width={SINGLE_GLYPH_SIZE}
                height={SINGLE_GLYPH_SIZE}
              />
            </div>
          );
        }

        const multiLeft = PREVIEW_PAD + gate.column * PREVIEW_COL_W - MULTI_GLYPH_W / 2;
        const multiTop = PREVIEW_PAD;
        const multiHeight = numberOfQubits * PREVIEW_ROW_H;
        return (
          <div
            key={gate.id}
            className="absolute flex items-center justify-center"
            style={{
              left: multiLeft,
              top: multiTop,
              width: MULTI_GLYPH_W,
              height: multiHeight,
            }}
          >
            <MultiQubitPreviewGlyph
              gate={gate}
              width={MULTI_GLYPH_W}
              height={MULTI_GLYPH_H * numberOfQubits}
            />
          </div>
        );
      })}
    </div>
  );
}

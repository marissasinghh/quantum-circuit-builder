import React from "react";
import type { ControlTargetOrder } from "../types/global";
import { colors, fonts } from "../design-tokens";

const WIRE_COLOR = colors.grid;

/** Shared wire styling */
const Wire = ({ x1, x2, y }: { x1: number; x2: number; y: number }) => (
  <line x1={x1} y1={y} x2={x2} y2={y} stroke={WIRE_COLOR} strokeWidth={1} />
);

/** A tiny plus sign for the CNOT / Toffoli target circle */
const Plus = ({ cx, cy, r = 8 }: { cx: number; cy: number; r?: number }) => (
  <>
    <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={colors.cyan} strokeWidth={1.5} />
    <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={colors.cyan} strokeWidth={1.5} />
  </>
);

/** Diagonal × mark at a wire crossing (SWAP / Fredkin target) */
const XMark = ({ cx, cy, size = 7 }: { cx: number; cy: number; size?: number }) => (
  <>
    <line
      x1={cx - size}
      y1={cy - size}
      x2={cx + size}
      y2={cy + size}
      stroke={colors.cyan}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <line
      x1={cx + size}
      y1={cy - size}
      x2={cx - size}
      y2={cy + size}
      stroke={colors.cyan}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </>
);

/** Evenly spaced wire y-positions for multi-qubit glyphs */
function threeWireYs(height: number, pad = 10): [number, number, number] {
  const y0 = pad + 8;
  const y2 = height - pad - 8;
  const y1 = (y0 + y2) / 2;
  return [y0, y1, y2];
}

/** CNOT glyph: two wires + vertical link + control dot + target ⊕ */
export function CNOTGlyph({
  order = [0, 1],
  width = 80,
  height = 60,
  viewBox,
  className,
}: {
  order?: ControlTargetOrder;
  width?: number;
  height?: number;
  viewBox?: string;
  className?: string;
}) {
  const geomW = viewBox ? 80 : width;
  const geomH = viewBox ? 60 : height;
  const pad = 10;
  const yTop = 12;
  const yBot = geomH - 12;
  const cx = geomW / 2;

  const controlY = order[0] === 0 ? yTop : yBot;
  const targetY = order[1] === 1 ? yBot : yTop;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox ?? `0 0 ${geomW} ${geomH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-label="CNOT"
    >
      <Wire x1={pad} x2={geomW - pad} y={yTop} />
      <Wire x1={pad} x2={geomW - pad} y={yBot} />

      <line x1={cx} y1={yTop} x2={cx} y2={yBot} stroke={colors.cyan} strokeWidth={2} />

      <circle cx={cx} cy={controlY} r={5} fill={colors.cyan} />
      <circle cx={cx} cy={targetY} r={9} fill={colors.navy} stroke={colors.cyan} strokeWidth={2} />
      <Plus cx={cx} cy={targetY} r={5} />
    </svg>
  );
}

const GATESET_LABEL_FONT_SIZE = 13;
const GATESET_LABEL_LINE_HEIGHT = GATESET_LABEL_FONT_SIZE * 1.25;

/** Uniform inset around drawn geometry; smaller = larger tile glyph. */
const GATESET_CNOT_INSET = 0.75;
const GATESET_CNOT_WIRE_STUB = 3;

function gatesetCnotViewBox(order: ControlTargetOrder) {
  const cx = 40;
  const yTop = 12;
  const yBot = 48;
  const controlY = order[0] === 0 ? yTop : yBot;
  const targetY = order[1] === 1 ? yBot : yTop;
  const controlR = 5;
  const targetR = 9;
  const stroke = 2;

  const contentMinY = Math.min(controlY - controlR, targetY - targetR - stroke / 2);
  const contentMaxY = Math.max(controlY + controlR, targetY + targetR + stroke / 2);
  const contentMinX = cx - targetR - stroke / 2 - GATESET_CNOT_WIRE_STUB;
  const contentMaxX = cx + targetR + stroke / 2 + GATESET_CNOT_WIRE_STUB;

  return {
    x: contentMinX - GATESET_CNOT_INSET,
    y: contentMinY - GATESET_CNOT_INSET,
    width: contentMaxX - contentMinX + GATESET_CNOT_INSET * 2,
    height: contentMaxY - contentMinY + GATESET_CNOT_INSET * 2,
  };
}

/** CNOT at gateset-tile scale: fills label line height with equal padding on all sides. */
export function GatesetCNOTGlyph({
  order = [0, 1],
}: {
  order?: ControlTargetOrder;
}) {
  const crop = gatesetCnotViewBox(order);
  const height = GATESET_LABEL_LINE_HEIGHT;
  const width = height * (crop.width / crop.height);
  const viewBox = `${crop.x} ${crop.y} ${crop.width} ${crop.height}`;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-visible leading-none"
      style={{ height, width, fontSize: GATESET_LABEL_FONT_SIZE }}
    >
      <CNOTGlyph
        order={order}
        width={width}
        height={height}
        viewBox={viewBox}
        className="block h-full w-full shrink-0"
      />
    </span>
  );
}

/** Controlled-Z glyph: control dot + boxed Z target */
export function ControlledZGlyph({
  order = [0, 1],
  width = 80,
  height = 60,
}: {
  order?: ControlTargetOrder;
  width?: number;
  height?: number;
}) {
  const pad = 10;
  const yTop = 12;
  const yBot = height - 12;
  const cx = width / 2;

  const controlY = order[0] === 0 ? yTop : yBot;
  const targetY = order[1] === 1 ? yBot : yTop;

  const boxW = 20;
  const boxH = 20;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="Controlled-Z">
      <Wire x1={pad} x2={width - pad} y={yTop} />
      <Wire x1={pad} x2={width - pad} y={yBot} />

      <line x1={cx} y1={yTop} x2={cx} y2={yBot} stroke={colors.cyan} strokeWidth={2} />

      <rect
        x={cx - boxW / 2}
        y={targetY - boxH / 2}
        width={boxW}
        height={boxH}
        rx={4}
        ry={4}
        fill={colors.navy}
        stroke={colors.cyan}
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={targetY + 1}
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily={fonts.mono}
        fontSize={10}
        fontWeight={700}
        fill={colors.cyanMuted}
      >
        Z
      </text>

      <circle cx={cx} cy={controlY} r={5} fill={colors.cyan} />
    </svg>
  );
}

/** Toffoli (CCX) glyph: controls on wires 0 & 1, ⊕ target on wire 2 */
export function ToffoliGlyph({
  width = 80,
  height = 90,
}: {
  width?: number;
  height?: number;
}) {
  const pad = 10;
  const [y0, y1, y2] = threeWireYs(height, pad);
  const cx = width / 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="Toffoli">
      <Wire x1={pad} x2={width - pad} y={y0} />
      <Wire x1={pad} x2={width - pad} y={y1} />
      <Wire x1={pad} x2={width - pad} y={y2} />

      <line x1={cx} y1={y0} x2={cx} y2={y2} stroke={colors.cyan} strokeWidth={2} />

      <circle cx={cx} cy={y0} r={5} fill={colors.cyan} />
      <circle cx={cx} cy={y1} r={5} fill={colors.cyan} />
      <circle cx={cx} cy={y2} r={9} fill={colors.navy} stroke={colors.cyan} strokeWidth={2} />
      <Plus cx={cx} cy={y2} r={5} />
    </svg>
  );
}

/** Fredkin (CSWAP) glyph: control on wire 0, SWAP (×) between wires 1 & 2 */
export function FredkinGlyph({
  width = 80,
  height = 90,
}: {
  width?: number;
  height?: number;
}) {
  const pad = 10;
  const [y0, y1, y2] = threeWireYs(height, pad);
  const cx = width / 2;
  const bridgeHalf = (y2 - y1) * 0.38;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="Fredkin">
      <Wire x1={pad} x2={width - pad} y={y0} />
      <Wire x1={pad} x2={width - pad} y={y1} />
      <Wire x1={pad} x2={width - pad} y={y2} />

      <line x1={cx} y1={y0} x2={cx} y2={y2} stroke={colors.cyan} strokeWidth={2} />

      <circle cx={cx} cy={y0} r={5} fill={colors.cyan} />

      <XMark cx={cx} cy={y1} />
      <XMark cx={cx} cy={y2} />

      {/* SWAP bridge: crossed diagonals between the two target wires */}
      <line
        x1={cx - bridgeHalf}
        y1={y1}
        x2={cx + bridgeHalf}
        y2={y2}
        stroke={colors.cyan}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <line
        x1={cx + bridgeHalf}
        y1={y1}
        x2={cx - bridgeHalf}
        y2={y2}
        stroke={colors.cyan}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** SWAP glyph: × on both wires */
export function SwapGlyph({
  width = 80,
  height = 60,
}: {
  width?: number;
  height?: number;
}) {
  const pad = 10;
  const yTop = 12;
  const yBot = height - 12;
  const cx = width / 2;
  const bridgeHalf = (yBot - yTop) * 0.38;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="SWAP">
      <Wire x1={pad} x2={width - pad} y={yTop} />
      <Wire x1={pad} x2={width - pad} y={yBot} />
      <XMark cx={cx} cy={yTop} />
      <XMark cx={cx} cy={yBot} />
      <line
        x1={cx - bridgeHalf}
        y1={yTop}
        x2={cx + bridgeHalf}
        y2={yBot}
        stroke={colors.cyan}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <line
        x1={cx + bridgeHalf}
        y1={yTop}
        x2={cx - bridgeHalf}
        y2={yBot}
        stroke={colors.cyan}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Single-qubit gate block (H, T, Rz, etc.) */
function GateBlock({
  label,
  subLabel,
  dagger,
  width = 44,
  height = 40,
}: {
  label: string;
  subLabel?: string;
  dagger?: boolean;
  width?: number;
  height?: number;
}) {
  const rx = 5;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label={dagger ? `${label}†` : label}>
      <rect
        x={0.75}
        y={0.75}
        width={width - 1.5}
        height={height - 1.5}
        rx={rx}
        ry={rx}
        fill={colors.navy}
        stroke={colors.cyan}
        strokeWidth={1.5}
      />
      <text
        x="50%"
        y={subLabel ? "42%" : "55%"}
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily={fonts.mono}
        fontSize={13}
        fontWeight={700}
        fill={colors.cyanMuted}
      >
        {label}
      </text>
      {subLabel && (
        <text
          x="50%"
          y="72%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontFamily={fonts.mono}
          fontSize={10}
          fill={colors.cyan}
        >
          {subLabel}
        </text>
      )}
      {dagger && (
        <text
          x={width - 4.5}
          y={5.5}
          dominantBaseline="hanging"
          textAnchor="end"
          fontFamily={fonts.mono}
          fontSize={9}
          fontWeight={700}
          fill={colors.cyan}
        >
          †
        </text>
      )}
    </svg>
  );
}

export function HGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="H" {...props} />;
}

export function TGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="T" {...props} />;
}

export function SGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="S" {...props} />;
}

export function RXGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="Rx" subLabel="θ" {...props} />;
}

export function RYGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="Ry" subLabel="θ" {...props} />;
}

export function UGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="U" {...props} />;
}

export function RZGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="Rz" subLabel="θ" {...props} />;
}

export function XGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="X" {...props} />;
}

export function SqrtXGlyph({
  width = 44,
  height = 40,
}: {
  width?: number;
  height?: number;
}) {
  const rx = 5;

  const xCenterX = width * 0.5;

  const overlineY = height * 0.24;
  const dipStartX = width * 0.22;
  const dipStartY = height * 0.61;
  const dipBotX = width * 0.30;
  const dipBotY = height * 0.79;
  const upStrokeTopX = width * 0.41;
  const overlineEndX = width * 0.59;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="√X">
      <rect
        x={0.75}
        y={0.75}
        width={width - 1.5}
        height={height - 1.5}
        rx={rx}
        ry={rx}
        fill={colors.navy}
        stroke={colors.cyan}
        strokeWidth={1.5}
      />
      <polyline
        points={`${dipStartX},${dipStartY} ${dipBotX},${dipBotY} ${upStrokeTopX},${overlineY} ${overlineEndX},${overlineY}`}
        fill="none"
        stroke={colors.cyan}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x={xCenterX}
        y="62%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily={fonts.mono}
        fontSize={13}
        fontWeight={700}
        fill={colors.cyanMuted}
      >
        X
      </text>
    </svg>
  );
}

export function SqrtXDagGlyph({
  width = 44,
  height = 40,
}: {
  width?: number;
  height?: number;
}) {
  const rx = 5;

  const xCenterX = width * 0.5;

  const overlineY = height * 0.24;
  const dipStartX = width * 0.22;
  const dipStartY = height * 0.61;
  const dipBotX = width * 0.30;
  const dipBotY = height * 0.79;
  const upStrokeTopX = width * 0.41;
  const overlineEndX = width * 0.59;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="√X†">
      <rect
        x={0.75}
        y={0.75}
        width={width - 1.5}
        height={height - 1.5}
        rx={rx}
        ry={rx}
        fill={colors.navy}
        stroke={colors.cyan}
        strokeWidth={1.5}
      />
      <polyline
        points={`${dipStartX},${dipStartY} ${dipBotX},${dipBotY} ${upStrokeTopX},${overlineY} ${overlineEndX},${overlineY}`}
        fill="none"
        stroke={colors.cyan}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x={xCenterX}
        y="62%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily={fonts.mono}
        fontSize={13}
        fontWeight={700}
        fill={colors.cyanMuted}
      >
        X
      </text>
      <text
        x={width - 4.5}
        y={5.5}
        dominantBaseline="hanging"
        textAnchor="end"
        fontFamily={fonts.mono}
        fontSize={9}
        fontWeight={700}
        fill={colors.cyan}
      >
        †
      </text>
    </svg>
  );
}

export function ZGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="Z" {...props} />;
}

export function YGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="Y" {...props} />;
}

export function ZDagGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="Z" dagger {...props} />;
}

export function YDagGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="Y" dagger {...props} />;
}

export function SDagGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="S" dagger {...props} />;
}

export function TDagGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="T" dagger {...props} />;
}

export function HDagGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="H" dagger {...props} />;
}

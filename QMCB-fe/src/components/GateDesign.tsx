import React from "react";
import type { ControlTargetOrder } from "../types/global";

const WIRE_COLOR = "#9CA3AF";

/** Shared wire styling */
const Wire = ({ x1, x2, y }: { x1: number; x2: number; y: number }) => (
  <line x1={x1} y1={y} x2={x2} y2={y} stroke={WIRE_COLOR} strokeWidth={2} />
);

/** A tiny plus sign for the CNOT target circle */
const Plus = ({ cx, cy, r = 8 }: { cx: number; cy: number; r?: number }) => (
  <>
    <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#111827" strokeWidth={2} />
    <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#111827" strokeWidth={2} />
  </>
);

/** CNOT glyph: two wires + vertical link + control dot + target ⊕
 * --> internal wires drawn at y=12 and y=height-12 for alignment on canvas. */
export function CNOTGlyph({
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

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="CNOT">
      <Wire x1={pad} x2={width - pad} y={yTop} />
      <Wire x1={pad} x2={width - pad} y={yBot} />

      <line x1={cx} y1={yTop} x2={cx} y2={yBot} stroke="#10B981" strokeWidth={3} />

      <circle cx={cx} cy={controlY} r={6} fill="#10B981" />
      <circle cx={cx} cy={targetY} r={10} fill="white" stroke="#10B981" strokeWidth={3} />
      <Plus cx={cx} cy={targetY} r={6} />
    </svg>
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

  // Box dimensions for the Z gate
  const boxW = 20;
  const boxH = 20;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="Controlled-Z">
      {/* Draw wires FIRST (bottom layer) */}
      <Wire x1={pad} x2={width - pad} y={yTop} />
      <Wire x1={pad} x2={width - pad} y={yBot} />

      {/* Vertical connecting line (behind box) */}
      <line x1={cx} y1={yTop} x2={cx} y2={yBot} stroke="#8B5CF6" strokeWidth={3} />

      {/* Target: boxed Z - drawn AFTER wires so it covers them */}
      <rect
        x={cx - boxW / 2}
        y={targetY - boxH / 2}
        width={boxW}
        height={boxH}
        rx={4}
        ry={4}
        fill="white"
        stroke="#8B5CF6"
        strokeWidth={2.5}
      />
      <text
        x={cx}
        y={targetY + 1}
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto"
        fontSize={12}
        fontWeight={600}
        fill="#8B5CF6"
      >
        Z
      </text>

      {/* Control dot - drawn LAST (top layer) */}
      <circle cx={cx} cy={controlY} r={6} fill="#8B5CF6" />
    </svg>
  );
}

/** Single-qubit gate block (H, T, Rz, etc.) */
function GateBlock({
  label,
  width = 54,
  height = 38,
}: {
  label: string;
  width?: number;
  height?: number;
}) {
  const rx = 8;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label={label}>
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        rx={rx}
        ry={rx}
        fill="white"
        stroke="#111827"
        strokeWidth={2}
      />
      <text
        x="50%"
        y="55%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto"
        fontSize={14}
        fill="#111827"
      >
        {label}
      </text>
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
  return <GateBlock label="Rx(θ)" {...props} />;
}

export function RYGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="Ry(θ)" {...props} />;
}

export function UGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="U" {...props} />;
}

export function RZGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="Rz(θ)" {...props} />;
}

export function XGlyph(props: { width?: number; height?: number }) {
  return <GateBlock label="X" {...props} />;
}

/**
 * √X glyph: the radical symbol is drawn as an SVG polyline so it does not
 * depend on system-font support for U+221A (the Windows system font ships
 * with an incomplete glyph that drops the overline). The "X" letter is
 * rendered separately at the same font size as every other GateBlock-based
 * glyph so the placed gate visually matches its siblings.
 */
export function SqrtXGlyph({
  width = 54,
  height = 38,
}: {
  width?: number;
  height?: number;
}) {
  const rx = 8;

  // X letter centered horizontally in the box.
  const xCenterX = width * 0.5;

  // √ shape — overline width matches the rendered width of "X" at fontSize=14
  // (≈ 18% of a 54px box). The hook + diagonal sit immediately to the left.
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
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        rx={rx}
        ry={rx}
        fill="white"
        stroke="#111827"
        strokeWidth={2}
      />
      <polyline
        points={`${dipStartX},${dipStartY} ${dipBotX},${dipBotY} ${upStrokeTopX},${overlineY} ${overlineEndX},${overlineY}`}
        fill="none"
        stroke="#111827"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x={xCenterX}
        y="62%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto"
        fontSize={14}
        fill="#111827"
      >
        X
      </text>
    </svg>
  );
}

import React from "react";
import type { ControlTargetOrder } from "../types/global";
import { colors, fonts } from "../design-tokens";

const WIRE_COLOR = colors.grid;

/** Shared wire styling */
const Wire = ({ x1, x2, y }: { x1: number; x2: number; y: number }) => (
  <line x1={x1} y1={y} x2={x2} y2={y} stroke={WIRE_COLOR} strokeWidth={1} />
);

/** A tiny plus sign for the CNOT target circle */
const Plus = ({ cx, cy, r = 8 }: { cx: number; cy: number; r?: number }) => (
  <>
    <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={colors.cyan} strokeWidth={1.5} />
    <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={colors.cyan} strokeWidth={1.5} />
  </>
);

/** CNOT glyph: two wires + vertical link + control dot + target ⊕ */
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

      <line x1={cx} y1={yTop} x2={cx} y2={yBot} stroke={colors.cyan} strokeWidth={2} />

      <circle cx={cx} cy={controlY} r={5} fill={colors.cyan} />
      <circle cx={cx} cy={targetY} r={9} fill={colors.navy} stroke={colors.cyan} strokeWidth={2} />
      <Plus cx={cx} cy={targetY} r={5} />
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

/** Single-qubit gate block (H, T, Rz, etc.) */
function GateBlock({
  label,
  subLabel,
  width = 44,
  height = 40,
}: {
  label: string;
  subLabel?: string;
  width?: number;
  height?: number;
}) {
  const rx = 5;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label={label}>
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

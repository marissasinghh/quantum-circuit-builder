/**
 * BlochSphere — SVG Bloch sphere with a proper 3D orthographic projection.
 *
 * Camera: azimuth −60°, elevation 30° (QuTiP / textbook standard).
 * All elements (axes, great circles, arrow) share a single project(x,y,z)
 * function so every state — including the −Y equator produced by SQRT_X|0⟩ —
 * is displayed at the correct position on the sphere surface.
 *
 * Cardinal states:
 *   |0⟩  → north pole (+Z, top)
 *   |1⟩  → south pole (−Z, bottom)
 *   |+⟩  → equator +X (lower-right)
 *   |−⟩  → equator −X (upper-left)
 *   |i⟩  → equator +Y (upper-right, into screen)
 *   |−i⟩ → equator −Y (lower-left, out of screen) ← SQRT_X|0⟩
 */

import React from "react";

interface BlochSphereProps {
  theta: number;
  phi: number;
}

// ---------------------------------------------------------------------------
// Canvas and sphere geometry
// ---------------------------------------------------------------------------
const SIZE = 240;
const CX = SIZE / 2; // 120
const CY = SIZE / 2; // 120
const R = 82;

// ---------------------------------------------------------------------------
// 3D orthographic projection
// Camera azimuth AZ = −60°, elevation EL = 30°.
//
// We derive two orthonormal screen-space basis vectors:
//   Right (R*): horizontal screen axis, positive = screen-right
//   Up (U*):   vertical screen axis,   positive = screen-up (= SVG −y)
//
// Then for any 3D Bloch-sphere point (x, y, z):
//   SVG x = CX + R · dot((x,y,z), right)
//   SVG y = CY − R · dot((x,y,z), up)
// ---------------------------------------------------------------------------
const AZ = -Math.PI / 3; // −60°
const EL =  Math.PI / 6; //  30°

const RX = -Math.sin(AZ); // = sin(60°) ≈ 0.866
const RY =  Math.cos(AZ); // = cos(60°) = 0.5
// RZ = 0

const UX = -Math.sin(EL) * Math.cos(AZ); // ≈ −0.25
const UY = -Math.sin(EL) * Math.sin(AZ); // ≈  0.433
const UZ =  Math.cos(EL);                // ≈  0.866

// View direction into the screen (away from camera), used for depth cueing.
// DVi = cos(EL)·cos(AZ), cos(EL)·sin(AZ), sin(EL)
const DVX = Math.cos(EL) * Math.cos(AZ); // ≈  0.433
const DVY = Math.cos(EL) * Math.sin(AZ); // ≈ −0.75
const DVZ = Math.sin(EL);                // =  0.5

/** Project a 3D unit-sphere point to SVG screen coordinates. */
function project(x: number, y: number, z: number): { x: number; y: number } {
  return {
    x: CX + R * (x * RX + y * RY),
    y: CY - R * (x * UX + y * UY + z * UZ),
  };
}

/**
 * Build two SVG path strings for one great circle on the unit sphere.
 *
 * dot(point, viewDir) ≤ 0  →  point faces the camera (front, solid line)
 * dot(point, viewDir) >  0  →  point faces away   (back,  dashed line)
 *
 * Each path is a collection of M/L segments; gaps naturally separate the
 * front and back arcs without any extra arc math.
 */
function makeCirclePaths(
  axis: "xy" | "xz" | "yz",
  n = 128,
): { front: string; back: string } {
  const pts: Array<{ sx: number; sy: number; front: boolean }> = [];

  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    let bx = 0, by = 0, bz = 0;
    if      (axis === "xy") { bx = Math.cos(t); by = Math.sin(t); }
    else if (axis === "xz") { bx = Math.cos(t); bz = Math.sin(t); }
    else                    { by = Math.cos(t); bz = Math.sin(t); }

    const depth = bx * DVX + by * DVY + bz * DVZ;
    const p = project(bx, by, bz);
    pts.push({ sx: p.x, sy: p.y, front: depth <= 0 });
  }

  function buildSegments(wantFront: boolean): string {
    const cmds: string[] = [];
    let inSegment = false;
    for (let i = 0; i < n; i++) {
      const cur  = pts[i];
      const next = pts[(i + 1) % n];
      if (cur.front === wantFront) {
        if (!inSegment) {
          cmds.push(`M ${cur.sx.toFixed(1)},${cur.sy.toFixed(1)}`);
          inSegment = true;
        }
        cmds.push(`L ${next.sx.toFixed(1)},${next.sy.toFixed(1)}`);
      } else {
        inSegment = false;
      }
    }
    return cmds.join(" ");
  }

  return { front: buildSegments(true), back: buildSegments(false) };
}

// Pre-compute great-circle paths once at module load (they are view-static).
const EQUATOR  = makeCirclePaths("xy"); // z = 0 plane
const MERID_XZ = makeCirclePaths("xz"); // y = 0 plane (through +X/−X poles)
const MERID_YZ = makeCirclePaths("yz"); // x = 0 plane (through +Y/−Y poles)

// ---------------------------------------------------------------------------
// Colour palette — muted so the arrow is always the focal point
// ---------------------------------------------------------------------------
const SPHERE_STROKE = "#6B7280"; // gray-500
const CIRCLE_BACK   = "#D1D5DB"; // gray-300 — back arcs (dashed)
const CIRCLE_FRONT  = "#9CA3AF"; // gray-400 — front arcs (solid)
const AXIS_STROKE   = "#D1D5DB"; // gray-300
const LABEL_MAIN    = "#374151"; // gray-700 — all state labels
const ARROW_COLOR   = "#10B981"; // emerald-500
const DOT_COLOR     = "#10B981";

const FONT = "ui-sans-serif, system-ui, -apple-system, sans-serif";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function BlochSphere({ theta, phi }: BlochSphereProps) {
  // -------------------------------------------------------------------------
  // Arrow: convert spherical (θ, φ) → 3D Bloch vector → projected SVG point
  // -------------------------------------------------------------------------
  const bx = Math.sin(theta) * Math.cos(phi);
  const by = Math.sin(theta) * Math.sin(phi);
  const bz = Math.cos(theta);
  const tip = project(bx, by, bz);

  // Arrowhead rotation: angle of the projected shaft in screen space
  const arrowAngleDeg = (Math.atan2(tip.y - CY, tip.x - CX) * 180) / Math.PI;

  // -------------------------------------------------------------------------
  // Axis endpoints (A · R beyond the unit sphere) and label positions (L · R)
  // -------------------------------------------------------------------------
  const A  = 1.18; // axis line extent
  const L  = 1.32; // state-label placement
  const LA = 1.50; // axis-letter placement (sits at arrow tip)

  const axZpos = project(0, 0,  A);
  const axZneg = project(0, 0, -A);
  const axXpos = project( A, 0, 0);
  const axXneg = project(-A, 0, 0);
  const axYpos = project(0,  A, 0);
  const axYneg = project(0, -A, 0);

  // State labels
  const lbZpos = project(0, 0,  L); // |0⟩ — top
  const lbZneg = project(0, 0, -L); // |1⟩ — bottom
  const lbXpos = project( L, 0, 0); // |+⟩ — lower-right
  const lbXneg = project(-L, 0, 0); // |−⟩ — upper-left
  const lbYpos = project(0,  L, 0); // |i⟩ — upper-right (into screen)
  const lbYneg = project(0, -L, 0); // |−i⟩ — lower-left (out of screen)

  // Axis letter tips
  const ltZ = project(0, 0,  LA);
  const ltX = project( LA, 0, 0);
  const ltY = project(0,  LA, 0);

  const thetaDeg = ((theta * 180) / Math.PI).toFixed(1);
  const phiDeg   = (((phi   * 180) / Math.PI) % 360).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Bloch Sphere
      </p>

      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-label={`Bloch sphere: theta=${thetaDeg}°, phi=${phiDeg}°`}
      >
        {/* ── 1. Axis lines (behind all other elements) ─────────────────── */}
        <line x1={axZneg.x} y1={axZneg.y} x2={axZpos.x} y2={axZpos.y}
              stroke={AXIS_STROKE} strokeWidth={1} />
        <line x1={axXneg.x} y1={axXneg.y} x2={axXpos.x} y2={axXpos.y}
              stroke={AXIS_STROKE} strokeWidth={1} />
        <line x1={axYneg.x} y1={axYneg.y} x2={axYpos.x} y2={axYpos.y}
              stroke={AXIS_STROKE} strokeWidth={1} />

        {/* ── 2. Back arcs of great circles (dashed, before sphere outline) */}
        <path d={EQUATOR.back}  fill="none" stroke={CIRCLE_BACK} strokeWidth={1} strokeDasharray="4 3" />
        <path d={MERID_XZ.back} fill="none" stroke={CIRCLE_BACK} strokeWidth={1} strokeDasharray="4 3" />
        <path d={MERID_YZ.back} fill="none" stroke={CIRCLE_BACK} strokeWidth={1} strokeDasharray="4 3" />

        {/* ── 3. Sphere silhouette ──────────────────────────────────────── */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={SPHERE_STROKE} strokeWidth={1.5} />

        {/* ── 4. Front arcs of great circles (solid, on top of outline) ─── */}
        <path d={EQUATOR.front}  fill="none" stroke={CIRCLE_FRONT} strokeWidth={1} />
        <path d={MERID_XZ.front} fill="none" stroke={CIRCLE_FRONT} strokeWidth={1} />
        <path d={MERID_YZ.front} fill="none" stroke={CIRCLE_FRONT} strokeWidth={1} />

        {/* ── 5. Axis labels ────────────────────────────────────────────── */}

        {/* --- Z axis --- */}
        {/* "z" letter at arrow tip */}
        <text x={ltZ.x + 4} y={ltZ.y}
              fontSize={9} fontFamily={FONT} fontStyle="italic" fill={LABEL_MAIN}
              textAnchor="start" dominantBaseline="middle">
          z
        </text>
        {/* |0⟩ state label */}
        <text x={lbZpos.x + 5} y={lbZpos.y}
              fontSize={11} fontFamily={FONT} fontWeight={600} fill={LABEL_MAIN}
              textAnchor="start" dominantBaseline="middle">
          |0⟩
        </text>
        {/* |1⟩ state label */}
        <text x={lbZneg.x + 5} y={lbZneg.y}
              fontSize={11} fontFamily={FONT} fontWeight={600} fill={LABEL_MAIN}
              textAnchor="start" dominantBaseline="middle">
          |1⟩
        </text>

        {/* --- X axis --- */}
        {/* "x" letter at arrow tip */}
        <text x={ltX.x + 4} y={ltX.y}
              fontSize={9} fontFamily={FONT} fontStyle="italic" fill={LABEL_MAIN}
              textAnchor="start" dominantBaseline="middle">
          x
        </text>
        {/* |+⟩ lower-right */}
        <text x={lbXpos.x + 4} y={lbXpos.y}
              fontSize={11} fontFamily={FONT} fontWeight={600} fill={LABEL_MAIN}
              textAnchor="start" dominantBaseline="middle">
          |+⟩
        </text>
        {/* |−⟩ upper-left */}
        <text x={lbXneg.x - 4} y={lbXneg.y}
              fontSize={11} fontFamily={FONT} fontWeight={600} fill={LABEL_MAIN}
              textAnchor="end" dominantBaseline="middle">
          |−⟩
        </text>

        {/* --- Y axis --- */}
        {/* "y" letter at arrow tip */}
        <text x={ltY.x + 4} y={ltY.y}
              fontSize={9} fontFamily={FONT} fontStyle="italic" fill={LABEL_MAIN}
              textAnchor="start" dominantBaseline="middle">
          y
        </text>
        {/* |i⟩ upper-right (into screen) */}
        <text x={lbYpos.x + 4} y={lbYpos.y}
              fontSize={11} fontFamily={FONT} fontWeight={600} fill={LABEL_MAIN}
              textAnchor="start" dominantBaseline="middle">
          |i⟩
        </text>
        {/* |−i⟩ lower-left (out of screen) */}
        <text x={lbYneg.x - 4} y={lbYneg.y}
              fontSize={11} fontFamily={FONT} fontWeight={600} fill={LABEL_MAIN}
              textAnchor="end" dominantBaseline="middle">
          |−i⟩
        </text>

        {/* ── 6. State arrow (always rendered on top) ───────────────────── */}
        <line
          x1={CX} y1={CY}
          x2={tip.x} y2={tip.y}
          stroke={ARROW_COLOR} strokeWidth={2.5} strokeLinecap="round"
        />
        {/* Arrowhead triangle, rotated to align with the shaft direction */}
        <polygon
          points="-6,-4 6,-4 0,6"
          fill={ARROW_COLOR}
          transform={`translate(${tip.x},${tip.y}) rotate(${arrowAngleDeg - 90})`}
        />
        <circle cx={tip.x} cy={tip.y} r={4} fill={DOT_COLOR} />
      </svg>

      <p className="text-xs text-gray-400 font-mono">
        θ = {thetaDeg}° &nbsp; φ = {phiDeg}°
      </p>
    </div>
  );
}

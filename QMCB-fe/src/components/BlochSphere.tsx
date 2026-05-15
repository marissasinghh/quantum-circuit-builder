/**
 * BlochSphere — SVG Bloch sphere with a proper 3D orthographic projection.
 *
 * Camera: azimuth +30°, elevation 30° (textbook / Nielsen-Chuang standard).
 * Axis orientation matches the reference diagram:
 *   +z  up          |0⟩ north pole, |1⟩ south pole
 *   +y  screen-right  |i⟩ right,     |−i⟩ left
 *   +x  toward viewer |+⟩ lower-left, |−⟩  upper-right
 */

import React from "react";

interface BlochSphereProps {
  theta: number;
  phi: number;
}

// ---------------------------------------------------------------------------
// Canvas and sphere geometry
// ---------------------------------------------------------------------------
const SIZE = 260;
const CX = SIZE / 2; // 130
const CY = SIZE / 2; // 130
const R = 82;

// ---------------------------------------------------------------------------
// 3D orthographic projection
// Camera azimuth AZ = +30°, elevation EL = 30°.
//
// We derive two orthonormal screen-space basis vectors:
//   Right (R*): horizontal screen axis, positive = screen-right
//   Up (U*):   vertical screen axis,   positive = screen-up (= SVG −y)
//
// Then for any 3D Bloch-sphere point (x, y, z):
//   SVG x = CX + R · dot((x,y,z), right)
//   SVG y = CY − R · dot((x,y,z), up)
// ---------------------------------------------------------------------------
const AZ =  Math.PI / 6; // +30°
const EL =  Math.PI / 6; //  30°

// Screen-right basis vector: perpendicular to view dir, in XY plane
const RX = -Math.sin(AZ); // = −sin(30°) = −0.5  →  +x maps to screen-left (toward viewer)
const RY =  Math.cos(AZ); // =  cos(30°) ≈  0.866 →  +y maps to screen-right

// Screen-up basis vector: perpendicular to view dir and Right
const UX = -Math.sin(EL) * Math.cos(AZ); // ≈ −0.433
const UY = -Math.sin(EL) * Math.sin(AZ); // = −0.25
const UZ =  Math.cos(EL);                // ≈  0.866

// Depth-test vector: camera position direction from scene centre.
// Negated relative to the "view into screen" convention so that
// front: dot(point, DV) ≤ 0 correctly identifies the +x/+y/+z hemisphere
// as the front-facing (solid) side.
const DVX = -Math.cos(EL) * Math.cos(AZ); // ≈ −0.75
const DVY = -Math.cos(EL) * Math.sin(AZ); // ≈ −0.433
const DVZ = -Math.sin(EL);               // = −0.5

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
 * dot(point, DV) ≤ 0  →  point faces the camera (front, solid line)
 * dot(point, DV) >  0  →  point faces away   (back,  dashed line)
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
const MERID_XZ = makeCirclePaths("xz"); // y = 0 plane (through |+⟩/|−⟩ poles)
const MERID_YZ = makeCirclePaths("yz"); // x = 0 plane (through |i⟩/|−i⟩ poles)

// ---------------------------------------------------------------------------
// Colour palette
// ---------------------------------------------------------------------------
const SPHERE_STROKE = "#6B7280"; // gray-500
const CIRCLE_BACK   = "#D1D5DB"; // gray-300 — back arcs (dashed)
const CIRCLE_FRONT  = "#9CA3AF"; // gray-400 — front arcs (solid)
const AXIS_STROKE   = "#D1D5DB"; // gray-300
const LABEL_MAIN    = "#374151"; // gray-700 — all state labels
const LABEL_AXIS    = "#6B7280"; // gray-500 — small axis letters
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
  // Axis endpoints and label positions
  // A  = axis line extent beyond unit sphere
  // L  = state-label placement radius
  // LA = axis-letter placement radius (at arrow tip)
  // -------------------------------------------------------------------------
  const A  = 1.18;
  const L  = 1.32;
  const LA = 1.50;

  const axZpos = project(0, 0,  A);
  const axZneg = project(0, 0, -A);
  const axXpos = project( A, 0, 0);
  const axXneg = project(-A, 0, 0);
  const axYpos = project(0,  A, 0);
  const axYneg = project(0, -A, 0);

  // State labels
  // +z → |0⟩ top-centre
  // −z → |1⟩ bottom-centre
  // +x → |+⟩ lower-left  (toward viewer)
  // −x → |−⟩ upper-right
  // +y → |i⟩ far right
  // −y → |−i⟩ far left
  const lbZpos = project(0, 0,  L);
  const lbZneg = project(0, 0, -L);
  const lbXpos = project( L, 0, 0);
  const lbXneg = project(-L, 0, 0);
  const lbYpos = project(0,  L, 0);
  const lbYneg = project(0, -L, 0);

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
        {/* ── 1. Axis lines ──────────────────────────────────────────────── */}
        <line x1={axZneg.x} y1={axZneg.y} x2={axZpos.x} y2={axZpos.y}
              stroke={AXIS_STROKE} strokeWidth={1} />
        <line x1={axXneg.x} y1={axXneg.y} x2={axXpos.x} y2={axXpos.y}
              stroke={AXIS_STROKE} strokeWidth={1} />
        <line x1={axYneg.x} y1={axYneg.y} x2={axYpos.x} y2={axYpos.y}
              stroke={AXIS_STROKE} strokeWidth={1} />

        {/* ── 2. Back arcs (dashed) ──────────────────────────────────────── */}
        <path d={EQUATOR.back}  fill="none" stroke={CIRCLE_BACK} strokeWidth={1} strokeDasharray="4 3" />
        <path d={MERID_XZ.back} fill="none" stroke={CIRCLE_BACK} strokeWidth={1} strokeDasharray="4 3" />
        <path d={MERID_YZ.back} fill="none" stroke={CIRCLE_BACK} strokeWidth={1} strokeDasharray="4 3" />

        {/* ── 3. Sphere silhouette ──────────────────────────────────────── */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={SPHERE_STROKE} strokeWidth={1.5} />

        {/* ── 4. Front arcs (solid) ──────────────────────────────────────── */}
        <path d={EQUATOR.front}  fill="none" stroke={CIRCLE_FRONT} strokeWidth={1} />
        <path d={MERID_XZ.front} fill="none" stroke={CIRCLE_FRONT} strokeWidth={1} />
        <path d={MERID_YZ.front} fill="none" stroke={CIRCLE_FRONT} strokeWidth={1} />

        {/* ── 5. Axis labels ────────────────────────────────────────────── */}

        {/* --- Z axis (up) --- */}
        <text x={ltZ.x + 4} y={ltZ.y}
              fontSize={9} fontFamily={FONT} fontStyle="italic" fill={LABEL_AXIS}
              textAnchor="start" dominantBaseline="middle">
          z
        </text>
        {/* |0⟩ — top, centred */}
        <text x={lbZpos.x} y={lbZpos.y - 4}
              fontSize={11} fontFamily={FONT} fontWeight={600} fill={LABEL_MAIN}
              textAnchor="middle" dominantBaseline="auto">
          |0⟩
        </text>
        {/* |1⟩ — bottom, centred */}
        <text x={lbZneg.x} y={lbZneg.y + 4}
              fontSize={11} fontFamily={FONT} fontWeight={600} fill={LABEL_MAIN}
              textAnchor="middle" dominantBaseline="hanging">
          |1⟩
        </text>

        {/* --- X axis (toward viewer, lower-left) --- */}
        <text x={ltX.x - 3} y={ltX.y + 10}
              fontSize={9} fontFamily={FONT} fontStyle="italic" fill={LABEL_AXIS}
              textAnchor="middle" dominantBaseline="hanging">
          x
        </text>
        {/* |+⟩ — lower-left, text to the left of the point */}
        <text x={lbXpos.x - 4} y={lbXpos.y}
              fontSize={11} fontFamily={FONT} fontWeight={600} fill={LABEL_MAIN}
              textAnchor="end" dominantBaseline="middle">
          |+⟩
        </text>
        {/* |−⟩ — upper-right, text to the right */}
        <text x={lbXneg.x + 4} y={lbXneg.y}
              fontSize={11} fontFamily={FONT} fontWeight={600} fill={LABEL_MAIN}
              textAnchor="start" dominantBaseline="middle">
          |−⟩
        </text>

        {/* --- Y axis (right) --- */}
        <text x={ltY.x + 4} y={ltY.y}
              fontSize={9} fontFamily={FONT} fontStyle="italic" fill={LABEL_AXIS}
              textAnchor="start" dominantBaseline="middle">
          y
        </text>
        {/* |i⟩ — far right, text to the right */}
        <text x={lbYpos.x + 4} y={lbYpos.y}
              fontSize={11} fontFamily={FONT} fontWeight={600} fill={LABEL_MAIN}
              textAnchor="start" dominantBaseline="middle">
          |i⟩
        </text>
        {/* |−i⟩ — far left, text anchored left of the point */}
        <text x={lbYneg.x - 4} y={lbYneg.y}
              fontSize={11} fontFamily={FONT} fontWeight={600} fill={LABEL_MAIN}
              textAnchor="end" dominantBaseline="middle">
          |−i⟩
        </text>

        {/* ── 6. State arrow ────────────────────────────────────────────── */}
        <line
          x1={CX} y1={CY}
          x2={tip.x} y2={tip.y}
          stroke={ARROW_COLOR} strokeWidth={2.5} strokeLinecap="round"
        />
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

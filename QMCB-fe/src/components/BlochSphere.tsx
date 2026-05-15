/**
 * BlochSphere — SVG Bloch sphere with a proper 3D orthographic projection.
 *
 * Camera: azimuth +30°, elevation 30° (textbook standard).
 * Axis convention:
 *   +z  up            |0⟩ north pole, |1⟩ south pole
 *   +y  screen-right  |i⟩ right,      |−i⟩ left
 *   +x  toward viewer |+⟩ lower-left, |−⟩  upper-right
 *
 * Labels are placed with projectOutward() which pushes every state label
 * to a fixed 2D distance from the SVG centre, guaranteeing they always
 * appear outside the sphere silhouette regardless of projection direction.
 */

import React from "react";

interface BlochSphereProps {
  theta: number;
  phi: number;
}

// ---------------------------------------------------------------------------
// Canvas constants
// ---------------------------------------------------------------------------
const SIZE = 300;
const CX   = SIZE / 2; // 150
const CY   = SIZE / 2; // 150
const R    = 90;        // sphere radius in SVG pixels

const DIST_LABEL = R + 14; // state labels: 14 px beyond sphere silhouette

// ---------------------------------------------------------------------------
// 3D orthographic projection — azimuth +30°, elevation 30°
//
//   RX, RY  = "screen right" basis vector
//   UX, UY, UZ = "screen up"   basis vector
//
//   SVG x = CX + R · (bx·RX + by·RY)
//   SVG y = CY − R · (bx·UX + by·UY + bz·UZ)
// ---------------------------------------------------------------------------
const AZ = Math.PI / 6; // 30°
const EL = Math.PI / 6; // 30°

const RX = -Math.sin(AZ); // −0.5   → +x projects screen-left (toward viewer)
const RY =  Math.cos(AZ); //  0.866 → +y projects screen-right

const UX = -Math.sin(EL) * Math.cos(AZ); // −0.433
const UY = -Math.sin(EL) * Math.sin(AZ); // −0.25
const UZ =  Math.cos(EL);                //  0.866

// Depth-test direction: negated so the +x/+y/+z hemisphere is front-facing.
const DVX = -Math.cos(EL) * Math.cos(AZ); // −0.75
const DVY = -Math.cos(EL) * Math.sin(AZ); // −0.433
const DVZ = -Math.sin(EL);               // −0.5

/** Project a 3D point to SVG coordinates. */
function project(x: number, y: number, z: number): { x: number; y: number } {
  return {
    x: CX + R * (x * RX + y * RY),
    y: CY - R * (x * UX + y * UY + z * UZ),
  };
}

/**
 * Project a 3D direction, then push the result outward from the SVG centre
 * to exactly `dist2D` pixels. This ensures labels always sit outside the
 * sphere silhouette, regardless of how "inside" their raw projection lands.
 */
function projectOutward(
  bx: number, by: number, bz: number, dist2D: number,
): { x: number; y: number } {
  const p  = project(bx, by, bz);
  const dx = p.x - CX;
  const dy = p.y - CY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: CX + (dx / len) * dist2D, y: CY + (dy / len) * dist2D };
}

// ---------------------------------------------------------------------------
// Great circle path builder
// ---------------------------------------------------------------------------
function makeCirclePaths(axis: "xy" | "xz" | "yz", n = 128): { front: string; back: string } {
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
    let inSeg = false;
    for (let i = 0; i < n; i++) {
      const cur  = pts[i];
      const next = pts[(i + 1) % n];
      if (cur.front === wantFront) {
        if (!inSeg) { cmds.push(`M ${cur.sx.toFixed(1)},${cur.sy.toFixed(1)}`); inSeg = true; }
        cmds.push(`L ${next.sx.toFixed(1)},${next.sy.toFixed(1)}`);
      } else { inSeg = false; }
    }
    return cmds.join(" ");
  }

  return { front: buildSegments(true), back: buildSegments(false) };
}

const EQUATOR  = makeCirclePaths("xy");
const MERID_XZ = makeCirclePaths("xz");
const MERID_YZ = makeCirclePaths("yz");

// ---------------------------------------------------------------------------
// Colour palette
// ---------------------------------------------------------------------------
const SPHERE_STROKE = "#6B7280";
const CIRCLE_BACK   = "#D1D5DB";
const CIRCLE_FRONT  = "#9CA3AF";
const AXIS_STROKE   = "#D1D5DB";
const LABEL_MAIN    = "#374151";
const LABEL_AXIS    = "#9CA3AF";
const ARROW_COLOR   = "#10B981";
const DOT_COLOR     = "#10B981";
const FONT = "ui-sans-serif, system-ui, -apple-system, sans-serif";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function BlochSphere({ theta, phi }: BlochSphereProps) {
  const bx = Math.sin(theta) * Math.cos(phi);
  const by = Math.sin(theta) * Math.sin(phi);
  const bz = Math.cos(theta);
  const tip = project(bx, by, bz);
  const arrowAngleDeg = (Math.atan2(tip.y - CY, tip.x - CX) * 180) / Math.PI;

  // Axis endpoints — exactly at sphere surface so lines stop at the equatorial cross-sections
  const A = 1.0;
  const axZpos = project(0, 0,  A);
  const axZneg = project(0, 0, -A);
  const axXpos = project( A, 0, 0);
  const axXneg = project(-A, 0, 0);
  const axYpos = project(0,  A, 0);
  const axYneg = project(0, -A, 0);

  // State labels — always outside the sphere silhouette
  const lbZpos = projectOutward(0, 0,  1, DIST_LABEL); // |0⟩ top
  const lbZneg = projectOutward(0, 0, -1, DIST_LABEL); // |1⟩ bottom
  const lbXpos = projectOutward( 1, 0, 0, DIST_LABEL); // |+⟩ lower-left
  const lbXneg = projectOutward(-1, 0, 0, DIST_LABEL); // |−⟩ upper-right
  const lbYpos = projectOutward(0,  1, 0, DIST_LABEL); // |i⟩ right
  const lbYneg = projectOutward(0, -1, 0, DIST_LABEL); // |−i⟩ left

  // Axis letters — placed at each positive axis endpoint (sphere surface),
  // nudged slightly sideways so they sit beside the axis line rather than on it.
  const ltZtip = project(0, 0,  1); // north pole projected point
  const ltXtip = project( 1, 0, 0); // +x equatorial point
  const ltYtip = project(0,  1, 0); // +y equatorial point

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
        {/* ── 1. Axis lines ── */}
        <line x1={axZneg.x} y1={axZneg.y} x2={axZpos.x} y2={axZpos.y} stroke={AXIS_STROKE} strokeWidth={1} />
        <line x1={axXneg.x} y1={axXneg.y} x2={axXpos.x} y2={axXpos.y} stroke={AXIS_STROKE} strokeWidth={1} />
        <line x1={axYneg.x} y1={axYneg.y} x2={axYpos.x} y2={axYpos.y} stroke={AXIS_STROKE} strokeWidth={1} />

        {/* ── 2. Back arcs (dashed) ── */}
        <path d={EQUATOR.back}  fill="none" stroke={CIRCLE_BACK} strokeWidth={1} strokeDasharray="4 3" />
        <path d={MERID_XZ.back} fill="none" stroke={CIRCLE_BACK} strokeWidth={1} strokeDasharray="4 3" />
        <path d={MERID_YZ.back} fill="none" stroke={CIRCLE_BACK} strokeWidth={1} strokeDasharray="4 3" />

        {/* ── 3. Sphere silhouette ── */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={SPHERE_STROKE} strokeWidth={1.5} />

        {/* ── 4. Front arcs (solid) ── */}
        <path d={EQUATOR.front}  fill="none" stroke={CIRCLE_FRONT} strokeWidth={1} />
        <path d={MERID_XZ.front} fill="none" stroke={CIRCLE_FRONT} strokeWidth={1} />
        <path d={MERID_YZ.front} fill="none" stroke={CIRCLE_FRONT} strokeWidth={1} />

        {/* ── 5. Labels ── */}

        {/* Z axis — +z label at north-pole tip, nudged right */}
        <text x={ltZtip.x + 6} y={ltZtip.y - 2} fontSize={9} fontFamily={FONT} fontStyle="italic"
              fill={LABEL_AXIS} textAnchor="start" dominantBaseline="auto">+z</text>
        <text x={lbZpos.x} y={lbZpos.y - 3} fontSize={11} fontFamily={FONT} fontWeight={600}
              fill={LABEL_MAIN} textAnchor="middle" dominantBaseline="auto">|0⟩</text>
        <text x={lbZneg.x} y={lbZneg.y + 3} fontSize={11} fontFamily={FONT} fontWeight={600}
              fill={LABEL_MAIN} textAnchor="middle" dominantBaseline="hanging">|1⟩</text>

        {/* X axis — +x label at equatorial cross-section tip (lower-left), nudged below */}
        <text x={ltXtip.x - 2} y={ltXtip.y + 10} fontSize={9} fontFamily={FONT} fontStyle="italic"
              fill={LABEL_AXIS} textAnchor="middle" dominantBaseline="hanging">+x</text>
        <text x={lbXpos.x - 4} y={lbXpos.y} fontSize={11} fontFamily={FONT} fontWeight={600}
              fill={LABEL_MAIN} textAnchor="end" dominantBaseline="middle">|+⟩</text>
        <text x={lbXneg.x + 4} y={lbXneg.y} fontSize={11} fontFamily={FONT} fontWeight={600}
              fill={LABEL_MAIN} textAnchor="start" dominantBaseline="middle">|−⟩</text>

        {/* Y axis — +y label at equatorial cross-section tip (right), nudged above */}
        <text x={ltYtip.x + 4} y={ltYtip.y - 8} fontSize={9} fontFamily={FONT} fontStyle="italic"
              fill={LABEL_AXIS} textAnchor="start" dominantBaseline="auto">+y</text>
        <text x={lbYpos.x + 4} y={lbYpos.y} fontSize={11} fontFamily={FONT} fontWeight={600}
              fill={LABEL_MAIN} textAnchor="start" dominantBaseline="middle">|i⟩</text>
        <text x={lbYneg.x - 4} y={lbYneg.y} fontSize={11} fontFamily={FONT} fontWeight={600}
              fill={LABEL_MAIN} textAnchor="end" dominantBaseline="middle">|−i⟩</text>

        {/* ── 6. State arrow ── */}
        <line x1={CX} y1={CY} x2={tip.x} y2={tip.y}
              stroke={ARROW_COLOR} strokeWidth={2.5} strokeLinecap="round" />
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

/**
 * Output Table: displays the circuit output truth table and validation results.
 */

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { TruthRow } from "../interfaces/truthTable";
import { Tooltip, TooltipMath } from "./Tooltip";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  formatAmplitudeMultiLine,
  formatAmplitudeOneLine,
  parseAmplitudeTerms,
} from "../utils/amplitudeDisplay";
import { basisInputLabel } from "../utils/trialUnitary";

/** Pixel floor so nested P(t)/P(e) mini-tables fit; forces outer table scroll when aside is narrow. */
const P_COL_MIN_WIDTH_PX = 80;

export interface GradingSummary {
  samplesChecked: number;
  samplesPassed: number;
}

export type OutputTableMode = "preview" | "graded";

const THETA_PRESETS = [
  { label: "π/4", value: Math.PI / 4 },
  { label: "π/2", value: Math.PI / 2 },
  { label: "π",   value: Math.PI },
  { label: "2π",  value: 2 * Math.PI },
] as const;

const controlInputClass =
  "bg-bg-elevated border border-tier1 rounded-gate px-1 py-0.5 text-[10px] font-mono text-tier2 focus:border-tier3 outline-none";

interface OutputTableProps {
  rows: TruthRow[] | null;
  isCorrect: boolean;
  error: Error | null;
  levelInsight?: ReactNode;
  isChecking?: boolean;
  onClearAndRetry?: () => void;
  /** Present for random-theta levels (Rx, Ry) where the backend grades via unitary comparison. */
  gradingSummary?: GradingSummary;
  /** Preview: live client-side trial rows without match indicators. Graded: post-Check-Solution. */
  mode?: OutputTableMode;
  /** When present (RANDOM_THETA levels), renders a theta slider inside the panel. */
  paramSlotGate?: { id: string; theta?: number };
  onSetGateTheta?: (id: string, theta: number) => void;
}

const CELL_CLASS = "px-3 py-1.5";

const EXPECTED_P_TOOLTIP_ID = "expected-p-probability";

function AmplitudeCell({ value }: { value: string }) {
  const terms = useMemo(() => parseAmplitudeTerms(value), [value]);
  const lines = useMemo(
    () =>
      terms.length <= 1
        ? [formatAmplitudeOneLine(terms)]
        : formatAmplitudeMultiLine(terms),
    [terms],
  );

  return (
    <div className="whitespace-normal overflow-hidden break-words min-w-0 max-w-full">
      {lines.map((line, i) => (
        <div key={i} className="block whitespace-normal break-words min-w-0">
          {line}
        </div>
      ))}
    </div>
  );
}

function ProbabilityCell({ probs }: { probs: readonly number[] | undefined }) {
  if (!probs?.length) return <>—</>;
  const qubitCount = Math.log2(probs.length);
  return (
    <div className="min-w-0 max-w-full">
      <table className="border-collapse">
        <tbody>
          {probs.map((p, i) => (
            <tr
              key={i}
              className={i < probs.length - 1 ? "border-b border-tier1" : undefined}
            >
              <td className="border-r border-tier1 px-1 py-0.5 whitespace-nowrap">
                {basisInputLabel(qubitCount, i)}
              </td>
              <td className="px-1 py-0.5 whitespace-nowrap">{p.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpectedPHeaderTooltip() {
  return (
    <Tooltip
      id={EXPECTED_P_TOOLTIP_ID}
      bottom={4}
      right={0}
      ariaLabel="Measurement probability info"
    >
      Measurement probabilities: the chance of observing each output state. Calculated as{" "}
      <TooltipMath>P = |amplitude|²</TooltipMath>. A definite state like{" "}
      <TooltipMath>|1⟩</TooltipMath> gives <TooltipMath>P = 1.000</TooltipMath>. A superposition
      splits probability across states. Your trial probabilities must match expected for the level
      to pass.
    </Tooltip>
  );
}

export function OutputTable({
  rows,
  isCorrect,
  error,
  levelInsight,
  isChecking = false,
  onClearAndRetry,
  gradingSummary,
  mode = "graded",
  paramSlotGate,
  onSetGateTheta,
}: OutputTableProps) {
  const isPreview = mode === "preview";
  const isRandomTheta = !!onSetGateTheta;
  // Match column in graded mode for all levels, including RANDOM_THETA (ok from API all_match).
  // Preview still hides Match. Partial "N/M rows match" banner stays fixed-level only —
  // Rx/Ry use the N/10 angles badge instead.
  const showRowMatch = !isPreview;
  const hasPartialMismatch =
    showRowMatch && !isRandomTheta && rows && rows.length > 0 && !isCorrect && !error;
  const matchCount = hasPartialMismatch ? rows.filter((r) => r.ok).length : 0;
  const totalRows = rows?.length ?? 0;

  return (
    <div className="w-full min-w-0 box-border">
      <div className="mb-2">
        <h2 className="panel-heading">
          CIRCUIT OUTPUT
        </h2>
      </div>

      {paramSlotGate && onSetGateTheta && (
        <div className="mb-3 flex items-center gap-1 flex-wrap min-w-0">
          <label className="font-mono text-[9px] text-tier2">θ (Vary θ gate):</label>
          <input
            type="range"
            min={-2 * Math.PI}
            max={2 * Math.PI}
            step={0.01}
            className="w-24 accent-tier3"
            value={paramSlotGate.theta ?? 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onSetGateTheta(paramSlotGate.id, val);
            }}
          />
          <input
            type="number"
            step="0.000001"
            placeholder="rad"
            className={`${controlInputClass} w-16`}
            value={paramSlotGate.theta !== undefined ? paramSlotGate.theta : ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onSetGateTheta(paramSlotGate.id, val);
            }}
          />
          <button
            type="button"
            onClick={() => onSetGateTheta(paramSlotGate.id, -(paramSlotGate.theta ?? 0))}
            title="Negate angle"
            className="px-1.5 py-0.5 font-mono text-[9px] border border-tier1 rounded-gate text-tier2 hover:bg-bg-hover"
          >
            ±
          </button>
          {THETA_PRESETS.map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => onSetGateTheta(paramSlotGate.id, value)}
              className="px-1.5 py-0.5 font-mono text-[9px] border border-tier1 rounded-gate text-tier2 hover:bg-bg-hover"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {isCorrect && !isPreview && !isRandomTheta && (
        <div className="mb-3 bg-match-bg border border-tier1 rounded-md px-3 py-2 text-sm font-sans text-text-body">
          All rows match — circuit verified ✓
        </div>
      )}

      {hasPartialMismatch && (
        <div className="mb-3 bg-mismatch-bg border border-tier1 rounded-md px-3 py-2">
          <p className="text-sm font-sans text-mismatch-text font-medium">
            {matchCount}/{totalRows} rows match
          </p>
          {onClearAndRetry && (
            <button
              type="button"
              onClick={onClearAndRetry}
              className="mt-2 font-mono text-[10px] tracking-wide uppercase px-3 py-1.5 border border-tier1 rounded-gate text-tier3 hover:bg-bg-hover transition"
            >
              Clear and try again
            </button>
          )}
        </div>
      )}

      {gradingSummary && !error && !isPreview && (
        <div
          className={`mb-3 border border-tier1 rounded-md px-3 py-2 ${
            isCorrect ? "bg-match-bg" : "bg-mismatch-bg"
          }`}
        >
          <p
            className={`text-sm font-sans font-medium ${
              isCorrect ? "text-text-body" : "text-mismatch-text"
            }`}
          >
            {gradingSummary.samplesPassed}/{gradingSummary.samplesChecked} angles passed
            {isCorrect ? " — circuit verified ✓" : ""}
          </p>
          {!isCorrect && onClearAndRetry && (
            <button
              type="button"
              onClick={onClearAndRetry}
              className="mt-2 font-mono text-[10px] tracking-wide uppercase px-3 py-1.5 border border-tier1 rounded-gate text-tier3 hover:bg-bg-hover transition"
            >
              Clear and try again
            </button>
          )}
        </div>
      )}

      {isChecking && (
        <div className="mb-3 flex items-center gap-2 bg-bg-panel border border-tier1 rounded-md px-3 py-2">
          <LoadingSpinner size={16} />
          <span className="font-sans text-[12px] text-tier2">Checking circuit…</span>
        </div>
      )}

      {levelInsight}

      {error && (
        <div className="font-sans text-[12px] text-error-action mb-2">{error.message}</div>
      )}

      {!rows && !error && !isCorrect && !gradingSummary && (
        <div className="font-sans text-[12px] text-tier2">
          {isPreview
            ? "Build a circuit to preview outputs."
            : "Submit to see the truth tables."}
        </div>
      )}

      {rows && (
        <>
          {/*
            Outer relative + pb-8: room for the absolute corner tooltip trigger.
            Inner overflow-x-auto: wide tables scroll inside the panel instead of
            painting past the border. Tooltip popups portal to document.body, so
            they do not need overflow-visible on these wrappers.
          */}
          <div
            className={`relative w-full min-w-0 box-border pb-8${isChecking ? " opacity-50" : ""}`}
          >
            <div className="w-full min-w-0 overflow-x-auto">
              <table
                className="font-mono text-[10px] w-full min-w-0 border-collapse"
                style={{ tableLayout: "fixed" }}
              >
                <colgroup>
                  {showRowMatch ? (
                    <>
                      <col className="w-[10%]" />
                      <col className="w-[18%]" />
                      <col className="w-[22%]" style={{ minWidth: P_COL_MIN_WIDTH_PX }} />
                      <col className="w-[18%]" />
                      <col className="w-[22%]" style={{ minWidth: P_COL_MIN_WIDTH_PX }} />
                      <col className="w-[10%]" />
                    </>
                  ) : (
                    <>
                      <col className="w-[10%]" />
                      <col className="w-[23%]" />
                      <col className="w-[22%]" style={{ minWidth: P_COL_MIN_WIDTH_PX }} />
                      <col className="w-[23%]" />
                      <col className="w-[22%]" style={{ minWidth: P_COL_MIN_WIDTH_PX }} />
                    </>
                  )}
                </colgroup>
                <thead>
                  <tr className="text-text-muted border-b border-tier1">
                    <th className={`${CELL_CLASS} text-left font-normal`}>Input</th>
                    <th className={`${CELL_CLASS} text-left font-normal`}>Trial</th>
                    <th className={`${CELL_CLASS} text-left font-normal`}>P(t)</th>
                    <th className={`${CELL_CLASS} text-left font-normal`}>Expected</th>
                    <th className={`${CELL_CLASS} text-left font-normal relative`}>
                      P(e)
                      <ExpectedPHeaderTooltip />
                    </th>
                    {showRowMatch && (
                      <th className={`${CELL_CLASS} text-left font-normal`}>Match</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.input}
                      className={
                        showRowMatch
                          ? r.ok
                            ? "bg-match-bg"
                            : "bg-mismatch-bg"
                          : undefined
                      }
                    >
                      <td className={`${CELL_CLASS} text-tier3 align-top`}>{r.input}</td>
                      <td
                        className={`${CELL_CLASS} align-top min-w-0 ${
                          !showRowMatch || r.ok ? "text-tier3" : "text-mismatch-text"
                        }`}
                      >
                        <AmplitudeCell value={r.trial} />
                      </td>
                      <td className={`${CELL_CLASS} text-text-muted align-top`}>
                        <ProbabilityCell probs={r.trialProbabilities} />
                      </td>
                      <td className={`${CELL_CLASS} text-tier3 align-top min-w-0`}>
                        <AmplitudeCell value={r.target} />
                      </td>
                      <td className={`${CELL_CLASS} text-text-muted align-top`}>
                        <ProbabilityCell probs={r.targetProbabilities} />
                      </td>
                      {showRowMatch && (
                        <td
                          className={`${CELL_CLASS} align-top ${r.ok ? "text-tier3" : "text-error-action"}`}
                        >
                          {r.ok ? "✓" : "✗"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Tooltip id="circuit-output" bottom={4} right={0}>
              Quantum gates are linear operations. This means if your circuit produces the right
              output for every basis state — <TooltipMath>|0⟩</TooltipMath> and{" "}
              <TooltipMath>|1⟩</TooltipMath> — it is guaranteed to work correctly on any
              superposition too. That is why matching all rows here is enough to prove your
              circuit is correct.
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
}

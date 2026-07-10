/**
 * Output Table: displays the circuit output truth table and validation results.
 */

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { TruthRow } from "../interfaces/truthTable";
import { Tooltip, TooltipMath } from "./Tooltip";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  formatAmplitudeMultiLine,
  formatAmplitudeOneLine,
  parseAmplitudeTerms,
} from "../utils/amplitudeDisplay";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [useMultiLine, setUseMultiLine] = useState(false);

  const terms = useMemo(() => parseAmplitudeTerms(value), [value]);
  const oneLine = useMemo(() => formatAmplitudeOneLine(terms), [terms]);
  const multiLines = useMemo(() => formatAmplitudeMultiLine(terms), [terms]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const updateLayout = () => {
      const availableWidth = container.clientWidth;
      const measuredWidth = measure.getBoundingClientRect().width;

      if (availableWidth <= 0) {
        setUseMultiLine(false);
        return;
      }

      if (terms.length <= 1) {
        setUseMultiLine(false);
        return;
      }

      setUseMultiLine(measuredWidth > availableWidth);
    };

    updateLayout();

    const observer = new ResizeObserver(updateLayout);
    observer.observe(container);

    return () => observer.disconnect();
  }, [oneLine, terms.length]);

  const lines = useMultiLine ? multiLines : [oneLine];

  return (
    <div
      ref={containerRef}
      className="relative whitespace-normal overflow-visible break-words min-w-0"
    >
      <span
        ref={measureRef}
        aria-hidden
        className="invisible absolute font-mono text-[10px] whitespace-nowrap pointer-events-none"
      >
        {oneLine}
      </span>
      {lines.map((line, i) => (
        <div key={i} className="block whitespace-normal overflow-visible break-words">
          {line}
        </div>
      ))}
    </div>
  );
}

function ProbabilityCell({ probs }: { probs: readonly number[] | undefined }) {
  if (!probs?.length) return <>—</>;
  return (
    <>
      {probs.map((p, i) => (
        <span key={i} className="block">
          {p.toFixed(3)}
        </span>
      ))}
    </>
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
  const hasPartialMismatch =
    !isPreview && rows && rows.length > 0 && !isCorrect && !error;
  const matchCount = hasPartialMismatch ? rows.filter((r) => r.ok).length : 0;
  const totalRows = rows?.length ?? 0;

  return (
    <div className="w-full box-border overflow-visible">
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

      {isCorrect && !isPreview && (
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

      {gradingSummary && !isCorrect && !error && (
        <div className="mb-3 bg-mismatch-bg border border-tier1 rounded-md px-3 py-2">
          <p className="text-sm font-sans text-mismatch-text font-medium">
            {gradingSummary.samplesPassed}/{gradingSummary.samplesChecked} angles passed
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
          <div
            className={`relative w-full box-border pb-8 overflow-visible${isChecking ? " opacity-50" : ""}`}
          >
            <table
              className="font-mono text-[10px] w-full box-border overflow-visible"
              style={{ tableLayout: "auto" }}
            >
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
                  {!isPreview && (
                    <th className={`${CELL_CLASS} text-left font-normal`}>Match</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.input}
                    className={
                      isPreview ? undefined : r.ok ? "bg-match-bg" : "bg-mismatch-bg"
                    }
                  >
                    <td className={`${CELL_CLASS} text-tier3`}>{r.input}</td>
                    <td
                      className={`${CELL_CLASS} ${
                        isPreview || r.ok ? "text-tier3" : "text-mismatch-text"
                      }`}
                    >
                      <AmplitudeCell value={r.trial} />
                    </td>
                    <td className={`${CELL_CLASS} text-text-muted`}>
                      <ProbabilityCell probs={r.trialProbabilities} />
                    </td>
                    <td className={`${CELL_CLASS} text-tier3`}>
                      <AmplitudeCell value={r.target} />
                    </td>
                    <td className={`${CELL_CLASS} text-text-muted`}>
                      <ProbabilityCell probs={r.targetProbabilities} />
                    </td>
                    {!isPreview && (
                      <td
                        className={`${CELL_CLASS} ${r.ok ? "text-tier3" : "text-error-action"}`}
                      >
                        {r.ok ? "✓" : "✗"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

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

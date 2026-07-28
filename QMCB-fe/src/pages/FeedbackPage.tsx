/**
 * Feedback page: submit a circuit for a chosen level + general survey link.
 * Independent of solve-page circuit state, progression, and localStorage solutions.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CircuitCanvas } from "../components/CircuitCanvas";
import { DragGateOverlay } from "../components/DragGateOverlay";
import { Gateset } from "../components/Gateset";
import { TooltipProvider } from "../components/Tooltip";
import { LEVEL_ORDER, getLevelDisplayName, getLevelNumber } from "../config/levels";
import { useCircuit } from "../hooks/useCircuit";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import { ParameterMode } from "../utils/constants";
import { cellFirstCollision } from "../utils/collisionDetection";
import { serializeOrders, serializeUnitaryGateEntries } from "../utils/circuit";
import { feedbackAvailableGates } from "../utils/feedbackToolbox";
import { submitFeedbackSolution } from "../services/feedback";

/** TODO: replace with real Google Form URL */
const GOOGLE_FEEDBACK_FORM_URL = "PLACEHOLDER";

type SubmitPhase = "form" | "success";

function FeedbackCircuitBuilder({
  level,
  onSubmitted,
}: {
  level: LevelDefinition;
  onSubmitted: () => void;
}) {
  const numberOfQubits = level.number_of_qubits;
  const {
    gates,
    addTwoQubitGate,
    addSingleQubitGate,
    removeGate,
    moveGate,
    setGateOrder,
    setGateSpan,
    setGateTheta,
    setParameterSlot,
    clearAll,
  } = useCircuit(numberOfQubits);

  const [note, setNote] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const skipNextGatesReset = useRef(true);

  const mutation = useMutation({
    mutationFn: submitFeedbackSolution,
    onSuccess: () => onSubmitted(),
  });

  const availableGates = useMemo(
    () => feedbackAvailableGates(numberOfQubits),
    [numberOfQubits],
  );

  const {
    activeId,
    hoveredCellId,
    isDraggingPlacedGate,
    onDragStart,
    onDragOver,
    onDragMove,
    onDragCancel,
    onDragEnd,
  } = useDragAndDrop(
    gates,
    numberOfQubits,
    addSingleQubitGate,
    addTwoQubitGate,
    moveGate,
    removeGate,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  const isRandomThetaLevel = level.parameterMode === ParameterMode.RANDOM_THETA;

  // Clear error status when the student edits the circuit (skip initial mount).
  useEffect(() => {
    if (skipNextGatesReset.current) {
      skipNextGatesReset.current = false;
      return;
    }
    mutation.reset();
    // Intentionally gates-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gates]);

  const handleSubmit = () => {
    if (gates.length === 0 || mutation.isPending) return;
    mutation.mutate({
      levelId: level.target_unitary,
      gates: serializeUnitaryGateEntries(gates),
      qubitOrder: serializeOrders(gates),
      note,
      honeypot,
    });
  };

  const handleClear = () => {
    clearAll();
    mutation.reset();
  };

  // Success navigates to the page-level success view via onSubmitted.
  // Keep the form visible on pending/error so work is not lost.
  let statusMessage: string | null = null;
  let statusClass = "font-sans text-sm border rounded-gate px-3 py-2";
  if (mutation.isPending) {
    statusMessage = "Submitting…";
    statusClass += " text-tier2 border-tier1 bg-bg-elevated";
  } else if (mutation.isError) {
    statusMessage =
      mutation.error instanceof Error && mutation.error.message
        ? mutation.error.message
        : "Submission failed. Please try again.";
    statusClass += " text-error-action border-error-action/40 bg-error-action/5";
  }

  return (
    <TooltipProvider>
      <DndContext
        sensors={sensors}
        collisionDetection={cellFirstCollision}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragOver={onDragOver}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-col gap-3 min-w-0">
          <div className="rounded-md border border-tier1 p-3 min-w-0 overflow-visible">
            <Gateset
              availableGates={availableGates}
              activeId={activeId}
              numberOfQubits={numberOfQubits}
            />
          </div>
          <CircuitCanvas
            gates={gates}
            numberOfQubits={numberOfQubits}
            hoveredCellId={hoveredCellId}
            activeId={activeId}
            isDraggingPlacedGate={isDraggingPlacedGate}
            onRemoveGate={removeGate}
            onSetGateOrder={setGateOrder}
            onSetGateSpan={setGateSpan}
            onSetGateTheta={setGateTheta}
            onSetParameterSlot={setParameterSlot}
            showParameterSlotControls={isRandomThetaLevel}
            thetaSliderStep={level.thetaSliderStep}
            showCheckSolution={false}
            onClear={handleClear}
            isChecking={mutation.isPending}
            cnotFlipUnlocked={true}
          />

          <div className="flex flex-col gap-3">
            <label
              className="block font-sans text-sm text-text-body"
              htmlFor="feedback-note"
            >
              Additional notes (optional)
            </label>
            <textarea
              id="feedback-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                mutation.reset();
              }}
              rows={3}
              className="w-full bg-bg-elevated border border-tier1 rounded-gate px-2 py-1.5 font-sans text-sm text-text-body focus:border-tier3 outline-none resize-y min-h-[72px]"
              placeholder="Anything we should know about this solution…"
            />

            {/* Honeypot: off-screen, not display:none — bots that fill it are silently no-op'd */}
            <label
              htmlFor="feedback-company"
              className="absolute -left-[9999px] h-px w-px overflow-hidden"
              aria-hidden="true"
            >
              Company
            </label>
            <input
              id="feedback-company"
              name="company"
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-px w-px overflow-hidden"
            />

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={gates.length === 0 || mutation.isPending}
                className="w-full py-1.5 bg-tier3/5 border border-tier3/35 rounded-gate font-mono text-[12px] uppercase text-text-body tracking-[0.05em] hover:bg-tier3/10 hover:border-tier3/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {mutation.isPending ? "Submitting…" : "Submit"}
              </button>
            </div>

            {statusMessage && (
              <p role="status" className={statusClass}>
                {statusMessage}
              </p>
            )}
          </div>
        </div>
        <DragOverlay>
          <DragGateOverlay
            activeId={activeId}
            gates={gates}
            numberOfQubits={numberOfQubits}
          />
        </DragOverlay>
      </DndContext>
    </TooltipProvider>
  );
}

export default function FeedbackPage() {
  const [selectedId, setSelectedId] = useState("");
  const [phase, setPhase] = useState<SubmitPhase>("form");

  const selectedLevel: LevelDefinition | null =
    LEVEL_ORDER.find((l) => l.target_unitary === selectedId) ?? null;

  const handleSubmitNewSolution = () => {
    setSelectedId("");
    setPhase("form");
  };

  return (
    <main className="flex-1 overflow-y-auto canvas-grid p-6">
      <div className="max-w-3xl">
        <p className="page-eyebrow mb-1">{"// FEEDBACK"}</p>
        <h1 className="page-title mb-4">Feedback</h1>

        {/* ── Submit a Solution ─────────────────────────────────────────────── */}
        <div className="bg-navy border border-grid rounded-panel px-4 py-4 mb-4">
          <h2 className="font-mono text-[13px] uppercase tracking-[0.05em] text-tier3 mb-1">
            Submit a Solution
          </h2>

          {phase === "success" ? (
            <div className="flex flex-col gap-4 py-2">
              <p className="font-sans text-sm text-text-body" role="status">
                Your solution was submitted — thank you!
              </p>
              <button
                type="button"
                onClick={handleSubmitNewSolution}
                className="w-full max-w-md py-1.5 bg-tier3/5 border border-tier3/35 rounded-gate font-mono text-[12px] uppercase text-text-body tracking-[0.05em] hover:bg-tier3/10 hover:border-tier3/60 transition-colors"
              >
                Submit New Solution
              </button>
            </div>
          ) : (
            <>
              <p className="font-sans text-sm text-text-secondary mb-4">
                Build the circuit you believe should pass for a level and send it for review.
              </p>

              <label className="block font-sans text-sm text-text-body mb-1.5" htmlFor="feedback-level">
                Select the level you&apos;re submitting a solution for.
              </label>
              <select
                id="feedback-level"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full max-w-md mb-4 bg-bg-elevated border border-tier1 rounded-gate px-2 py-1.5 font-sans text-sm text-text-body focus:border-tier3 outline-none"
              >
                <option value="">Select a level…</option>
                {LEVEL_ORDER.map((level, index) => (
                  <option key={level.target_unitary} value={level.target_unitary}>
                    {getLevelNumber(index)} {getLevelDisplayName(level)}
                  </option>
                ))}
              </select>

              {!selectedLevel ? (
                <div className="rounded-md border border-dashed border-tier1 px-4 py-10 text-center font-sans text-sm text-text-muted">
                  Select a level to begin
                </div>
              ) : (
                <FeedbackCircuitBuilder
                  key={selectedLevel.target_unitary}
                  level={selectedLevel}
                  onSubmitted={() => setPhase("success")}
                />
              )}
            </>
          )}
        </div>

        {/* ── General Feedback ─────────────────────────────────────────────── */}
        <div className="bg-navy border border-grid rounded-panel px-4 py-4">
          <h2 className="font-mono text-[13px] uppercase tracking-[0.05em] text-tier3 mb-1">
            General Feedback
          </h2>
          <p className="font-sans text-sm text-text-secondary mb-4">
            Have general thoughts or suggestions? Fill out our quick survey.
          </p>
          <a
            href={GOOGLE_FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block py-1.5 px-4 bg-tier3/5 border border-tier3/35 rounded-gate font-mono text-[12px] uppercase text-text-body tracking-[0.05em] hover:bg-tier3/10 hover:border-tier3/60 transition-colors"
          >
            Open survey
          </a>
        </div>
      </div>
    </main>
  );
}

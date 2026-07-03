import React, { useMemo } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { useCircuit } from "../hooks/useCircuit";
import { useLevelProgress } from "../hooks/useLevelProgress";
import { useCircuitValidation } from "../hooks/useCircuitValidation";
import { useRandomUnitary } from "../hooks/useRandomUnitary";
import { useControlledUnitary } from "../hooks/useControlledUnitary";
import { useDragAndDrop } from "../hooks/useDragAndDrop";

import { TaskCard } from "../components/TaskCard";
import { Gateset, BlochPreviewToggle, BlochSphereHeader, BLOCH_SPHERE_TOOLTIP } from "../components/Gateset";
import { Tooltip, TooltipProvider } from "../components/Tooltip";
import { CircuitCanvas } from "../components/CircuitCanvas";
import { DragGateOverlay } from "../components/DragGateOverlay";
import { OutputTable, type GradingSummary } from "../components/OutputTable";
import { LevelCompleteModal } from "../components/LevelCompleteModal";
import { BlochSphere } from "../components/BlochSphere";

import { LEVEL_ORDER, getNextLevel } from "../config/levels";
import { ParameterMode } from "../utils/constants";
import { gateSequenceToBlochState, amplitudesToBlochState, canonicalStepsToBlochState, type BlochState } from "../utils/blochMath";
import { buildPreviewTruthRows } from "../utils/previewTruthTable";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import { Gate, type PlacedGate, type PlacedSingleQubitGate } from "../types/global";
import { useMobileView } from "../hooks/useMobileView";
import { MobileSolveLayout } from "../components/MobileSolveLayout";

function gatesAreOnlyRz(gates: PlacedGate[]): boolean {
  return gates.length > 0 && gates.every((g) => g.type === Gate.RZ);
}

function rzThetaSignature(gates: PlacedGate[]): string {
  return gates
    .filter((g): g is PlacedSingleQubitGate => g.type === Gate.RZ)
    .map((g) => `${g.id}:${g.theta ?? 0}`)
    .join("|");
}

export default function SolveLevelPage() {
  const { id } = useParams<{ id: string }>();
  const currentLevel = LEVEL_ORDER.find((l) => l.target_unitary === id) ?? null;

  if (!currentLevel) return <Navigate to="/levels" replace />;

  return (
    <SolveLevelContent
      key={currentLevel.target_unitary}
      currentLevel={currentLevel}
    />
  );
}

function SolveLevelContent({
  currentLevel,
}: {
  currentLevel: LevelDefinition;
}) {
  const navigate = useNavigate();

  const { gates, addTwoQubitGate, addSingleQubitGate, removeGate, moveGate, setGateOrder, setGateTheta, setParameterSlot, clearAll } =
    useCircuit(currentLevel.number_of_qubits);

  const isRandomThetaLevel =
    currentLevel.parameterMode === ParameterMode.RANDOM_THETA;

  const { completedLevels, skippedLevels, advancedPastLevels, markLevelComplete, advancePastLevel, unlockGateForLevel, skipLevel } =
    useLevelProgress();

  const levelId = currentLevel.target_unitary;

  // True when the student has solved this level but hasn't yet clicked "Next level →".
  // This state is fully persisted (completedLevels / advancedPastLevels are in localStorage),
  // so it survives refresh, "Repeat level," and sidebar navigation.
  const isCompletedPendingAdvance =
    completedLevels.includes(levelId) &&
    !advancedPastLevels.includes(levelId) &&
    !skippedLevels.includes(levelId);

  // Tracks whether a correct grading result has been received this mount.
  // Lets the allCorrect effect distinguish "cold mount, no check yet" (where
  // the modal should stay open if isCompletedPendingAdvance is already true)
  // from "a re-check returned wrong" (where the modal should close).
  const hasBeenCorrectRef = React.useRef(false);

  // Initialise from persisted state so the modal re-opens automatically on
  // refresh or sidebar navigation when isCompletedPendingAdvance is true.
  const [showCompletionModal, setShowCompletionModal] = React.useState(isCompletedPendingAdvance);

  const isSeedDrivenLevel =
    currentLevel.parameterMode === ParameterMode.SEED_ZXZ ||
    currentLevel.parameterMode === ParameterMode.SEED_ZYZ;
  const isControlledU = currentLevel.target_unitary === Gate.CONTROLLED_U;

  const { query: randomUnitaryQuery, generateNew: generateNewRandomU, seed: randomUSeed } =
    useRandomUnitary(isSeedDrivenLevel && !isControlledU);

  const { query: controlledUnitaryQuery, generateNew: generateNewControlledU, seed: controlledUSeed } =
    useControlledUnitary(isSeedDrivenLevel && isControlledU);

  const seedDrivenQuery    = isControlledU ? controlledUnitaryQuery : randomUnitaryQuery;
  const generateNewUnitary = isControlledU ? generateNewControlledU : generateNewRandomU;
  const randomSeed         = isControlledU ? controlledUSeed        : randomUSeed;

  const [initialState, setInitialState] = React.useState<0 | 1>(0);

  const { mutation, rows, allCorrect, handleCheck, validationError, isChecking } = useCircuitValidation(
    currentLevel,
    gates,
    randomSeed,
    undefined,
    !isControlledU ? randomUnitaryQuery.data?.angles : undefined
  );

  const seedDrivenTruth = isSeedDrivenLevel ? seedDrivenQuery.data?.truth_table : undefined;

  const isGraded = mutation.status === "success" && rows != null;
  const previewRows = useMemo(
    () => buildPreviewTruthRows(gates, currentLevel, seedDrivenTruth),
    [gates, currentLevel, seedDrivenTruth]
  );
  const displayRows = isGraded ? rows : previewRows;
  const outputTableMode = isGraded ? "graded" : "preview";
  const displayIsCorrect = isGraded && allCorrect;

  const {
    activeId,
    dragContainers,
    isDraggingPlacedGate,
    onDragStart,
    onDragOver,
    onDragCancel,
    onDragEnd,
  } = useDragAndDrop(
    gates,
    currentLevel.number_of_qubits,
    addSingleQubitGate,
    addTwoQubitGate,
    moveGate,
    removeGate
  );

  // Mouse/stylus: start drag after 8 px of movement (prevents accidental drags on click).
  // Touch: 250 ms hold before drag activates so double-tap-to-delete can complete first.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  const blochState = useMemo(
    () => gateSequenceToBlochState(gates, initialState),
    [gates, initialState]
  );

  const targetBlochState = useMemo((): BlochState | null => {
    if (currentLevel.number_of_qubits !== 1) return null;
    if (currentLevel.parameterMode === ParameterMode.RANDOM_THETA) return null;

    if (isSeedDrivenLevel && !isControlledU) {
      const blochByState = randomUnitaryQuery.data?.target_bloch;
      const bloch = blochByState?.[String(initialState)];
      if (bloch) return { theta: bloch.theta, phi: bloch.phi };

      // Fallback while the query is loading
      const amps = randomUnitaryQuery.data?.truth_table?.amplitudes?.[initialState];
      if (!amps) return null;
      return amplitudesToBlochState(amps[0], amps[1]);
    }

    if (currentLevel.canonical) {
      return canonicalStepsToBlochState(currentLevel.canonical, initialState);
    }
    return null;
  }, [currentLevel, initialState, isSeedDrivenLevel, isControlledU, randomUnitaryQuery.data]);

  const circuitOutputRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (mutation.status === "success" || mutation.status === "error") {
      circuitOutputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [mutation.status]);

  const isSLevel = currentLevel.target_unitary === Gate.S;
  const [showOrderTip, setShowOrderTip] = React.useState(false);
  const prevGateCountRef = React.useRef(0);
  const prevRzThetaSigRef = React.useRef("");

  React.useEffect(() => {
    if (!isSLevel) {
      prevGateCountRef.current = gates.length;
      prevRzThetaSigRef.current = "";
      return;
    }

    const gateCount = gates.length;
    const onlyRz = gatesAreOnlyRz(gates);
    const thetaSig = rzThetaSignature(gates);

    if (gateCount > prevGateCountRef.current) {
      setShowOrderTip(false);
    } else if (
      onlyRz &&
      prevRzThetaSigRef.current !== "" &&
      thetaSig !== prevRzThetaSigRef.current
    ) {
      setShowOrderTip(true);
    }

    prevGateCountRef.current = gateCount;
    prevRzThetaSigRef.current = onlyRz ? thetaSig : "";
  }, [gates, isSLevel]);

  React.useEffect(() => {
    // allCorrect is derived from mutation.data?.all_match, so it's only true when
    // the server returned a passing grade. rows may be null for random-theta levels
    // (Rx/Ry) where the backend grades via unitary comparison with no truth table.
    if (allCorrect) {
      hasBeenCorrectRef.current = true;
      markLevelComplete(currentLevel);
      const t = setTimeout(() => setShowCompletionModal(true), 300);
      return () => clearTimeout(t);
    }
    // Only close the modal when this mount has already seen a correct result.
    // Without this guard, the effect would fire on every cold mount (allCorrect=false)
    // and immediately collapse the modal that was opened from persisted state
    // (isCompletedPendingAdvance=true after a refresh or sidebar navigation).
    if (hasBeenCorrectRef.current) {
      setShowCompletionModal(false);
    }
  }, [allCorrect, markLevelComplete, currentLevel]);

  const handleClear = () => {
    clearAll();
    mutation.reset();
  };

  const handleNewUnitary = () => {
    generateNewUnitary();
    handleClear();
  };

  const handleRepeat = () => {
    advancePastLevel(currentLevel);
    unlockGateForLevel(currentLevel);
    handleClear();
    setShowCompletionModal(false);
  };

  const handleNextLevel = () => {
    const next = getNextLevel(currentLevel);
    if (next) {
      advancePastLevel(currentLevel);
      unlockGateForLevel(currentLevel);
      setShowCompletionModal(false);
      navigate("/level/" + next.target_unitary);
    }
  };

  const handleSkipLevel = () => {
    skipLevel(currentLevel);
    const next = getNextLevel(currentLevel);
    navigate(next ? "/level/" + next.target_unitary : "/levels");
  };

  const showSkip =
    !completedLevels.includes(levelId) && !skippedLevels.includes(levelId);

  const isMobile = useMobileView(768);

  const isMutationPending = mutation.isPending;
  const mutationError: Error | null = mutation.isError ? (mutation.error as Error) : null;
  const gradingSummary: GradingSummary | undefined =
    mutation.data?.grading_mode === "random_theta" &&
    mutation.data.samples_checked != null &&
    mutation.data.samples_passed != null
      ? {
          samplesChecked: mutation.data.samples_checked,
          samplesPassed: mutation.data.samples_passed,
        }
      : undefined;

  if (isMobile) {
    return (
      <MobileSolveLayout
        currentLevel={currentLevel}
        isSeedDrivenLevel={isSeedDrivenLevel}
        dynamicTruth={isSeedDrivenLevel ? seedDrivenQuery.data?.truth_table : undefined}
        gates={gates}
        removeGate={removeGate}
        setGateOrder={setGateOrder}
        setGateTheta={setGateTheta}
        setParameterSlot={setParameterSlot}
        showParameterSlotControls={isRandomThetaLevel}
        rows={displayRows}
        allCorrect={displayIsCorrect}
        outputTableMode={outputTableMode}
        handleCheck={handleCheck}
        validationError={validationError}
        isChecking={isChecking}
        isMutationPending={isMutationPending}
        mutationError={mutationError}
        gradingSummary={gradingSummary}
        handleClear={handleClear}
        handleNewUnitary={isSeedDrivenLevel ? handleNewUnitary : undefined}
        handleRepeat={handleRepeat}
        handleNextLevel={handleNextLevel}
        showCompletionModal={showCompletionModal}
        activeId={activeId}
        dragContainers={dragContainers}
        isDraggingPlacedGate={isDraggingPlacedGate}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
        sensors={sensors}
        blochState={blochState}
        targetBlochState={targetBlochState}
        initialState={initialState}
        setInitialState={setInitialState}
        showOrderTip={showOrderTip}
        setShowOrderTip={setShowOrderTip}
        isSLevel={isSLevel}
        circuitOutputRef={circuitOutputRef}
        handleSkipLevel={handleSkipLevel}
        showSkip={showSkip}
      />
    );
  }

  return (
    <TooltipProvider>
    <div className="flex flex-1 min-h-0 w-full h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
      >
        <div className="flex-1 w-full min-w-0 flex flex-col sm:flex-row sm:min-h-0 sm:h-full overflow-y-auto sm:overflow-y-hidden">
          {/* Center: Task + Circuit Canvas */}
          <section className="relative w-full sm:flex-1 flex flex-col min-w-0 bg-bg-app canvas-grid p-4 gap-3 min-h-[320px] sm:min-h-0 sm:h-full sm:overflow-y-auto panel-scroll">
            <TaskCard
              level={currentLevel}
              dynamicTruth={isSeedDrivenLevel ? seedDrivenQuery.data?.truth_table : undefined}
              onNewUnitary={isSeedDrivenLevel ? handleNewUnitary : undefined}
            />
            <CircuitCanvas
              gates={gates}
              numberOfQubits={currentLevel.number_of_qubits}
              dragContainers={dragContainers}
              isDraggingPlacedGate={isDraggingPlacedGate}
              onRemoveGate={removeGate}
              onSetGateOrder={setGateOrder}
              onSetGateTheta={setGateTheta}
              onSetParameterSlot={setParameterSlot}
              showParameterSlotControls={isRandomThetaLevel}
              onCheck={handleCheck}
              onClear={handleClear}
              isChecking={mutation.isPending}
              onSkip={handleSkipLevel}
              showSkip={showSkip}
            />
            <LevelCompleteModal
              isOpen={showCompletionModal}
              onRepeat={handleRepeat}
              onNext={handleNextLevel}
              hasNextLevel={getNextLevel(currentLevel) !== null}
            />
          </section>

          {/* Right: Gateset + Bloch + Output */}
          <aside
            className="w-full sm:w-auto sm:shrink sm:basis-[523px] sm:min-w-[200px] bg-bg-sidebar border-t sm:border-t-0 sm:border-l border-tier1 p-3 sm:overflow-y-auto panel-scroll flex flex-col gap-0 min-h-0 sm:h-full"
          >
            <div className="rounded-md border border-tier1 p-3 mb-3 min-w-0 overflow-visible">
              <Gateset availableGates={currentLevel.toolbox} activeId={activeId} numberOfQubits={currentLevel.number_of_qubits} />
            </div>
            {currentLevel.number_of_qubits === 1 && (
              <>
                <div className="border-t border-tier1 my-3 shrink-0" />
                <div className="rounded-md border border-tier1 p-3 mb-3 overflow-visible">
                  <div className="relative flex flex-col items-center gap-0 w-full">
                    <BlochSphereHeader />
                    <BlochPreviewToggle
                      initialState={initialState}
                      onSelect0={() => setInitialState(0)}
                      onSelect1={() => setInitialState(1)}
                    />
                    <BlochSphere
                      theta={blochState.theta}
                      phi={blochState.phi}
                      targetTheta={targetBlochState?.theta}
                      targetPhi={targetBlochState?.phi}
                    />
                    {showOrderTip && isSLevel && (
                      <div className="relative w-full mt-[14px] text-[10px] text-text-body bg-bg-panel border border-tier1 rounded-panel px-2 py-1.5 leading-relaxed font-sans">
                        <button
                          type="button"
                          onClick={() => setShowOrderTip(false)}
                          className="absolute top-0.5 right-1 text-tier2 hover:text-tier3 leading-none"
                          aria-label="Dismiss tip"
                        >
                          ×
                        </button>
                        <p className="pr-4">
                          Gate order matters — to visually see how Rz(θ) rotates the Bloch sphere,
                          try placing Sqrt_X first.
                        </p>
                      </div>
                    )}
                    <Tooltip id="bloch-sphere">{BLOCH_SPHERE_TOOLTIP}</Tooltip>
                  </div>
                </div>
              </>
            )}
            <div className="border-t border-tier1 my-3 shrink-0" />
            <div ref={circuitOutputRef} className="rounded-md border border-tier1 p-3 mb-3 min-w-0 overflow-visible">
              <OutputTable
                rows={displayRows}
                mode={outputTableMode}
                isCorrect={displayIsCorrect}
                error={validationError ?? (mutation.isError ? (mutation.error as Error) : null)}
                isChecking={isChecking}
                onClearAndRetry={handleClear}
                gradingSummary={
                  mutation.data?.grading_mode === "random_theta" &&
                  mutation.data.samples_checked != null &&
                  mutation.data.samples_passed != null
                    ? ({
                        samplesChecked: mutation.data.samples_checked,
                        samplesPassed: mutation.data.samples_passed,
                      } satisfies GradingSummary)
                    : undefined
                }
                levelInsight={
                  currentLevel.insight && allCorrect ? (
                    <div className="mb-3 bg-bg-panel border border-tier1 rounded-panel px-3 py-2">
                      <p className="panel-heading mb-1.5">
                        LEVEL INSIGHT
                      </p>
                      <p className="font-sans text-sm text-text-body leading-relaxed">
                        {currentLevel.insight}
                      </p>
                    </div>
                  ) : undefined
                }
              />
            </div>
          </aside>
        </div>

        <DragOverlay>
          <DragGateOverlay activeId={activeId} gates={gates} numberOfQubits={currentLevel.number_of_qubits} />
        </DragOverlay>
      </DndContext>
    </div>
    </TooltipProvider>
  );
}

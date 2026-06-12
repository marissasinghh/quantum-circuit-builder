import React, { useMemo } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
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
import { Toolbox, BlochPreviewToggle, BlochSphereHeader, BLOCH_SPHERE_TOOLTIP } from "../components/Toolbox";
import { Tooltip, TooltipProvider } from "../components/Tooltip";
import { CircuitCanvas } from "../components/CircuitCanvas";
import { OutputTable, type GradingSummary } from "../components/OutputTable";
import { LevelCompleteModal } from "../components/LevelCompleteModal";
import { BlochSphere } from "../components/BlochSphere";
import {
  CNOTGlyph,
  HGlyph,
  TGlyph,
  SGlyph,
  RXGlyph,
  RYGlyph,
  UGlyph,
  RZGlyph,
  XGlyph,
  SqrtXGlyph,
} from "../components/GateDesign";

import { LEVEL_ORDER, getNextLevel } from "../config/levels";
import { ParameterMode } from "../utils/constants";
import { gateSequenceToBlochState, amplitudesToBlochState, canonicalStepsToBlochState, type BlochState } from "../utils/blochMath";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import { Gate, type PlacedGate, type PlacedSingleQubitGate } from "../types/global";

const RIGHT_PANEL_WIDTH_PX = 523;
const APP_HEADER_HEIGHT_PX = 40;

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
  const [showCompletionModal, setShowCompletionModal] = React.useState(false);

  // Explicitly close modal whenever the level id changes in the URL
  React.useEffect(() => {
    setShowCompletionModal(false);
  }, [id]);

  const currentLevel = LEVEL_ORDER.find((l) => l.target_unitary === id) ?? null;

  if (!currentLevel) return <Navigate to="/levels" replace />;

  return (
    <SolveLevelContent
      key={currentLevel.target_unitary}
      currentLevel={currentLevel}
      showCompletionModal={showCompletionModal}
      setShowCompletionModal={setShowCompletionModal}
    />
  );
}

function SolveLevelContent({
  currentLevel,
  showCompletionModal,
  setShowCompletionModal,
}: {
  currentLevel: LevelDefinition;
  showCompletionModal: boolean;
  setShowCompletionModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();

  const { gates, addTwoQubitGate, addSingleQubitGate, removeGate, setGateOrder, setGateTheta, clearAll } =
    useCircuit();

  const { markLevelComplete, unlockGateForLevel } = useLevelProgress();

  const isSeedDrivenLevel = currentLevel.parameterMode === ParameterMode.SEED_ZXZ;
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
    randomSeed
  );

  const { activeId, setActiveId, onDragEnd } = useDragAndDrop(addSingleQubitGate, addTwoQubitGate);

  // Mouse/stylus: start drag after 8 px of movement (prevents accidental drags on click).
  // Touch: start drag after 100 ms — short enough to feel instant, long enough not to
  // swallow scroll gestures on the rest of the page.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 10 } }),
  );

  const blochState = useMemo(
    () => gateSequenceToBlochState(gates, initialState),
    [gates, initialState]
  );

  const targetBlochState = useMemo((): BlochState | null => {
    if (currentLevel.number_of_qubits !== 1) return null;
    if (currentLevel.parameterMode === ParameterMode.RANDOM_THETA) return null;

    if (isSeedDrivenLevel) {
      const apiBloch = !isControlledU ? randomUnitaryQuery.data?.target_bloch : undefined;
      if (apiBloch) {
        if (initialState === 0) return { theta: apiBloch.theta, phi: apiBloch.phi };
        // |1⟩ is the antipodal point of |0⟩ on the Bloch sphere
        return { theta: Math.PI - apiBloch.theta, phi: apiBloch.phi + Math.PI };
      }
      // Fallback while the query is loading
      const amps = seedDrivenQuery.data?.truth_table?.amplitudes?.[initialState];
      if (!amps) return null;
      return amplitudesToBlochState(amps[0], amps[1]);
    }

    if (currentLevel.canonical) {
      return canonicalStepsToBlochState(currentLevel.canonical, initialState);
    }
    return null;
  }, [currentLevel, initialState, isSeedDrivenLevel, isControlledU, randomUnitaryQuery.data, seedDrivenQuery.data]);

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
      markLevelComplete(currentLevel);
      const t = setTimeout(() => setShowCompletionModal(true), 300);
      return () => clearTimeout(t);
    }
    setShowCompletionModal(false);
  }, [allCorrect, markLevelComplete, currentLevel, setShowCompletionModal]);

  const handleClear = () => {
    clearAll();
    mutation.reset();
  };

  const handleNewUnitary = () => {
    generateNewUnitary();
    handleClear();
  };

  const handleRepeat = () => {
    handleClear();
    setShowCompletionModal(false);
  };

  const handleNextLevel = () => {
    const next = getNextLevel(currentLevel);
    if (next) {
      unlockGateForLevel(currentLevel);
      setShowCompletionModal(false);
      navigate("/level/" + next.target_unitary);
    }
  };

  return (
    <TooltipProvider>
    <div className="flex flex-1 min-h-0 w-full h-full">
      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={(e) => {
          setActiveId(null);
          onDragEnd(e);
        }}
      >
        <div
          className="flex-1 min-h-0 w-full min-w-0 grid h-full"
          style={{ gridTemplateColumns: `minmax(0, 1fr) ${RIGHT_PANEL_WIDTH_PX}px` }}
        >
          {/* Center: Task + Circuit Canvas */}
          <section className="relative flex-1 flex flex-col min-w-0 bg-bg-app canvas-grid p-4 overflow-hidden gap-3">
            <TaskCard
              level={currentLevel}
              dynamicTruth={isSeedDrivenLevel ? seedDrivenQuery.data?.truth_table : undefined}
              onNewUnitary={isSeedDrivenLevel ? handleNewUnitary : undefined}
            />
            <CircuitCanvas
              gates={gates}
              numberOfQubits={currentLevel.number_of_qubits}
              onRemoveGate={removeGate}
              onSetGateOrder={setGateOrder}
              onSetGateTheta={setGateTheta}
              onCheck={handleCheck}
              onClear={handleClear}
              isChecking={mutation.isPending}
            />
            <LevelCompleteModal
              isOpen={showCompletionModal}
              onRepeat={handleRepeat}
              onNext={handleNextLevel}
              hasNextLevel={getNextLevel(currentLevel) !== null}
            />
          </section>

          {/* Right: Toolbox + Bloch + Output */}
          <aside
            className="shrink-0 bg-bg-sidebar border-l border-tier1 p-3 overflow-y-auto flex flex-col gap-0 min-w-0 min-h-0 h-full"
            style={{
              width: RIGHT_PANEL_WIDTH_PX,
              maxHeight: `calc(100vh - ${APP_HEADER_HEIGHT_PX}px)`,
            }}
          >
            <div className="rounded-md border border-tier1 p-3 mb-3 min-w-0 overflow-visible">
              <Toolbox availableGates={currentLevel.toolbox} activeId={activeId} numberOfQubits={currentLevel.number_of_qubits} />
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
                rows={rows}
                isCorrect={allCorrect}
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
                      <p className="font-mono text-[8px] tracking-[0.12em] text-text-muted uppercase mb-1.5">
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
          {activeId === "tool-x" && <XGlyph width={64} height={44} />}
          {activeId === "tool-sqrt-x" && <SqrtXGlyph width={64} height={44} />}
          {activeId === "tool-cnot" && <CNOTGlyph order={[0, 1]} width={84} height={64} />}
          {activeId === "tool-h" && <HGlyph width={64} height={44} />}
          {activeId === "tool-t" && <TGlyph width={76} height={44} />}
          {activeId === "tool-s" && <SGlyph width={76} height={44} />}
          {activeId === "tool-rx" && <RXGlyph width={76} height={44} />}
          {activeId === "tool-ry" && <RYGlyph width={76} height={44} />}
          {activeId === "tool-rz" && <RZGlyph width={76} height={44} />}
          {activeId === "tool-u" && <UGlyph width={64} height={44} />}
        </DragOverlay>
      </DndContext>
    </div>
    </TooltipProvider>
  );
}

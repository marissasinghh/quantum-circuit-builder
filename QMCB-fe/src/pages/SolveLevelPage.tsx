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
import { useDragAndDrop } from "../hooks/useDragAndDrop";

import { TaskCard } from "../components/TaskCard";
import { Toolbox, BlochPreviewToggle, BlochSphereHeader, BLOCH_SPHERE_TOOLTIP } from "../components/Toolbox";
import { Tooltip, TooltipProvider } from "../components/Tooltip";
import { CircuitCanvas } from "../components/CircuitCanvas";
import { OutputTable } from "../components/OutputTable";
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
import { gateSequenceToBlochState } from "../utils/blochMath";
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

  const { unlockedGates, markLevelComplete } = useLevelProgress();

  const isSeedDrivenLevel = currentLevel.parameterMode === ParameterMode.SEED_ZXZ;
  const { query: randomUnitaryQuery, generateNew: generateNewUnitary, seed: randomSeed } =
    useRandomUnitary(isSeedDrivenLevel);

  const [initialState, setInitialState] = React.useState<0 | 1>(0);

  const { mutation, rows, allCorrect, handleCheck, validationError } = useCircuitValidation(
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

  const isTLevel = currentLevel.target_unitary === Gate.T;
  const [showOrderTip, setShowOrderTip] = React.useState(false);
  const prevGateCountRef = React.useRef(0);
  const prevRzThetaSigRef = React.useRef("");

  React.useEffect(() => {
    if (!isTLevel) {
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
  }, [gates, isTLevel]);

  React.useEffect(() => {
    if (allCorrect && rows && rows.length > 0) {
      markLevelComplete(currentLevel);
      const t = setTimeout(() => setShowCompletionModal(true), 1500);
      return () => clearTimeout(t);
    }
    setShowCompletionModal(false);
  }, [allCorrect, rows, markLevelComplete, currentLevel, setShowCompletionModal]);

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
              dynamicTruth={isSeedDrivenLevel ? randomUnitaryQuery.data?.truth_table : undefined}
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
              <Toolbox availableGates={unlockedGates} activeId={activeId} />
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
                    <BlochSphere theta={blochState.theta} phi={blochState.phi} />
                    {showOrderTip && (
                      <div className="relative w-full text-[10px] text-text-body bg-bg-panel border border-tier1 rounded-panel px-2 py-1.5 leading-relaxed font-sans">
                        <button
                          type="button"
                          onClick={() => setShowOrderTip(false)}
                          className="absolute top-0.5 right-1 text-tier2 hover:text-tier3 leading-none"
                          aria-label="Dismiss tip"
                        >
                          ×
                        </button>
                        <p className="pr-4">
                          Gate order matters — Rz has nothing to rotate yet. Try placing sqrt(X) first.
                        </p>
                      </div>
                    )}
                    <Tooltip id="bloch-sphere">{BLOCH_SPHERE_TOOLTIP}</Tooltip>
                  </div>
                </div>
              </>
            )}
            <div className="border-t border-tier1 my-3 shrink-0" />
            <div className="rounded-md border border-tier1 p-3 mb-3 min-w-0 overflow-visible">
              <OutputTable
                rows={rows}
                isCorrect={allCorrect}
                error={validationError ?? (mutation.isError ? (mutation.error as Error) : null)}
                showGlobalPhaseNote={currentLevel.target_unitary === Gate.H}
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

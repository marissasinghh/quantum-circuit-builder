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
import { Toolbox } from "../components/Toolbox";
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
import { BASIS_0, BASIS_1, ParameterMode } from "../utils/constants";
import { gateSequenceToBlochState } from "../utils/blochMath";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import { Gate, type PlacedGate } from "../types/global";

function gatesAreOnlyRz(gates: PlacedGate[]): boolean {
  return gates.length > 0 && gates.every((g) => g.type === Gate.RZ);
}

function rzThetaSignature(gates: PlacedGate[]): string {
  return gates
    .filter((g) => g.type === Gate.RZ)
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
      setShowCompletionModal(true);
      markLevelComplete(currentLevel);
    }
  }, [allCorrect, rows, markLevelComplete, currentLevel]);

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

  const handleLevelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigate("/level/" + e.target.value);
  };

  return (
    <div>
      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={(e) => {
          setActiveId(null);
          onDragEnd(e);
        }}
      >
        <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Task + Toolbox + Circuit Canvas */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="level-select" className="text-gray-600 font-medium">
                Level:
              </label>
              <select
                id="level-select"
                className="border rounded px-2 py-1 text-sm"
                value={currentLevel.target_unitary}
                onChange={handleLevelSelect}
              >
                {LEVEL_ORDER.map((level) => (
                  <option key={level.target_unitary} value={level.target_unitary}>
                    {level.target_unitary}
                  </option>
                ))}
              </select>
            </div>
            <TaskCard
              level={currentLevel}
              dynamicTruth={isSeedDrivenLevel ? randomUnitaryQuery.data?.truth_table : undefined}
              onNewUnitary={isSeedDrivenLevel ? handleNewUnitary : undefined}
            />
            <Toolbox availableGates={unlockedGates} activeId={activeId} />
            {currentLevel.number_of_qubits === 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Bloch preview from:</span>
                <button
                  type="button"
                  onClick={() => setInitialState(0)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    initialState === 0
                      ? "bg-amber-100 border-amber-400 text-amber-800"
                      : "border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-700"
                  }`}
                >
                  {BASIS_0}
                </button>
                <button
                  type="button"
                  onClick={() => setInitialState(1)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    initialState === 1
                      ? "bg-amber-100 border-amber-400 text-amber-800"
                      : "border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-700"
                  }`}
                >
                  {BASIS_1}
                </button>
              </div>
            )}
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
          </section>

          {/* Right: Bloch Sphere (top) + Output */}
          <section className="space-y-6">
            {currentLevel.number_of_qubits === 1 && (
              <div className="flex flex-col items-center gap-2">
                <BlochSphere theta={blochState.theta} phi={blochState.phi} />
                {showOrderTip && (
                  <div className="relative max-w-sm text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                    <button
                      type="button"
                      onClick={() => setShowOrderTip(false)}
                      className="absolute top-1 right-1.5 text-amber-600 hover:text-amber-900 leading-none"
                      aria-label="Dismiss tip"
                    >
                      ×
                    </button>
                    <p className="pr-4">
                      Gate order matters — Rz has nothing to rotate yet. Try placing sqrt(X) first.
                    </p>
                  </div>
                )}
              </div>
            )}
            <OutputTable
              rows={rows}
              isCorrect={allCorrect}
              error={validationError ?? (mutation.isError ? (mutation.error as Error) : null)}
            />
          </section>
        </main>

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

      <LevelCompleteModal
        isOpen={showCompletionModal}
        onRepeat={handleRepeat}
        onNext={handleNextLevel}
        hasNextLevel={getNextLevel(currentLevel) !== null}
      />
    </div>
  );
}

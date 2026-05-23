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
import { ParameterMode } from "../utils/constants";
import { gateSequenceToBlochState } from "../utils/blochMath";
import type { LevelDefinition } from "../interfaces/levelDefinition";

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

  const blochState = useMemo(() => gateSequenceToBlochState(gates), [gates]);

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
              <div className="flex justify-center">
                <BlochSphere theta={blochState.theta} phi={blochState.phi} />
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

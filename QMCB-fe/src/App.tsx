/**
 * Main App: Orchestrates level selection, circuit building, and validation.
 * All UI rendering delegated to focused components.
 */

import React from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";

// Hooks
import { useCircuit } from "./hooks/useCircuit";
import { useLevelSelection } from "./hooks/useLevelSelection";
import { useCircuitValidation } from "./hooks/useCircuitValidation";
import { useDragAndDrop } from "./hooks/useDragAndDrop";

// Components
import { AppHeader } from "./components/AppHeader";
import { TaskCard } from "./components/TaskCard";
import { Toolbox } from "./components/Toolbox";
import { CircuitCanvas } from "./components/CircuitCanvas";
import { OutputTable } from "./components/OutputTable";
import { LevelCompleteModal } from "./components/LevelCompleteModal";
import { CNOTGlyph, HGlyph, TGlyph } from "./components/GateDesign";

// Utils
import { getNextLevel } from "./config/levels";

export default function App() {
  // State management via custom hooks
  const { gates, addTwoQubitGate, addSingleQubitGate, removeGate, setGateOrder, clearAll } =
    useCircuit();

  // Modal state
  const [showCompletionModal, setShowCompletionModal] = React.useState(false);

  const { currentLevel, changeLevel } = useLevelSelection(() => {
    clearAll();
    mutation.reset();
    setShowCompletionModal(false); // Reset modal when level changes
  });

  const { mutation, rows, allCorrect, handleCheck, validationError } = useCircuitValidation(currentLevel, gates);

  const { activeId, setActiveId, onDragEnd } = useDragAndDrop(addSingleQubitGate, addTwoQubitGate);

  // Show completion modal when solution is correct
  React.useEffect(() => {
    if (allCorrect && rows && rows.length > 0) {
      setShowCompletionModal(true);
    }
  }, [allCorrect, rows]);

  const handleClear = () => {
    clearAll();
    mutation.reset();
  };

  const handleRepeat = () => {
    handleClear();
    setShowCompletionModal(false);
  };

  const handleNextLevel = () => {
    const nextLevel = getNextLevel(currentLevel);
    if (nextLevel) {
      changeLevel(nextLevel);
      setShowCompletionModal(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-900">
      <AppHeader currentLevel={currentLevel} onLevelChange={changeLevel} />

      <DndContext
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={(e) => {
          setActiveId(null);
          onDragEnd(e);
        }}
      >
        <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Task + Toolbox */}
          <section className="space-y-6">
            <TaskCard level={currentLevel} />
            <Toolbox availableGates={currentLevel.toolbox} activeId={activeId} />
          </section>

          {/* Right: Circuit + Output */}
          <section className="space-y-6">
            <CircuitCanvas
              gates={gates}
              numberOfQubits={currentLevel.number_of_qubits}
              onRemoveGate={removeGate}
              onSetGateOrder={setGateOrder}
              onCheck={handleCheck}
              onClear={handleClear}
              isChecking={mutation.isPending}
            />
            <OutputTable
              rows={rows}
              isCorrect={allCorrect}
              error={validationError ?? (mutation.isError ? (mutation.error as Error) : null)}
            />
          </section>
        </main>

        {/* Drag overlay */}
        <DragOverlay>
          {activeId === "tool-cnot" && <CNOTGlyph order={[0, 1]} width={84} height={64} />}
          {activeId === "tool-h" && <HGlyph width={64} height={44} />}
          {activeId === "tool-t" && <TGlyph width={76} height={44} />}
        </DragOverlay>
      </DndContext>

      {/* Level completion modal */}
      <LevelCompleteModal
        isOpen={showCompletionModal}
        onRepeat={handleRepeat}
        onNext={handleNextLevel}
        hasNextLevel={getNextLevel(currentLevel) !== null}
      />
    </div>
  );
}
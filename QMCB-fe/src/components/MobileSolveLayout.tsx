/**
 * MobileSolveLayout: tab-based layout for viewports below 1300px.
 * Receives the same props that SolveLevelContent already has in scope.
 * Desktop layout (App.tsx / SolveLevelPage.tsx) is not touched.
 */

import React from "react";
import {
  DndContext,
  DragOverlay,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { cellFirstCollision } from "../utils/collisionDetection";

import { CircuitCanvas } from "./CircuitCanvas";
import { DragGateOverlay } from "./DragGateOverlay";
import { LevelCompleteModal } from "./LevelCompleteModal";
import { OutputTable, type GradingSummary, type OutputTableMode } from "./OutputTable";
import { TaskCard } from "./TaskCard";
import { BlochSphere } from "./BlochSphere";
import {
  BlochSphereHeader,
  BlochPreviewToggle,
  BLOCH_SPHERE_TOOLTIP,
} from "./Gateset";
import { Tooltip, TooltipProvider } from "./Tooltip";
import { DraggableTool } from "./DragAndDropWrappers";
import { getNextLevel } from "../config/levels";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import type { TruthTableDTO, TruthRow } from "../interfaces/truthTable";
import type { BlochState } from "../utils/blochMath";
import { Gate, type PlacedGate, type ControlTargetOrder } from "../types/global";

// Minimal label + toolId lookup for rendering the mobile gate row.
// Labels and toolIds mirror GATE_CONFIG in Gateset.tsx (no internal logic changes).
const MOBILE_GATE_CONFIG: Partial<Record<Gate, { label: string; toolId: string }>> = {
  [Gate.X]: { label: "X", toolId: "tool-x" },
  [Gate.SQRT_X]: { label: "√X", toolId: "tool-sqrt-x" },
  [Gate.CNOT]: { label: "CNOT", toolId: "tool-cnot" },
  [Gate.CNOT_FLIPPED]: { label: "CNOT↕", toolId: "tool-cnot-flipped" },
  [Gate.CONTROLLED_Z]: { label: "CZ", toolId: "tool-cz" },
  [Gate.SWAP]: { label: "SWAP", toolId: "tool-swap" },
  [Gate.S]: { label: "S", toolId: "tool-s" },
  [Gate.T]: { label: "T", toolId: "tool-t" },
  [Gate.H]: { label: "H", toolId: "tool-h" },
  [Gate.RX]: { label: "Rx(θ)", toolId: "tool-rx" },
  [Gate.RY]: { label: "Ry(θ)", toolId: "tool-ry" },
  [Gate.RZ]: { label: "Rz(θ)", toolId: "tool-rz" },
  [Gate.U]: { label: "U", toolId: "tool-u" },
  [Gate.CONTROLLED_H]: { label: "CH", toolId: "tool-ch" },
  [Gate.CONTROLLED_U]: { label: "CU", toolId: "tool-cu" },
};

interface MobileSolveLayoutProps {
  // Level
  currentLevel: LevelDefinition;
  isSeedDrivenLevel: boolean;
  dynamicTruth: TruthTableDTO | undefined;

  // Circuit state
  gates: PlacedGate[];
  removeGate: (id: string) => void;
  setGateOrder: (id: string, order: ControlTargetOrder) => void;
  setGateTheta: (id: string, theta: number) => void;
  setParameterSlot?: (id: string) => void;
  showParameterSlotControls?: boolean;

  // Validation
  rows: TruthRow[] | null;
  allCorrect: boolean;
  outputTableMode: OutputTableMode;
  handleCheck: () => void;
  validationError: Error | null;
  isChecking: boolean;
  isMutationPending: boolean;
  mutationError: Error | null;
  gradingSummary: GradingSummary | undefined;

  // Handlers
  handleClear: () => void;
  handleNewUnitary: (() => void) | undefined;
  handleRepeat: () => void;
  handleNextLevel: () => void;
  handleSkipLevel: () => void;
  showSkip: boolean;

  // Completion modal
  showCompletionModal: boolean;

  // Drag and drop
  activeId: string | null;
  hoveredCellId: string | null;
  isDraggingPlacedGate: boolean;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragMove: (event: DragMoveEvent) => void;
  onDragCancel: (event: DragCancelEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;

  // Bloch sphere
  blochState: BlochState;
  targetBlochState: BlochState | null;
  initialState: 0 | 1;
  setInitialState: (val: 0 | 1) => void;
  showOrderTip: boolean;
  setShowOrderTip: (val: boolean) => void;
  isSLevel: boolean;

  // Scroll ref (passed through from SolveLevelContent)
  circuitOutputRef: React.RefObject<HTMLDivElement>;
}

type Tab = "play" | "info";

function tabBtnClass(active: boolean): string {
  return [
    "flex-1 py-2.5 font-mono text-[11px] tracking-[0.08em] uppercase border-b-2 transition-colors",
    active
      ? "border-tier3 text-tier3"
      : "border-transparent text-text-muted hover:text-text-body",
  ].join(" ");
}

export function MobileSolveLayout({
  currentLevel,
  isSeedDrivenLevel,
  dynamicTruth,
  gates,
  removeGate,
  setGateOrder,
  setGateTheta,
  setParameterSlot,
  showParameterSlotControls = false,
  rows,
  allCorrect,
  outputTableMode,
  handleCheck,
  validationError,
  isChecking,
  isMutationPending,
  mutationError,
  gradingSummary,
  handleClear,
  handleNewUnitary,
  handleRepeat,
  handleNextLevel,
  handleSkipLevel,
  showSkip,
  showCompletionModal,
  activeId,
  hoveredCellId,
  isDraggingPlacedGate,
  onDragStart,
  onDragOver,
  onDragMove,
  onDragCancel,
  onDragEnd,
  sensors,
  blochState,
  targetBlochState,
  initialState,
  setInitialState,
  showOrderTip,
  setShowOrderTip,
  isSLevel,
  circuitOutputRef,
}: MobileSolveLayoutProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>("info");

  return (
    <TooltipProvider>
      <div className="flex flex-1 flex-col min-h-0 w-full h-full">
        <DndContext
          sensors={sensors}
          collisionDetection={cellFirstCollision}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragOver={onDragOver}
          onDragCancel={onDragCancel}
          onDragEnd={onDragEnd}
        >
          {/* ── Tab bar ── */}
          <div className="flex shrink-0 border-b border-tier1 bg-bg-sidebar">
            <button
              type="button"
              onClick={() => setActiveTab("play")}
              className={tabBtnClass(activeTab === "play")}
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={tabBtnClass(activeTab === "info")}
            >
              Info
            </button>
          </div>

          {/* ── Play tab ── */}
          {activeTab === "play" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto panel-scroll">

              {/* Horizontal gate row */}
              <div className="shrink-0 px-3 pt-3 pb-2 bg-bg-sidebar border-b border-tier1">
                <p className="panel-heading mb-2">
                  GATESET
                </p>
                <div className="flex flex-nowrap overflow-x-auto gap-2 pb-1">
                  {currentLevel.toolbox.map((gate) => {
                    const cfg = MOBILE_GATE_CONFIG[gate];
                    if (!cfg) return null;
                    return (
                      <DraggableTool
                        key={gate}
                        id={cfg.toolId}
                        className="relative flex items-center bg-bg-elevated border border-tier1 rounded px-2 py-1.5 hover:border-tier2 shrink-0 min-w-[72px]"
                      >
                        <span
                          draggable={false}
                          className="font-mono font-medium text-[13px] text-tier3 leading-tight pointer-events-none select-none"
                        >
                          {cfg.label}
                        </span>
                      </DraggableTool>
                    );
                  })}
                </div>
                <p className="mt-1.5 font-sans text-xs text-text-muted leading-relaxed">
                  {currentLevel.number_of_qubits === 1
                    ? "Drag a gate onto the wires."
                    : "Drag a gate onto the wires. For 2-qubit gates, set the order after placement."}
                </p>
              </div>

              {/* Circuit canvas — full width, horizontal scroll wrapper */}
              <div
                className="canvas-grid bg-bg-app p-4 shrink-0"
                style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}
              >
                <CircuitCanvas
                  gates={gates}
                  numberOfQubits={currentLevel.number_of_qubits}
                  hoveredCellId={hoveredCellId}
                  isDraggingPlacedGate={isDraggingPlacedGate}
                  onRemoveGate={removeGate}
                  onSetGateOrder={setGateOrder}
                  onSetGateTheta={setGateTheta}
                  onSetParameterSlot={setParameterSlot}
                  showParameterSlotControls={showParameterSlotControls}
                  onCheck={handleCheck}
                  onClear={handleClear}
                  isChecking={isMutationPending}
                  onSkip={handleSkipLevel}
                  showSkip={showSkip}
                />
              </div>

              {/* Bloch sphere — single-qubit levels only */}
              {currentLevel.number_of_qubits === 1 && (
                <div className="px-4 pb-4 shrink-0">
                  <div className="rounded-md border border-tier1 p-3">
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
                            Gate order matters — to visually see how Rz(θ) rotates the Bloch
                            sphere, try placing Sqrt_X first.
                          </p>
                        </div>
                      )}
                      <Tooltip id="bloch-sphere-mobile">{BLOCH_SPHERE_TOOLTIP}</Tooltip>
                    </div>
                  </div>
                </div>
              )}

              <LevelCompleteModal
                isOpen={showCompletionModal}
                onRepeat={handleRepeat}
                onNext={handleNextLevel}
                hasNextLevel={getNextLevel(currentLevel) !== null}
              />
            </div>
          )}

          {/* ── Info tab ── */}
          {activeTab === "info" && (
            <div className="flex-1 min-h-0 overflow-y-auto panel-scroll p-4 flex flex-col gap-4">
              <TaskCard
                level={currentLevel}
                dynamicTruth={isSeedDrivenLevel ? dynamicTruth : undefined}
                onNewUnitary={handleNewUnitary}
              />
              <div ref={circuitOutputRef}>
                <OutputTable
                  rows={rows}
                  mode={outputTableMode}
                  isCorrect={allCorrect}
                  error={validationError ?? mutationError}
                  isChecking={isChecking}
                  onClearAndRetry={handleClear}
                  gradingSummary={gradingSummary}
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
            </div>
          )}

          {/* DragOverlay — must stay inside DndContext */}
          <DragOverlay>
            <DragGateOverlay activeId={activeId} gates={gates} numberOfQubits={currentLevel.number_of_qubits} />
          </DragOverlay>
        </DndContext>
      </div>
    </TooltipProvider>
  );
}

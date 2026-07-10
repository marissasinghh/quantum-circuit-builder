import { useNavigate } from "react-router-dom";
import { useLevelProgress } from "../hooks/useLevelProgress";
import { LEVEL_ORDER, getLevelNumber } from "../config/levels";
import { GateDisplayLabel } from "../components/GateDisplayLabel";
import { LevelTierSection } from "../components/LevelTierSection";
import { SolutionCircuitPreview } from "../components/SolutionCircuitPreview";
import { loadLevelSolutions } from "../utils/levelSolutions";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import type { PlacedGate } from "../types/global";

type LevelTierItem = {
  level: LevelDefinition;
  index: number;
};

function SolutionCard({
  level,
  levelNum,
  gates,
  isCompleted,
  isSkipped,
  onClick,
}: {
  level: LevelDefinition;
  levelNum: string;
  gates: PlacedGate[];
  isCompleted: boolean;
  isSkipped: boolean;
  onClick: () => void;
}) {
  const hasSolution = gates.length > 0;

  if (!hasSolution) {
    return (
      <div className="rounded-panel border p-4 flex flex-col gap-2 bg-navy border-dashed border-tier1 text-text-faint opacity-60 select-none">
        <div className="flex items-center justify-between level-label">
          <span>LEVEL {levelNum}</span>
        </div>
        <p className="nav-level-name">
          <GateDisplayLabel gate={level.target_unitary} />
        </p>
        <p className="figure-caption">no saved solution</p>
      </div>
    );
  }

  let cardClass =
    "rounded-panel border p-4 flex flex-col gap-2 transition select-none ";
  if (isCompleted) {
    cardClass += "bg-navy border-grid text-cyan-muted cursor-pointer hover:border-cyan-muted";
  } else if (isSkipped) {
    cardClass +=
      "bg-navy border-grid text-slate opacity-80 cursor-pointer hover:border-grid hover:text-text-secondary";
  } else {
    cardClass += "bg-navy border-grid text-cyan cursor-pointer hover:border-cyan";
  }

  const gateCountLabel = gates.length === 1 ? "1 gate" : `${gates.length} gates`;

  return (
    <div onClick={onClick} className={cardClass}>
      <div className="flex items-center justify-between level-label">
        <span>LEVEL {levelNum}</span>
        {isCompleted && <span className="text-text-emphasis">✓</span>}
        {isSkipped && !isCompleted && <span className="text-text-faint">⏭</span>}
      </div>

      <p className="nav-level-name">
        <GateDisplayLabel gate={level.target_unitary} />
      </p>

      <SolutionCircuitPreview gates={gates} numberOfQubits={level.number_of_qubits} />

      <p className="figure-caption">{gateCountLabel}</p>
    </div>
  );
}

export default function MySolutionsPage() {
  const { completedLevels, skippedLevels } = useLevelProgress();
  const navigate = useNavigate();
  const solutions = loadLevelSolutions();

  const allItems: LevelTierItem[] = LEVEL_ORDER.map((level, index) => ({
    level,
    index,
  }));

  const tier1 = allItems.filter((item) => item.level.number_of_qubits === 1);
  const tier2 = allItems.filter((item) => item.level.number_of_qubits === 2);
  const tier3 = allItems.filter((item) => item.level.number_of_qubits === 3);

  function renderSolutionCard({ level, index }: LevelTierItem) {
    const levelId = level.target_unitary;
    const gates = solutions[levelId] ?? [];
    const isCompleted = completedLevels.includes(levelId);
    const isSkipped = skippedLevels.includes(levelId);

    return (
      <SolutionCard
        level={level}
        levelNum={getLevelNumber(index)}
        gates={gates}
        isCompleted={isCompleted}
        isSkipped={isSkipped}
        onClick={() => navigate("/level/" + levelId)}
      />
    );
  }

  return (
    <main className="flex-1 overflow-y-auto panel-scroll canvas-grid p-6 space-y-8">
      <div>
        <p className="page-eyebrow mb-3">{"// MY SOLUTIONS"}</p>
        <h1 className="page-title mb-2">My Solutions</h1>
        <p className="text-body text-text-secondary italic mb-4">
          Saved circuits from your level attempts. Click a card to continue editing.
        </p>
      </div>
      <LevelTierSection
        title="Tier 1 — Single Qubit"
        items={tier1}
        getKey={(item) => item.level.target_unitary}
        renderCard={renderSolutionCard}
      />
      <LevelTierSection
        title="Tier 2 — Two Qubit"
        items={tier2}
        getKey={(item) => item.level.target_unitary}
        renderCard={renderSolutionCard}
      />
      <LevelTierSection
        title="Tier 3 — Three Qubit"
        items={tier3}
        getKey={(item) => item.level.target_unitary}
        renderCard={renderSolutionCard}
      />
    </main>
  );
}

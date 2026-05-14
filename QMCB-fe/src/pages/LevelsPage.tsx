import { useNavigate } from "react-router-dom";
import { useLevelProgress } from "../hooks/useLevelProgress";
import { LEVEL_ORDER } from "../config/levels";
import type { LevelDefinition } from "../interfaces/levelDefinition";

type LevelStatus = "locked" | "unlocked" | "completed";

function getLevelStatus(
  index: number,
  level: LevelDefinition,
  completedLevels: string[]
): LevelStatus {
  const isCompleted = completedLevels.includes(level.target_unitary);
  const isUnlocked =
    index === 0 || completedLevels.includes(LEVEL_ORDER[index - 1].target_unitary);

  if (isCompleted) return "completed";
  if (isUnlocked) return "unlocked";
  return "locked";
}

function levelNumber(index: number): string {
  if (index < 7) return `1.${index}`;
  return `2.${index - 6}`;
}

function LevelCard({
  level,
  status,
  levelNum,
  onClick,
}: {
  level: LevelDefinition;
  status: LevelStatus;
  levelNum: string;
  onClick: () => void;
}) {
  const isLocked = status === "locked";

  return (
    <div
      onClick={isLocked ? undefined : onClick}
      className={[
        "rounded-xl border p-5 flex flex-col gap-2 transition select-none",
        isLocked
          ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
          : status === "completed"
          ? "bg-green-50 border-green-200 text-gray-900 cursor-pointer hover:shadow-md"
          : "bg-white border-gray-200 text-gray-900 cursor-pointer hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex items-center justify-between text-xs font-medium text-gray-400">
        <span>Level {levelNum}</span>
        {status === "completed" && <span className="text-green-600 text-base">✓</span>}
        {status === "locked" && <span className="text-gray-300 text-base">🔒</span>}
      </div>

      <p className="text-lg font-semibold tracking-wide">{level.target_unitary}</p>

      <span className="text-xs text-gray-400">
        {level.number_of_qubits === 1 ? "1-qubit" : "2-qubit"}
      </span>
    </div>
  );
}

function TierSection({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: { level: LevelDefinition; index: number; status: LevelStatus }[];
  onNavigate: (id: string) => void;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(({ level, index, status }) => (
          <LevelCard
            key={level.target_unitary}
            level={level}
            status={status}
            levelNum={levelNumber(index)}
            onClick={() => onNavigate(level.target_unitary)}
          />
        ))}
      </div>
    </section>
  );
}

export default function LevelsPage() {
  const { completedLevels } = useLevelProgress();
  const navigate = useNavigate();

  const allItems = LEVEL_ORDER.map((level, index) => ({
    level,
    index,
    status: getLevelStatus(index, level, completedLevels),
  }));

  const tier1 = allItems.filter((item) => item.level.number_of_qubits === 1);
  const tier2 = allItems.filter((item) => item.level.number_of_qubits === 2);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      <h1 className="text-2xl font-bold text-gray-900">Choose a Level</h1>
      <TierSection
        title="Tier 1 — Single Qubit"
        items={tier1}
        onNavigate={(id) => navigate("/level/" + id)}
      />
      <TierSection
        title="Tier 2 — Two Qubit"
        items={tier2}
        onNavigate={(id) => navigate("/level/" + id)}
      />
    </main>
  );
}

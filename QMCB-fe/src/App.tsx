import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AppHeader } from "./components/AppHeader";
import LevelsPage from "./pages/LevelsPage";
import SolveLevelPage from "./pages/SolveLevelPage";
import AboutPage from "./pages/AboutPage";
import SettingsPage from "./pages/SettingsPage";
import { useLevelProgress } from "./hooks/useLevelProgress";
import { LEVEL_ORDER } from "./config/levels";
import type { LevelDefinition } from "./interfaces/levelDefinition";

type LevelStatus = "locked" | "unlocked" | "completed";

function getLevelStatus(
  index: number,
  level: LevelDefinition,
  completedLevels: string[]
): LevelStatus {
  if (level.locked) return "locked";

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

function LevelSidebar() {
  const { completedLevels } = useLevelProgress();
  const navigate = useNavigate();
  const location = useLocation();

  const activeId = location.pathname.startsWith("/level/")
    ? location.pathname.replace("/level/", "")
    : null;

  const allItems = LEVEL_ORDER.map((level, index) => ({
    level,
    index,
    status: getLevelStatus(index, level, completedLevels),
  }));

  const tier1 = allItems.filter((item) => item.level.number_of_qubits === 1);
  const tier2 = allItems.filter((item) => item.level.number_of_qubits === 2);

  function renderTier(title: string, items: typeof tier1) {
    return (
      <div>
        <div className="px-[14px] pt-2 pb-1 font-mono text-[10px] tracking-[0.12em] text-slate-muted uppercase">
          {title}
        </div>
        {items.map(({ level, index, status }) => {
          const isLocked = status === "locked";
          const isActive = activeId === level.target_unitary;
          const isCompleted = status === "completed";

          let rowColor = "text-slate";
          let dotColor = "bg-slate";
          if (isCompleted) {
            rowColor = "text-cyan-muted";
            dotColor = "bg-cyan-muted";
          }
          if (isActive) {
            rowColor = "text-cyan";
            dotColor = "bg-cyan";
          }

          return (
            <div
              key={level.target_unitary}
              onClick={isLocked ? undefined : () => navigate("/level/" + level.target_unitary)}
              className={[
                "flex items-center gap-1.5 px-[14px] py-1.5 font-sans text-[12px] cursor-pointer select-none",
                rowColor,
                isLocked ? "cursor-not-allowed opacity-60" : "hover:bg-navy-light",
                isActive ? "bg-grid border-l-2 border-cyan" : "",
              ].join(" ")}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
              <span>
                {levelNumber(index)} {level.target_unitary}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <aside className="w-[180px] shrink-0 bg-navy border-r border-grid overflow-y-auto h-full">
      {renderTier("Tier 1 — Single Qubit", tier1)}
      {renderTier("Tier 2 — Two Qubit", tier2)}
    </aside>
  );
}

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-space text-[#e8eaf6]">
      <AppHeader />
      <div className="flex flex-1 min-h-0">
        <LevelSidebar />
        <div className="flex flex-1 min-w-0 min-h-0 w-full flex-col">
          <Routes>
            <Route path="/" element={<Navigate to="/levels" replace />} />
            <Route path="/levels" element={<LevelsPage />} />
            <Route
              path="/level/:id"
              element={
                <div className="flex flex-1 min-h-0 w-full [&_section]:flex-[1.1] [&_section]:min-w-0 [&_aside]:flex-[0.9] [&_aside]:min-w-0 [&_aside]:!w-auto">
                  <SolveLevelPage />
                </div>
              }
            />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

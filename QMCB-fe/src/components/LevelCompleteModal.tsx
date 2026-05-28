interface LevelCompleteModalProps {
  isOpen: boolean;
  onRepeat: () => void;
  onNext: () => void;
  hasNextLevel: boolean;
}

const primaryBtnClass =
  "w-full py-1.5 bg-tier3/5 border border-tier3/35 rounded-gate font-mono text-[11px] text-tier3 tracking-[0.05em] hover:bg-tier3/10 hover:border-tier3/60 transition-colors";

const secondaryBtnClass =
  "w-full py-1.5 bg-transparent border border-tier1 rounded-gate font-mono text-[11px] text-text-muted tracking-[0.05em] hover:border-tier2 hover:text-tier2 transition-colors";

export function LevelCompleteModal({
  isOpen,
  onRepeat,
  onNext,
  hasNextLevel,
}: LevelCompleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(8,12,24,0.92)]" />

      <div className="relative bg-bg-panel border border-tier1 rounded-panel p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="font-mono text-base uppercase text-tier3 mb-2">LEVEL COMPLETE</h2>

          <p className="font-sans text-[11px] text-text-body mb-6">
            Target circuit verified. Proceed to the next level or repeat this one.
          </p>

          <div className="flex flex-col gap-2">
            <button onClick={onRepeat} className={secondaryBtnClass}>
              Repeat level
            </button>

            {hasNextLevel && (
              <button onClick={onNext} className={primaryBtnClass}>
                Next level →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

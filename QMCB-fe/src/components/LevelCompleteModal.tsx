interface LevelCompleteModalProps {
  isOpen: boolean;
  onRepeat: () => void;
  onNext: () => void;
  hasNextLevel: boolean;
}

const btnClass =
  "w-full py-1.5 bg-navy border border-cyan rounded-gate font-mono text-[10px] text-cyan-muted tracking-[0.05em] hover:bg-grid transition-colors";

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

      <div className="relative bg-navy border border-cyan rounded-panel p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="font-mono text-base text-cyan mb-2">LEVEL COMPLETE</h2>

          <p className="font-sans text-[11px] text-cyan-muted mb-6">
            Target circuit verified. Proceed to the next level or repeat this one.
          </p>

          <div className="flex flex-col gap-2">
            <button onClick={onRepeat} className={btnClass}>
              REPEAT LEVEL
            </button>

            {hasNextLevel && (
              <button onClick={onNext} className={btnClass}>
                NEXT LEVEL →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface BlochTargetHintProps {
  onDismiss: () => void;
}

export function BlochTargetHint({ onDismiss }: BlochTargetHintProps) {
  return (
    <div className="absolute top-2 right-2 z-10 max-w-[10.5rem] text-[10px] text-text-body bg-bg-panel border border-tier1 rounded-panel px-2 py-1.5 leading-relaxed font-sans">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-0 right-0 flex items-center justify-center min-w-[32px] min-h-[32px] text-tier2 hover:text-tier3 leading-none"
        aria-label="Dismiss tip"
      >
        ×
      </button>
      <p className="pr-6">This red dot is your target. Get the blue vector to match it!</p>
    </div>
  );
}

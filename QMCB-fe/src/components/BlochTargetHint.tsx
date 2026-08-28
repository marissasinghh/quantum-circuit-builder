interface BlochTargetHintProps {
  onDismiss: () => void;
}

export function BlochTargetHint({ onDismiss }: BlochTargetHintProps) {
  return (
    <div className="relative w-full mt-[14px] text-[10px] text-text-body bg-bg-panel border border-tier1 rounded-panel px-2 py-1.5 leading-relaxed font-sans">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-0.5 right-1 text-tier2 hover:text-tier3 leading-none"
        aria-label="Dismiss tip"
      >
        ×
      </button>
      <p className="pr-4">This red dot is your target. Get the blue vector to match it!</p>
    </div>
  );
}

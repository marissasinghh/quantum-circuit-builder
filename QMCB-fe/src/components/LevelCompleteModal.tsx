interface LevelCompleteModalProps {
  isOpen: boolean;
  onRepeat: () => void;
  onNext: () => void;
  hasNextLevel: boolean;
}

export function LevelCompleteModal({
  isOpen,
  onRepeat,
  onNext,
  hasNextLevel,
}: LevelCompleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />

      {/* Modal content */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Success icon */}
          <div className="mb-4 text-6xl">🎉</div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Level Completed!</h2>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Congratulations! You&apos;ve successfully built the target circuit.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onRepeat}
              className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Repeat Level
            </button>

            {hasNextLevel && (
              <button
                onClick={onNext}
                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Next Level →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
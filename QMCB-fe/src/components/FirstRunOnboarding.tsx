import {
  HAS_SEEN_ONBOARDING_KEY,
  LEVEL_PROGRESS_KEY,
} from "../utils/constants";

interface FirstRunOnboardingProps {
  variant: "fullscreen" | "inline";
  onComplete?: () => void;
}

export function hasLevelProgress(): boolean {
  try {
    return localStorage.getItem(LEVEL_PROGRESS_KEY) !== null;
  } catch {}
  return false;
}

function markOnboardingSeen(): void {
  try {
    localStorage.setItem(HAS_SEEN_ONBOARDING_KEY, "true");
  } catch {}
}

function OnboardingContent() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Quantum Circuit Builder</h1>
        <p className="text-gray-500">A quick intro before you start playing.</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">Qubit vs. classical bit</h2>
        <p className="text-gray-600 leading-relaxed">
          A classical bit is always 0 or 1. A qubit carries a full state — not just a label,
          but where the state sits on the Bloch sphere. Quantum operations move that state;
          they are reversible rotations, not one-way flips.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">Bloch sphere axes</h2>
        <p className="text-gray-600 leading-relaxed">
          Think of the sphere as a map of one qubit. The north pole (+Z) is |0⟩, the south pole
          (−Z) is |1⟩. Around the equator you&apos;ll find |+⟩, |−⟩, |i⟩, and |−i⟩ — equal
          superpositions pointing in different directions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">Gates are rotations</h2>
        <p className="text-gray-600 leading-relaxed">
          Every single-qubit gate you place is a rotation on this sphere. Spin around X, Y, or Z
          — or combine them — and the state moves to a new point.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">How you&apos;ll learn</h2>
        <p className="text-gray-600 leading-relaxed">
          We&apos;re going to discover what quantum gates do by finding the rotations that
          produce our target outputs. Build a circuit, watch the sphere move, and match the goal.
        </p>
      </section>
    </div>
  );
}

export function FirstRunOnboarding({ variant, onComplete }: FirstRunOnboardingProps) {
  const handleComplete = () => {
    markOnboardingSeen();
    onComplete?.();
  };

  if (variant === "inline") {
    return <OnboardingContent />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <OnboardingContent />
      <div className="max-w-2xl mx-auto px-6 pb-10">
        <button
          type="button"
          onClick={handleComplete}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          Got it, start playing
        </button>
      </div>
    </div>
  );
}

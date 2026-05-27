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

const btnClass =
  "px-4 py-2 bg-navy border border-cyan rounded-gate font-mono text-[10px] text-cyan-muted tracking-[0.05em] hover:bg-grid transition-colors";

function OnboardingContent() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <header className="space-y-2">
        <p className="font-mono text-[9px] tracking-[0.1em] text-cyan">// WELCOME</p>
        <h1 className="font-mono text-base font-bold text-cyan tracking-wide">
          ⟨ψ| CNOT GAME |ψ⟩
        </h1>
        <p className="font-sans text-[11px] text-cyan-muted">
          A quick intro before you start building circuits.
        </p>
      </header>

      <section className="bg-navy border border-grid rounded-panel px-4 py-3 space-y-2">
        <h2 className="font-mono text-[9px] tracking-[0.12em] text-slate-muted uppercase">
          Qubit vs. classical bit
        </h2>
        <p className="font-sans text-[11px] text-cyan-muted leading-relaxed">
          A classical bit is always 0 or 1. A qubit carries a full state — not just a label,
          but where the state sits on the Bloch sphere. Quantum operations move that state;
          they are reversible rotations, not one-way flips.
        </p>
      </section>

      <section className="bg-navy border border-grid rounded-panel px-4 py-3 space-y-2">
        <h2 className="font-mono text-[9px] tracking-[0.12em] text-slate-muted uppercase">
          Bloch sphere axes
        </h2>
        <p className="font-sans text-[11px] text-cyan-muted leading-relaxed">
          Think of the sphere as a map of one qubit. The north pole (+Z) is |0⟩, the south pole
          (−Z) is |1⟩. Around the equator you&apos;ll find |+⟩, |−⟩, |i⟩, and |−i⟩ — equal
          superpositions pointing in different directions.
        </p>
      </section>

      <section className="bg-navy border border-grid rounded-panel px-4 py-3 space-y-2">
        <h2 className="font-mono text-[9px] tracking-[0.12em] text-slate-muted uppercase">
          Gates are rotations
        </h2>
        <p className="font-sans text-[11px] text-cyan-muted leading-relaxed">
          Every single-qubit gate you place is a rotation on this sphere. Spin around X, Y, or Z
          — or combine them — and the state moves to a new point.
        </p>
      </section>

      <section className="bg-navy border border-grid rounded-panel px-4 py-3 space-y-2">
        <h2 className="font-mono text-[9px] tracking-[0.12em] text-slate-muted uppercase">
          How you&apos;ll learn
        </h2>
        <p className="font-sans text-[11px] text-cyan-muted leading-relaxed">
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
    <div className="fixed inset-0 z-50 bg-[rgba(8,12,24,0.96)] overflow-y-auto canvas-grid">
      <OnboardingContent />
      <div className="max-w-2xl mx-auto px-6 pb-10">
        <button type="button" onClick={handleComplete} className={btnClass}>
          GOT IT, START PLAYING
        </button>
      </div>
    </div>
  );
}

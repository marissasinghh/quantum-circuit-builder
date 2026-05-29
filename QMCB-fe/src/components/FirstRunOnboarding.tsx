/**
 * First-run onboarding — full-viewport intro shown before the main game.
 */

import type { ReactNode } from "react";
import { ONBOARDING_COMPLETE_KEY } from "../utils/constants";
import { colors } from "../design-tokens";

export { ONBOARDING_COMPLETE_KEY };

export function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true";
  } catch {}
  return false;
}

interface FirstRunOnboardingProps {
  variant?: "fullscreen" | "inline";
  onComplete?: () => void;
}

function markOnboardingComplete(): void {
  try {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
  } catch {}
}

// ---------------------------------------------------------------------------
// Shared primitives (match About page design system)
// ---------------------------------------------------------------------------

function Bold({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-tier3">{children}</strong>;
}

/** Inline quantum notation — JetBrains Mono + tier3 */
function Q({ children }: { children: ReactNode }) {
  return <span className="font-mono text-tier3">{children}</span>;
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-mono text-[8px] tracking-[0.09em] text-text-muted uppercase mt-9 mb-2.5">
      {children}
    </h2>
  );
}

function BodyParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans text-[14px] text-text-body leading-relaxed">{children}</p>
  );
}

function SectionDivider() {
  return <div className="w-full border-t border-tier1 my-7" />;
}

function BlochIllustration() {
  const wire = colors.wireframe;
  return (
    <div className="flex flex-col items-center py-5 pb-4 overflow-visible">
      <svg width="310" height="320" viewBox="0 0 310 320" aria-hidden>
        <path
          d="M 50 140 a 90 22 0 0 0 180 0"
          fill="none"
          stroke={wire}
          strokeWidth={1}
          strokeDasharray="5,3"
        />
        <ellipse cx={140} cy={140} rx={90} ry={90} fill="none" stroke={wire} strokeWidth={1.5} />
        <path d="M 50 140 a 90 22 0 0 1 180 0" fill="none" stroke={wire} strokeWidth={1} />
        <line
          x1={140}
          y1={140}
          x2={140}
          y2={230}
          stroke={wire}
          strokeWidth={0.8}
          strokeDasharray="4,3"
        />
        <line x1={140} y1={140} x2={140} y2={52} stroke={colors.cyan} strokeWidth={1.2} />
        <polygon points="140,48 136,58 144,58" fill={colors.cyan} />
        <line
          x1={140}
          y1={140}
          x2={52}
          y2={140}
          stroke={wire}
          strokeWidth={0.8}
          strokeDasharray="4,3"
        />
        <line x1={140} y1={140} x2={228} y2={140} stroke={colors.cyan} strokeWidth={1.2} />
        <polygon points="232,140 222,136 222,144" fill={colors.cyan} />
        <line
          x1={140}
          y1={140}
          x2={175}
          y2={120}
          stroke={wire}
          strokeWidth={0.8}
          strokeDasharray="4,3"
        />
        <line x1={140} y1={140} x2={107} y2={159} stroke={colors.cyan} strokeWidth={1.2} />
        <polygon points="105,160 115.7,158.5 111.7,151.5" fill={colors.cyan} />
        <line x1={140} y1={140} x2={140} y2={55} stroke={colors.cyan} strokeWidth={2.5} />
        <circle cx={140} cy={55} r={5} fill="#e94560" />
        <text
          x={140}
          y={34}
          textAnchor="middle"
          fontSize={11}
          fill={colors.blochLabel}
          fontFamily="'JetBrains Mono', monospace"
        >
          |0⟩
        </text>
        <text
          x={140}
          y={16}
          textAnchor="middle"
          fontSize={13}
          fill={colors.blochLabel}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={700}
        >
          Z
        </text>
        <text
          x={244}
          y={144}
          textAnchor="start"
          fontSize={11}
          fill={colors.blochLabel}
          fontFamily="'JetBrains Mono', monospace"
        >
          |+⟩
        </text>
        <text
          x={265}
          y={144}
          textAnchor="start"
          fontSize={13}
          fill={colors.blochLabel}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={700}
        >
          Y
        </text>
        <text
          x={108}
          y={174}
          textAnchor="end"
          fontSize={11}
          fill={colors.blochLabel}
          fontFamily="'JetBrains Mono', monospace"
        >
          |i⟩
        </text>
        <text
          x={88}
          y={183}
          textAnchor="end"
          fontSize={13}
          fill={colors.blochLabel}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={700}
        >
          X
        </text>
        <text
          x={140}
          y={250}
          textAnchor="middle"
          fontSize={11}
          fill={colors.blochLabel}
          fontFamily="'JetBrains Mono', monospace"
        >
          |1⟩
        </text>
        <text
          x={34}
          y={144}
          textAnchor="end"
          fontSize={11}
          fill={colors.blochLabel}
          fontFamily="'JetBrains Mono', monospace"
        >
          |−⟩
        </text>
        <text
          x={190}
          y={112}
          textAnchor="start"
          fontSize={11}
          fill={colors.blochLabel}
          fontFamily="'JetBrains Mono', monospace"
        >
          |−i⟩
        </text>
      </svg>
      <p className="font-sans text-[10px] text-text-muted mt-2">
        The Bloch sphere — state vector at <Q>|0⟩</Q>
      </p>
    </div>
  );
}

function OnboardingContent({
  showCta,
  showPageHeader = true,
  onComplete,
}: {
  showCta: boolean;
  showPageHeader?: boolean;
  onComplete?: () => void;
}) {
  const handleStart = () => {
    markOnboardingComplete();
    onComplete?.();
  };

  return (
    <>
      {showPageHeader && (
        <>
          <p className="font-mono text-[11px] tracking-[0.12em] text-cyan uppercase mb-3">
            {"// welcome"}
          </p>
          <h1
            className="page-heading text-[28px] text-tier3 leading-[1.2] mb-2"
            style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 600 }}
          >
            Welcome
          </h1>
          <p className="font-sans text-[14px] text-slate italic mb-10">
            A quick intro before you start building circuits.
          </p>
        </>
      )}

      <SectionHeader>Bits vs. qubits</SectionHeader>
      <BodyParagraph>
        In classical computing, the most basic unit of information is the <Bold>bit</Bold>. A
        bit is always either 0 or 1. No in between, no ambiguity. A quantum computer works with{" "}
        <Bold>qubits</Bold>, the quantum version of bits. Qubits can do something classical bits
        fundamentally cannot: they can exist in a <Bold>superposition</Bold> of 0 and 1 at the
        same time! A qubit carries a probability of being measured as 0 and a probability of being
        measured as 1, and it holds both simultaneously until the moment you actually measure it.
        The best part? Nature stores that full state for you automatically. Not your hardware.
        Nature!
      </BodyParagraph>

      <SectionDivider />

      <SectionHeader>The Bloch sphere</SectionHeader>
      <BodyParagraph>
        To visualize a qubit&apos;s state, we use the <Bold>Bloch sphere</Bold>.
      </BodyParagraph>
      <BlochIllustration />
      <BodyParagraph>
        It is a unit sphere where every possible single-qubit state maps to exactly one point on
        its surface. The north pole is <Q>|0⟩</Q>, the south pole is <Q>|1⟩</Q>, and the equator
        is where things get interesting! <Q>|+⟩</Q>, <Q>|−⟩</Q>, <Q>|i⟩</Q>, and <Q>|−i⟩</Q> all
        live there. Each points in a different direction around the middle and represents a
        different equal superposition of 0 and 1. The X axis captures one flavor of
        superposition, the Y axis another, and the Z axis is your classical north/south pole axis.
        State vector pointing straight up? You are at <Q>|0⟩</Q>. Straight down? <Q>|1⟩</Q>.
        Anywhere else on the sphere and you are in superposition.
      </BodyParagraph>

      <SectionDivider />

      <SectionHeader>Gates are rotations</SectionHeader>
      <BodyParagraph>
        In classical computing, logic gates change the state of bits. A classical NOT gate flips
        0 to 1 and 1 to 0. Quantum gates do the same thing for qubits, but with a twist: every
        single-qubit quantum gate is a <Bold>rotation</Bold> on the Bloch sphere! Apply a gate to
        your qubit and the state vector swings to a new point on the surface. Gates are
        rotations. States are points. The sphere is your map.
      </BodyParagraph>

      <SectionDivider />

      <SectionHeader>Why quantum gates are special</SectionHeader>
      <BodyParagraph>
        There is one more thing that makes quantum gates special, and it is huge: they are{" "}
        <Bold>invertible</Bold>! In classical computing, if someone hands you the output of a
        logic gate you often cannot figure out what the input was. Information gets lost. In
        quantum computing every gate operation can be undone. The math is reversible by design.
        This means quantum circuits can preserve and manipulate information in ways that
        classical circuits simply cannot. This is not an engineering trick. It is baked into the
        physics!
      </BodyParagraph>

      <SectionDivider />

      <SectionHeader>What we&apos;re doing here</SectionHeader>
      <BodyParagraph>
        So here is what we are going to do. We are starting from the simplest quantum gates and
        building up one level at a time. Each level gives you a target transformation to
        implement. Your job is to assemble a circuit from the gates in your toolbox, watch the
        Bloch sphere update in real time as you place and tune each gate, and match the target
        output. You will build intuition for what each gate does, how rotations combine, and how
        to engineer a specific quantum transformation from scratch!
      </BodyParagraph>
      <BodyParagraph>
        Build circuits. Watch the state vector on the bloch sphere move. Match the goal. Learn.
      </BodyParagraph>

      <p className="font-mono text-[22px] font-bold text-tier3 tracking-[0.06em] mt-5">
        {"// Good luck!"}
      </p>

      {showCta && (
        <div className="mt-10">
          <button
            type="button"
            onClick={handleStart}
            className="bg-tier3/5 border border-tier3/35 rounded-gate text-tier3 font-mono text-[12px] px-7 py-3 cursor-pointer tracking-[0.1em] uppercase hover:bg-tier3/10 hover:border-tier3/60 transition-colors"
          >
            Got it, start playing
          </button>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function FirstRunOnboarding({ variant = "fullscreen", onComplete }: FirstRunOnboardingProps) {
  if (variant === "inline") {
    return <OnboardingContent showCta={false} showPageHeader={false} />;
  }

  return (
    <div className="h-screen flex flex-col bg-bg-app text-text-body">
      <header className="bg-[#090f1d] border-b border-tier1 h-10 shrink-0 px-4 flex items-center">
        <span className="font-mono text-[14px] text-tier3 tracking-[0.05em]">
          ⟨ψ| CNOT GAME |ψ⟩
        </span>
      </header>

      <main className="flex-1 overflow-y-auto canvas-grid p-6 bg-bg-app">
        <div className="max-w-[620px] mx-auto">
          <OnboardingContent showCta onComplete={onComplete} />
        </div>
      </main>
    </div>
  );
}

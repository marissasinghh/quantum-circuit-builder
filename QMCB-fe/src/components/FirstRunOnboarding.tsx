/**
 * First-run onboarding — full-viewport intro shown before the main game.
 */

import type { ReactNode } from "react";
import { ONBOARDING_COMPLETE_KEY } from "../utils/constants";
import { colors, fonts } from "../design-tokens";

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
// Shared primitives
// ---------------------------------------------------------------------------

function Bold({ children }: { children: ReactNode }) {
  return <strong className="text-cyan-muted font-semibold">{children}</strong>;
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-mono text-[10px] tracking-[0.14em] text-cyan uppercase opacity-80 mt-9 mb-2.5">
      {children}
    </h2>
  );
}

function BodyParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans text-[14px] text-[#b0bec5] leading-[1.8]">{children}</p>
  );
}

function SectionDivider() {
  return <div className="w-full h-px bg-grid opacity-50 my-7" />;
}

function DotCluster({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-1 h-1 rounded-full bg-cyan opacity-20" />
      ))}
    </div>
  );
}

function DecoLine() {
  return <div className="w-px flex-1 min-h-[60px] bg-grid opacity-50" />;
}

function AtomDecoration() {
  return (
    <svg
      viewBox="0 0 56 56"
      width={56}
      height={56}
      className="opacity-[0.15]"
      aria-hidden
    >
      <ellipse
        cx={28}
        cy={28}
        rx={11}
        ry={25}
        fill="none"
        stroke={colors.cyan}
        strokeWidth={1}
        transform="rotate(0 28 28)"
      />
      <ellipse
        cx={28}
        cy={28}
        rx={11}
        ry={25}
        fill="none"
        stroke={colors.cyan}
        strokeWidth={1}
        transform="rotate(60 28 28)"
      />
      <ellipse
        cx={28}
        cy={28}
        rx={11}
        ry={25}
        fill="none"
        stroke={colors.cyan}
        strokeWidth={1}
        transform="rotate(120 28 28)"
      />
      <circle cx={28} cy={28} r={4} fill={colors.cyan} />
    </svg>
  );
}

function CrosshairDecoration() {
  return (
    <svg
      viewBox="0 0 44 44"
      width={44}
      height={44}
      className="opacity-[0.15]"
      aria-hidden
    >
      <circle
        cx={22}
        cy={22}
        r={18}
        fill="none"
        stroke={colors.cyan}
        strokeWidth={0.8}
      />
      <circle
        cx={22}
        cy={22}
        r={10}
        fill="none"
        stroke={colors.cyan}
        strokeWidth={0.5}
        strokeDasharray="3,2"
      />
      <circle cx={22} cy={22} r={3} fill={colors.cyan} />
      <line x1={4} y1={22} x2={40} y2={22} stroke={colors.cyan} strokeWidth={0.5} />
      <line x1={22} y1={4} x2={22} y2={40} stroke={colors.cyan} strokeWidth={0.5} />
    </svg>
  );
}

function DecoColumn({ side }: { side: "left" | "right" }) {
  const label = side === "left" ? "quantum" : "circuits";
  const Decoration = side === "left" ? AtomDecoration : CrosshairDecoration;

  return (
    <div className="w-[160px] shrink-0 flex flex-col items-center py-12 gap-3 self-stretch">
      <DotCluster count={5} />
      <DecoLine />
      <Decoration />
      <DecoLine />
      <span
        className="font-mono text-[9px] tracking-[0.15em] text-cyan uppercase opacity-30"
        style={{ writingMode: "vertical-rl" }}
      >
        {label}
      </span>
      <DecoLine />
      <DotCluster count={3} />
    </div>
  );
}

function BlochIllustration() {
  return (
    <div className="flex flex-col items-center py-5 pb-4">
      <svg width={180} height={190} viewBox="0 0 180 190" aria-hidden>
        <ellipse
          cx={90}
          cy={90}
          rx={72}
          ry={72}
          fill="none"
          stroke={colors.grid}
          strokeWidth={1.5}
        />
        <ellipse
          cx={90}
          cy={90}
          rx={72}
          ry={20}
          fill="none"
          stroke={colors.grid}
          strokeWidth={0.8}
          strokeDasharray="5,3"
        />
        <line x1={90} y1={18} x2={90} y2={162} stroke={colors.grid} strokeWidth={0.8} />
        <line x1={18} y1={90} x2={162} y2={90} stroke={colors.grid} strokeWidth={0.8} />
        <line
          x1={32}
          y1={57}
          x2={148}
          y2={123}
          stroke={colors.grid}
          strokeWidth={0.5}
          strokeDasharray="3,2"
        />
        <line x1={90} y1={90} x2={90} y2={20} stroke={colors.cyan} strokeWidth={2.5} />
        <circle cx={90} cy={20} r={6} fill={colors.cyan} />
        <text
          x={90}
          y={11}
          fontSize={11}
          fontFamily={fonts.mono}
          fill={colors.slate}
          textAnchor="middle"
        >
          |0⟩
        </text>
        <text
          x={90}
          y={178}
          fontSize={11}
          fontFamily={fonts.mono}
          fill={colors.slate}
          textAnchor="middle"
        >
          |1⟩
        </text>
        <text
          x={168}
          y={94}
          fontSize={10}
          fontFamily={fonts.mono}
          fill={colors.slate}
          textAnchor="start"
        >
          |+⟩
        </text>
        <text
          x={4}
          y={94}
          fontSize={10}
          fontFamily={fonts.mono}
          fill={colors.slate}
          textAnchor="start"
        >
          |−⟩
        </text>
        <text
          x={153}
          y={64}
          fontSize={10}
          fontFamily={fonts.mono}
          fill={colors.slate}
          textAnchor="start"
        >
          |i⟩
        </text>
        <text
          x={2}
          y={64}
          fontSize={10}
          fontFamily={fonts.mono}
          fill={colors.slate}
          textAnchor="start"
        >
          |−i⟩
        </text>
      </svg>
      <p className="font-mono text-[9px] text-slate-muted tracking-[0.1em] uppercase mt-2">
        The Bloch sphere — state vector at |0⟩
      </p>
    </div>
  );
}

function OnboardingContent({
  showCta,
  onComplete,
}: {
  showCta: boolean;
  onComplete?: () => void;
}) {
  const handleStart = () => {
    markOnboardingComplete();
    onComplete?.();
  };

  return (
    <>
      <p className="font-mono text-[11px] tracking-[0.12em] text-cyan uppercase mb-3">
        // welcome
      </p>
      <h1 className="font-mono text-[28px] font-bold text-cyan tracking-[0.04em] leading-[1.2] mb-2">
        ⟨ψ| CNOT GAME |ψ⟩
      </h1>
      <p className="font-sans text-[14px] text-slate italic mb-10">
        A quick intro before you start building circuits.
      </p>

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
        its surface. The north pole is |0⟩, the south pole is |1⟩, and the equator is where things
        get interesting! |+⟩, |−⟩, |i⟩, and |−i⟩ all live there. Each points in a different
        direction around the middle and represents a different equal superposition of 0 and 1. The
        X axis captures one flavor of superposition, the Y axis another, and the Z axis is your
        classical north/south pole axis. State vector pointing straight up? You are at |0⟩.
        Straight down? |1⟩. Anywhere else on the sphere and you are in superposition.
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

      <p className="font-mono text-[22px] font-bold text-cyan tracking-[0.06em] mt-5">
        // Good luck!
      </p>

      {showCta && (
        <div className="mt-10">
          <button
            type="button"
            onClick={handleStart}
            className="bg-navy border border-cyan rounded-gate text-cyan-muted font-mono text-[12px] px-7 py-3 cursor-pointer tracking-[0.1em] uppercase hover:bg-grid transition-colors"
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
    return (
      <div className="max-w-[620px] mx-auto">
        <OnboardingContent showCta={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-space canvas-grid">
      <header className="bg-navy border-b border-grid shrink-0 px-6 py-2.5">
        <span className="font-mono text-[13px] font-bold text-cyan tracking-[0.05em]">
          ⟨ψ| CNOT GAME |ψ⟩
        </span>
      </header>

      <div className="flex flex-1 justify-center overflow-y-auto min-h-0">
        <DecoColumn side="left" />
        <main className="flex-1 max-w-[620px] pt-12 pb-16 min-w-0">
          <OnboardingContent showCta onComplete={onComplete} />
        </main>
        <DecoColumn side="right" />
      </div>
    </div>
  );
}

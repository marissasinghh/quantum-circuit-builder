import { FirstRunOnboarding } from "../components/FirstRunOnboarding";

export default function AboutPage() {
  return (
    <main className="flex-1 overflow-y-auto canvas-grid p-6">
      <div className="max-w-2xl">
        <p className="font-mono text-[9px] tracking-[0.1em] text-cyan mb-1">// ABOUT</p>
        <h1 className="font-mono text-base font-bold text-cyan mb-2">About</h1>
        <p className="font-sans text-[11px] text-cyan-muted mb-6">
          A quick intro to how this app thinks about qubits.
        </p>
        <FirstRunOnboarding variant="inline" />
      </div>
    </main>
  );
}

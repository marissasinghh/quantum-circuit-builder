import { FirstRunOnboarding } from "../components/FirstRunOnboarding";

export default function HelpPage() {
  return (
    <main className="flex-1 overflow-y-auto canvas-grid p-6 bg-bg-app">
      <div className="max-w-[620px] mx-auto">
        <p className="page-eyebrow mb-3">
          {"// help"}
        </p>
        <h1 className="page-title mb-2">
          Help
        </h1>
        <p className="text-body text-text-secondary italic mb-10">
          A quick intro to how this app thinks about qubits.
        </p>
        <FirstRunOnboarding variant="inline" />
      </div>
    </main>
  );
}

import { FirstRunOnboarding } from "../components/FirstRunOnboarding";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">About</h1>
      <p className="text-gray-500 mb-6">A quick intro to how this app thinks about qubits.</p>
      <FirstRunOnboarding variant="inline" />
    </main>
  );
}

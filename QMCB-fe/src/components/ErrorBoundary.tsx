import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-app text-text-body flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-panel border border-tier1 bg-bg-panel p-6 text-center">
            <h1 className="page-title text-xl mb-2">Something went wrong</h1>
            <p className="font-sans text-sm text-text-body mb-4 leading-relaxed">
              The app hit an unexpected error. Try reloading the page — your progress is saved
              locally.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <p className="font-mono text-[11px] text-error-action mb-4 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-mono text-[11px] tracking-wide uppercase px-4 py-2 border border-tier1 rounded-gate text-tier3 hover:bg-bg-hover transition"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

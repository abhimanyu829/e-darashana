import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/20 p-8 rounded-3xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">System Error</h2>
              <p className="text-zinc-400 text-sm">
                An unexpected error occurred in the execution engine.
              </p>
            </div>
            <div className="p-4 bg-black/50 rounded-xl text-left overflow-auto max-h-32">
              <code className="text-xs text-red-400 font-mono">
                {this.state.error?.message}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-black font-bold py-3 rounded-xl transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
              Restart Engine
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

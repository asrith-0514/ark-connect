"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  name?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error in [${this.props.name || "Component"}]:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 sm:p-10 my-4 bg-surface rounded-2xl border border-rose-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[28px]">warning</span>
          </div>
          <h2 className="text-xl font-bold text-ink mb-1">
            Unable to load {this.props.name || "this view"}
          </h2>
          <p className="text-sm text-ink-muted max-w-md mb-6">
            An unexpected error occurred while rendering this section. The rest of your workspace is still running.
          </p>
          {this.state.error && (
            <div className="mb-6 p-3 rounded-xl bg-surface-raised border border-border text-xs font-mono text-ink max-w-xl text-left overflow-x-auto">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.search = "?mode=distributor&view=dashboard";
                }
              }}
              className="px-4 py-2 rounded-xl bg-surface-raised hover:bg-surface-raised text-ink font-semibold text-xs transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


"use client";

import React from "react";
import { clientLogger } from "@/lib/logger";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    clientLogger.captureException(err, {
      componentStack: info.componentStack ?? undefined,
      source: "ErrorBoundary",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen items-center justify-center p-8 text-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Something went wrong</h2>
              <p className="text-sm text-slate-500 mb-4">{this.state.message}</p>
              <button
                className="px-4 py-2 rounded-lg bg-[#f97316] text-white text-sm font-medium hover:bg-[#ea6d10] transition-colors"
                onClick={() => this.setState({ hasError: false })}
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center dark:bg-slate-950">
          <p className="text-5xl font-semibold text-slate-300 dark:text-slate-600">
            Oops
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Something went wrong while rendering this view. Please refresh the
            page to try again.
          </p>
          <p className="max-w-md text-xs break-words text-slate-400 dark:text-slate-500">
            {this.state.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

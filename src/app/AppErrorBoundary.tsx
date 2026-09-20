import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Last line of defence: an unexpected render error shows a recoverable screen
 *  rather than a blank page. Details are logged without user credentials. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("StudyTrack failed to render", error.message, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div className="app-error" role="alert">
        <h1>StudyTrack could not load this screen</h1>
        <p>{this.state.error.message}</p>
        <button type="button" className="button button--primary" onClick={() => window.location.assign("/dashboard")}>
          Return to dashboard
        </button>
      </div>
    );
  }
}

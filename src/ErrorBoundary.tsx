import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Atlas Notes runtime error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatal-error">
          <h1>Uygulama hatası</h1>
          <p>{this.state.error.message}</p>
          <button onClick={() => window.location.reload()}>Yeniden yükle</button>
        </main>
      );
    }

    return this.props.children;
  }
}

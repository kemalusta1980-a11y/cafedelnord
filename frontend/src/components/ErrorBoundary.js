import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error, info) {
    console.error("App render error:", error, info);
    const stackLine = (error?.stack || "").split("\n").slice(0, 2).join(" ");
    this.setState({ message: `${error?.message || error} ${stackLine ? "| " + stackLine.slice(0, 200) : ""}` });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#170f2e] text-white px-6 text-center" data-testid="error-boundary">
          <p className="font-display font-black text-2xl">
            CAFE <span className="text-gold">DEL NORD</span>
          </p>
          <p className="text-white/60 text-sm max-w-sm">Bir şeyler ters gitti. Lütfen sayfayı yenileyin.</p>
          <button onClick={() => window.location.reload()} className="btn-pill btn-solid" data-testid="error-reload-btn">
            Sayfayı Yenile
          </button>
          {this.state.message && (
            <p className="text-white/25 text-xs max-w-md break-words" data-testid="error-detail">{this.state.message}</p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

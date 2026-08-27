import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#030303] text-white px-6 text-center" data-testid="error-boundary">
          <p className="font-display font-black text-2xl">
            CAFE <span className="text-gold">DEL NORD</span>
          </p>
          <p className="text-white/60 text-sm max-w-sm">Bir şeyler ters gitti. Lütfen sayfayı yenileyin.</p>
          <button onClick={() => window.location.reload()} className="btn-pill btn-solid" data-testid="error-reload-btn">
            Sayfayı Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "intersection-observer";
import ResizeObserverPolyfill from "resize-observer-polyfill";
import "@/index.css";
import App from "@/App";

if (typeof window.ResizeObserver === "undefined") {
  window.ResizeObserver = ResizeObserverPolyfill;
}

// Suppress benign ResizeObserver loop errors (Lenis/framer-motion) from error overlays
window.addEventListener("error", (e) => {
  if (/ResizeObserver loop/i.test(e.message || "")) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);

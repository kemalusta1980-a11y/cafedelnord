import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) {
      navigate("/admin", { replace: true });
      return;
    }
    const sessionId = match[1];
    api
      .post("/auth/session", { session_id: sessionId })
      .then((r) => {
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/admin", { replace: true, state: { user: r.data } });
      })
      .catch(() => {
        navigate("/admin", { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#170f2e]" data-testid="auth-callback">
      <p className="text-white/50 font-display tracking-widest uppercase text-sm animate-pulse">Giriş yapılıyor...</p>
    </div>
  );
}

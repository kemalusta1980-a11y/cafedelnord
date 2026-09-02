import { Link, useLocation } from "react-router-dom";
import { UtensilsCrossed, Phone, Navigation } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { events } from "../lib/analytics";

export const StickyBar = () => {
  const { settings, t } = useSite();
  const location = useLocation();
  if (location.pathname.startsWith("/admin")) return null;
  const s = settings || {};

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 backdrop-blur-xl bg-[#030303]/85 border-t border-white/10" data-testid="mobile-sticky-bar">
      <div className="grid grid-cols-3">
        <Link to="/menu" className="flex flex-col items-center gap-1 py-3 text-white/70 active:text-gold" data-testid="sticky-menu-btn">
          <UtensilsCrossed size={19} />
          <span className="text-[0.65rem] font-display font-bold uppercase tracking-wider">{t("menu")}</span>
        </Link>
        <a href={s.phone ? `tel:${s.phone.replace(/[^\d+]/g, "")}` : "#"} onClick={events.phoneCall}
          className="flex flex-col items-center gap-1 py-3 text-white/70 active:text-gold border-x border-white/10" data-testid="sticky-call-btn">
          <Phone size={19} />
          <span className="text-[0.65rem] font-display font-bold uppercase tracking-wider">{t("call")}</span>
        </a>
        <a href={s.maps_url || "#"} target="_blank" rel="noreferrer" onClick={events.directions}
          className="flex flex-col items-center gap-1 py-3 text-white/70 active:text-gold" data-testid="sticky-directions-btn">
          <Navigation size={19} />
          <span className="text-[0.65rem] font-display font-bold uppercase tracking-wider">{t("directionsShort")}</span>
        </a>
      </div>
    </div>
  );
};

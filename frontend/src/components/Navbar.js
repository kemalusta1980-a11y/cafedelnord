import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { events } from "../lib/analytics";

const links = [
  { to: "/", key: "home" },
  { to: "/menu", key: "menu" },
  { to: "/hakkimizda", key: "about" },
  { to: "/galeri", key: "gallery" },
  { to: "/iletisim", key: "contact" },
];

export const Navbar = () => {
  const { t, settings, lang, toggleLang } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "backdrop-blur-xl bg-[#030303]/80 border-b border-white/10" : "bg-transparent"
      }`}
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16 sm:h-20">
        <Link to="/" className="font-display font-black text-lg sm:text-xl tracking-tight" data-testid="nav-logo">
          CAFE <span className="text-gold">DEL NORD</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${l.key}`}
              className={({ isActive }) =>
                `font-display text-[0.8rem] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${
                  isActive ? "text-gold" : "text-white/70 hover:text-white"
                }`
              }
            >
              {t(l.key)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <button onClick={toggleLang} data-testid="lang-toggle" className="font-display text-xs font-bold tracking-widest text-white/50 hover:text-gold transition-colors">
            {lang === "tr" ? "EN" : "TR"}
          </button>
          {settings?.reservation_enabled && (
            <Link to="/rezervasyon" onClick={events.reservationClick} className="btn-pill btn-solid !py-2.5 !px-5" data-testid="nav-reservation-btn">
              {t("reservation")}
            </Link>
          )}
        </div>

        <button className="lg:hidden text-white p-2" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle" aria-label="Menü">
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden backdrop-blur-xl bg-[#030303]/95 border-b border-white/10 overflow-hidden"
            data-testid="mobile-menu"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              {links.map((l, i) => (
                <motion.div key={l.to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                  <NavLink
                    to={l.to}
                    data-testid={`mobile-nav-link-${l.key}`}
                    className={({ isActive }) =>
                      `font-display text-2xl font-black tracking-tight ${isActive ? "text-gold" : "text-white"}`
                    }
                  >
                    {t(l.key)}
                  </NavLink>
                </motion.div>
              ))}
              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                {settings?.reservation_enabled && (
                  <Link to="/rezervasyon" className="btn-pill btn-solid flex-1 justify-center" data-testid="mobile-reservation-btn">
                    {t("reservation")}
                  </Link>
                )}
                {settings?.phone && (
                  <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} onClick={events.phoneCall} className="btn-pill btn-ghost" data-testid="mobile-call-btn">
                    <Phone size={16} />
                  </a>
                )}
                <button onClick={toggleLang} className="font-display text-sm font-bold text-white/50" data-testid="mobile-lang-toggle">
                  {lang === "tr" ? "EN" : "TR"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

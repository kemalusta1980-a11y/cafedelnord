import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, Globe, Check } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { events } from "../lib/analytics";

const links = [
  { to: "/", key: "home" },
  { to: "/menu", key: "menu" },
  { to: "/hakkimizda", key: "about" },
  { to: "/galeri", key: "gallery" },
  { to: "/iletisim", key: "contact" },
];

const LangMenu = ({ mobile = false }) => {
  const { lang, setLang, langs } = useSite();
  const [open, setOpen] = useState(false);
  const current = langs.find((l) => l.code === lang);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 font-display text-xs font-bold tracking-widest text-white/60 hover:text-gold transition-colors py-2"
        data-testid={mobile ? "mobile-lang-toggle" : "lang-toggle"}
      >
        <Globe size={14} /> {current?.short}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 min-w-[9.5rem] backdrop-blur-xl bg-[#251a4a]/95 border border-white/15 rounded-xl overflow-hidden shadow-2xl ${
              mobile ? "bottom-full mb-2 left-0" : "top-full mt-2 right-0"
            }`}
            data-testid="lang-menu"
          >
            {langs.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-4 px-4 py-2.5 text-sm text-left transition-colors ${
                  l.code === lang ? "text-gold bg-white/5" : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
                data-testid={`lang-option-${l.code}`}
              >
                {l.label}
                {l.code === lang && <Check size={14} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Navbar = () => {
  const { t, settings } = useSite();
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
        scrolled ? "backdrop-blur-xl bg-[#170f2e]/80 border-b border-white/10" : "bg-transparent"
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
          <LangMenu />
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
            className="lg:hidden backdrop-blur-xl bg-[#170f2e]/95 border-b border-white/10 overflow-hidden"
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
                <LangMenu mobile />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, Mail, Clock } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { events } from "../lib/analytics";

export const Footer = () => {
  const { settings, t } = useSite();
  const s = settings || {};

  return (
    <footer className="border-t border-white/10 bg-[#050505] pb-24 lg:pb-0" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div>
          <p className="font-display font-black text-2xl mb-4">
            CAFE <span className="text-gold">DEL NORD</span>
          </p>
          <p className="text-sm text-white/50 leading-relaxed mb-6">
            {s.tagline ? s.tagline.charAt(0).toUpperCase() + s.tagline.slice(1) : "Bir cafeden daha fazlası"}.{" "}
            {t("footerDesc")}
          </p>
          <div className="flex gap-3">
            {s.instagram && (
              <a href={s.instagram} target="_blank" rel="noreferrer" onClick={events.instagramClick}
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold transition-colors" data-testid="footer-instagram">
                <Instagram size={18} />
              </a>
            )}
            {s.facebook && (
              <a href={s.facebook} target="_blank" rel="noreferrer"
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold transition-colors" data-testid="footer-facebook">
                <Facebook size={18} />
              </a>
            )}
            {!s.instagram && !s.facebook && (
              <p className="text-xs text-white/30 italic">{t("addLater")}</p>
            )}
          </div>
        </div>

        <div>
          <p className="eyebrow mb-5">{t("menu")}</p>
          <ul className="space-y-3 text-sm">
            {[["/", t("home")], ["/menu", t("menu")], ["/hakkimizda", t("about")], ["/galeri", t("gallery")], ["/iletisim", t("contact")], ...(s.reservation_enabled ? [["/rezervasyon", t("reservation")]] : [])].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-white/50 hover:text-gold transition-colors" data-testid={`footer-link-${to.replace("/", "") || "home"}`}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-5">{t("contact")}</p>
          <ul className="space-y-4 text-sm text-white/50">
            {s.phone && (
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-gold mt-0.5 shrink-0" />
                <a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} onClick={events.phoneCall} className="hover:text-gold transition-colors" data-testid="footer-phone">{s.phone}</a>
              </li>
            )}
            {s.email && (
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-gold mt-0.5 shrink-0" />
                <a href={`mailto:${s.email}`} className="hover:text-gold transition-colors" data-testid="footer-email">{s.email}</a>
              </li>
            )}
            <li className="flex items-start gap-3">
              <MapPin size={16} className="text-gold mt-0.5 shrink-0" />
              {s.address ? (
                <a href={s.maps_url || "#"} target="_blank" rel="noreferrer" onClick={events.directions} className="hover:text-gold transition-colors" data-testid="footer-address">{s.address}</a>
              ) : (
                <span className="italic text-white/30">{t("addLater")}</span>
              )}
            </li>
            <li className="flex items-start gap-3">
              <Clock size={16} className="text-gold mt-0.5 shrink-0" />
              <span data-testid="footer-hours">
                {s.hours_weekday || s.hours_weekend ? (
                  <>
                    {s.hours_weekday && <span className="block">{t("weekdays")}: {s.hours_weekday}</span>}
                    {s.hours_weekend && <span className="block">{t("weekend")}: {s.hours_weekend}</span>}
                  </>
                ) : (
                  <span className="italic text-white/30">{t("addLater")}</span>
                )}
              </span>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-5">{t("legal")}</p>
          <ul className="space-y-3 text-sm">
            <li><Link to="/gizlilik-politikasi" className="text-white/50 hover:text-gold transition-colors" data-testid="footer-privacy">{t("privacy")}</Link></li>
            <li><Link to="/kvkk" className="text-white/50 hover:text-gold transition-colors" data-testid="footer-kvkk">{t("kvkk")}</Link></li>
            <li><Link to="/cerez-politikasi" className="text-white/50 hover:text-gold transition-colors" data-testid="footer-cookies">{t("cookiePolicy")}</Link></li>
            <li><Link to="/admin" className="text-white/25 hover:text-white/50 transition-colors text-xs" data-testid="footer-admin">Admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-white/30">
        © {new Date().getFullYear()} Cafe Del Nord. {t("rights")}
      </div>
    </footer>
  );
};

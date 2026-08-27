import { Phone, Navigation, Mail, MapPin, Clock, Instagram, Facebook } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { events } from "../lib/analytics";
import { Reveal, GoldTitle } from "../components/Reveal";

export default function ContactPage() {
  const { settings, t } = useSite();
  const s = settings || {};
  const phoneHref = s.phone ? `tel:${s.phone.replace(/[^\d+]/g, "")}` : "#";
  const mapsQuery = s.address ? encodeURIComponent(`Cafe Del Nord ${s.address}`) : "Cafe+Del+Nord";

  return (
    <div className="pt-28 sm:pt-36 pb-24" data-testid="contact-page">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="eyebrow mb-4">{t("contactEyebrow")}</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter mb-12">
            <GoldTitle text={t("contactTitle")} />
          </h1>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Reveal>
            <div className="space-y-5">
              <div className="card-dark p-6 flex items-start gap-4">
                <Phone className="text-gold shrink-0 mt-1" size={22} />
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg mb-1">{t("phone")}</h3>
                  {s.phone ? (
                    <a href={phoneHref} onClick={events.phoneCall} className="text-white/60 hover:text-gold transition-colors text-lg" data-testid="contact-phone">
                      {s.phone}
                    </a>
                  ) : (
                    <p className="text-white/30 italic text-sm">{t("addLater")}</p>
                  )}
                </div>
              </div>

              <div className="card-dark p-6 flex items-start gap-4">
                <MapPin className="text-gold shrink-0 mt-1" size={22} />
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg mb-1">{t("address")}</h3>
                  {s.address ? (
                    <p className="text-white/60" data-testid="contact-address">{s.address}</p>
                  ) : (
                    <p className="text-white/30 italic text-sm" data-testid="contact-address-missing">{t("addLater")}</p>
                  )}
                </div>
              </div>

              <div className="card-dark p-6 flex items-start gap-4">
                <Mail className="text-gold shrink-0 mt-1" size={22} />
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg mb-1">{t("email")}</h3>
                  {s.email ? (
                    <a href={`mailto:${s.email}`} className="text-white/60 hover:text-gold transition-colors" data-testid="contact-email">{s.email}</a>
                  ) : (
                    <p className="text-white/30 italic text-sm">{t("addLater")}</p>
                  )}
                </div>
              </div>

              <div className="card-dark p-6 flex items-start gap-4">
                <Clock className="text-gold shrink-0 mt-1" size={22} />
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg mb-1">{t("hours")}</h3>
                  {s.hours_weekday || s.hours_weekend ? (
                    <div className="text-white/60 space-y-1" data-testid="contact-hours">
                      {s.hours_weekday && <p>{t("weekdays")}: {s.hours_weekday}</p>}
                      {s.hours_weekend && <p>{t("weekend")}: {s.hours_weekend}</p>}
                    </div>
                  ) : (
                    <p className="text-white/30 italic text-sm">{t("addLater")}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <a href={phoneHref} onClick={events.phoneCall} className="btn-pill btn-solid" data-testid="contact-call-btn">
                  <Phone size={16} /> {t("call")}
                </a>
                <a href={s.maps_url || `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noreferrer" onClick={events.directions} className="btn-pill btn-ghost" data-testid="contact-directions-btn">
                  <Navigation size={16} /> {t("directionsShort")}
                </a>
                {s.instagram && (
                  <a href={s.instagram} target="_blank" rel="noreferrer" onClick={events.instagramClick} className="btn-pill btn-ghost" data-testid="contact-instagram-btn">
                    <Instagram size={16} /> Instagram
                  </a>
                )}
                {s.facebook && (
                  <a href={s.facebook} target="_blank" rel="noreferrer" className="btn-pill btn-ghost" data-testid="contact-facebook-btn">
                    <Facebook size={16} /> Facebook
                  </a>
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="img-frame h-full min-h-[380px] !rounded-2xl border border-white/10">
              <iframe
                title="Cafe Del Nord Konum"
                src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
                className="w-full h-full min-h-[380px] grayscale-[40%] contrast-[1.05]"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                data-testid="contact-map"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

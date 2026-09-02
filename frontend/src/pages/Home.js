import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Marquee from "react-fast-marquee";
import { Phone, Navigation, ArrowRight, Instagram, Megaphone } from "lucide-react";
import { api } from "../lib/api";
import { useSite } from "../context/SiteContext";
import { events } from "../lib/analytics";
import { Reveal, MaskedLines, GoldTitle } from "../components/Reveal";
import { MenuItemCard } from "../components/MenuItemCard";

const manifesto = [
  { num: "01", titleKey: "m1Title", stKey: "quality_text" },
  { num: "02", titleKey: "m2Title", stKey: "vision_text" },
  { num: "03", titleKey: "m3Title", tKey: "guestBody" },
];

export default function Home() {
  const { settings, t, st } = useSite();
  const [featured, setFeatured] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const s = settings || {};
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  useEffect(() => {
    api.get("/featured").then((r) => setFeatured(r.data)).catch(() => {});
    api.get("/campaigns").then((r) => setCampaigns(r.data)).catch(() => {});
  }, []);

  const phoneHref = s.phone ? `tel:${s.phone.replace(/[^\d+]/g, "")}` : "#";

  return (
    <div data-testid="home-page">
      {/* HERO — split layout: text left, circular dish right */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-[#a78bfa]/15 blur-[140px] pointer-events-none" />
        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full pt-28 pb-20 sm:pt-36 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="eyebrow inline-flex items-center gap-2 border border-white/15 bg-white/5 rounded-full px-4 py-2 mb-7"
              data-testid="hero-eyebrow"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]" />
              {(st("tagline") || "Bir cafeden daha fazlası").toUpperCase()}
            </motion.p>

            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl xl:text-[5rem] tracking-tighter leading-[1.02]" data-testid="hero-title">
              <MaskedLines key={t("heroLine1")} lines={[t("heroLine1"), t("heroLine2")]} delay={0.25} />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-base sm:text-lg text-white/60 max-w-xl mt-7 leading-relaxed"
              data-testid="hero-subtitle"
            >
              {st("hero_subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex flex-wrap gap-4 mt-10"
            >
              <Link to="/menu" className="btn-pill btn-solid" onClick={() => events.menuView("hero")} data-testid="hero-menu-btn">
                {t("viewMenu")} <ArrowRight size={16} />
              </Link>
              <a href={s.maps_url || "#"} target="_blank" rel="noreferrer" onClick={events.directions} className="btn-pill btn-ghost" data-testid="hero-directions-btn">
                <Navigation size={16} /> {t("directions")}
              </a>
              <a href={phoneHref} onClick={events.phoneCall} className="btn-pill btn-ghost" data-testid="hero-call-btn">
                <Phone size={16} /> {t("callUs")}
              </a>
              {s.reservation_enabled && (
                <Link to="/rezervasyon" onClick={events.reservationClick} className="btn-pill btn-ghost !border-[#a78bfa]/50 !text-[#a78bfa] hover:!border-[#a78bfa]" data-testid="hero-reservation-btn">
                  {t("makeReservation")}
                </Link>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-[78vw] max-w-[380px] lg:max-w-[520px] aspect-square"
            data-testid="hero-dish"
          >
            <div className="hero-ring" />
            <motion.div className="hero-dish w-full h-full" style={{ y: bgY }}>
              <img src="/images/kumpir.jpg" alt="Cafe Del Nord taş fırında kumpir" fetchPriority="high" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* MARQUEE */}
      <div className="py-10 border-y border-white/5 overflow-hidden" data-testid="editorial-marquee">
        <Marquee speed={30} gradient={false} autoFill>
          <span className="marquee-text mx-8">Kumpir · Burger · Kahve · Künefe · Waffle · Pizza ·</span>
        </Marquee>
      </div>

      {/* CAMPAIGNS */}
      {campaigns.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-16" data-testid="campaigns-section">
          {campaigns.map((c) => (
            <Reveal key={c.id} className="card-dark !border-gold/30 p-6 sm:p-8 flex items-start gap-4 mb-4">
              <Megaphone className="text-gold shrink-0 mt-1" size={22} />
              <div>
                <h3 className="font-display font-bold text-xl">{c.title}</h3>
                <p className="text-white/60 mt-2">{c.description}</p>
              </div>
            </Reveal>
          ))}
        </section>
      )}

      {/* FEATURED */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-24 sm:py-32" data-testid="featured-section">
        <Reveal>
          <p className="eyebrow mb-4">{t("favorites")}</p>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tighter">
              <GoldTitle text={t("featuredTitle")} />
            </h2>
            <Link to="/menu" className="font-display text-sm font-bold uppercase tracking-widest text-white/50 hover:text-gold transition-colors flex items-center gap-2" data-testid="featured-view-all">
              {t("allMenu")} <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 0.12}>
              <Link to="/menu" onClick={() => events.menuView("featured")}>
                <MenuItemCard item={item} />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="border-t border-white/5 bg-[#1b1236]" data-testid="manifesto-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <Reveal>
            <p className="eyebrow mb-16">{t("whyUs")}</p>
          </Reveal>
          <div className="space-y-20">
            {manifesto.map((m, i) => (
              <Reveal key={m.num} delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <span className="font-serif-editorial italic text-6xl sm:text-7xl text-white/15 lg:col-span-2">{m.num}</span>
                  <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight lg:col-span-4">{t(m.titleKey)}</h3>
                  <p className="text-white/50 leading-relaxed text-base sm:text-lg lg:col-span-6 max-w-xl">
                    {m.stKey ? st(m.stKey) : t(m.tKey)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COFFEE SPLIT */}
      <section className="grid grid-cols-1 lg:grid-cols-2 border-t border-white/5" data-testid="coffee-section">
        <div className="img-frame !rounded-none aspect-[4/3] lg:aspect-auto lg:min-h-[560px]">
          <img src="/images/kahve-atmosfer.jpg" alt="Taze çekilmiş kahve" loading="lazy" />
        </div>
        <div className="flex flex-col justify-center px-6 sm:px-14 py-16 lg:py-24">
          <Reveal>
            <p className="eyebrow mb-5">{t("coffeeEyebrow")}</p>
            <h2 className="font-serif-editorial italic text-4xl sm:text-5xl lg:text-6xl mb-8">{t("coffeeTitle")}</h2>
            <p className="text-white/55 leading-relaxed max-w-md mb-10">{t("coffeeBody")}</p>
            <Link to="/menu" className="btn-pill btn-ghost w-fit" data-testid="coffee-menu-btn">
              {t("coffeeBtn")} <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* DESSERT SPLIT */}
      <section className="grid grid-cols-1 lg:grid-cols-2 border-t border-white/5" data-testid="dessert-section">
        <div className="flex flex-col justify-center px-6 sm:px-14 py-16 lg:py-24 order-2 lg:order-1">
          <Reveal>
            <p className="eyebrow mb-5">{t("dessertEyebrow")}</p>
            <h2 className="font-serif-editorial italic text-4xl sm:text-5xl lg:text-6xl mb-8">{t("dessertTitle")}</h2>
            <p className="text-white/55 leading-relaxed max-w-md mb-10">{t("dessertBody")}</p>
            <Link to="/menu" className="btn-pill btn-ghost w-fit" data-testid="dessert-menu-btn">
              {t("dessertBtn")} <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
        <div className="img-frame !rounded-none aspect-[4/3] lg:aspect-auto lg:min-h-[560px] order-1 lg:order-2">
          <img src="/images/tatli-atmosfer.jpg" alt="Tatlı çeşitleri" loading="lazy" />
        </div>
      </section>

      {/* INSTAGRAM CTA */}
      <section className="border-t border-white/5" data-testid="instagram-section">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-24 text-center">
          <Reveal>
            <Instagram className="mx-auto text-gold mb-6" size={32} />
            <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tighter mb-4">{t("igTitle")}</h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">{t("igBody")}</p>
            {s.instagram ? (
              <a href={s.instagram} target="_blank" rel="noreferrer" onClick={events.instagramClick} className="btn-pill btn-solid" data-testid="instagram-follow-btn">
                <Instagram size={16} /> {t("igBtn")}
              </a>
            ) : (
              <p className="text-xs text-white/30 italic">{t("addLater")}</p>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
}

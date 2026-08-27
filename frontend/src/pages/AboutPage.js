import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { Reveal, GoldTitle } from "../components/Reveal";

const chapters = [
  { num: "01", title: "Atmosfer", text: "Sıcak, samimi ve modern bir ortamda; ister kahvenizi yudumlayın, ister sevdiklerinizle uzun sohbetlere dalın.", img: "/images/kahve-atmosfer.jpg" },
  { num: "02", title: "Yemek Anlayışımız", text: "Taş fırında pişen kumpirden el yapımı burgerlere, geleneksel tatlılardan taze çekilmiş kahveye — her ürün usta ellerde hazırlanır.", img: "/images/karisik-izgara.jpg" },
  { num: "03", title: "Kalite Anlayışımız", text: "", key: "quality_text", img: "/images/serpme.jpg" },
  { num: "04", title: "Misafir Deneyimi", text: "Kusursuz servis ilkemiz ile misafirlerimize unutamayacakları bir gün geçirmeleri için elimizden gelen en iyi hizmeti veriyoruz.", img: "/images/tatli-atmosfer.jpg" },
];

export default function AboutPage() {
  const { settings, t } = useSite();
  const s = settings || {};

  return (
    <div className="pt-28 sm:pt-36 pb-24" data-testid="about-page">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="eyebrow mb-4">{t("aboutEyebrow")}</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter mb-6">
            <GoldTitle text={t("aboutTitle")} />
          </h1>
          <p className="text-white/55 max-w-2xl text-base sm:text-lg leading-relaxed" data-testid="about-intro">
            {s.about_text}
          </p>
        </Reveal>

        <div className="mt-20 space-y-24">
          {chapters.map((ch, i) => (
            <Reveal key={ch.num}>
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "lg:[direction:rtl]" : ""}`}>
                <div className="img-frame aspect-[4/3] [direction:ltr]">
                  <img src={ch.img} alt={ch.title} loading="lazy" />
                </div>
                <div className="[direction:ltr]">
                  <span className="font-serif-editorial italic text-6xl text-white/15 block mb-4">{ch.num}</span>
                  <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight mb-5">{ch.title}</h2>
                  <p className="text-white/50 leading-relaxed max-w-md">{ch.key ? s[ch.key] : ch.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-24 border border-white/10 rounded-3xl p-10 sm:p-16 text-center bg-[#0a0a0a]">
          <p className="font-serif-editorial italic text-2xl sm:text-3xl text-white/80 max-w-3xl mx-auto leading-relaxed" data-testid="about-vision">
            “{s.vision_text}”
          </p>
          <Link to="/menu" className="btn-pill btn-solid mt-10" data-testid="about-menu-btn">
            {t("exploreMenu")} <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}

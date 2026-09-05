import { useSite } from "../context/SiteContext";
import { Reveal } from "../components/Reveal";

const config = {
  privacy: { titleKey: "privacy", contentKey: "legal_privacy", note: "Bu sayfa placeholder olarak hazırlanmıştır. Nihai hukuki metin, admin panelindeki Sayfa İçerikleri sekmesinden eklenebilir." },
  kvkk: { titleKey: "kvkk", contentKey: "legal_kvkk", note: "Bu sayfa placeholder olarak hazırlanmıştır. 6698 sayılı KVKK kapsamındaki nihai aydınlatma metni, admin panelindeki Sayfa İçerikleri sekmesinden eklenebilir." },
  cookies: { titleKey: "cookiePolicy", contentKey: "legal_cookies", note: "Bu sayfa placeholder olarak hazırlanmıştır. Sitede yalnızca temel işlevsellik (dil tercihi, çerez onayı) için tarayıcı deposu kullanılmaktadır. Nihai çerez politikası metni admin panelindeki Sayfa İçerikleri sekmesinden eklenebilir." },
};

export default function LegalPage({ type }) {
  const { t, lang, content } = useSite();
  const c = config[type];
  const key = c.contentKey;
  const body = content ? (lang === "tr" ? content[key] : content[`${key}_${lang}`] || content[key]) : "";

  return (
    <div className="pt-28 sm:pt-36 pb-24" data-testid={`legal-page-${type}`}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="eyebrow mb-4">{t("legal")}</p>
          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tighter mb-10">{t(c.titleKey)}</h1>
          {body ? (
            <div className="text-white/60 leading-relaxed whitespace-pre-line" data-testid="legal-content">
              {body}
            </div>
          ) : (
            <div className="card-dark p-8 border-dashed !border-gold/30">
              <p className="text-white/60 leading-relaxed" data-testid="legal-placeholder-note">
                <span className="text-gold font-bold">[PLACEHOLDER]</span> — {c.note}
              </p>
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}

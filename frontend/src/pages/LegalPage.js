import { Reveal } from "../components/Reveal";

const content = {
  privacy: {
    title: "Gizlilik Politikası",
    note: "Bu sayfa placeholder olarak hazırlanmıştır. Nihai hukuki metin, işletme sahibi ve hukuk danışmanı tarafından hazırlanarak buraya eklenmelidir.",
  },
  kvkk: {
    title: "KVKK Aydınlatma Metni",
    note: "Bu sayfa placeholder olarak hazırlanmıştır. 6698 sayılı KVKK kapsamındaki nihai aydınlatma metni, işletme sahibi ve hukuk danışmanı tarafından hazırlanarak buraya eklenmelidir.",
  },
  cookies: {
    title: "Çerez Politikası",
    note: "Bu sayfa placeholder olarak hazırlanmıştır. Sitede yalnızca temel işlevsellik (dil tercihi, çerez onayı) için tarayıcı deposu kullanılmaktadır. Nihai çerez politikası metni buraya eklenmelidir.",
  },
};

export default function LegalPage({ type }) {
  const c = content[type];
  return (
    <div className="pt-28 sm:pt-36 pb-24" data-testid={`legal-page-${type}`}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="eyebrow mb-4">Yasal</p>
          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tighter mb-10">{c.title}</h1>
          <div className="card-dark p-8 border-dashed !border-gold/30">
            <p className="text-white/60 leading-relaxed" data-testid="legal-placeholder-note">
              <span className="text-gold font-bold">[PLACEHOLDER]</span> — {c.note}
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

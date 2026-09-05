import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Languages } from "lucide-react";
import { api } from "../../lib/api";
import { useSite } from "../../context/SiteContext";
import { UI } from "../../lib/i18n";

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60";

const GROUPS = [
  {
    title: "Ana Sayfa",
    fields: [
      ["hero_image", "Hero (Açılış) Görseli", "image", "/images/kumpir.jpg"],
      ["heroLine1", "Hero Başlık — 1. Satır"],
      ["heroLine2", "Hero Başlık — 2. Satır"],
      ["marqueeText", "Kayan Yazı (Marquee)"],
      ["featuredTitle", "Öne Çıkanlar Başlığı"],
      ["m1Title", "Manifesto 1 Başlık"],
      ["m2Title", "Manifesto 2 Başlık"],
      ["m3Title", "Manifesto 3 Başlık"],
      ["guestBody", "Müşteri Memnuniyeti Metni", "textarea"],
      ["coffeeEyebrow", "Kahve Bölümü Üst Yazı"],
      ["coffeeTitle", "Kahve Bölümü Başlık"],
      ["coffeeBody", "Kahve Bölümü Metni", "textarea"],
      ["coffee_image", "Kahve Bölümü Görseli", "image", "/images/kahve-atmosfer.jpg"],
      ["dessertEyebrow", "Tatlı Bölümü Üst Yazı"],
      ["dessertTitle", "Tatlı Bölümü Başlık"],
      ["dessertBody", "Tatlı Bölümü Metni", "textarea"],
      ["dessert_image", "Tatlı Bölümü Görseli", "image", "/images/tatli-atmosfer.jpg"],
      ["igTitle", "Instagram Bölümü Başlık"],
      ["igBody", "Instagram Bölümü Metni", "textarea"],
    ],
    note: "Hero alt metni, kalite ve vizyon metinleri “Ayarlar” sekmesinden düzenlenir.",
  },
  {
    title: "Menü Sayfası",
    fields: [
      ["menuTitle", "Menü Başlığı"],
      ["menuSubtitle", "Menü Alt Metni", "textarea"],
    ],
  },
  {
    title: "Hakkımızda Sayfası",
    fields: [
      ["aboutEyebrow", "Üst Yazı"],
      ["aboutTitle", "Başlık"],
      ["ch1Title", "Bölüm 1 Başlık"],
      ["ch1Body", "Bölüm 1 Metni", "textarea"],
      ["about_img_1", "Bölüm 1 Görseli", "image", "/images/kahve-atmosfer.jpg"],
      ["ch2Title", "Bölüm 2 Başlık"],
      ["ch2Body", "Bölüm 2 Metni", "textarea"],
      ["about_img_2", "Bölüm 2 Görseli", "image", "/images/karisik-izgara.jpg"],
      ["ch3Title", "Bölüm 3 Başlık (metni: Ayarlar → Kalite Metni)"],
      ["about_img_3", "Bölüm 3 Görseli", "image", "/images/serpme.jpg"],
      ["ch4Title", "Bölüm 4 Başlık (metni: Müşteri Memnuniyeti Metni)"],
      ["about_img_4", "Bölüm 4 Görseli", "image", "/images/tatli-atmosfer.jpg"],
    ],
    note: "Hakkımızda giriş metni “Ayarlar” sekmesindeki Hakkımızda Metni alanından düzenlenir.",
  },
  {
    title: "Galeri Sayfası",
    fields: [
      ["galleryEyebrow", "Üst Yazı"],
      ["galleryTitle", "Başlık"],
    ],
  },
  {
    title: "İletişim Sayfası",
    fields: [
      ["contactEyebrow", "Üst Yazı"],
      ["contactTitle", "Başlık"],
    ],
    note: "Telefon, adres, e-posta ve çalışma saatleri “Ayarlar” sekmesinden düzenlenir.",
  },
  {
    title: "Alt Bilgi (Footer)",
    fields: [["footerDesc", "Footer Açıklama Metni", "textarea"]],
  },
];

const ImageField = ({ value, fallback, onChange }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const r = await api.post("/admin/upload", fd);
      onChange(r.data.url);
      toast.success("Görsel yüklendi");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Görsel yüklenemedi");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <img src={value || fallback} alt="Önizleme" className="w-20 h-20 rounded-lg object-cover border border-white/10 shrink-0" />
      <div className="flex-1 flex gap-2 items-center">
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={fallback} className={inputCls} />
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-pill btn-ghost !py-2 !px-3 !text-xs shrink-0 disabled:opacity-50">
          <Upload size={13} /> {uploading ? "..." : "Yükle"}
        </button>
      </div>
    </div>
  );
};

export const AdminContent = () => {
  const { setContent } = useSite();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/content").then((r) => setForm(r.data)).catch(() => toast.error("İçerik yüklenemedi"));
  }, []);

  if (!form) return <p className="text-white/40">Yükleniyor...</p>;

  const val = (key, type) => form[key] ?? (type === "image" ? "" : UI.tr[key] ?? "");
  const setKey = (key) => (v) => setForm({ ...form, [key]: v });

  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      GROUPS.forEach((g) => g.fields.forEach(([key, , type]) => { payload[key] = val(key, type); }));
      const r = await api.put("/admin/content", payload);
      setForm(r.data.content);
      setContent(r.data.content);
      if (r.data.translated) {
        toast.success("Kaydedildi — çeviriler otomatik oluşturuldu");
      } else {
        toast.warning("Kaydedildi ancak otomatik çeviri başarısız oldu. Tekrar kaydetmeyi deneyin.");
      }
    } catch {
      toast.error("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-10" data-testid="admin-content-tab">
      <div className="flex items-start gap-3 border border-gold/25 bg-gold/5 rounded-xl p-4">
        <Languages className="text-gold shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-white/60 leading-relaxed">
          Metinleri <strong className="text-white/85">Türkçe</strong> girin — kaydettiğinizde İngilizce, Almanca, Rusça ve Arapça çeviriler
          yapay zeka ile otomatik oluşturulur.
        </p>
      </div>

      {GROUPS.map((group) => (
        <section key={group.title} className="card-dark p-6 space-y-4" data-testid={`content-group-${group.title}`}>
          <h3 className="font-display font-bold text-lg text-gold">{group.title}</h3>
          {group.fields.map(([key, label, type, fallback]) => (
            <div key={key}>
              <label className="text-xs text-white/50 block mb-1">{label}</label>
              {type === "image" ? (
                <ImageField value={form[key]} fallback={fallback} onChange={setKey(key)} />
              ) : type === "textarea" ? (
                <textarea value={val(key, type)} onChange={(e) => setKey(key)(e.target.value)} rows={3} className={inputCls} data-testid={`content-${key}-input`} />
              ) : (
                <input value={val(key, type)} onChange={(e) => setKey(key)(e.target.value)} className={inputCls} data-testid={`content-${key}-input`} />
              )}
            </div>
          ))}
          {group.note && <p className="text-[0.7rem] text-white/35 italic">{group.note}</p>}
        </section>
      ))}

      <div className="sticky bottom-4">
        <button onClick={save} disabled={saving} className="btn-pill btn-solid !py-3 !px-8 disabled:opacity-50" data-testid="content-save-btn">
          {saving ? "Kaydediliyor ve çevriliyor..." : "Kaydet ve Çevir"}
        </button>
      </div>
    </div>
  );
};

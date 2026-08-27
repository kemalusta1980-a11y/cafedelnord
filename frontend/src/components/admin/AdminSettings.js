import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { useSite } from "../../context/SiteContext";

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60";

const fields = [
  ["site_name", "Site Adı"],
  ["tagline", "Slogan"],
  ["hero_title", "Hero Başlığı"],
  ["hero_subtitle", "Hero Alt Metni", "textarea"],
  ["about_text", "Hakkımızda Metni", "textarea"],
  ["quality_text", "Kalite Metni", "textarea"],
  ["vision_text", "Vizyon/Misyon Metni", "textarea"],
  ["phone", "Telefon"],
  ["email", "E-posta"],
  ["address", "Adres", "textarea"],
  ["maps_url", "Google Maps Linki"],
  ["instagram", "Instagram Linki"],
  ["facebook", "Facebook Linki"],
  ["whatsapp", "WhatsApp Numarası (örn: 905001234567 — ülke koduyla)"],
  ["hours_weekday", "Çalışma Saatleri (Hafta içi)"],
  ["hours_weekend", "Çalışma Saatleri (Hafta sonu)"],
  ["notification_email", "Rezervasyon Bildirim E-postası (yeni talepler bu adrese gönderilir)"],
];

export const AdminSettings = () => {
  const { setSettings } = useSite();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/settings").then((r) => setForm(r.data)).catch(() => {});
  }, []);

  if (!form) return <p className="text-white/40">Yükleniyor...</p>;

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", form);
      setSettings(form);
      toast.success("Ayarlar kaydedildi");
    } catch {
      toast.error("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4" data-testid="admin-settings-tab">
      {fields.map(([key, label, type]) => (
        <div key={key}>
          <label className="text-xs text-white/50 block mb-1">{label}</label>
          {type === "textarea" ? (
            <textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} rows={3} className={inputCls} data-testid={`settings-${key}-input`} />
          ) : (
            <input value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputCls} data-testid={`settings-${key}-input`} />
          )}
        </div>
      ))}
      <label className="flex items-center gap-2 text-sm text-white/60">
        <input type="checkbox" checked={!!form.reservation_enabled} onChange={(e) => setForm({ ...form, reservation_enabled: e.target.checked })} data-testid="settings-reservation-toggle" />
        Rezervasyon bölümü aktif
      </label>
      <button onClick={save} disabled={saving} className="btn-pill btn-solid !py-2.5 !px-6 !text-xs disabled:opacity-50" data-testid="settings-save-btn">
        {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
      </button>
    </div>
  );
};

import { useState } from "react";
import { CalendarCheck, Phone } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useSite } from "../context/SiteContext";
import { events } from "../lib/analytics";
import { Reveal } from "../components/Reveal";

const initial = { name: "", phone: "", date: "", time: "", guests: 2, note: "" };

export default function ReservationPage() {
  const { settings } = useSite();
  const s = settings || {};
  const [form, setForm] = useState(initial);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.date || !form.time) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }
    setSending(true);
    try {
      await api.post("/reservations", { ...form, guests: Number(form.guests) });
      events.reservationClick();
      setDone(true);
      toast.success("Rezervasyon talebiniz alındı!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60 transition-colors";

  return (
    <div className="pt-28 sm:pt-36 pb-24" data-testid="reservation-page">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="eyebrow mb-4">Masanızı Ayırtın</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter mb-4">
            Rezerv<span className="text-gold">asyon</span>
          </h1>
          <p className="text-white/50 mb-10">
            Talebinizi bırakın, ekibimiz sizi arayarak rezervasyonunuzu onaylasın.
            {s.phone && <> Dilerseniz <a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} onClick={events.phoneCall} className="text-gold underline" data-testid="reservation-phone-link">{s.phone}</a> numarasından bize ulaşabilirsiniz.</>}
          </p>
        </Reveal>

        {done ? (
          <Reveal className="card-dark !border-gold/40 p-10 text-center" data-testid="reservation-success">
            <CalendarCheck className="mx-auto text-gold mb-4" size={40} />
            <h2 className="font-display font-black text-2xl mb-3">Talebiniz Alındı</h2>
            <p className="text-white/55 max-w-md mx-auto">
              Rezervasyon talebiniz bize ulaştı. Ekibimiz en kısa sürede sizi arayarak onaylayacaktır.
            </p>
          </Reveal>
        ) : (
          <Reveal>
            <form onSubmit={submit} className="card-dark p-6 sm:p-10 space-y-5" data-testid="reservation-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Ad Soyad *</label>
                  <input value={form.name} onChange={set("name")} className={inputCls} placeholder="Adınız Soyadınız" data-testid="reservation-name-input" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Telefon *</label>
                  <input value={form.phone} onChange={set("phone")} type="tel" className={inputCls} placeholder="05xx xxx xx xx" data-testid="reservation-phone-input" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Tarih *</label>
                  <input value={form.date} onChange={set("date")} type="date" className={inputCls} data-testid="reservation-date-input" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Saat *</label>
                  <input value={form.time} onChange={set("time")} type="time" className={inputCls} data-testid="reservation-time-input" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Kişi Sayısı *</label>
                  <input value={form.guests} onChange={set("guests")} type="number" min="1" max="50" className={inputCls} data-testid="reservation-guests-input" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-white/60 mb-2">Not</label>
                  <textarea value={form.note} onChange={set("note")} rows={3} className={inputCls} placeholder="Özel istekleriniz (doğum günü, pencere kenarı vb.)" data-testid="reservation-note-input" />
                </div>
              </div>
              <button type="submit" disabled={sending} className="btn-pill btn-solid w-full justify-center disabled:opacity-50" data-testid="reservation-submit-btn">
                {sending ? "Gönderiliyor..." : "Rezervasyon Talebi Gönder"}
              </button>
              <p className="text-xs text-white/30 text-center flex items-center justify-center gap-2">
                <Phone size={12} /> Rezervasyonlar telefonla onaylanır.
              </p>
            </form>
          </Reveal>
        )}
      </div>
    </div>
  );
}

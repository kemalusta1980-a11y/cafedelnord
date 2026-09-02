import { useEffect, useState } from "react";
import { Phone, Calendar, Users } from "lucide-react";
import { api } from "../../lib/api";

const statusLabels = { new: "Yeni", confirmed: "Onaylandı", cancelled: "İptal" };
const statusColors = { new: "text-gold border-gold/40", confirmed: "text-emerald-400 border-emerald-400/40", cancelled: "text-red-400 border-red-400/40" };

export const AdminReservations = () => {
  const [list, setList] = useState([]);

  const load = () => api.get("/admin/reservations").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    await api.put(`/admin/reservations/${id}`, { status });
    load();
  };

  return (
    <div data-testid="admin-reservations-tab">
      {list.length === 0 && <p className="text-white/40" data-testid="reservations-empty">Henüz rezervasyon talebi yok.</p>}
      <div className="space-y-3 max-w-3xl">
        {list.map((r) => (
          <div key={r.id} className="card-dark !rounded-xl p-5" data-testid={`reservation-row-${r.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display font-bold">{r.name}</p>
                <div className="flex flex-wrap gap-4 text-xs text-white/50 mt-2">
                  <span className="flex items-center gap-1"><Phone size={12} /> <a href={`tel:${r.phone}`} className="hover:text-gold">{r.phone}</a></span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {r.date} {r.time}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {r.guests} kişi</span>
                </div>
                {r.note && <p className="text-xs text-white/40 mt-2 italic">"{r.note}"</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs border rounded-full px-3 py-1 ${statusColors[r.status]}`}>{statusLabels[r.status]}</span>
                <select
                  value={r.status}
                  onChange={(e) => setStatus(r.id, e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                  data-testid={`reservation-status-select-${r.id}`}
                >
                  <option value="new" className="bg-[#251a4a]">Yeni</option>
                  <option value="confirmed" className="bg-[#251a4a]">Onayla</option>
                  <option value="cancelled" className="bg-[#251a4a]">İptal Et</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

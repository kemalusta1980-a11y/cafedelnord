import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60";

export const AdminCampaigns = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: "", description: "" });

  const load = () => api.get("/admin/campaigns").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title.trim()) return;
    await api.post("/admin/campaigns", form);
    setForm({ title: "", description: "" });
    toast.success("Kampanya eklendi");
    load();
  };

  const toggle = async (c) => {
    await api.put(`/admin/campaigns/${c.id}`, { active: !c.active });
    load();
  };

  const remove = async (id) => {
    await api.delete(`/admin/campaigns/${id}`);
    load();
  };

  return (
    <div data-testid="admin-campaigns-tab">
      <div className="card-dark p-5 mb-6 max-w-xl space-y-3">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Kampanya başlığı" className={inputCls} data-testid="campaign-title-input" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Açıklama" rows={2} className={inputCls} data-testid="campaign-desc-input" />
        <button onClick={add} className="btn-pill btn-solid !py-2 !px-4 !text-xs" data-testid="campaign-add-btn">
          <Plus size={14} /> Kampanya Ekle
        </button>
      </div>
      <div className="space-y-2 max-w-xl">
        {list.length === 0 && <p className="text-white/40">Henüz kampanya yok.</p>}
        {list.map((c) => (
          <div key={c.id} className="card-dark !rounded-xl p-4 flex items-center gap-4" data-testid={`campaign-row-${c.id}`}>
            <div className="flex-1">
              <p className={`font-display font-bold text-sm ${!c.active ? "text-white/30" : ""}`}>{c.title}</p>
              <p className="text-xs text-white/40">{c.description}</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-white/50">
              <input type="checkbox" checked={c.active} onChange={() => toggle(c)} data-testid={`campaign-toggle-${c.id}`} /> Aktif
            </label>
            <button onClick={() => remove(c.id)} className="p-2 text-white/50 hover:text-red-400" data-testid={`campaign-delete-${c.id}`}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

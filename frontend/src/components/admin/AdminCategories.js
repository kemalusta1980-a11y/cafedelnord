import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { api } from "../../lib/api";

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60";

export const AdminCategories = () => {
  const [cats, setCats] = useState([]);
  const [name, setName] = useState("");

  const load = () => api.get("/admin/menu").then((r) => setCats(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await api.post("/admin/categories", { name: name.trim(), order: cats.length });
    setName("");
    toast.success("Kategori eklendi");
    load();
  };

  const update = async (id, body) => {
    await api.put(`/admin/categories/${id}`, body);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Kategori ve içindeki tüm ürünler silinecek. Emin misiniz?")) return;
    await api.delete(`/admin/categories/${id}`);
    toast.success("Silindi");
    load();
  };

  return (
    <div data-testid="admin-categories-tab">
      <div className="flex gap-3 mb-6 max-w-md">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Yeni kategori adı" className={inputCls} data-testid="category-name-input" />
        <button onClick={add} className="btn-pill btn-solid !py-2 !px-4 !text-xs shrink-0" data-testid="category-add-btn">
          <Plus size={14} /> Ekle
        </button>
      </div>
      <div className="space-y-2 max-w-2xl">
        {cats.map((c) => (
          <div key={c.id} className="card-dark !rounded-xl p-4 flex items-center gap-4" data-testid={`admin-category-row-${c.id}`}>
            <input
              defaultValue={c.name}
              onBlur={(e) => e.target.value !== c.name && update(c.id, { name: e.target.value })}
              className="bg-transparent font-display font-bold text-sm flex-1 focus:outline-none focus:text-gold"
              data-testid={`category-rename-${c.id}`}
            />
            <input
              type="number"
              defaultValue={c.order}
              onBlur={(e) => Number(e.target.value) !== c.order && update(c.id, { order: Number(e.target.value) })}
              className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-center"
              title="Sıra"
              data-testid={`category-order-${c.id}`}
            />
            <span className="text-xs text-white/40">{c.items.length} ürün</span>
            <button onClick={() => update(c.id, { visible: !c.visible })} className="p-2 text-white/50 hover:text-gold" data-testid={`category-toggle-${c.id}`}>
              {c.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button onClick={() => remove(c.id)} className="p-2 text-white/50 hover:text-red-400" data-testid={`category-delete-${c.id}`}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

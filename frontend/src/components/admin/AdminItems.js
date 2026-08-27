import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Upload } from "lucide-react";
import { api } from "../../lib/api";

const empty = { category_id: "", name: "", name_en: "", description: "", description_en: "", price: "", image: "", order: 0, visible: true, featured: false };
const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60";

export const AdminItems = () => {
  const [menu, setMenu] = useState([]);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () => api.get("/admin/menu").then((r) => setMenu(r.data)).catch(() => toast.error("Menü yüklenemedi"));
  useEffect(() => { load(); }, []);

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const r = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setEditing((prev) => ({ ...prev, image: r.data.url }));
      toast.success("Görsel yüklendi");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Görsel yüklenemedi");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    const payload = { ...editing, price: editing.price === "" || editing.price === null ? null : Number(editing.price), order: Number(editing.order) };
    try {
      if (editing.id) {
        await api.put(`/admin/items/${editing.id}`, payload);
      } else {
        await api.post("/admin/items", payload);
      }
      toast.success("Kaydedildi");
      setEditing(null);
      load();
    } catch {
      toast.error("Kaydedilemedi");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    await api.delete(`/admin/items/${id}`);
    toast.success("Silindi");
    load();
  };

  const toggle = async (item, field) => {
    await api.put(`/admin/items/${item.id}`, { [field]: !item[field] });
    load();
  };

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div data-testid="admin-items-tab">
      <button onClick={() => setEditing({ ...empty, category_id: menu[0]?.id || "" })} className="btn-pill btn-solid !py-2 !px-4 !text-xs mb-6" data-testid="admin-add-item-btn">
        <Plus size={14} /> Yeni Ürün
      </button>

      {editing && (
        <div className="card-dark p-6 mb-8 space-y-4" data-testid="admin-item-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 block mb-1">Kategori</label>
              <select value={editing.category_id} onChange={set("category_id")} className={inputCls} data-testid="item-category-select">
                {menu.map((c) => <option key={c.id} value={c.id} className="bg-[#0d0d0d]">{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Ürün Adı (TR)</label>
              <input value={editing.name} onChange={set("name")} className={inputCls} data-testid="item-name-input" />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Ürün Adı (EN — opsiyonel)</label>
              <input value={editing.name_en || ""} onChange={set("name_en")} className={inputCls} data-testid="item-name-en-input" />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Fiyat (₺ — boş bırakılabilir)</label>
              <input value={editing.price ?? ""} onChange={set("price")} type="number" step="0.01" className={inputCls} data-testid="item-price-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-white/50 block mb-1">Açıklama (TR)</label>
              <textarea value={editing.description} onChange={set("description")} rows={2} className={inputCls} data-testid="item-desc-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-white/50 block mb-1">Açıklama (EN — opsiyonel)</label>
              <textarea value={editing.description_en || ""} onChange={set("description_en")} rows={2} className={inputCls} data-testid="item-desc-en-input" />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Ürün Görseli</label>
              <div className="flex gap-2 items-center">
                <input value={editing.image || ""} onChange={set("image")} placeholder="/images/kumpir.jpg veya yükleyin →" className={inputCls} data-testid="item-image-input" />
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadFile} className="hidden" data-testid="item-image-file-input" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-pill btn-ghost !py-2 !px-3 !text-xs shrink-0 disabled:opacity-50" data-testid="item-image-upload-btn">
                  <Upload size={13} /> {uploading ? "..." : "Yükle"}
                </button>
              </div>
              {editing.image && <img src={editing.image} alt="Önizleme" className="mt-2 w-20 h-20 rounded-lg object-cover border border-white/10" data-testid="item-image-preview" />}
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Sıra</label>
              <input value={editing.order} onChange={set("order")} type="number" className={inputCls} data-testid="item-order-input" />
            </div>
          </div>
          <div className="flex gap-6 text-sm text-white/60">
            <label className="flex items-center gap-2"><input type="checkbox" checked={editing.visible} onChange={set("visible")} data-testid="item-visible-checkbox" /> Görünür</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={editing.featured} onChange={set("featured")} data-testid="item-featured-checkbox" /> Öne Çıkan</label>
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="btn-pill btn-solid !py-2 !px-5 !text-xs" data-testid="item-save-btn">Kaydet</button>
            <button onClick={() => setEditing(null)} className="btn-pill btn-ghost !py-2 !px-5 !text-xs" data-testid="item-cancel-btn">İptal</button>
          </div>
        </div>
      )}

      {menu.map((cat) => (
        <div key={cat.id} className="mb-8">
          <h3 className="font-display font-bold text-lg mb-3 text-white/80">{cat.name}</h3>
          <div className="space-y-2">
            {cat.items.map((item) => (
              <div key={item.id} className="card-dark !rounded-xl p-3 flex items-center gap-3" data-testid={`admin-item-row-${item.id}`}>
                {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`font-display font-bold text-sm truncate ${!item.visible ? "text-white/30 line-through" : ""}`}>
                    {item.name} {item.featured && <Star size={12} className="inline text-gold" />}
                  </p>
                  <p className="text-xs text-white/40 truncate">{item.price != null ? `${item.price} ₺` : "Fiyat yok"} · Sıra: {item.order}</p>
                </div>
                <button onClick={() => toggle(item, "visible")} className="p-2 text-white/50 hover:text-gold" title="Gizle/Göster" data-testid={`item-toggle-visible-${item.id}`}>
                  {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => toggle(item, "featured")} className={`p-2 hover:text-gold ${item.featured ? "text-gold" : "text-white/50"}`} title="Öne çıkar" data-testid={`item-toggle-featured-${item.id}`}>
                  <Star size={16} />
                </button>
                <button onClick={() => setEditing({ ...item })} className="p-2 text-white/50 hover:text-gold" data-testid={`item-edit-${item.id}`}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => remove(item.id)} className="p-2 text-white/50 hover:text-red-400" data-testid={`item-delete-${item.id}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

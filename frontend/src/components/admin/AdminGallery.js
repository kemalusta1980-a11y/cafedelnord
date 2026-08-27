import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Eye, EyeOff, Upload, RectangleVertical } from "lucide-react";
import { api } from "../../lib/api";

export const AdminGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () => api.get("/admin/gallery").then((r) => setPhotos(r.data)).catch(() => toast.error("Galeri yüklenemedi"));
  useEffect(() => { load(); }, []);

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const r = await api.post("/admin/upload", fd);
      await api.post("/admin/gallery", { image: r.data.url, alt: file.name.replace(/\.[^.]+$/, ""), order: photos.length });
      toast.success("Fotoğraf galeriye eklendi");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Fotoğraf yüklenemedi");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const update = async (id, body) => {
    await api.put(`/admin/gallery/${id}`, body);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Bu fotoğrafı galeriden kaldırmak istediğinize emin misiniz?")) return;
    await api.delete(`/admin/gallery/${id}`);
    toast.success("Fotoğraf kaldırıldı");
    load();
  };

  return (
    <div data-testid="admin-gallery-tab">
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadFile} className="hidden" data-testid="gallery-file-input" />
      <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-pill btn-solid !py-2 !px-4 !text-xs mb-6 disabled:opacity-50" data-testid="gallery-upload-btn">
        <Upload size={14} /> {uploading ? "Yükleniyor..." : "Fotoğraf Yükle"}
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((p) => (
          <div key={p.id} className="card-dark overflow-hidden" data-testid={`gallery-admin-photo-${p.id}`}>
            <div className="aspect-[4/3] overflow-hidden relative">
              <img src={p.image} alt={p.alt} className={`w-full h-full object-cover ${!p.visible ? "opacity-30" : ""}`} />
            </div>
            <div className="p-3">
              <input
                defaultValue={p.alt}
                onBlur={(e) => e.target.value !== p.alt && update(p.id, { alt: e.target.value })}
                placeholder="Açıklama (alt text)"
                className="w-full bg-transparent text-xs text-white/70 focus:outline-none focus:text-gold mb-2"
                data-testid={`gallery-alt-${p.id}`}
              />
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  defaultValue={p.order}
                  onBlur={(e) => Number(e.target.value) !== p.order && update(p.id, { order: Number(e.target.value) })}
                  className="w-14 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-center"
                  title="Sıra"
                  data-testid={`gallery-order-${p.id}`}
                />
                <div className="flex">
                  <button onClick={() => update(p.id, { tall: !p.tall })} className={`p-1.5 hover:text-gold ${p.tall ? "text-gold" : "text-white/40"}`} title="Dikey format" data-testid={`gallery-tall-${p.id}`}>
                    <RectangleVertical size={15} />
                  </button>
                  <button onClick={() => update(p.id, { visible: !p.visible })} className="p-1.5 text-white/50 hover:text-gold" title="Gizle/Göster" data-testid={`gallery-toggle-${p.id}`}>
                    {p.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button onClick={() => remove(p.id)} className="p-1.5 text-white/50 hover:text-red-400" data-testid={`gallery-delete-${p.id}`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

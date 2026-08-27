import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { LogOut, ShieldAlert } from "lucide-react";
import { api } from "../lib/api";
import { AdminItems } from "../components/admin/AdminItems";
import { AdminCategories } from "../components/admin/AdminCategories";
import { AdminReservations } from "../components/admin/AdminReservations";
import { AdminCampaigns } from "../components/admin/AdminCampaigns";
import { AdminGallery } from "../components/admin/AdminGallery";
import { AdminSettings } from "../components/admin/AdminSettings";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const tabs = [
  { id: "items", label: "Ürünler" },
  { id: "categories", label: "Kategoriler" },
  { id: "reservations", label: "Rezervasyonlar" },
  { id: "gallery", label: "Galeri" },
  { id: "campaigns", label: "Kampanyalar" },
  { id: "settings", label: "Ayarlar" },
];

export default function AdminPage() {
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [checking, setChecking] = useState(!location.state?.user);
  const [tab, setTab] = useState("items");

  useEffect(() => {
    if (user) return;
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/admin";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="admin-loading">
        <p className="text-white/50 font-display tracking-widest uppercase text-sm animate-pulse">Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" data-testid="admin-login-page">
        <div className="card-dark p-10 max-w-md w-full text-center">
          <p className="font-display font-black text-2xl mb-2">
            CAFE <span className="text-gold">DEL NORD</span>
          </p>
          <p className="text-white/50 text-sm mb-8">Yönetim Paneli</p>
          <button onClick={login} className="btn-pill btn-solid w-full justify-center" data-testid="admin-google-login-btn">
            Google ile Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" data-testid="admin-no-access">
        <div className="card-dark p-10 max-w-md w-full text-center">
          <ShieldAlert className="mx-auto text-gold mb-4" size={36} />
          <h1 className="font-display font-black text-xl mb-3">Yetkiniz Yok</h1>
          <p className="text-white/50 text-sm mb-6">
            Bu hesap ({user.email}) yönetici yetkisine sahip değil. Site sahibiyle iletişime geçin.
          </p>
          <button onClick={logout} className="btn-pill btn-ghost mx-auto" data-testid="admin-logout-btn-noaccess">
            <LogOut size={15} /> Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 px-5 sm:px-8 max-w-7xl mx-auto" data-testid="admin-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-black text-3xl tracking-tighter">
            Yönetim <span className="text-gold">Paneli</span>
          </h1>
          <p className="text-white/40 text-sm mt-1" data-testid="admin-user-email">{user.email}</p>
        </div>
        <button onClick={logout} className="btn-pill btn-ghost !py-2 !px-4 !text-xs" data-testid="admin-logout-btn">
          <LogOut size={14} /> Çıkış
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto mb-8 pb-1">
        {tabs.map((t) => (
          <button key={t.id} className={`cat-chip ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)} data-testid={`admin-tab-${t.id}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "items" && <AdminItems />}
      {tab === "categories" && <AdminCategories />}
      {tab === "reservations" && <AdminReservations />}
      {tab === "gallery" && <AdminGallery />}
      {tab === "campaigns" && <AdminCampaigns />}
      {tab === "settings" && <AdminSettings />}
    </div>
  );
}

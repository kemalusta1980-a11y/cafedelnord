import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { safeStorage } from "../lib/storage";

const SiteContext = createContext(null);

const UI = {
  tr: {
    home: "Ana Sayfa", menu: "Menü", about: "Hakkımızda", gallery: "Galeri",
    contact: "İletişim", reservation: "Rezervasyon", viewMenu: "Menüyü İncele",
    directions: "Yol Tarifi Al", callUs: "Bizi Ara", makeReservation: "Rezervasyon Yap",
    featured: "Öne Çıkan Lezzetler", search: "Menüde ara...",
  },
  en: {
    home: "Home", menu: "Menu", about: "About", gallery: "Gallery",
    contact: "Contact", reservation: "Reservation", viewMenu: "View Menu",
    directions: "Get Directions", callUs: "Call Us", makeReservation: "Book a Table",
    featured: "Featured Flavors", search: "Search the menu...",
  },
};

export const SiteProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [lang, setLang] = useState(() => safeStorage.get("cdn_lang") || "tr");

  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const toggleLang = () => {
    const next = lang === "tr" ? "en" : "tr";
    setLang(next);
    safeStorage.set("cdn_lang", next);
  };

  const t = (key) => UI[lang][key] || key;
  const localName = (item) => (lang === "en" && item.name_en ? item.name_en : item.name);
  const localDesc = (item) => (lang === "en" && item.description_en ? item.description_en : item.description);

  return (
    <SiteContext.Provider value={{ settings, setSettings, lang, toggleLang, t, localName, localDesc }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);

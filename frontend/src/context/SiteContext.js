import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { safeStorage } from "../lib/storage";
import { UI, LANGS } from "../lib/i18n";

const SiteContext = createContext(null);

export const SiteProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [content, setContent] = useState(null);
  const [lang, setLangState] = useState(() => {
    const saved = safeStorage.get("cdn_lang");
    return UI[saved] ? saved : "tr";
  });

  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => {});
    api.get("/content").then((r) => setContent(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (code) => {
    if (!UI[code]) return;
    setLangState(code);
    safeStorage.set("cdn_lang", code);
  };

  const t = (key) => {
    const c = content || {};
    if (lang === "tr") {
      if (c[key]) return c[key];
    } else if (c[`${key}_${lang}`]) {
      return c[`${key}_${lang}`];
    }
    return UI[lang][key] ?? UI.tr[key] ?? key;
  };
  const img = (key, fallback) => (content && content[key]) || fallback;
  const st = (key) => (settings ? (lang !== "tr" && settings[`${key}_${lang}`]) || settings[key] || "" : "");
  const localName = (item) => (lang !== "tr" && item[`name_${lang}`]) || item.name;
  const localDesc = (item) => (lang !== "tr" && item[`description_${lang}`]) || item.description;

  return (
    <SiteContext.Provider value={{ settings, setSettings, content, setContent, lang, setLang, langs: LANGS, t, st, img, localName, localDesc }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);

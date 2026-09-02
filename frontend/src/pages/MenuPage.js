import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../lib/api";
import { useSite } from "../context/SiteContext";
import { events } from "../lib/analytics";
import { Reveal, GoldTitle } from "../components/Reveal";
import { MenuItemCard } from "../components/MenuItemCard";

export default function MenuPage() {
  const { t, localName, localDesc, lang } = useSite();
  const [menu, setMenu] = useState([]);
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/menu").then((r) => setMenu(r.data)).catch(() => {});
    events.menuView("page");
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu
      .filter((c) => active === "all" || c.id === active)
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) => !q || localName(it).toLowerCase().includes(q) || (localDesc(it) || "").toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [menu, active, query, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pt-28 sm:pt-36 pb-24" data-testid="menu-page">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="eyebrow mb-4">Cafe Del Nord</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter mb-4">
            <GoldTitle text={t("menuTitle")} />
          </h1>
          <p className="text-white/50 max-w-xl mb-10">{t("menuSubtitle")}</p>
        </Reveal>
      </div>

      {/* Sticky category nav + search */}
      <div className="sticky top-16 sm:top-20 z-40 backdrop-blur-xl bg-[#170f2e]/85 border-y border-white/10 py-3" data-testid="menu-sticky-nav">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1 [scrollbar-width:none]">
            <button className={`cat-chip ${active === "all" ? "active" : ""}`} onClick={() => setActive("all")} data-testid="cat-chip-all">
              {t("all")}
            </button>
            {menu.map((c) => (
              <button
                key={c.id}
                className={`cat-chip ${active === c.id ? "active" : ""}`}
                onClick={() => { setActive(c.id); events.menuView(c.name); }}
                data-testid={`cat-chip-${c.slug}`}
              >
                {localName(c)}
              </button>
            ))}
          </div>
          <div className="relative shrink-0 w-40 sm:w-60">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60 transition-colors"
              data-testid="menu-search-input"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 mt-14 space-y-20">
        {filtered.length === 0 && menu.length > 0 && (
          <p className="text-white/40 text-center py-16" data-testid="menu-no-results">{t("noResults")}</p>
        )}
        {filtered.map((cat) => (
          <section key={cat.id} data-testid={`menu-category-${cat.slug}`}>
            <Reveal>
              <div className="flex items-baseline gap-4 mb-8">
                <h2 className="font-serif-editorial italic text-3xl sm:text-4xl">{localName(cat)}</h2>
                <span className="text-white/25 text-sm">{cat.items.length} {t("items")}</span>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cat.items.map((item, i) => (
                <Reveal key={item.id} delay={(i % 3) * 0.08}>
                  <MenuItemCard item={item} />
                </Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

import { useSite } from "../context/SiteContext";

export const MenuItemCard = ({ item, large = false }) => {
  const { localName, localDesc } = useSite();

  return (
    <article className="card-dark overflow-hidden group" data-testid={`menu-item-${item.id}`}>
      {item.image && (
        <div className={`img-frame !rounded-b-none ${large ? "aspect-[4/3]" : "aspect-[4/3]"}`}>
          <img src={item.image} alt={localName(item)} loading="lazy" />
          {item.price != null && (
            <span className="absolute top-3 right-3 backdrop-blur-md bg-black/60 border border-white/15 rounded-full px-3 py-1 font-display font-bold text-sm text-gold">
              {item.price} ₺
            </span>
          )}
        </div>
      )}
      <div className="p-5">
        <h3 className="font-display font-bold text-lg tracking-tight group-hover:text-gold transition-colors duration-300">
          {localName(item)}
        </h3>
        <p className="text-sm text-white/50 leading-relaxed mt-2 line-clamp-3">{localDesc(item)}</p>
      </div>
    </article>
  );
};

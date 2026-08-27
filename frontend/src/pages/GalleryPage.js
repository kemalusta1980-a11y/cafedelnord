import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "../components/Reveal";

const photos = [
  { src: "/images/kumpir.jpg", alt: "Taş fırında kumpir" },
  { src: "/images/kahve-atmosfer.jpg", alt: "Kahve atmosferi", tall: true },
  { src: "/images/et-burger.jpg", alt: "Et burger" },
  { src: "/images/kunefe.jpg", alt: "Künefe" },
  { src: "/images/serpme.jpg", alt: "Serpme kahvaltı", tall: true },
  { src: "/images/waffle.jpg", alt: "Waffle" },
  { src: "/images/pizza.jpg", alt: "Pizza çeşitleri" },
  { src: "/images/tatli-atmosfer.jpg", alt: "Tatlılar", tall: true },
  { src: "/images/latte.jpg", alt: "Latte" },
  { src: "/images/karisik-izgara.jpg", alt: "Karışık ızgara" },
  { src: "/images/milkshake.jpg", alt: "Milkshake" },
  { src: "/images/turk-kahvesi.jpg", alt: "Türk kahvesi", tall: true },
  { src: "/images/icecek-atmosfer.jpg", alt: "Soğuk içecekler" },
  { src: "/images/katmer.jpg", alt: "Katmer" },
  { src: "/images/burger-atmosfer.jpg", alt: "Burger çeşitleri" },
  { src: "/images/sufle.jpg", alt: "Sufle" },
];

export default function GalleryPage() {
  const [index, setIndex] = useState(null);

  const next = (dir) => setIndex((i) => (i + dir + photos.length) % photos.length);

  return (
    <div className="pt-28 sm:pt-36 pb-24" data-testid="gallery-page">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="eyebrow mb-4">Kareler</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter mb-12">
            Gale<span className="text-gold">ri</span>
          </h1>
        </Reveal>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:balance]">
          {photos.map((p, i) => (
            <Reveal key={p.src} delay={(i % 4) * 0.06} className="mb-4 break-inside-avoid">
              <button onClick={() => setIndex(i)} className="img-frame block w-full" data-testid={`gallery-photo-${i}`}>
                <img src={p.src} alt={p.alt} loading="lazy" className={p.tall ? "aspect-[3/4]" : "aspect-[4/3]"} />
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {index !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] backdrop-blur-xl bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIndex(null)}
            data-testid="gallery-lightbox"
          >
            <button className="absolute top-5 right-5 text-white/70 hover:text-white p-2" data-testid="lightbox-close-btn" aria-label="Kapat">
              <X size={28} />
            </button>
            <button
              className="absolute left-3 sm:left-8 text-white/60 hover:text-gold p-2"
              onClick={(e) => { e.stopPropagation(); next(-1); }}
              data-testid="lightbox-prev-btn" aria-label="Önceki"
            >
              <ChevronLeft size={36} />
            </button>
            <motion.img
              key={index}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              src={photos[index].src}
              alt={photos[index].alt}
              className="max-h-[85vh] max-w-[88vw] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute right-3 sm:right-8 text-white/60 hover:text-gold p-2"
              onClick={(e) => { e.stopPropagation(); next(1); }}
              data-testid="lightbox-next-btn" aria-label="Sonraki"
            >
              <ChevronRight size={36} />
            </button>
            <p className="absolute bottom-6 text-white/50 text-sm">{photos[index].alt}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

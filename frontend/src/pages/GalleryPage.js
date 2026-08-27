import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../lib/api";
import { useSite } from "../context/SiteContext";
import { Reveal, GoldTitle } from "../components/Reveal";

export default function GalleryPage() {
  const { t } = useSite();
  const [photos, setPhotos] = useState([]);
  const [index, setIndex] = useState(null);

  useEffect(() => {
    api.get("/gallery").then((r) => setPhotos(r.data)).catch(() => {});
  }, []);

  const next = (dir) => setIndex((i) => (i + dir + photos.length) % photos.length);

  return (
    <div className="pt-28 sm:pt-36 pb-24" data-testid="gallery-page">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="eyebrow mb-4">{t("galleryEyebrow")}</p>
          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter mb-12">
            <GoldTitle text={t("galleryTitle")} />
          </h1>
        </Reveal>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:balance]">
          {photos.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 0.06} className="mb-4 break-inside-avoid">
              <button onClick={() => setIndex(i)} className="img-frame block w-full" data-testid={`gallery-photo-${i}`}>
                <img src={p.image} alt={p.alt} loading="lazy" className={p.tall ? "aspect-[3/4]" : "aspect-[4/3]"} />
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {index !== null && photos[index] && (
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
              src={photos[index].image}
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

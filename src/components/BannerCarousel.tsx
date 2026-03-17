import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const banners = [
  {
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=1472",
    tag: "PATROCINADO",
    title: "🍔 McDonald's Delivery",
    subtitle: "Peça agora e ganhe batata média grátis!",
    cta: "Pedir Agora",
  },
  {
    image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=1470",
    tag: "PATROCINADO",
    title: "🔥 Burger King",
    subtitle: "2 Whoppers por R$19,90 — só hoje!",
    cta: "Aproveitar Oferta",
  },
  {
    image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1470",
    tag: "PATROCINADO",
    title: "🎤 Show Gusttavo Lima – São Paulo",
    subtitle: "26 de Outubro no Allianz Parque!",
    cta: "Ver Detalhes",
  },
];

const BannerCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  };
  const next = () => {
    setDirection(1);
    setCurrent((c) => (c + 1) % banners.length);
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const b = banners[current];

  return (
    <div className="relative rounded-2xl overflow-hidden h-44 sm:h-52 md:h-56 bg-muted">
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="absolute bottom-0 left-0 p-4 text-white"
          >
            <span className="text-xs font-semibold tracking-widest opacity-80">{b.tag}</span>
            <h3 className="font-bold text-lg leading-tight">{b.title}</h3>
            <p className="text-sm opacity-90 mb-2">{b.subtitle}</p>
            <button className="bg-white text-black text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors">
              {b.cta}
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/60 text-white rounded-full p-1 transition-colors z-10"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/60 text-white rounded-full p-1 transition-colors z-10"
      >
        <ChevronRight size={18} />
      </button>

      <div className="absolute bottom-2 right-4 flex gap-1 z-10">
        {banners.map((_, i) => (
          <motion.span
            key={i}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            animate={{ width: i === current ? 12 : 6, opacity: i === current ? 1 : 0.5 }}
            transition={{ duration: 0.3 }}
            className="h-1.5 rounded-full bg-white cursor-pointer"
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;

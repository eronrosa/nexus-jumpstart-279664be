import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  const prev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);
  const next = () => setCurrent((c) => (c + 1) % banners.length);

  const b = banners[current];

  return (
    <div className="relative rounded-2xl overflow-hidden h-44 sm:h-52 md:h-56 bg-muted">
      <img src={b.image} alt={b.title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 text-white">
        <span className="text-xs font-semibold tracking-widest opacity-80">{b.tag}</span>
        <h3 className="font-bold text-lg leading-tight">{b.title}</h3>
        <p className="text-sm opacity-90 mb-2">{b.subtitle}</p>
        <button className="bg-white text-black text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors">
          {b.cta}
        </button>
      </div>
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/60 text-white rounded-full p-1 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/60 text-white rounded-full p-1 transition-colors"
      >
        <ChevronRight size={18} />
      </button>
      <div className="absolute bottom-2 right-4 flex gap-1">
        {banners.map((_, i) => (
          <span
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${i === current ? "bg-white w-3" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;

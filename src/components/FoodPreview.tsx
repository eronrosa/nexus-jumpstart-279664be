import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowLeft, Heart, ShoppingCart, UtensilsCrossed, MoreHorizontal } from "lucide-react";

interface PreviewItem {
  id: string;
  title: string;
  highlight: string;     // word rendered in lighter weight
  temperature: string;   // e.g. "57"
  badge: string;         // e.g. "Medium Cook"
  hero: string;          // main image url
  thumbs: string[];      // small variant images
}

// Default sponsored / hot promo (later: load from DB "featured_preview" table)
const DEFAULT_ITEM: PreviewItem = {
  id: "grilled-chicken",
  title: "Grilled",
  highlight: "chicken breast",
  temperature: "57",
  badge: "Medium Cook",
  hero: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1000&q=80&auto=format&fit=crop",
  thumbs: [
    "https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1597652482220-d1a4070b4c7e?w=200&q=80&auto=format&fit=crop",
  ],
};

export default function FoodPreview({ onEnter, item = DEFAULT_ITEM }: { onEnter: () => void; item?: PreviewItem }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [maxX, setMaxX] = useState(0);
  const progress = useTransform(x, [0, Math.max(maxX, 1)], [0, 1]);
  const opacityArrows = useTransform(progress, [0, 0.6], [1, 0]);
  const [unlocked, setUnlocked] = useState(false);

  const handleMeasure = (node: HTMLDivElement | null) => {
    trackRef.current = node;
    if (node) {
      // Track width minus handle width (56) minus left/right padding (8 each)
      setMaxX(node.clientWidth - 56 - 16);
    }
  };

  const onDragEnd = () => {
    if (x.get() >= maxX * 0.8) {
      setUnlocked(true);
      animate(x, maxX, { duration: 0.15, onComplete: () => setTimeout(onEnter, 150) });
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5">
        <button onClick={onEnter} className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground bg-card border border-border rounded-full px-3 py-1.5 shadow-sm">
          <UtensilsCrossed size={12} className="text-[hsl(14_90%_55%)]" /> Food Preview
        </div>
        <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
          <Heart size={18} className="text-foreground" />
        </button>
      </div>

      {/* Title row */}
      <div className="px-6 mt-3 flex items-start justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-foreground tracking-tight">
          {item.title}{" "}
          <span className="font-medium text-muted-foreground">{item.highlight}</span>
        </h1>
        <p className="text-2xl sm:text-3xl font-extrabold text-foreground whitespace-nowrap">
          {item.temperature}
          <span className="text-sm font-bold align-top ml-0.5">°C</span>
        </p>
      </div>

      {/* Hero with side thumbs */}
      <div className="flex-1 relative overflow-hidden mt-2">
        {/* Vertical thumb strip */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 bg-card/70 backdrop-blur rounded-full p-1.5 border border-border shadow">
          {item.thumbs.map((t, i) => (
            <button key={i} className="w-11 h-11 rounded-full overflow-hidden border-2 border-card hover:border-[hsl(14_90%_55%)] transition-colors">
              <img src={t} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Hero image */}
        <motion.img
          initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          src={item.hero}
          alt={`${item.title} ${item.highlight}`}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Center badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-foreground/70 backdrop-blur text-background text-xs font-bold pl-3 pr-2 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
          {item.badge}
          <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center">
            <MoreHorizontal size={12} />
          </span>
        </motion.div>
      </div>

      {/* Swipe-to-cart track */}
      <div className="px-6 pb-6 pt-3">
        <div
          ref={handleMeasure}
          className="relative h-16 rounded-full bg-card border border-border shadow-inner flex items-center px-2 overflow-hidden">
          {/* Fill */}
          <motion.div
            style={{ width: useTransform(x, v => `${Math.min(100, (v / Math.max(maxX, 1)) * 100)}%`) }}
            className="absolute inset-y-0 left-0 bg-[hsl(14_90%_55%)]/15 rounded-full"
          />
          {/* Arrows */}
          <motion.div style={{ opacity: opacityArrows }} className="absolute inset-0 flex items-center justify-center text-muted-foreground font-bold tracking-widest text-sm">
            <span>›››</span>
          </motion.div>
          {/* Drag handle */}
          <motion.button
            drag="x"
            dragConstraints={{ left: 0, right: maxX }}
            dragElastic={0}
            dragMomentum={false}
            style={{ x }}
            onDragEnd={onDragEnd}
            whileTap={{ scale: 1.05 }}
            className="relative z-10 w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing">
            <UtensilsCrossed size={20} className="text-[hsl(14_90%_55%)]" />
          </motion.button>
          {/* Target cart */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
            <ShoppingCart size={18} />
          </div>
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-2 font-medium">
          {unlocked ? "Bem-vindo ao ZuuFood…" : "Arraste para entrar no ZuuFood"}
        </p>
      </div>
    </div>
  );
}

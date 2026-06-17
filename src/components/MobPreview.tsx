import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowLeft, Heart, MapPin, Car } from "lucide-react";
import heroImg from "@/assets/zuumob-preview.jpg";

export default function MobPreview({ onEnter }: { onEnter: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [maxX, setMaxX] = useState(0);
  const progress = useTransform(x, [0, Math.max(maxX, 1)], [0, 1]);
  const opacityArrows = useTransform(progress, [0, 0.6], [1, 0]);
  const fill = useTransform(x, v => `${Math.min(100, (v / Math.max(maxX, 1)) * 100)}%`);
  const [unlocked, setUnlocked] = useState(false);

  const handleMeasure = (node: HTMLDivElement | null) => {
    trackRef.current = node;
    if (node) setMaxX(node.clientWidth - 56 - 16);
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
    <div className="fixed inset-0 z-[60] bg-black flex flex-col overflow-hidden">
      <motion.img
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        src={heroImg}
        alt="ZuuMob — mobilidade urbana"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/90 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
        <button onClick={onEnter} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md">
          <ArrowLeft size={18} className="text-black" />
        </button>
        <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md">
          <Heart size={18} className="text-black" />
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-3"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(84_95%_55%)] text-black text-[11px] font-bold uppercase tracking-wider">
            <MapPin size={12} /> Mobilidade urbana
          </span>
          <h1 className="text-white text-4xl font-extrabold leading-[1.05] drop-shadow-lg">
            Sua viagem,<br />
            <span className="text-[hsl(84_95%_55%)]">no seu ritmo</span>
          </h1>
          <p className="text-white/80 text-sm max-w-[18rem]">
            Carros, motos e conforto premium em segundos.
          </p>
        </motion.div>
      </div>

      <div className="relative z-10 px-4 pb-6 pt-3 space-y-3">
        <div
          ref={handleMeasure}
          className="relative h-16 rounded-full bg-white/95 backdrop-blur shadow-lg flex items-center px-2 overflow-hidden"
        >
          <motion.div style={{ width: fill }} className="absolute inset-y-0 left-0 bg-[hsl(84_95%_55%)]/30 rounded-full" />
          <motion.div style={{ opacity: opacityArrows }} className="absolute inset-0 flex items-center justify-center text-black/40 font-bold tracking-widest text-sm">
            <span>›››</span>
          </motion.div>
          <motion.button
            drag="x"
            dragConstraints={{ left: 0, right: maxX }}
            dragElastic={0}
            dragMomentum={false}
            style={{ x }}
            onDragEnd={onDragEnd}
            whileTap={{ scale: 1.05 }}
            className="relative z-10 w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing"
          >
            <Car size={20} className="text-[hsl(84_95%_55%)]" />
          </motion.button>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center">
            <MapPin size={18} />
          </div>
        </div>
        <p className="text-center text-[11px] text-white/90 font-medium drop-shadow">
          {unlocked ? "Bem-vindo ao ZuuMob…" : "Arraste para entrar no ZuuMob"}
        </p>
      </div>
    </div>
  );
}

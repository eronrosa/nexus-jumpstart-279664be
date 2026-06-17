import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Search, Calendar, Car, Clock, Crown, Route, CarFront,
  Package, Truck, Bike, Home, Grid3x3, History, User, ArrowRight,
  Shield, Smartphone, ChevronRight, ArrowLeft
} from "lucide-react";
import ZuuMobConta from "./ZuuMobConta";


const NEON = "#C6FF00";
const BG = "#000000";
const CARD = "#111111";
const BORDER = "#2A2A2A";
const FONT = `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;


interface ServiceCard {
  icon: typeof Car;
  label: string;
  badge?: string;
  badgeColor?: "neon" | "white";
}

const services: ServiceCard[] = [
  { icon: Car, label: "Viagens", badge: "-25%", badgeColor: "neon" },
  { icon: Clock, label: "Reservar", badge: "PROMO", badgeColor: "white" },
  { icon: Crown, label: "ZUUMOB Black" },
  { icon: Route, label: "Intermunicipal" },
  { icon: CarFront, label: "Aluguel", badge: "-25%", badgeColor: "neon" },
  { icon: Package, label: "Enviar pacote" },
  { icon: Truck, label: "Entregas" },
  { icon: Bike, label: "Moto" },
];

export default function ZuuMobHome({ onSearchOpen }: { onSearchOpen: () => void }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"home" | "conta">("home");

  if (tab === "conta") {
    return <ZuuMobConta onBack={() => setTab("home")} />;
  }

  return (

    <div
      className="fixed inset-0 z-[55] overflow-hidden flex flex-col"
      style={{ background: BG, color: "#fff", fontFamily: FONT, letterSpacing: "-0.01em" }}
    >
      <div className="flex-1 overflow-y-auto overscroll-contain max-w-md w-full mx-auto px-4 sm:px-5 pt-4 pb-24">
        {/* Top bar with back button */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/")}
            aria-label="Voltar"
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <ArrowLeft size={18} strokeWidth={1.8} style={{ color: NEON }} />
          </button>
          <span
            className="text-[11px] font-bold tracking-[0.3em]"
            style={{ color: NEON, textShadow: `0 0 12px ${NEON}55` }}
          >
            ZUUMOB
          </span>
          <span className="w-10" />
        </div>

        {/* Search */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={onSearchOpen}
          className="w-full h-14 rounded-[28px] flex items-center pl-4 sm:pl-5 pr-2 mb-4 sm:mb-5 transition-all"
          style={{ background: "#0E0E0E", border: `1px solid ${BORDER}` }}
        >
          <Search size={18} strokeWidth={1.6} className="text-white/70 shrink-0" />
          <span className="ml-3 flex-1 text-left text-[14px] sm:text-[15px] text-white/60 font-medium truncate">
            Para onde vamos?
          </span>
          <span
            className="h-10 sm:h-11 px-3 sm:px-4 rounded-full inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-semibold shrink-0"
            style={{ background: "#0A0A0A", border: `1px solid ${BORDER}`, color: "#fff" }}
          >
            <Calendar size={14} strokeWidth={1.6} />
            Agora
          </span>
        </motion.button>

        {/* Repeat last ride card */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onSearchOpen}
          className="w-full text-left rounded-[18px] p-4 mb-6 sm:mb-7 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0A0A0A 0%, #131313 100%)",
            border: `1px solid ${NEON}33`,
            boxShadow: `0 0 24px ${NEON}10, inset 0 0 0 1px ${NEON}08`,
          }}
        >
          <div className="flex items-start justify-between mb-3 gap-2">
            <h3 className="text-[14px] sm:text-[15px] font-bold">Repetir última viagem</h3>
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
              style={{ background: NEON, color: "#000" }}
            >
              2 min atrás
            </span>
          </div>
          <div className="relative">
            <div className="space-y-3 max-w-[65%]">
              <div className="flex gap-3">
                <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0" style={{ background: NEON, boxShadow: `0 0 8px ${NEON}` }} />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-tight truncate">Aeroporto Internacional</p>
                  <p className="text-[11px] text-white/50">Terminal 2</p>
                </div>
              </div>
              <div className="ml-[5px] w-px h-3 bg-white/20" />
              <div className="flex gap-3">
                <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0" style={{ background: NEON, boxShadow: `0 0 8px ${NEON}` }} />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-tight truncate">Shopping Center</p>
                  <p className="text-[11px] text-white/50">Av. Principal</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-2 bottom-0 w-24 h-16 sm:w-28 sm:h-20 opacity-80 pointer-events-none">
              <Car size={80} strokeWidth={1.2} className="text-white/30 sm:hidden" style={{ filter: `drop-shadow(0 0 12px ${NEON}55)` }} />
              <Car size={90} strokeWidth={1.2} className="text-white/30 hidden sm:block" style={{ filter: `drop-shadow(0 0 12px ${NEON}55)` }} />
            </div>
          </div>
        </motion.button>

        {/* Para você */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] sm:text-[17px] font-bold">Para você</h2>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
            aria-label="Ver mais"
          >
            <ArrowRight size={15} strokeWidth={1.6} className="text-white" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-2.5 mb-6 sm:mb-7">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.button
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                whileHover={{ y: -2, boxShadow: `0 0 20px ${NEON}33` }}
                onClick={onSearchOpen}
                className="relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 transition-all"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
              >
                {s.badge && (
                  <span
                    className="absolute top-1.5 left-1.5 text-[7.5px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={
                      s.badgeColor === "neon"
                        ? { background: NEON, color: "#000" }
                        : { background: "#fff", color: "#000" }
                    }
                  >
                    {s.badge}
                  </span>
                )}
                <Icon
                  size={24}
                  strokeWidth={1.5}
                  className="sm:hidden"
                  style={{ color: NEON, filter: `drop-shadow(0 0 6px ${NEON}66)` }}
                />
                <Icon
                  size={26}
                  strokeWidth={1.5}
                  className="hidden sm:block"
                  style={{ color: NEON, filter: `drop-shadow(0 0 6px ${NEON}66)` }}
                />
                <span className="text-[9.5px] sm:text-[10.5px] font-medium text-white/90 text-center leading-tight px-0.5">
                  {s.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Promo banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="relative rounded-[20px] p-4 sm:p-5 overflow-hidden"
          style={{ background: NEON }}
        >
          <div className="relative z-10 max-w-[62%]">
            <h3 className="text-[15px] sm:text-[17px] font-extrabold text-black leading-tight mb-1">
              Sua mobilidade<br />merece mais liberdade
            </h3>
            <p className="text-[11px] sm:text-[11.5px] text-black/70 font-medium mb-3">
              Viaje, envie ou reserve em segundos.
            </p>
            <button className="bg-black text-white text-[11.5px] sm:text-[12px] font-semibold px-4 py-2 rounded-full inline-flex items-center gap-1.5">
              Saiba mais <ChevronRight size={13} strokeWidth={2} />
            </button>
          </div>
          <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-90">
            <Smartphone size={36} strokeWidth={1.4} className="text-black -rotate-12 sm:hidden" />
            <Smartphone size={42} strokeWidth={1.4} className="text-black -rotate-12 hidden sm:block" />
            <Shield size={28} strokeWidth={1.4} className="text-black absolute right-10 sm:right-12 top-2 sm:hidden" fill="rgba(0,0,0,0.1)" />
            <Shield size={32} strokeWidth={1.4} className="text-black absolute right-12 top-2 hidden sm:block" fill="rgba(0,0,0,0.1)" />
            <Car size={32} strokeWidth={1.4} className="text-black ml-1 sm:hidden" />
            <Car size={38} strokeWidth={1.4} className="text-black ml-1 hidden sm:block" />
          </div>
        </motion.div>
      </div>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[56] max-w-md mx-auto"
        style={{ background: BG, borderTop: `1px solid #1B1B1B`, fontFamily: FONT }}
      >
        <div className="grid grid-cols-4 px-2 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]">
          {[
            { icon: Home, label: "Início", active: true },
            { icon: Grid3x3, label: "Serviços" },
            { icon: History, label: "Atividade" },
            { icon: User, label: "Conta" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => item.label === "Conta" && setTab("conta")}
                className="flex flex-col items-center gap-1 py-1.5"
              >

                <Icon
                  size={22}
                  strokeWidth={item.active ? 2 : 1.5}
                  style={{
                    color: item.active ? NEON : "#A0A0A0",
                    filter: item.active ? `drop-shadow(0 0 8px ${NEON}aa)` : undefined,
                  }}
                  fill={item.active ? NEON : "none"}
                />
                <span
                  className="text-[10.5px] font-semibold"
                  style={{ color: item.active ? NEON : "#A0A0A0" }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

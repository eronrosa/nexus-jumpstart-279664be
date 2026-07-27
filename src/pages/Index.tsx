import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, QrCode, Bell, Eye, EyeOff, ArrowRight,
  Utensils, ShoppingBag, Car, Ticket, Star, Grid3x3,
  Home, ClipboardList, User, Zap, Pizza, Music,
  Stethoscope, MessageCircle, CreditCard, Gamepad2, Tag, Phone, Shield,
  BookOpen, GraduationCap, ShoppingCart, Store,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import burgerBanner from "@/assets/home-burger-banner.jpg";

const BG = "#070707";
const CARD = "#111111";
const CARD_HOVER = "#161616";
const BORDER = "#1F1F1F";
const NEON = "#C8FF00";
const TEXT_MUTED = "#A0A0A0";
const FONT = `'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif`;

const shortcuts = [
  { icon: Utensils, label: "ZuuFood", path: "/zuufood" },
  { icon: ShoppingBag, label: "ZuuPlace", path: "/" },
  { icon: Car, label: "ZuuMob", path: "/zuumob" },
  { icon: Ticket, label: "ZuuPass", path: "/zuupass" },
  { icon: Star, label: "ZuuPoints", path: "/" },
  { icon: Grid3x3, label: "Mais", path: "/" },
];

const offers = [
  { logo: "🍕", brand: "Pizza Hut", desc: "Até 30% OFF em pizzas", tag: "30% OFF", color: "#E31837" },
  { logo: "🎤", brand: "Festa Sertaneja", desc: "30% OFF Ingressos", tag: "30% OFF", color: "#7B2D26" },
  { logo: "🚗", brand: "Uber", desc: "Corridas com até 25% OFF", tag: "25% OFF", color: "#000" },
  { logo: "🍔", brand: "McDonald's", desc: "Combo do dia", tag: "20% OFF", color: "#DA291C" },
];

const services = [
  { icon: Utensils, label: "ZuuFood", color: "#C8FF00", path: "/zuufood" },
  { icon: Car, label: "ZuuMob", color: "#00D9FF", path: "/zuumob" },
  { icon: CreditCard, label: "ZuuPass", color: "#FF3EA5", path: "/zuupass" },
  { icon: ShoppingBag, label: "ZuuPlace", color: "#FF8A00", path: "/" },
  { icon: Star, label: "ZuuPoints", color: "#C8FF00", path: "/" },
  { icon: ShoppingCart, label: "ZuuMarket", color: "#FFD400", path: "/" },
  { icon: GraduationCap, label: "Academy", color: "#B87BFF", path: "/" },
  { icon: BookOpen, label: "ZuuBook", color: "#00D9FF", path: "/" },
  { icon: MessageCircle, label: "ZuuChat", color: "#00E676", path: "/zuuchat" },
  { icon: CreditCard, label: "ZuuPay", color: "#C8FF00", path: "/" },
  { icon: Gamepad2, label: "ZuuGames", color: "#FF3E3E", path: "/" },
  { icon: Tag, label: "Cupons", color: "#FFB800", path: "/" },
  { icon: Phone, label: "ZuuCall", color: "#4A9EFF", path: "/" },
  { icon: Shield, label: "ZuuSeg", color: "#B87BFF", path: "/" },
  { icon: Grid3x3, label: "Mais", color: "#A0A0A0", path: "/" },
];

const Index = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeShortcut, setActiveShortcut] = useState(0);
  const [balanceHidden, setBalanceHidden] = useState(false);

  const displayName = profile?.display_name?.split(" ")[0] ?? "você";

  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: BG, color: "#fff", fontFamily: FONT, letterSpacing: "-0.01em" }}
    >
      <div className="max-w-md mx-auto px-6 pt-6 space-y-7">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(user ? "/perfil" : "/auth")}
              className="relative shrink-0"
            >
              <div className="w-12 h-12 rounded-full p-[2px]" style={{ background: NEON }}>
                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-white/70" />
                  )}
                </div>
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                style={{ background: NEON, borderColor: BG }}
              />
            </button>
            <div className="min-w-0">
              <h1 className="text-[19px] font-bold leading-tight truncate">
                Oi, {displayName} na Zuuppi! <span className="inline-block">👋</span>
              </h1>
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                Tudo que você precisa, em um só lugar.
              </p>
            </div>
          </div>
          <button
            className="relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 ml-2"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
            aria-label="Notificações"
          >
            <Bell size={18} strokeWidth={1.7} className="text-white" />
            <span
              className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
              style={{ background: NEON, boxShadow: `0 0 8px ${NEON}` }}
            />
          </button>
        </header>

        {/* Search */}
        <div
          className="h-14 rounded-[28px] flex items-center pl-5 pr-2"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <Search size={18} strokeWidth={1.7} style={{ color: TEXT_MUTED }} />
          <input
            className="flex-1 bg-transparent outline-none px-3 text-[14px] placeholder:text-[#6B6B6B]"
            placeholder="Buscar restaurantes, produtos, serviços..."
          />
          <button
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "#1A1A1A", border: `1px solid ${BORDER}` }}
            aria-label="Escanear QR"
          >
            <QrCode size={16} strokeWidth={1.7} className="text-white" />
          </button>
        </div>

        {/* Shortcuts */}
        <div className="flex justify-between gap-1">
          {shortcuts.map((s, i) => {
            const Icon = s.icon;
            const active = i === activeShortcut;
            return (
              <button
                key={s.label}
                onClick={() => {
                  setActiveShortcut(i);
                  if (s.path !== "/") navigate(s.path);
                }}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all active:scale-95"
                  style={{
                    background: active ? NEON : CARD,
                    border: `1px solid ${active ? NEON : BORDER}`,
                    boxShadow: active ? `0 0 20px ${NEON}55` : "none",
                  }}
                >
                  <Icon
                    size={22}
                    strokeWidth={1.6}
                    style={{ color: active ? "#000" : "#fff" }}
                  />
                </div>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: active ? "#fff" : TEXT_MUTED }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Banner */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/zuufood")}
          className="relative w-full rounded-[24px] overflow-hidden text-left h-[220px] flex"
          style={{
            background: `linear-gradient(90deg, #0B0F04 0%, #131a06 55%, #1a2408 100%)`,
            border: `1px solid ${BORDER}`,
          }}
        >
          <div className="relative z-10 flex-1 p-6 flex flex-col justify-between max-w-[58%]">
            <div>
              <span className="text-[10px] font-bold tracking-widest" style={{ color: NEON }}>
                PATROCINADO
              </span>
              <h2 className="text-[26px] font-extrabold leading-[1.05] mt-2">
                McDonald's<br />
                <span style={{ color: NEON }}>Delivery</span>
              </h2>
              <p className="text-[12px] mt-2" style={{ color: "#D0D0D0" }}>
                Peça agora e ganhe pontos ZP!
              </p>
            </div>
            <span
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold w-fit"
              style={{ background: NEON, color: "#000" }}
            >
              Pedir agora <ArrowRight size={14} strokeWidth={2.5} />
            </span>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-[55%]">
            <img
              src={burgerBanner}
              alt="McDonald's"
              className="w-full h-full object-cover"
              style={{ maskImage: "linear-gradient(90deg, transparent 0%, black 25%)", WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 25%)" }}
            />
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === 0 ? 16 : 5,
                  height: 5,
                  background: i === 0 ? NEON : "#FFFFFF44",
                }}
              />
            ))}
          </div>
        </motion.button>

        {/* Balance Card */}
        <div
          className="rounded-[24px] p-6"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium" style={{ color: TEXT_MUTED }}>
                  Saldo Zuuppi
                </span>
                <button onClick={() => setBalanceHidden((v) => !v)} aria-label="Ocultar saldo">
                  {balanceHidden ? (
                    <EyeOff size={14} style={{ color: TEXT_MUTED }} />
                  ) : (
                    <Eye size={14} style={{ color: TEXT_MUTED }} />
                  )}
                </button>
              </div>
              <p className="text-[34px] font-extrabold mt-1 leading-none">
                {balanceHidden ? "R$ ••••" : "R$ 250,00"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {[
                { icon: QrCode, label: "Pix" },
                { icon: CreditCard, label: "Pagar" },
                { icon: ArrowRight, label: "Transferir" },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <button
                    key={b.label}
                    className="w-[62px] h-[62px] rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                    style={{ background: "#1A1A1A", border: `1px solid ${BORDER}` }}
                  >
                    <Icon size={16} strokeWidth={1.8} style={{ color: NEON }} />
                    <span className="text-[9.5px] font-semibold text-white">{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            className="mt-5 w-full flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "#0C0C0C", border: `1px solid ${BORDER}` }}
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
              style={{ background: NEON, color: "#000" }}
            >
              ZP
            </span>
            <span className="text-[14px] font-bold">1.250 pts</span>
            <span className="text-[12px] flex-1 text-left" style={{ color: TEXT_MUTED }}>
              Resgate descontos e vantagens
            </span>
            <ArrowRight size={14} style={{ color: TEXT_MUTED }} />
          </button>
        </div>

        {/* Ofertas do dia */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-bold">Ofertas do dia</h3>
            <button className="text-[13px] font-semibold" style={{ color: NEON }}>
              Ver todas
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            {offers.map((o) => (
              <div
                key={o.brand}
                className="shrink-0 w-[220px] rounded-[20px] p-4"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
              >
                <div className="flex gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: o.color }}
                  >
                    {o.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold truncate">{o.brand}</p>
                    <p className="text-[11px] leading-tight mt-0.5" style={{ color: TEXT_MUTED }}>
                      {o.desc}
                    </p>
                  </div>
                </div>
                <span
                  className="inline-block mt-3 px-3 py-1 rounded-full text-[10.5px] font-bold"
                  style={{ background: `${NEON}22`, color: NEON, border: `1px solid ${NEON}44` }}
                >
                  {o.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Nossos serviços */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-bold">Nossos serviços</h3>
            <button className="text-[13px] font-semibold" style={{ color: NEON }}>
              Editar
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2.5">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => s.path !== "/" && navigate(s.path)}
                  className="aspect-square rounded-[18px] flex flex-col items-center justify-center gap-1.5 p-1.5 active:scale-95 transition-transform"
                  style={{ background: CARD, border: `1px solid ${BORDER}` }}
                >
                  <Icon size={22} strokeWidth={1.6} style={{ color: s.color }} />
                  <span className="text-[9.5px] font-semibold text-white text-center leading-tight px-0.5">
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
        style={{ background: BG, borderTop: `1px solid ${BORDER}` }}
      >
        <div className="relative grid grid-cols-5 items-end px-4 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
          {[
            { icon: Home, label: "Início", path: "/", active: true },
            { icon: ClipboardList, label: "Atividades", path: "/pedidos" },
            { center: true },
            { icon: Star, label: "ZP Points", path: "/" },
            { icon: User, label: "Perfil", path: user ? "/perfil" : "/auth" },
          ].map((item, i) => {
            if ((item as any).center) {
              return (
                <div key="c" className="flex justify-center">
                  <button
                    onClick={() => navigate("/")}
                    className="w-14 h-14 rounded-full flex items-center justify-center -translate-y-4 active:scale-95 transition-transform"
                    style={{
                      background: NEON,
                      boxShadow: `0 8px 24px ${NEON}66, 0 0 0 6px ${BG}`,
                    }}
                    aria-label="Zuuppi"
                  >
                    <span className="text-[22px] font-black text-black" style={{ fontFamily: FONT }}>
                      Z
                    </span>
                  </button>
                </div>
              );
            }
            const Icon = (item as any).icon;
            return (
              <button
                key={(item as any).label}
                onClick={() => navigate((item as any).path)}
                className="flex flex-col items-center gap-1 py-1"
              >
                <Icon
                  size={20}
                  strokeWidth={(item as any).active ? 2 : 1.6}
                  style={{ color: (item as any).active ? NEON : TEXT_MUTED }}
                />
                <span
                  className="text-[10.5px] font-semibold"
                  style={{ color: (item as any).active ? NEON : TEXT_MUTED }}
                >
                  {(item as any).label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;

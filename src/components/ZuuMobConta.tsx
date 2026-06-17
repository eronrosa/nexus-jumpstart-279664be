import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Headphones, Wallet, ShieldCheck, Mail,
  MessageCircle, Settings, ChevronRight, Star, User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NEON = "#C6FF00";
const BG = "#000000";
const CARD = "#111111";
const BORDER = "#2A2A2A";
const TEXT_SEC = "#A0A0A0";
const FONT = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

interface Props {
  onBack: () => void;
}

const quickActions = [
  { icon: Headphones, label: "Ajuda", path: "/perfil" },
  { icon: Wallet, label: "Carteira", path: "/perfil" },
  { icon: ShieldCheck, label: "Segurança", path: "/perfil" },
  { icon: Mail, label: "Mensagens", path: "/zuuchat" },
];

export default function ZuuMobConta({ onBack }: Props) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Dados puxados do Super App ZUPPI (perfil central)
  const displayName =
    profile?.display_name ||
    user?.email?.split("@")[0] ||
    "Convidado ZUPPI";
  const avatarUrl = profile?.avatar_url || "";
  const rating = 4.9; // central rating placeholder
  const balance = "R$ 0,00"; // central wallet placeholder until wallet table exists

  return (
    <div
      className="fixed inset-0 z-[55] overflow-hidden flex flex-col"
      style={{ background: BG, color: "#fff", fontFamily: FONT, letterSpacing: "-0.01em" }}
    >
      <div className="flex-1 overflow-y-auto overscroll-contain max-w-md w-full mx-auto px-4 sm:px-5 pt-4 pb-28">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onBack}
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

        {/* Cabeçalho do usuário (dados centrais ZUPPI) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-tight truncate">{displayName}</h1>
            <div
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <Star size={12} fill={NEON} style={{ color: NEON }} strokeWidth={0} />
              <span className="text-[12px] font-semibold">{rating.toFixed(2)}</span>
            </div>
          </div>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden shrink-0"
            style={{ background: "#1a1a1a", border: `1px solid ${BORDER}`, boxShadow: `0 0 20px ${NEON}33` }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={28} strokeWidth={1.6} className="text-white/80" />
            )}
          </div>
        </motion.div>

        {/* Ações rápidas (centrais) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {quickActions.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.button
                key={a.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                onClick={() => navigate(a.path)}
                className="h-14 rounded-2xl flex items-center gap-3 px-4 active:scale-[0.98] transition-transform"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
              >
                <Icon size={20} strokeWidth={1.6} style={{ color: NEON }} />
                <span className="text-[14px] font-semibold">{a.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Card Suporte ao cliente */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/zuuchat")}
          className="w-full text-left rounded-[18px] p-4 mb-4 flex items-center gap-3"
          style={{
            background: CARD,
            border: `1px solid ${NEON}`,
            boxShadow: `0 0 24px ${NEON}22`,
          }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#0A0A0A", border: `1px solid ${BORDER}` }}
          >
            <Headphones size={20} strokeWidth={1.6} style={{ color: NEON }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold leading-tight">Suporte ao cliente</p>
            <p className="text-[11.5px] mt-0.5 leading-snug" style={{ color: TEXT_SEC }}>
              Precisa de ajuda? Fale com nosso time agora.
            </p>
          </div>
          <div
            className="text-right px-3 py-2 rounded-xl shrink-0"
            style={{ background: "#0A0A0A", border: `1px solid ${BORDER}` }}
          >
            <p className="text-[9px] font-medium" style={{ color: TEXT_SEC }}>Tempo médio</p>
            <p className="text-[12px] font-bold" style={{ color: NEON }}>2 min</p>
          </div>
        </motion.button>

        {/* Saldo central ZUPPI */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/perfil")}
          className="w-full rounded-[18px] p-4 mb-3 flex items-center gap-3"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <Wallet size={20} strokeWidth={1.6} style={{ color: NEON }} />
          <span className="flex-1 text-left text-[14px] font-semibold">Saldo ZUPPI</span>
          <span className="text-[15px] font-bold">{balance}</span>
          <ChevronRight size={18} strokeWidth={1.6} style={{ color: TEXT_SEC }} />
        </motion.button>

        {/* Mensagens central */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/zuuchat")}
          className="w-full rounded-[18px] p-4 mb-3 flex items-center gap-3"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <MessageCircle size={20} strokeWidth={1.6} style={{ color: NEON }} />
          <div className="flex-1 text-left">
            <p className="text-[14px] font-semibold leading-tight">Mensagens</p>
            <p className="text-[11.5px]" style={{ color: TEXT_SEC }}>Inbox do Super App</p>
          </div>
          <ChevronRight size={18} strokeWidth={1.6} style={{ color: TEXT_SEC }} />
        </motion.button>

        {/* Configurações */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/perfil")}
          className="w-full rounded-[18px] p-4 flex items-center gap-3"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <Settings size={20} strokeWidth={1.6} style={{ color: NEON }} />
          <span className="flex-1 text-left text-[14px] font-semibold">Configurações</span>
          <ChevronRight size={18} strokeWidth={1.6} style={{ color: TEXT_SEC }} />
        </motion.button>

        <p
          className="text-center text-[10.5px] mt-6 leading-snug"
          style={{ color: TEXT_SEC }}
        >
          Sua conta é gerenciada pelo Super App ZUPPI.
        </p>
      </div>
    </div>
  );
}

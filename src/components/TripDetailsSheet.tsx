import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Shield, Pencil, Plus, Grid3x3, Wallet,
  Tag, Star, ChevronRight, Radio,
} from "lucide-react";
import { useState } from "react";

const NEON = "#C6FF00";
const BG = "#000000";
const CARD = "#111111";
const CARD_INNER = "#1A1A1A";
const BORDER = "#2A2A2A";
const MUTED = "#A0A0A0";
const DANGER = "#FF3B30";
const FONT = `'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`;

interface TripDetailsSheetProps {
  open: boolean;
  onClose: () => void;
  origin?: string;
  originSub?: string;
  destination?: string;
  destinationTime?: string;
  pin?: string;
  fare?: string;
  paymentMethod?: string;
  savings?: string;
  creditsPct?: string;
}

export default function TripDetailsSheet({
  open,
  onClose,
  origin = "Encontro no Aeroporto Internacional de Raja Bhoj",
  originSub = "Ponto de embarque ZUUMOB",
  destination = "Shopping Center Central",
  destinationTime = "20:30",
  pin = "9046",
  fare = "R$ 32,45",
  paymentMethod = "Dinheiro",
  savings = "R$ 4,50",
  creditsPct = "10%",
}: TripDetailsSheetProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80]"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => { if (info.offset.y > 140) onClose(); }}
            className="fixed left-0 right-0 bottom-0 z-[81] max-w-md mx-auto rounded-t-[28px] overflow-hidden flex flex-col"
            style={{
              background: BG,
              color: "#fff",
              fontFamily: FONT,
              height: "85vh",
              border: `1px solid ${BORDER}`,
              borderBottom: "none",
              boxShadow: `0 -20px 60px rgba(0,0,0,0.6), 0 0 80px ${NEON}10`,
              letterSpacing: "-0.01em",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <span className="w-10 h-1 rounded-full" style={{ background: "#2A2A2A" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
              >
                <ChevronDown size={18} strokeWidth={2} className="text-white" />
              </button>
              <button
                className="h-10 px-3.5 rounded-full inline-flex items-center gap-1.5 active:scale-95 transition-transform"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
              >
                <Shield size={15} strokeWidth={2} style={{ color: NEON, filter: `drop-shadow(0 0 6px ${NEON}88)` }} />
                <span className="text-[13px] font-semibold">Segurança</span>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
              <h2 className="text-center text-[17px] font-semibold mb-4 mt-1">Detalhes da viagem</h2>

              {/* Route card */}
              <div className="rounded-[18px] p-4 mb-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-1.5 shrink-0">
                    <span className="w-3 h-3 rounded-full" style={{ background: NEON, boxShadow: `0 0 8px ${NEON}` }} />
                    <span className="flex-1 w-px my-1.5" style={{ background: "#2A2A2A", minHeight: 40 }} />
                    <span className="w-3 h-3 rounded-sm" style={{ background: NEON, boxShadow: `0 0 8px ${NEON}` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-4">
                      <p className="text-[14px] font-semibold leading-snug">{origin}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>{originSub}</p>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold leading-snug truncate">{destination}</p>
                        <p className="text-[12px] mt-0.5 font-bold" style={{ color: MUTED }}>{destinationTime}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button aria-label="Editar" className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all hover:shadow-[0_0_12px_#C6FF0055]" style={{ background: CARD_INNER, border: `1px solid ${BORDER}` }}>
                          <Pencil size={15} className="text-white" />
                        </button>
                        <button aria-label="Adicionar parada" className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all hover:shadow-[0_0_12px_#C6FF0055]" style={{ background: CARD_INNER, border: `1px solid ${BORDER}` }}>
                          <Plus size={16} className="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PIN card */}
              <div className="rounded-[18px] p-4 mb-3 flex items-center gap-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <Grid3x3 size={22} strokeWidth={1.6} style={{ color: NEON }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold">Seu PIN</p>
                  <p className="text-[11.5px] truncate" style={{ color: MUTED }}>Compartilhe este PIN com o motorista</p>
                </div>
                <div className="flex gap-1">
                  {pin.split("").map((d, i) => (
                    <span
                      key={i}
                      className="w-7 h-9 rounded-[8px] flex items-center justify-center text-[15px] font-bold"
                      style={{ background: NEON, color: "#000", boxShadow: `0 0 10px ${NEON}55` }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Payment + benefits card */}
              <div className="rounded-[18px] p-4 mb-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-3 mb-4">
                  <Wallet size={22} strokeWidth={1.6} style={{ color: NEON }} />
                  <div className="flex-1">
                    <p className="text-[16px] font-bold leading-tight">{fare}</p>
                    <p className="text-[12px]" style={{ color: MUTED }}>{paymentMethod}</p>
                  </div>
                  <button
                    className="h-9 px-4 rounded-full text-[12.5px] font-semibold active:scale-95 transition-transform"
                    style={{ background: CARD_INNER, border: `1px solid ${BORDER}`, color: "#fff" }}
                  >
                    Trocar
                  </button>
                </div>
                <div className="space-y-2.5 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-2.5">
                    <Tag size={15} style={{ color: NEON }} />
                    <p className="text-[12.5px]" style={{ color: MUTED }}>
                      Você economiza <span className="font-bold" style={{ color: NEON }}>{savings}</span> com créditos ZUUMOB
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Star size={15} style={{ color: NEON }} />
                    <p className="text-[12.5px]" style={{ color: MUTED }}>
                      Ganhe <span className="font-bold" style={{ color: NEON }}>{creditsPct}</span> de créditos ZUUMOB nesta viagem
                    </p>
                  </div>
                  <button className="flex items-center justify-between w-full pt-1 text-[12.5px] font-semibold" style={{ color: NEON }}>
                    Ver todos os benefícios
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              {/* Share status */}
              <button className="w-full rounded-[18px] p-3.5 mb-3 flex items-center gap-3 active:scale-[0.98] transition-transform" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <Radio size={18} style={{ color: NEON }} />
                <span className="flex-1 text-left text-[13.5px] font-medium">Compartilhar status da viagem</span>
                <span className="h-9 px-4 rounded-full inline-flex items-center text-[12.5px] font-semibold" style={{ background: CARD_INNER, border: `1px solid ${BORDER}` }}>
                  Compartilhar
                </span>
              </button>

              {/* Cancel button */}
              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full rounded-[16px] mb-2.5 flex flex-col items-center justify-center active:scale-[0.98] transition-transform"
                style={{ background: DANGER, height: 64 }}
              >
                <span className="text-[15px] font-bold text-white">Cancelar viagem</span>
                <span className="text-[11px] text-white/80">Sem taxa se cancelado em até 30 segundos</span>
              </button>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-full rounded-[16px] text-[14px] font-semibold text-white active:scale-[0.98] transition-transform"
                style={{ background: CARD_INNER, border: `1px solid ${BORDER}`, height: 56 }}
              >
                Fechar
              </button>
            </div>

            {/* Confirm cancel modal */}
            <AnimatePresence>
              {confirmCancel && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-end sm:items-center justify-center p-5"
                  style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
                  onClick={() => setConfirmCancel(false)}
                >
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 30, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-sm rounded-[20px] p-5"
                    style={{ background: CARD, border: `1px solid ${BORDER}` }}
                  >
                    <h3 className="text-[16px] font-bold mb-1">Cancelar esta viagem?</h3>
                    <p className="text-[13px] mb-5" style={{ color: MUTED }}>
                      Sem taxa se cancelado em até 30 segundos.
                    </p>
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="flex-1 h-12 rounded-full text-[13.5px] font-semibold text-white"
                        style={{ background: CARD_INNER, border: `1px solid ${BORDER}` }}
                      >
                        Manter viagem
                      </button>
                      <button
                        onClick={() => { setConfirmCancel(false); onClose(); }}
                        className="flex-1 h-12 rounded-full text-[13.5px] font-bold text-white"
                        style={{ background: DANGER }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

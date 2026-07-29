import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, ArrowRight, QrCode, CreditCard, Plus, X,
  ArrowUpRight, ArrowDownLeft, Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const CARD = "#111111";
const BORDER = "#1F1F1F";
const NEON = "#C8FF00";
const TEXT_MUTED = "#A0A0A0";

type OpType = "pix" | "pay" | "transfer" | "deposit";

interface Tx {
  id: string;
  type: OpType;
  direction: "in" | "out";
  amount: number;
  description: string | null;
  counterparty: string | null;
  created_at: string;
}

const OP_LABEL: Record<OpType, string> = {
  pix: "Enviar Pix",
  pay: "Pagar",
  transfer: "Transferir",
  deposit: "Depositar",
};

const OP_FIELDS: Record<OpType, { counterpartyLabel: string; counterpartyPh: string; descPh: string }> = {
  pix: { counterpartyLabel: "Chave Pix (email, CPF, telefone)", counterpartyPh: "chave@zuuppi.com", descPh: "Mensagem (opcional)" },
  pay: { counterpartyLabel: "Código do boleto ou beneficiário", counterpartyPh: "Ex.: Conta de luz", descPh: "Descrição (opcional)" },
  transfer: { counterpartyLabel: "Email do destinatário Zuuppi", counterpartyPh: "amigo@zuuppi.com", descPh: "Mensagem (opcional)" },
  deposit: { counterpartyLabel: "Origem", counterpartyPh: "Cartão / Pix in", descPh: "Descrição (opcional)" },
};

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function WalletCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openOp, setOpenOp] = useState<OpType | null>(null);
  const [openExtrato, setOpenExtrato] = useState(false);

  const loadWallet = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) {
      await supabase.from("wallets").insert({ user_id: user.id, balance: 0 });
      setBalance(0);
    } else {
      setBalance(Number(data.balance));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadWallet(); }, [loadWallet]);

  return (
    <>
      <div className="rounded-2xl px-4 py-3.5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
              Saldo
            </span>
            <button onClick={() => setHidden((v) => !v)} aria-label="Ocultar saldo">
              {hidden ? <EyeOff size={12} style={{ color: TEXT_MUTED }} /> : <Eye size={12} style={{ color: TEXT_MUTED }} />}
            </button>
            <span className="ml-2 text-[20px] font-bold leading-none tracking-tight text-white">
              {loading ? "—" : hidden ? "R$ ••••" : formatBRL(balance)}
            </span>
          </div>
          <button
            onClick={() => user ? setOpenExtrato(true) : navigate("/auth")}
            className="text-[11px] font-semibold flex items-center gap-1" style={{ color: NEON }}
          >
            Extrato <ArrowRight size={11} />
          </button>
        </div>

        <div className="mt-3.5 grid grid-cols-4 gap-1">
          {([
            { icon: QrCode, label: "Pix", op: "pix" as const },
            { icon: CreditCard, label: "Pagar", op: "pay" as const },
            { icon: ArrowUpRight, label: "Transferir", op: "transfer" as const },
            { icon: Plus, label: "Depositar", op: "deposit" as const },
          ]).map((b) => {
            const Icon = b.icon;
            return (
              <button
                key={b.label}
                onClick={() => user ? setOpenOp(b.op) : navigate("/auth")}
                className="flex flex-col items-center gap-1.5 py-1 active:scale-95 transition-transform"
              >
                <span className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "#1A1A1A", border: `1px solid ${BORDER}` }}>
                  <Icon size={15} strokeWidth={2} style={{ color: NEON }} />
                </span>
                <span className="text-[10.5px] font-medium text-white">{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {openOp && (
          <OperationSheet
            op={openOp}
            balance={balance}
            onClose={() => setOpenOp(null)}
            onDone={async () => { setOpenOp(null); await loadWallet(); }}
          />
        )}
        {openExtrato && (
          <ExtratoSheet onClose={() => setOpenExtrato(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function OperationSheet({
  op, balance, onClose, onDone,
}: { op: OpType; balance: number; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fields = OP_FIELDS[op];

  const submit = async () => {
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) {
      toast({ title: "Valor inválido", description: "Informe um valor maior que zero.", variant: "destructive" });
      return;
    }
    if (op !== "deposit" && value > balance) {
      toast({ title: "Saldo insuficiente", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    let recipient_user_id: string | null = null;
    if (op === "transfer" && counterparty.trim()) {
      // resolve email → user_id via profiles (best-effort; profile may not exist)
      const { data: prof } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("display_name", counterparty.trim())
        .maybeSingle();
      recipient_user_id = prof?.user_id ?? null;
    }

    const { error } = await supabase.rpc("wallet_operation", {
      _type: op,
      _amount: value,
      _description: description || null,
      _counterparty: counterparty || null,
      _recipient_user_id: recipient_user_id,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Falha na operação", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Operação concluída", description: `${OP_LABEL[op]} de ${formatBRL(value)}.` });
    onDone();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md rounded-t-3xl p-5 pb-[max(20px,env(safe-area-inset-bottom))]"
        style={{ background: "#0A0A0A", border: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold text-white">{OP_LABEL[op]}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="mb-4">
          <label className="text-[11px] uppercase tracking-wider" style={{ color: TEXT_MUTED }}>Valor</label>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[16px] text-white/60">R$</span>
            <input
              autoFocus inputMode="decimal" placeholder="0,00"
              value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
              className="flex-1 bg-transparent outline-none text-[32px] font-bold text-white placeholder-white/20"
            />
          </div>
          <div className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
            Saldo disponível: {formatBRL(balance)}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
              {fields.counterpartyLabel}
            </label>
            <input
              value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder={fields.counterpartyPh}
              className="mt-1 w-full h-11 rounded-xl px-3 bg-transparent text-white text-[14px] outline-none"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            />
          </div>
          <div>
            <input
              value={description} onChange={(e) => setDescription(e.target.value)} placeholder={fields.descPh}
              className="w-full h-11 rounded-xl px-3 bg-transparent text-white text-[14px] outline-none"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            />
          </div>
        </div>

        <button
          onClick={submit} disabled={submitting}
          className="mt-5 w-full h-12 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: NEON, color: "#000" }}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Confirmar
        </button>
      </motion.div>
    </motion.div>
  );
}

function ExtratoSheet({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [txs, setTxs] = useState<Tx[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setTxs((data ?? []) as Tx[]));
  }, [user]);

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md h-[80vh] rounded-t-3xl p-5 flex flex-col"
        style={{ background: "#0A0A0A", border: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold text-white">Extrato</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {txs === null ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" style={{ color: NEON }} /></div>
          ) : txs.length === 0 ? (
            <p className="text-center text-[13px] py-10" style={{ color: TEXT_MUTED }}>
              Nenhuma movimentação ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {txs.map((t) => {
                const isIn = t.direction === "in";
                const Icon = isIn ? ArrowDownLeft : ArrowUpRight;
                return (
                  <li key={t.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                    <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "#1A1A1A", border: `1px solid ${BORDER}` }}>
                      <Icon size={16} style={{ color: isIn ? NEON : "#FF6B6B" }} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">
                        {t.description || OP_LABEL[t.type]}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>
                        {new Date(t.created_at).toLocaleString("pt-BR")}
                        {t.counterparty ? ` · ${t.counterparty}` : ""}
                      </p>
                    </div>
                    <span className="text-[13px] font-bold shrink-0" style={{ color: isIn ? NEON : "#fff" }}>
                      {isIn ? "+" : "−"} {formatBRL(Number(t.amount))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

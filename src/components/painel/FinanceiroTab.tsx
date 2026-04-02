import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download, Calendar, CreditCard, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface FinanceiroTabProps {
  orders: { id: string; total: number; delivery_fee: number; status: string; created_at: string }[];
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function FinanceiroTab({ orders }: FinanceiroTabProps) {
  const [period, setPeriod] = useState<"hoje" | "semana" | "mes">("mes");

  const now = new Date();
  const filterOrders = orders.filter(o => {
    if (o.status !== "entregue") return false;
    const d = new Date(o.created_at);
    if (period === "hoje") return d.toDateString() === now.toDateString();
    if (period === "semana") return (now.getTime() - d.getTime()) / 86400000 <= 7;
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalRevenue = filterOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalDeliveryFees = filterOrders.reduce((s, o) => s + Number(o.delivery_fee), 0);
  const platformFee = totalRevenue * 0.12; // 12% simulated platform fee
  const netRevenue = totalRevenue - platformFee;
  const avgTicket = filterOrders.length > 0 ? totalRevenue / filterOrders.length : 0;

  // Last period comparison
  const lastPeriodOrders = orders.filter(o => {
    if (o.status !== "entregue") return false;
    const d = new Date(o.created_at);
    if (period === "hoje") { const y = new Date(now); y.setDate(y.getDate() - 1); return d.toDateString() === y.toDateString(); }
    if (period === "semana") { const diff = (now.getTime() - d.getTime()) / 86400000; return diff > 7 && diff <= 14; }
    const lm = new Date(now); lm.setMonth(lm.getMonth() - 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });
  const lastRevenue = lastPeriodOrders.reduce((s, o) => s + Number(o.total), 0);
  const revenueGrowth = lastRevenue > 0 ? ((totalRevenue - lastRevenue) / lastRevenue) * 100 : 0;

  // Simulated transactions
  const transactions = filterOrders.slice(0, 10).map(o => ({
    id: o.id,
    date: o.created_at,
    amount: Number(o.total),
    fee: Number(o.total) * 0.12,
    net: Number(o.total) * 0.88,
    type: "Pedido" as const,
  }));

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {(["hoje", "semana", "mes"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${period === p ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {p === "hoje" ? "Hoje" : p === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-border text-foreground hover:bg-secondary transition-all">
          <Download size={14} /> Exportar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-foreground">Faturamento bruto</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(totalRevenue)}</p>
          <div className="flex items-center gap-1 mt-1">
            {revenueGrowth >= 0
              ? <ArrowUpRight size={12} className="text-emerald-600" />
              : <ArrowDownRight size={12} className="text-destructive" />}
            <span className={`text-xs font-bold ${revenueGrowth >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {Math.abs(revenueGrowth).toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">vs período anterior</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet size={18} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Receita líquida</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{fmt(netRevenue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Após taxas da plataforma</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <TrendingDown size={18} className="text-destructive" />
            </div>
            <p className="text-sm font-semibold text-foreground">Taxas (12%)</p>
          </div>
          <p className="text-2xl font-bold text-destructive">{fmt(platformFee)}</p>
          <p className="text-xs text-muted-foreground mt-1">Comissão da plataforma</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <CreditCard size={18} className="text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-foreground">Ticket médio</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(avgTicket)}</p>
          <p className="text-xs text-muted-foreground mt-1">{filterOrders.length} pedidos entregues</p>
        </motion.div>
      </div>

      {/* Next payment */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar size={20} className="text-primary" />
          <h3 className="font-bold text-foreground text-lg">Próximo repasse</h3>
        </div>
        <p className="text-sm text-muted-foreground">O valor líquido será depositado na sua conta em até 2 dias úteis após cada período de faturamento.</p>
        <div className="mt-4 flex items-end gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Valor estimado</p>
            <p className="text-2xl font-bold text-primary">{fmt(netRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taxa de entrega acumulada</p>
            <p className="text-lg font-bold text-foreground">{fmt(totalDeliveryFees)}</p>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground text-lg">Histórico de transações</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Nenhuma transação no período selecionado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-widest border-b border-border">
                  <th className="text-left px-6 py-3 font-bold">Data</th>
                  <th className="text-left px-6 py-3 font-bold">Tipo</th>
                  <th className="text-right px-6 py-3 font-bold">Bruto</th>
                  <th className="text-right px-6 py-3 font-bold">Taxa</th>
                  <th className="text-right px-6 py-3 font-bold">Líquido</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 text-sm text-foreground">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                    <td className="px-6 py-3 text-sm text-foreground">{t.type}</td>
                    <td className="px-6 py-3 text-sm text-right font-semibold text-foreground">{fmt(t.amount)}</td>
                    <td className="px-6 py-3 text-sm text-right text-destructive">-{fmt(t.fee)}</td>
                    <td className="px-6 py-3 text-sm text-right font-bold text-emerald-600">{fmt(t.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

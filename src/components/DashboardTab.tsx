import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingUp, DollarSign, ShoppingBag, CalendarDays, Target } from "lucide-react";

interface Order {
  id: string; total: number; delivery_fee: number; status: string; created_at: string;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

const PERIOD_OPTIONS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
];

const STATUS_COLORS: Record<string, string> = {
  pendente: "hsl(45, 93%, 47%)",
  em_preparo: "hsl(217, 91%, 60%)",
  entregue: "hsl(142, 71%, 45%)",
  cancelado: "hsl(0, 84%, 60%)",
};
const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente", em_preparo: "Em Preparo", entregue: "Entregue", cancelado: "Cancelado",
};

export default function DashboardTab({ storeId }: { storeId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - period);
      const { data } = await supabase
        .from("orders").select("id, total, delivery_fee, status, created_at")
        .eq("restaurant_id", storeId).gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    };
    load();
  }, [storeId, period]);

  const stats = useMemo(() => {
    const delivered = orders.filter(o => o.status === "entregue");
    const revenue = delivered.reduce((s, o) => s + Number(o.total), 0);
    const avgTicket = delivered.length > 0 ? revenue / delivered.length : 0;
    const cancelRate = orders.length > 0 ? (orders.filter(o => o.status === "cancelado").length / orders.length) * 100 : 0;
    return { total: orders.length, delivered: delivered.length, revenue, avgTicket, cancelRate };
  }, [orders]);

  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; pedidos: number; faturamento: number }>();
    orders.forEach(o => {
      const day = new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const cur = map.get(day) ?? { date: day, pedidos: 0, faturamento: 0 };
      cur.pedidos++;
      if (o.status === "entregue") cur.faturamento += Number(o.total);
      map.set(day, cur);
    });
    return Array.from(map.values());
  }, [orders]);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => map.set(o.status, (map.get(o.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([status, value]) => ({
      name: STATUS_LABELS[status] ?? status, value, color: STATUS_COLORS[status] ?? "#888",
    }));
  }, [orders]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="bg-card rounded-2xl h-36 animate-pulse border border-border" />)}
      </div>
    );
  }

  const kpis = [
    { icon: ShoppingBag, label: "Total Pedidos", value: stats.total.toString(), color: "text-primary", bg: "from-primary/15 to-primary/5", iconBg: "bg-primary/15" },
    { icon: Target, label: "Entregues", value: stats.delivered.toString(), color: "text-emerald-600", bg: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15" },
    { icon: DollarSign, label: "Faturamento", value: fmt(stats.revenue), color: "text-blue-600", bg: "from-blue-500/15 to-blue-500/5", iconBg: "bg-blue-500/15" },
    { icon: CalendarDays, label: "Ticket Médio", value: fmt(stats.avgTicket), color: "text-violet-600", bg: "from-violet-500/15 to-violet-500/5", iconBg: "bg-violet-500/15" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground text-xl flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" /> Visão Geral
          </h3>
          <p className="text-sm text-muted-foreground">Acompanhe o desempenho do seu negócio</p>
        </div>
        <div className="flex gap-1 bg-secondary/80 rounded-xl p-1">
          {PERIOD_OPTIONS.map(p => (
            <button key={p.days} onClick={() => setPeriod(p.days)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${period === p.days ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`bg-gradient-to-br ${kpi.bg} rounded-2xl p-5 border border-border/50`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${kpi.iconBg} rounded-xl flex items-center justify-center`}>
                <kpi.icon size={18} className={kpi.color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={32} className="text-muted-foreground/30" />
          </div>
          <p className="font-bold text-foreground text-lg">Sem dados no período</p>
          <p className="text-sm text-muted-foreground mt-1">Os gráficos aparecerão quando houver pedidos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue area chart */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
            <h4 className="font-bold text-foreground mb-1">Faturamento por dia</h4>
            <p className="text-xs text-muted-foreground mb-5">Receita de pedidos entregues</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `R$${v}`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
                  formatter={(v: number) => [fmt(v), "Faturamento"]} />
                <Area type="monotone" dataKey="faturamento" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders bar chart */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-foreground mb-1">Pedidos por dia</h4>
            <p className="text-xs text-muted-foreground mb-5">Volume diário de pedidos</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
                  formatter={(v: number) => [v, "Pedidos"]} />
                <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status pie chart */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-foreground mb-1">Por Status</h4>
            <p className="text-xs text-muted-foreground mb-5">Distribuição dos pedidos</p>
            <div className="flex flex-col items-center gap-5">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={4} strokeWidth={0}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3">
                {statusData.map(s => (
                  <div key={s.name} className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-xs text-foreground font-medium">{s.name}: <strong>{s.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

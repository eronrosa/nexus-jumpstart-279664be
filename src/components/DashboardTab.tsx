import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign, ShoppingBag, CalendarDays } from "lucide-react";

interface Order {
  id: string;
  total: number;
  delivery_fee: number;
  status: string;
  created_at: string;
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
  pendente: "Pendente",
  em_preparo: "Em Preparo",
  entregue: "Entregue",
  cancelado: "Cancelado",
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
        .from("orders")
        .select("id, total, delivery_fee, status, created_at")
        .eq("restaurant_id", storeId)
        .gte("created_at", since.toISOString())
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
    return { total: orders.length, delivered: delivered.length, revenue, avgTicket };
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
      name: STATUS_LABELS[status] ?? status,
      value,
      color: STATUS_COLORS[status] ?? "hsl(var(--muted-foreground))",
    }));
  }, [orders]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl h-32 animate-pulse border border-border" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" /> Dashboard
        </h3>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {PERIOD_OPTIONS.map(p => (
            <button key={p.days} onClick={() => setPeriod(p.days)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${period === p.days ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: ShoppingBag, label: "Total Pedidos", value: stats.total.toString(), color: "text-primary", bg: "bg-primary/10" },
          { icon: ShoppingBag, label: "Entregues", value: stats.delivered.toString(), color: "text-green-600", bg: "bg-green-500/10" },
          { icon: DollarSign, label: "Faturamento", value: fmt(stats.revenue), color: "text-primary", bg: "bg-primary/10" },
          { icon: CalendarDays, label: "Ticket Médio", value: fmt(stats.avgTicket), color: "text-blue-600", bg: "bg-blue-500/10" },
        ].map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} rounded-2xl p-4`}>
            <kpi.icon size={18} className={`${kpi.color} mb-1`} />
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp size={48} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">Sem dados no período</p>
          <p className="text-xs text-muted-foreground mt-1">Os gráficos aparecerão quando houver pedidos</p>
        </div>
      ) : (
        <>
          {/* Revenue line chart */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h4 className="font-semibold text-foreground text-sm mb-4">Faturamento por dia</h4>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `R$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [fmt(v), "Faturamento"]}
                />
                <Line type="monotone" dataKey="faturamento" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Orders bar chart */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h4 className="font-semibold text-foreground text-sm mb-4">Pedidos por dia</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [v, "Pedidos"]}
                />
                <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status pie chart */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h4 className="font-semibold text-foreground text-sm mb-4">Distribuição por Status</h4>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3">
                {statusData.map(s => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-sm text-foreground">{s.name}: <strong>{s.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

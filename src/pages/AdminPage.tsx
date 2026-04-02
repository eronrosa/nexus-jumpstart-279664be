import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, Users, Store, ShoppingBag, Car, Ticket, Sparkles,
  Star, ArrowLeft, Search, ToggleLeft, ToggleRight, Shield, ChevronRight,
  DollarSign, Bike, MapPin, Megaphone, TrendingUp, Activity, Zap,
  CheckCircle2, XCircle, Clock, Globe, Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtK = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString();

type Tab = "dashboard" | "users" | "stores" | "orders" | "rides" | "drivers" | "coupons" | "featured" | "services";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Usuários", icon: Users },
  { id: "stores", label: "Estabelecimentos", icon: Store },
  { id: "orders", label: "Pedidos", icon: ShoppingBag },
  { id: "rides", label: "Corridas", icon: Car },
  { id: "drivers", label: "Motoristas", icon: Bike },
  { id: "coupons", label: "Cupons", icon: Ticket },
  { id: "featured", label: "Destaques", icon: Star },
  { id: "services", label: "Serviços", icon: Sparkles },
];

const GLOW = "shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (authLoading || adminLoading) {
    return (
      <div className="admin-dark min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(240 10% 4%), hsl(240 10% 8%))" }}>
        <div className="relative">
          <span className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin block" />
          <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="admin-dark min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "linear-gradient(135deg, hsl(240 10% 4%), hsl(240 10% 8%))" }}>
        <div className="relative">
          <Shield size={56} className="text-destructive" />
          <div className="absolute inset-0 blur-2xl bg-destructive/20 rounded-full" />
        </div>
        <h1 className="text-xl font-bold text-white">Acesso Restrito</h1>
        <p className="text-white/50 text-sm">Você não tem permissão para acessar o Command Center.</p>
        <button onClick={() => navigate("/")} className="text-primary text-sm font-semibold hover:underline mt-2">Voltar ao início</button>
      </div>
    );
  }

  return (
    <div className="admin-dark flex min-h-screen" style={{ background: "linear-gradient(160deg, hsl(240 15% 4%) 0%, hsl(240 10% 7%) 50%, hsl(260 12% 5%) 100%)" }}>
      {/* Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col min-h-screen shrink-0 transition-all duration-500 ease-out border-r py-6",
        "bg-white/[0.02] border-white/[0.06] backdrop-blur-xl",
        sidebarCollapsed ? "w-[68px] px-2" : "w-[260px] px-4"
      )}>
        <div className="px-2 mb-8 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Cpu size={16} className="text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-white tracking-tight">ZUUPPI</h1>
                  <p className="text-[9px] text-white/30 font-medium tracking-widest uppercase">Command Center</p>
                </div>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
              <Cpu size={16} className="text-primary-foreground" />
            </div>
          )}
        </div>

        <div className={cn("mb-4", sidebarCollapsed ? "px-0" : "px-2")}>
          {!sidebarCollapsed && <p className="text-[10px] text-white/20 font-semibold uppercase tracking-widest mb-3">Navegação</p>}
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300",
                tab === id
                  ? "bg-primary/10 text-primary"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]",
                sidebarCollapsed && "justify-center px-2"
              )}>
              {tab === id && (
                <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary" />
              )}
              <Icon size={18} />
              {!sidebarCollapsed && label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-2 px-1">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center w-full py-2 rounded-lg text-white/20 hover:text-white/40 transition-colors">
            <ChevronRight size={16} className={cn("transition-transform duration-300", sidebarCollapsed && "rotate-180")} />
          </button>
          <button onClick={() => navigate("/")} className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all w-full",
            sidebarCollapsed && "justify-center px-2"
          )}>
            <ArrowLeft size={18} />
            {!sidebarCollapsed && "Voltar ao App"}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3 overflow-x-auto bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
        <button onClick={() => navigate("/")} className="shrink-0 text-white/50"><ArrowLeft size={20} /></button>
        <span className="font-bold text-primary shrink-0 text-sm">ZUUPPI</span>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0",
                tab === id ? "bg-primary/20 text-primary border border-primary/30" : "text-white/40 border border-white/[0.06]"
              )}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              {tab === "dashboard" && <DashboardPanel />}
              {tab === "users" && <UsersPanel />}
              {tab === "stores" && <StoresPanel />}
              {tab === "orders" && <OrdersPanel />}
              {tab === "rides" && <RidesPanel />}
              {tab === "drivers" && <DriversPanel />}
              {tab === "coupons" && <CouponsPanel />}
              {tab === "featured" && <FeaturedPanel />}
              {tab === "services" && <ServicesPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CARD GLASS — reusable wrapper
   ═══════════════════════════════════════════════════════════════════════════════ */
function GlassCard({ children, className, glow }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md p-5 transition-all duration-300",
      glow && "hover:border-primary/20 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)]",
      className
    )}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DASHBOARD PANEL — KPIs + Charts
   ═══════════════════════════════════════════════════════════════════════════════ */
function DashboardPanel() {
  const [stats, setStats] = useState({ users: 0, stores: 0, orders: 0, rides: 0, revenue: 0, drivers: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [profiles, stores, ordersRes, rides, drivers] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total, created_at, status"),
        supabase.from("rides").select("id", { count: "exact", head: true }),
        supabase.from("drivers").select("id", { count: "exact", head: true }),
      ]);
      const allOrders = ordersRes.data ?? [];
      const revenue = allOrders.reduce((s, o) => s + Number(o.total), 0);
      setStats({
        users: profiles.count ?? 0,
        stores: stores.count ?? 0,
        orders: allOrders.length,
        rides: rides.count ?? 0,
        revenue,
        drivers: drivers.count ?? 0,
      });
      setOrders(allOrders);
      setLoading(false);
    };
    load();
  }, []);

  // Generate chart data from orders
  const revenueChart = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });
    return last7.map(day => {
      const dayOrders = orders.filter(o => o.created_at?.startsWith(day));
      return {
        day: new Date(day).toLocaleDateString("pt-BR", { weekday: "short" }),
        receita: dayOrders.reduce((s, o) => s + Number(o.total), 0),
        pedidos: dayOrders.length,
      };
    });
  }, [orders]);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const PIE_COLORS = ["hsl(152 100% 45%)", "hsl(217 91% 60%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)", "hsl(262 83% 58%)"];

  const kpis = [
    { label: "Receita Total", value: fmt(stats.revenue), icon: DollarSign, trend: "+12.5%", trendUp: true, gradient: "from-primary/20 to-primary/5" },
    { label: "Pedidos", value: fmtK(stats.orders), icon: ShoppingBag, trend: "+8.2%", trendUp: true, gradient: "from-blue-500/20 to-blue-500/5" },
    { label: "Usuários", value: fmtK(stats.users), icon: Users, trend: "+23.1%", trendUp: true, gradient: "from-purple-500/20 to-purple-500/5" },
    { label: "Corridas", value: fmtK(stats.rides), icon: Car, trend: "+15.4%", trendUp: true, gradient: "from-amber-500/20 to-amber-500/5" },
    { label: "Motoristas", value: fmtK(stats.drivers), icon: Bike, trend: "+5.7%", trendUp: true, gradient: "from-pink-500/20 to-pink-500/5" },
    { label: "Lojas Ativas", value: fmtK(stats.stores), icon: Store, trend: "+18.9%", trendUp: true, gradient: "from-emerald-500/20 to-emerald-500/5" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-white/[0.03] animate-pulse rounded-2xl border border-white/[0.04]" />)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-72 bg-white/[0.03] animate-pulse rounded-2xl border border-white/[0.04]" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Command Center</h2>
          <p className="text-white/30 text-sm mt-1">Visão geral da operação em tempo real</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2">
          <Activity size={14} className="text-primary animate-pulse" />
          <span className="text-[11px] text-white/50 font-medium">Live</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.06, type: "spring", stiffness: 200 }}>
            <GlassCard glow className="relative overflow-hidden group">
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", kpi.gradient)} />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center">
                    <kpi.icon size={18} className="text-white/60" />
                  </div>
                  <div className="flex items-center gap-1 text-primary text-[11px] font-bold">
                    <TrendingUp size={12} />
                    {kpi.trend}
                  </div>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-extrabold text-white">{kpi.value}</p>
                  <p className="text-[11px] text-white/30 font-medium mt-0.5">{kpi.label}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Area Chart */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">Faturamento & Pedidos</h3>
              <p className="text-[11px] text-white/30">Últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-white/40">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />Receita</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Pedidos</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(122 39% 42%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(122 39% 42%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(240 10% 10%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
              <Area type="monotone" dataKey="receita" stroke="hsl(122 39% 42%)" fill="url(#gradRev)" strokeWidth={2} />
              <Area type="monotone" dataKey="pedidos" stroke="hsl(217 91% 60%)" fill="url(#gradPed)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Status Pie */}
        <GlassCard>
          <h3 className="text-sm font-bold text-white mb-1">Status dos Pedidos</h3>
          <p className="text-[11px] text-white/30 mb-4">Distribuição atual</p>
          {statusChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusChart} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                  {statusChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(240 10% 10%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Sem dados</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {statusChart.map((s, i) => (
              <span key={s.name} className="flex items-center gap-1 text-[10px] text-white/50">
                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard className="!p-4">
        <div className="flex items-center gap-3 overflow-x-auto">
          <Zap size={16} className="text-primary shrink-0" />
          <span className="text-[11px] text-white/30 font-medium shrink-0">Quick Insights:</span>
          <div className="flex gap-2 overflow-x-auto">
            {[
              { label: `${stats.orders} pedidos processados`, icon: CheckCircle2 },
              { label: `${stats.drivers} motoristas na frota`, icon: Bike },
              { label: `${stats.stores} lojas no ecossistema`, icon: Globe },
            ].map(q => (
              <span key={q.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50 whitespace-nowrap shrink-0">
                <q.icon size={12} className="text-primary" />{q.label}
              </span>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   USERS PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
function UsersPanel() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("*").then(({ data }) => { setProfiles(data ?? []); setLoading(false); });
  }, []);

  const filtered = profiles.filter(p => (p.display_name ?? "").toLowerCase().includes(search.toLowerCase()) || (p.phone ?? "").includes(search));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Usuários</h2>
          <p className="text-white/30 text-sm">{profiles.length} cadastrados</p>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..."
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all" />
      </div>
      {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-white/[0.03] animate-pulse rounded-xl border border-white/[0.04]" />)}</div> : (
        <div className="space-y-2">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
              <GlassCard className="!p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {(p.display_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{p.display_name ?? "Sem nome"}</p>
                  <p className="text-[11px] text-white/30">{p.phone ?? "Sem telefone"}</p>
                </div>
                <span className="text-[10px] text-white/20 font-mono">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
              </GlassCard>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-center text-white/20 text-sm py-12">Nenhum usuário encontrado</p>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STORES PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
function StoresPanel() {
  const [stores, setStores] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadStores = async () => { const { data } = await supabase.from("stores").select("*"); setStores(data ?? []); setLoading(false); };
  useEffect(() => { loadStores(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("stores").update({ is_active: !current }).eq("id", id);
    toast({ title: !current ? "Loja ativada ✅" : "Loja desativada" });
    loadStores();
  };

  const filtered = stores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Estabelecimentos</h2>
        <p className="text-white/30 text-sm">{stores.length} cadastrados</p>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar estabelecimento..."
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
      </div>
      {loading ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-white/[0.03] animate-pulse rounded-xl border border-white/[0.04]" />)}</div> : (
        <div className="space-y-2">
          {filtered.map(s => (
            <GlassCard key={s.id} className="!p-4 flex items-center gap-4">
              {s.logo_url ? <img src={s.logo_url} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/[0.06]" /> : (
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center"><Store size={20} className="text-white/40" /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{s.name}</p>
                <p className="text-[11px] text-white/30">{s.category} • {s.address_city ?? "Sem cidade"}</p>
              </div>
              <button onClick={() => toggleActive(s.id, s.is_active)}
                className={cn("p-2 rounded-lg transition-all", s.is_active ? "text-primary hover:bg-primary/10" : "text-white/20 hover:bg-white/[0.06]")}>
                {s.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ORDERS PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
function OrdersPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => { setOrders(data ?? []); setLoading(false); });
  }, []);

  const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
    pendente: { bg: "bg-amber-500/10", text: "text-amber-400", icon: Clock },
    preparando: { bg: "bg-blue-500/10", text: "text-blue-400", icon: Activity },
    pronto: { bg: "bg-primary/10", text: "text-primary", icon: CheckCircle2 },
    entregue: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: CheckCircle2 },
    cancelado: { bg: "bg-red-500/10", text: "text-red-400", icon: XCircle },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Pedidos</h2>
        <p className="text-white/30 text-sm">{orders.length} últimos pedidos</p>
      </div>
      {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-white/[0.03] animate-pulse rounded-xl border border-white/[0.04]" />)}</div> : (
        <div className="space-y-2">
          {orders.map(o => {
            const cfg = statusConfig[o.status] ?? { bg: "bg-white/[0.04]", text: "text-white/40", icon: Clock };
            return (
              <GlassCard key={o.id} className="!p-4 flex items-center gap-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", cfg.bg)}>
                  <cfg.icon size={16} className={cfg.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{o.restaurant_name}</p>
                  <p className="text-[11px] text-white/30">{new Date(o.created_at).toLocaleDateString("pt-BR")} • {fmt(o.total)}</p>
                </div>
                <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", cfg.bg, cfg.text)}>
                  {o.status?.toUpperCase()}
                </span>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   RIDES PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
function RidesPanel() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("rides").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => { setRides(data ?? []); setLoading(false); });
  }, []);

  const statusConfig: Record<string, { bg: string; text: string }> = {
    searching: { bg: "bg-amber-500/10", text: "text-amber-400" },
    accepted: { bg: "bg-blue-500/10", text: "text-blue-400" },
    in_progress: { bg: "bg-primary/10", text: "text-primary" },
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
    cancelled: { bg: "bg-red-500/10", text: "text-red-400" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Corridas</h2>
        <p className="text-white/30 text-sm">{rides.length} registradas</p>
      </div>
      {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-white/[0.03] animate-pulse rounded-xl border border-white/[0.04]" />)}</div> : (
        <div className="space-y-2">
          {rides.map(r => {
            const cfg = statusConfig[r.status] ?? { bg: "bg-white/[0.04]", text: "text-white/40" };
            return (
              <GlassCard key={r.id} className="!p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Car size={16} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.origin_address ?? "Origem"} → {r.destination_address ?? "Destino"}</p>
                  <p className="text-[11px] text-white/30">{r.ride_type} • {r.created_at ? new Date(r.created_at).toLocaleDateString("pt-BR") : ""} • {r.estimated_price ? fmt(r.estimated_price) : "—"}</p>
                </div>
                <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", cfg.bg, cfg.text)}>
                  {r.status?.toUpperCase()}
                </span>
              </GlassCard>
            );
          })}
          {rides.length === 0 && <p className="text-center text-white/20 text-sm py-12">Nenhuma corrida registrada</p>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DRIVERS PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
function DriversPanel() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const { toast } = useToast();

  const loadDrivers = async () => { const { data } = await supabase.from("drivers").select("*"); setDrivers(data ?? []); setLoading(false); };
  useEffect(() => { loadDrivers(); }, []);

  const handleApproval = async (driverId: string, approve: boolean) => {
    const { error } = await supabase.rpc("admin_update_driver", { _driver_id: driverId, _is_approved: approve });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: approve ? "Motorista aprovado ✅" : "Motorista rejeitado" });
      loadDrivers();
    }
  };

  const filtered = drivers.filter(d => {
    if (filter === "pending") return !d.is_approved;
    if (filter === "approved") return d.is_approved;
    return true;
  });

  const pills: { id: "all" | "pending" | "approved"; label: string }[] = [
    { id: "all", label: "Todos" }, { id: "pending", label: "Pendentes" }, { id: "approved", label: "Aprovados" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Motoristas</h2>
        <p className="text-white/30 text-sm">{drivers.length} na frota</p>
      </div>
      <div className="flex gap-2">
        {pills.map(p => (
          <button key={p.id} onClick={() => setFilter(p.id)}
            className={cn("px-4 py-2 rounded-xl text-[12px] font-semibold transition-all",
              filter === p.id ? "bg-primary/15 text-primary border border-primary/20" : "text-white/30 border border-white/[0.06] hover:bg-white/[0.04]"
            )}>
            {p.label}
          </button>
        ))}
      </div>
      {loading ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-white/[0.03] animate-pulse rounded-xl border border-white/[0.04]" />)}</div> : (
        <div className="space-y-2">
          {filtered.map(d => (
            <GlassCard key={d.id} className="!p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-white/70 shrink-0">
                {(d.full_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{d.full_name ?? "Sem nome"}</p>
                <p className="text-[11px] text-white/30">
                  {d.vehicle_brand} {d.vehicle_model} • <span className="font-mono text-white/40">{d.vehicle_plate ?? "—"}</span> • {d.vehicle_type}
                </p>
                <p className="text-[11px] text-white/20">{d.phone ?? ""} • ⭐ {d.rating} • {d.total_rides} corridas</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {d.is_approved ? (
                  <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">APROVADO</span>
                ) : (
                  <>
                    <button onClick={() => handleApproval(d.id, true)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all">
                      Aprovar
                    </button>
                    <button onClick={() => handleApproval(d.id, false)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all">
                      Rejeitar
                    </button>
                  </>
                )}
              </div>
            </GlassCard>
          ))}
          {filtered.length === 0 && <p className="text-center text-white/20 text-sm py-12">Nenhum motorista encontrado</p>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COUPONS PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
function CouponsPanel() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("store_promotions").select("*, stores(name)").order("created_at", { ascending: false }).then(({ data }) => { setPromos(data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Cupons & Promoções</h2>
        <p className="text-white/30 text-sm">{promos.length} cadastrados</p>
      </div>
      {loading ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-white/[0.03] animate-pulse rounded-xl border border-white/[0.04]" />)}</div> : (
        <div className="space-y-2">
          {promos.map(p => (
            <GlassCard key={p.id} className="!p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Ticket size={16} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{p.title}</p>
                <p className="text-[11px] text-white/30">
                  {(p.stores as any)?.name ?? "—"} • {p.discount_type === "percentage" ? `${p.discount_value}%` : fmt(p.discount_value)} • <span className="font-mono text-white/40">{p.coupon_code ?? "—"}</span>
                </p>
              </div>
              <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", p.is_active ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/[0.04] text-white/30 border border-white/[0.06]")}>
                {p.is_active ? "ATIVO" : "INATIVO"}
              </span>
            </GlassCard>
          ))}
          {promos.length === 0 && <p className="text-center text-white/20 text-sm py-12">Nenhum cupom cadastrado</p>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FEATURED PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
function FeaturedPanel() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("stores").select("*").eq("is_active", true).then(({ data }) => { setStores(data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Empresas em Destaque</h2>
        <p className="text-white/30 text-sm">Lojas ativas são exibidas automaticamente na home</p>
      </div>
      {loading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white/[0.03] animate-pulse rounded-xl border border-white/[0.04]" />)}</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map(s => (
            <GlassCard key={s.id} glow className="flex items-center gap-4">
              {s.logo_url ? <img src={s.logo_url} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/[0.06]" /> : (
                <div className="w-14 h-14 rounded-xl bg-white/[0.06] flex items-center justify-center"><Store size={24} className="text-white/40" /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{s.name}</p>
                <p className="text-[11px] text-white/30">{s.category}</p>
                <p className="text-[11px] text-white/20">{s.address_neighborhood ?? ""} {s.address_city ? `• ${s.address_city}` : ""}</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">Destaque</span>
              </div>
            </GlassCard>
          ))}
          {stores.length === 0 && <p className="text-center text-white/20 text-sm py-12 col-span-2">Nenhum estabelecimento ativo</p>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SERVICES PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
function ServicesPanel() {
  const SERVICES = [
    { name: "ZuuFood", desc: "Delivery de comida e marketplace gastronômico", icon: ShoppingBag, status: "Ativo", gradient: "from-orange-500/20 to-red-500/10" },
    { name: "ZuuMob", desc: "Mobilidade urbana — corridas e transporte", icon: Car, status: "Ativo", gradient: "from-purple-500/20 to-blue-500/10" },
    { name: "ZuuPay", desc: "Carteira digital e pagamentos integrados", icon: DollarSign, status: "Em breve", gradient: "from-emerald-500/20 to-teal-500/10" },
    { name: "ZUZU", desc: "Assistente de IA para usuários e merchants", icon: Cpu, status: "Em breve", gradient: "from-blue-500/20 to-indigo-500/10" },
    { name: "ZuuPlace", desc: "Classificados e marketplace de serviços", icon: MapPin, status: "Ativo", gradient: "from-pink-500/20 to-rose-500/10" },
    { name: "ZuuAds", desc: "Plataforma de publicidade e mídia", icon: Megaphone, status: "Em breve", gradient: "from-amber-500/20 to-yellow-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">Ecossistema de Serviços</h2>
        <p className="text-white/30 text-sm">Todos os verticais da plataforma Zuuppi</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map((s, i) => (
          <motion.div key={s.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard glow className="relative overflow-hidden">
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", s.gradient)} />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/[0.06]">
                  <s.icon size={22} className="text-white/60" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{s.name}</p>
                  <p className="text-[11px] text-white/30">{s.desc}</p>
                </div>
                <span className={cn("text-[10px] font-bold px-3 py-1.5 rounded-full border",
                  s.status === "Ativo" ? "bg-primary/10 text-primary border-primary/20" : "bg-white/[0.04] text-white/30 border-white/[0.06]")}>
                  {s.status === "Ativo" ? "● ATIVO" : "◌ EM BREVE"}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

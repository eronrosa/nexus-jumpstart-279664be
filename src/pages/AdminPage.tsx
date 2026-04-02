import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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
  CheckCircle2, XCircle, Clock, Cpu, Navigation, ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

/* ═══════════════════════ ANIMATED COUNTER ═══════════════════════ */
function AnimatedCounter({ value, prefix = "", suffix = "", duration = 1500 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    prevValue.current = value;
  }, [value, duration]);

  return <>{prefix}{display.toLocaleString("pt-BR")}{suffix}</>;
}

/* ═══════════════════════ GAUGE ARC ═══════════════════════ */
function GaugeArc({ value, max, label, color = "hsl(122 39% 42%)" }: { value: number; max: number; label: string; color?: string }) {
  const pct = Math.min(value / max, 1);
  const radius = 40;
  const circ = Math.PI * radius;
  const offset = circ * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="58" viewBox="0 0 100 58">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="hsl(0 0% 90%)" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <span className="text-2xl font-extrabold text-foreground -mt-5">{value}</span>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

/* ═══════════════════════ PULSE DOT ═══════════════════════ */
function PulseDot({ color = "bg-primary" }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", color)} />
      <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", color)} />
    </span>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin block" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Shield size={56} className="text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Acesso Restrito</h1>
        <p className="text-muted-foreground text-sm">Você não tem permissão para acessar o Command Center.</p>
        <button onClick={() => navigate("/")} className="text-primary text-sm font-semibold hover:underline mt-2">Voltar ao início</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[hsl(0_0%_95%)]">
      {/* Sidebar — white with green accents */}
      <aside className={cn(
        "hidden md:flex flex-col min-h-screen shrink-0 transition-all duration-500 ease-out border-r bg-card border-border",
        sidebarCollapsed ? "w-[68px] px-2" : "w-[260px] px-4"
      )} style={{ paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
        <div className="px-2 mb-8 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                <Cpu size={18} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-[15px] font-extrabold text-foreground tracking-tight">ZUUPPI</h1>
                <p className="text-[9px] text-muted-foreground font-semibold tracking-[0.2em] uppercase">Command Center</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
              <Cpu size={18} className="text-primary-foreground" />
            </div>
          )}
        </div>

        {!sidebarCollapsed && <p className="px-3 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.15em] mb-3">Menu</p>}

        <nav className="flex flex-col gap-0.5 flex-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                tab === id
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                sidebarCollapsed && "justify-center px-2"
              )}>
              {tab === id && (
                <motion.div layoutId="admin-nav" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
              )}
              <Icon size={18} />
              {!sidebarCollapsed && label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-1 px-1">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            <ChevronRight size={16} className={cn("transition-transform duration-300", sidebarCollapsed && "rotate-180")} />
          </button>
          <button onClick={() => navigate("/")} className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-all w-full",
            sidebarCollapsed && "justify-center px-2"
          )}>
            <ArrowLeft size={18} />
            {!sidebarCollapsed && "Voltar ao App"}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-3 py-2.5 flex items-center gap-2 overflow-x-auto bg-card/95 backdrop-blur-xl border-b border-border">
        <button onClick={() => navigate("/")} className="shrink-0 text-muted-foreground"><ArrowLeft size={20} /></button>
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Cpu size={14} className="text-primary-foreground" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0 border",
                tab === id ? "bg-primary/10 text-primary border-primary/20 font-semibold" : "text-muted-foreground border-border"
              )}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 pt-14 md:pt-0">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
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
   CARD — clean white card
   ═══════════════════════════════════════════════════════════════════════════════ */
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DASHBOARD — Real-time Command Center
   ═══════════════════════════════════════════════════════════════════════════════ */
function DashboardPanel() {
  const [stats, setStats] = useState({ users: 0, stores: 0, orders: 0, rides: 0, revenue: 0, drivers: 0, activeRides: 0, onlineDrivers: 0, newStores: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveRevenue, setLiveRevenue] = useState(0);
  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Simulated live revenue tick
  useEffect(() => {
    if (stats.revenue === 0) return;
    setLiveRevenue(stats.revenue);
    const t = setInterval(() => {
      setLiveRevenue(prev => prev + Math.random() * 15 + 2);
    }, 3000);
    return () => clearInterval(t);
  }, [stats.revenue]);

  useEffect(() => {
    const load = async () => {
      const [profiles, stores, ordersRes, rides, drivers, activeRides, onlineDrivers, newStores] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total, created_at, status"),
        supabase.from("rides").select("id", { count: "exact", head: true }),
        supabase.from("drivers").select("id", { count: "exact", head: true }),
        supabase.from("rides").select("id", { count: "exact", head: true }).in("status", ["searching", "accepted", "in_progress"]),
        supabase.from("drivers").select("id", { count: "exact", head: true }).eq("status", "online"),
        supabase.from("stores").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
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
        activeRides: activeRides.count ?? 0,
        onlineDrivers: onlineDrivers.count ?? 0,
        newStores: newStores.count ?? 0,
      });
      setOrders(allOrders);
      setLoading(false);
    };
    load();
  }, []);

  const revenueChart = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
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

  const PIE_COLORS = [
    "hsl(122 39% 42%)", "hsl(217 91% 60%)", "hsl(38 92% 50%)",
    "hsl(0 84% 60%)", "hsl(262 83% 58%)"
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-card animate-pulse rounded-2xl border border-border" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Command Center</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Monitoramento da operação ZUUPPI em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-xl px-4 py-2">
            <PulseDot />
            <span className="text-[12px] text-primary font-bold">LIVE</span>
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-2">
            <span className="text-[12px] text-muted-foreground font-mono">
              {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {/* ── ROW 1: Live Revenue + Gauges ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Live Revenue Big Card */}
        <Card className="lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-10 translate-x-10" />
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-primary" />
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Valor Movimentado</span>
              <PulseDot />
            </div>
            <p className="text-4xl md:text-5xl font-extrabold text-foreground tabular-nums">
              {fmt(liveRevenue)}
            </p>
            <div className="flex items-center gap-2 text-primary text-sm font-bold">
              <TrendingUp size={16} />
              <span>Atualizando em tempo real</span>
            </div>
          </div>
        </Card>

        {/* Gauges */}
        <Card className="flex items-center justify-around">
          <GaugeArc value={stats.activeRides} max={Math.max(stats.activeRides, 50)} label="Corridas Ativas" />
        </Card>
        <Card className="flex items-center justify-around">
          <GaugeArc value={stats.onlineDrivers} max={Math.max(stats.onlineDrivers, 30)} label="Motoristas Online" color="hsl(217 91% 60%)" />
        </Card>
      </div>

      {/* ── ROW 2: KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pedidos Hoje", value: stats.orders, icon: ShoppingBag, trend: "+8.2%", color: "text-primary", bg: "bg-primary/8" },
          { label: "Total Usuários", value: stats.users, icon: Users, trend: "+23%", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Corridas Total", value: stats.rides, icon: Car, trend: "+15%", color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Novos Estabelec.", value: stats.newStores, icon: Store, trend: `+${stats.newStores}`, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", kpi.bg)}>
                  <kpi.icon size={18} className={kpi.color} />
                </div>
                <span className="flex items-center gap-0.5 text-primary text-[11px] font-bold">
                  <ArrowUpRight size={12} />{kpi.trend}
                </span>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground"><AnimatedCounter value={kpi.value} /></p>
                <p className="text-[11px] text-muted-foreground font-medium">{kpi.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── ROW 3: Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Area Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-foreground">Faturamento & Pedidos</h3>
              <p className="text-[11px] text-muted-foreground">Últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" />Receita</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Pedidos</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="gradRevG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(122 39% 42%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(122 39% 42%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPedG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(0 0% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(0 0% 60%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid hsl(0 0% 88%)", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="receita" stroke="hsl(122 39% 42%)" fill="url(#gradRevG)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="pedidos" stroke="hsl(217 91% 60%)" fill="url(#gradPedG)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Pie */}
        <Card>
          <h3 className="text-sm font-bold text-foreground mb-1">Status Pedidos</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Distribuição atual</p>
          {statusChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusChart} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                    {statusChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid hsl(0 0% 88%)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {statusChart.map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
          )}
        </Card>
      </div>

      {/* ── ROW 4: Real-time indicators ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Navigation size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-extrabold text-foreground"><AnimatedCounter value={stats.activeRides} /></p>
            <p className="text-[11px] text-muted-foreground font-medium">Corridas Ativas Agora</p>
          </div>
          <PulseDot />
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Bike size={22} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-extrabold text-foreground"><AnimatedCounter value={stats.onlineDrivers} /></p>
            <p className="text-[11px] text-muted-foreground font-medium">Motoboys na Rua</p>
          </div>
          <PulseDot color="bg-blue-500" />
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Store size={22} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-extrabold text-foreground"><AnimatedCounter value={stats.newStores} /></p>
            <p className="text-[11px] text-muted-foreground font-medium">Novos Estabelecimentos (30d)</p>
          </div>
          <span className="text-primary text-[11px] font-bold flex items-center gap-0.5"><ArrowUpRight size={12} />Crescendo</span>
        </Card>
      </div>

      {/* Quick Insights Bar */}
      <Card className="!p-3">
        <div className="flex items-center gap-3 overflow-x-auto">
          <Zap size={16} className="text-primary shrink-0" />
          <span className="text-[11px] text-muted-foreground font-medium shrink-0">Insights:</span>
          {[
            `${stats.drivers} motoristas na frota`,
            `${stats.stores} lojas no ecossistema`,
            `${stats.orders} pedidos processados`,
          ].map(q => (
            <span key={q} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
              <CheckCircle2 size={12} className="text-primary" />{q}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   REMAINING PANELS — clean white/green theme
   ═══════════════════════════════════════════════════════════════════════════════ */

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all" />
    </div>
  );
}

function UsersPanel() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { supabase.from("profiles").select("*").then(({ data }) => { setProfiles(data ?? []); setLoading(false); }); }, []);
  const filtered = profiles.filter(p => (p.display_name ?? "").toLowerCase().includes(search.toLowerCase()) || (p.phone ?? "").includes(search));

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-extrabold text-foreground">Usuários</h2><p className="text-muted-foreground text-sm">{profiles.length} cadastrados</p></div>
      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome ou telefone..." />
      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.015 }}>
              <Card className="!p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {(p.display_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{p.display_name ?? "Sem nome"}</p>
                  <p className="text-[11px] text-muted-foreground">{p.phone ?? "Sem telefone"}</p>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && <EmptyState text="Nenhum usuário encontrado" />}
        </div>
      )}
    </div>
  );
}

function StoresPanel() {
  const [stores, setStores] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadStores = async () => { const { data } = await supabase.from("stores").select("*"); setStores(data ?? []); setLoading(false); };
  useEffect(() => { loadStores(); }, []);
  const toggleActive = async (id: string, current: boolean) => { await supabase.from("stores").update({ is_active: !current }).eq("id", id); toast({ title: !current ? "Loja ativada ✅" : "Loja desativada" }); loadStores(); };
  const filtered = stores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-extrabold text-foreground">Estabelecimentos</h2><p className="text-muted-foreground text-sm">{stores.length} cadastrados</p></div>
      <SearchInput value={search} onChange={setSearch} placeholder="Buscar estabelecimento..." />
      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {filtered.map(s => (
            <Card key={s.id} className="!p-4 flex items-center gap-4">
              {s.logo_url ? <img src={s.logo_url} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border" /> : (
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center"><Store size={20} className="text-muted-foreground" /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">{s.category} • {s.address_city ?? "Sem cidade"}</p>
              </div>
              <button onClick={() => toggleActive(s.id, s.is_active)} className={cn("p-2 rounded-lg transition-all", s.is_active ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-secondary")}>
                {s.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => { setOrders(data ?? []); setLoading(false); }); }, []);

  const statusCfg: Record<string, { bg: string; text: string; icon: any }> = {
    pendente: { bg: "bg-amber-50", text: "text-amber-600", icon: Clock },
    preparando: { bg: "bg-blue-50", text: "text-blue-600", icon: Activity },
    pronto: { bg: "bg-primary/10", text: "text-primary", icon: CheckCircle2 },
    entregue: { bg: "bg-emerald-50", text: "text-emerald-600", icon: CheckCircle2 },
    cancelado: { bg: "bg-red-50", text: "text-red-600", icon: XCircle },
  };

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-extrabold text-foreground">Pedidos</h2><p className="text-muted-foreground text-sm">{orders.length} últimos</p></div>
      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {orders.map(o => {
            const c = statusCfg[o.status] ?? { bg: "bg-secondary", text: "text-muted-foreground", icon: Clock };
            return (
              <Card key={o.id} className="!p-4 flex items-center gap-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", c.bg)}><c.icon size={16} className={c.text} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{o.restaurant_name}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")} • {fmt(o.total)}</p>
                </div>
                <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", c.bg, c.text)}>{o.status?.toUpperCase()}</span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RidesPanel() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from("rides").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => { setRides(data ?? []); setLoading(false); }); }, []);

  const statusCfg: Record<string, { bg: string; text: string }> = {
    searching: { bg: "bg-amber-50", text: "text-amber-600" }, accepted: { bg: "bg-blue-50", text: "text-blue-600" },
    in_progress: { bg: "bg-primary/10", text: "text-primary" }, completed: { bg: "bg-emerald-50", text: "text-emerald-600" },
    cancelled: { bg: "bg-red-50", text: "text-red-600" },
  };

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-extrabold text-foreground">Corridas</h2><p className="text-muted-foreground text-sm">{rides.length} registradas</p></div>
      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {rides.map(r => {
            const c = statusCfg[r.status] ?? { bg: "bg-secondary", text: "text-muted-foreground" };
            return (
              <Card key={r.id} className="!p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center"><Car size={16} className="text-purple-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.origin_address ?? "Origem"} → {r.destination_address ?? "Destino"}</p>
                  <p className="text-[11px] text-muted-foreground">{r.ride_type} • {r.created_at ? new Date(r.created_at).toLocaleDateString("pt-BR") : ""} • {r.estimated_price ? fmt(r.estimated_price) : "—"}</p>
                </div>
                <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", c.bg, c.text)}>{r.status?.toUpperCase()}</span>
              </Card>
            );
          })}
          {rides.length === 0 && <EmptyState text="Nenhuma corrida registrada" />}
        </div>
      )}
    </div>
  );
}

function DriversPanel() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const { toast } = useToast();

  const loadDrivers = async () => { const { data } = await supabase.from("drivers").select("*"); setDrivers(data ?? []); setLoading(false); };
  useEffect(() => { loadDrivers(); }, []);

  const handleApproval = async (id: string, approve: boolean) => {
    const { error } = await supabase.rpc("admin_update_driver", { _driver_id: id, _is_approved: approve });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: approve ? "Motorista aprovado ✅" : "Motorista rejeitado" }); loadDrivers(); }
  };

  const filtered = drivers.filter(d => filter === "pending" ? !d.is_approved : filter === "approved" ? d.is_approved : true);
  const pills: { id: typeof filter; label: string }[] = [{ id: "all", label: "Todos" }, { id: "pending", label: "Pendentes" }, { id: "approved", label: "Aprovados" }];

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-extrabold text-foreground">Motoristas</h2><p className="text-muted-foreground text-sm">{drivers.length} na frota</p></div>
      <div className="flex gap-2">
        {pills.map(p => (
          <button key={p.id} onClick={() => setFilter(p.id)}
            className={cn("px-4 py-2 rounded-xl text-[12px] font-semibold border transition-all",
              filter === p.id ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground border-border hover:bg-secondary")}>
            {p.label}
          </button>
        ))}
      </div>
      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {filtered.map(d => (
            <Card key={d.id} className="!p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {(d.full_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{d.full_name ?? "Sem nome"}</p>
                <p className="text-[11px] text-muted-foreground">{d.vehicle_brand} {d.vehicle_model} • <span className="font-mono">{d.vehicle_plate ?? "—"}</span> • {d.vehicle_type}</p>
                <p className="text-[11px] text-muted-foreground">{d.phone ?? ""} • ⭐ {d.rating} • {d.total_rides} corridas</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {d.is_approved ? (
                  <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">APROVADO</span>
                ) : (
                  <>
                    <button onClick={() => handleApproval(d.id, true)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all">Aprovar</button>
                    <button onClick={() => handleApproval(d.id, false)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all">Rejeitar</button>
                  </>
                )}
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <EmptyState text="Nenhum motorista encontrado" />}
        </div>
      )}
    </div>
  );
}

function CouponsPanel() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from("store_promotions").select("*, stores(name)").order("created_at", { ascending: false }).then(({ data }) => { setPromos(data ?? []); setLoading(false); }); }, []);

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-extrabold text-foreground">Cupons & Promoções</h2><p className="text-muted-foreground text-sm">{promos.length} cadastrados</p></div>
      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {promos.map(p => (
            <Card key={p.id} className="!p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center"><Ticket size={16} className="text-amber-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{p.title}</p>
                <p className="text-[11px] text-muted-foreground">{(p.stores as any)?.name ?? "—"} • {p.discount_type === "percentage" ? `${p.discount_value}%` : fmt(p.discount_value)} • <span className="font-mono">{p.coupon_code ?? "—"}</span></p>
              </div>
              <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", p.is_active ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-border")}>{p.is_active ? "ATIVO" : "INATIVO"}</span>
            </Card>
          ))}
          {promos.length === 0 && <EmptyState text="Nenhum cupom cadastrado" />}
        </div>
      )}
    </div>
  );
}

function FeaturedPanel() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from("stores").select("*").eq("is_active", true).then(({ data }) => { setStores(data ?? []); setLoading(false); }); }, []);

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-extrabold text-foreground">Empresas em Destaque</h2><p className="text-muted-foreground text-sm">Lojas ativas exibidas na home</p></div>
      {loading ? <LoadingSkeleton count={4} grid /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map(s => (
            <Card key={s.id} className="flex items-center gap-4">
              {s.logo_url ? <img src={s.logo_url} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-border" /> : (
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center"><Store size={24} className="text-muted-foreground" /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">{s.category}</p>
                <p className="text-[11px] text-muted-foreground">{s.address_neighborhood ?? ""} {s.address_city ? `• ${s.address_city}` : ""}</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-bold text-amber-600">Destaque</span>
              </div>
            </Card>
          ))}
          {stores.length === 0 && <EmptyState text="Nenhum estabelecimento ativo" />}
        </div>
      )}
    </div>
  );
}

function ServicesPanel() {
  const SERVICES = [
    { name: "ZuuFood", desc: "Delivery de comida e marketplace", icon: ShoppingBag, status: "Ativo", color: "text-orange-600", bg: "bg-orange-50" },
    { name: "ZuuMob", desc: "Mobilidade urbana", icon: Car, status: "Ativo", color: "text-purple-600", bg: "bg-purple-50" },
    { name: "ZuuPay", desc: "Carteira digital e pagamentos", icon: DollarSign, status: "Em breve", color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "ZUZU", desc: "Assistente de IA", icon: Cpu, status: "Em breve", color: "text-blue-600", bg: "bg-blue-50" },
    { name: "ZuuPlace", desc: "Classificados e serviços", icon: MapPin, status: "Ativo", color: "text-pink-600", bg: "bg-pink-50" },
    { name: "ZuuAds", desc: "Publicidade e mídia", icon: Megaphone, status: "Em breve", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-extrabold text-foreground">Ecossistema de Serviços</h2><p className="text-muted-foreground text-sm">Todos os verticais Zuuppi</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map((s, i) => (
          <motion.div key={s.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                <s.icon size={22} className={s.color} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">{s.desc}</p>
              </div>
              <span className={cn("text-[10px] font-bold px-3 py-1.5 rounded-full border",
                s.status === "Ativo" ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-border")}>
                {s.status === "Ativo" ? "● ATIVO" : "◌ EM BREVE"}
              </span>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════ Utility components ═══════ */
function LoadingSkeleton({ count = 5, grid = false }: { count?: number; grid?: boolean }) {
  return (
    <div className={grid ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-2"}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 bg-card animate-pulse rounded-xl border border-border" />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-center text-muted-foreground text-sm py-12">{text}</p>;
}

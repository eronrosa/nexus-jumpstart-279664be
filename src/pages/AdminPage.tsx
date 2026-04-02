import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Store, ShoppingBag, Car, Ticket, Sparkles,
  Star, ArrowLeft, Search, ToggleLeft, ToggleRight, Shield, ChevronRight,
  DollarSign, Bike, MapPin, Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Tab = "dashboard" | "users" | "stores" | "orders" | "rides" | "coupons" | "featured" | "services";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Usuários", icon: Users },
  { id: "stores", label: "Estabelecimentos", icon: Store },
  { id: "orders", label: "Pedidos", icon: ShoppingBag },
  { id: "rides", label: "Corridas", icon: Car },
  { id: "coupons", label: "Cupons", icon: Ticket },
  { id: "featured", label: "Destaques", icon: Star },
  { id: "services", label: "Serviços", icon: Sparkles },
];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Shield size={48} className="text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Acesso negado</h1>
        <p className="text-muted-foreground text-sm">Você não tem permissão para acessar esta área.</p>
        <button onClick={() => navigate("/")} className="text-primary text-sm font-semibold hover:underline">Voltar ao início</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn("hidden md:flex flex-col min-h-screen bg-card border-r border-border py-6 shrink-0 transition-all duration-300", sidebarCollapsed ? "w-[60px] px-1" : "w-[240px] px-3")}>
        <div className="px-3 mb-6 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-lg font-extrabold text-primary tracking-tight">ZUUPPI Admin</h1>
              <p className="text-[10px] text-muted-foreground">Painel Geral</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-muted-foreground hover:text-foreground">
            <ChevronRight size={16} className={cn("transition-transform", sidebarCollapsed && "rotate-180")} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                tab === id ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-secondary hover:text-foreground",
                sidebarCollapsed && "justify-center px-2"
              )}>
              <Icon size={18} />
              {!sidebarCollapsed && label}
            </button>
          ))}
        </nav>
        <div className="mt-auto px-1">
          <button onClick={() => navigate("/")} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full", sidebarCollapsed && "justify-center px-2")}>
            <ArrowLeft size={18} />
            {!sidebarCollapsed && "Voltar"}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-50 px-4 py-3 flex items-center gap-3 overflow-x-auto">
        <button onClick={() => navigate("/")} className="shrink-0"><ArrowLeft size={20} /></button>
        <span className="font-bold text-primary shrink-0">Admin</span>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                tab === id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70"
              )}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {tab === "dashboard" && <DashboardPanel />}
          {tab === "users" && <UsersPanel />}
          {tab === "stores" && <StoresPanel />}
          {tab === "orders" && <OrdersPanel />}
          {tab === "rides" && <RidesPanel />}
          {tab === "coupons" && <CouponsPanel />}
          {tab === "featured" && <FeaturedPanel />}
          {tab === "services" && <ServicesPanel />}
        </div>
      </main>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPanel() {
  const [stats, setStats] = useState({ users: 0, stores: 0, orders: 0, rides: 0, revenue: 0, drivers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [profiles, stores, orders, rides, drivers] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total"),
        supabase.from("rides").select("id", { count: "exact", head: true }),
        supabase.from("drivers").select("id", { count: "exact", head: true }),
      ]);
      const revenue = (orders.data ?? []).reduce((s, o) => s + Number(o.total), 0);
      setStats({
        users: profiles.count ?? 0,
        stores: stores.count ?? 0,
        orders: orders.data?.length ?? 0,
        rides: rides.count ?? 0,
        revenue,
        drivers: drivers.count ?? 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { label: "Usuários", value: stats.users, icon: Users, color: "text-blue-500" },
    { label: "Estabelecimentos", value: stats.stores, icon: Store, color: "text-emerald-500" },
    { label: "Pedidos", value: stats.orders, icon: ShoppingBag, color: "text-orange-500" },
    { label: "Corridas", value: stats.rides, icon: Car, color: "text-purple-500" },
    { label: "Motoristas", value: stats.drivers, icon: Bike, color: "text-pink-500" },
    { label: "Faturamento", value: fmt(stats.revenue), icon: DollarSign, color: "text-primary", isString: true },
  ];

  if (loading) return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Dashboard Geral</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <c.icon size={18} className={c.color} />
              <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{c.isString ? c.value : c.value.toLocaleString("pt-BR")}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── USERS ────────────────────────────────────────────────────────────────────
function UsersPanel() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("*").then(({ data }) => { setProfiles(data ?? []); setLoading(false); });
  }, []);

  const filtered = profiles.filter(p => (p.display_name ?? "").toLowerCase().includes(search.toLowerCase()) || (p.phone ?? "").includes(search));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Usuários ({profiles.length})</h2>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..."
          className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>
      {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {(p.display_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{p.display_name ?? "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">{p.phone ?? "Sem telefone"}</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nenhum usuário encontrado</p>}
        </div>
      )}
    </div>
  );
}

// ─── STORES ───────────────────────────────────────────────────────────────────
function StoresPanel() {
  const [stores, setStores] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadStores = async () => {
    const { data } = await supabase.from("stores").select("*");
    setStores(data ?? []);
    setLoading(false);
  };
  useEffect(() => { loadStores(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("stores").update({ is_active: !current }).eq("id", id);
    toast({ title: !current ? "Loja ativada" : "Loja desativada" });
    loadStores();
  };

  const filtered = stores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Estabelecimentos ({stores.length})</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar estabelecimento..."
          className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>
      {loading ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              {s.logo_url ? <img src={s.logo_url} className="w-12 h-12 rounded-xl object-cover shrink-0" /> : (
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Store size={20} className="text-primary" /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.category} • {s.address_city ?? "Sem cidade"}</p>
              </div>
              <button onClick={() => toggleActive(s.id, s.is_active)}
                className={cn("p-2 rounded-lg transition-colors", s.is_active ? "text-emerald-500 hover:bg-emerald-500/10" : "text-destructive hover:bg-destructive/10")}>
                {s.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
function OrdersPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => { setOrders(data ?? []); setLoading(false); });
  }, []);

  const statusColor: Record<string, string> = {
    pendente: "bg-yellow-500/10 text-yellow-600", preparando: "bg-blue-500/10 text-blue-600",
    pronto: "bg-emerald-500/10 text-emerald-600", entregue: "bg-primary/10 text-primary",
    cancelado: "bg-destructive/10 text-destructive"
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Pedidos ({orders.length})</h2>
      {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {orders.map(o => (
            <div key={o.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <ShoppingBag size={18} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{o.restaurant_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")} • {fmt(o.total)}</p>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", statusColor[o.status] ?? "bg-muted text-muted-foreground")}>
                {o.status?.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RIDES ────────────────────────────────────────────────────────────────────
function RidesPanel() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("rides").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => { setRides(data ?? []); setLoading(false); });
  }, []);

  const statusColor: Record<string, string> = {
    searching: "bg-yellow-500/10 text-yellow-600", accepted: "bg-blue-500/10 text-blue-600",
    in_progress: "bg-emerald-500/10 text-emerald-600", completed: "bg-primary/10 text-primary",
    cancelled: "bg-destructive/10 text-destructive"
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Corridas ({rides.length})</h2>
      {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {rides.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <Car size={18} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{r.origin_address ?? "Origem"} → {r.destination_address ?? "Destino"}</p>
                <p className="text-xs text-muted-foreground">{r.ride_type} • {r.created_at ? new Date(r.created_at).toLocaleDateString("pt-BR") : ""} • {r.estimated_price ? fmt(r.estimated_price) : "—"}</p>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", statusColor[r.status] ?? "bg-muted text-muted-foreground")}>
                {r.status?.toUpperCase()}
              </span>
            </div>
          ))}
          {rides.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nenhuma corrida registrada</p>}
        </div>
      )}
    </div>
  );
}

// ─── COUPONS ──────────────────────────────────────────────────────────────────
function CouponsPanel() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("store_promotions").select("*, stores(name)").order("created_at", { ascending: false }).then(({ data }) => { setPromos(data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Cupons e Promoções ({promos.length})</h2>
      {loading ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {promos.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <Ticket size={18} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {(p.stores as any)?.name ?? "—"} • {p.discount_type === "percentage" ? `${p.discount_value}%` : fmt(p.discount_value)} • Código: {p.coupon_code ?? "—"}
                </p>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", p.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
                {p.is_active ? "ATIVO" : "INATIVO"}
              </span>
            </div>
          ))}
          {promos.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nenhum cupom cadastrado</p>}
        </div>
      )}
    </div>
  );
}

// ─── FEATURED (Empresas em Destaque) ──────────────────────────────────────────
function FeaturedPanel() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("stores").select("*").eq("is_active", true).then(({ data }) => { setStores(data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Empresas em Destaque</h2>
      </div>
      <p className="text-sm text-muted-foreground">Gerencie quais estabelecimentos aparecem em destaque na home. Lojas ativas são exibidas automaticamente.</p>
      {loading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
              {s.logo_url ? <img src={s.logo_url} className="w-14 h-14 rounded-xl object-cover shrink-0" /> : (
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center"><Store size={24} className="text-primary" /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.category}</p>
                <p className="text-xs text-muted-foreground">{s.address_neighborhood ?? ""} {s.address_city ? `• ${s.address_city}` : ""}</p>
              </div>
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold text-foreground">Destaque</span>
              </div>
            </div>
          ))}
          {stores.length === 0 && <p className="text-center text-sm text-muted-foreground py-8 col-span-2">Nenhum estabelecimento ativo</p>}
        </div>
      )}
    </div>
  );
}

// ─── SERVICES ─────────────────────────────────────────────────────────────────
function ServicesPanel() {
  const SERVICES = [
    { name: "ZuuFood", desc: "Delivery de comida", icon: ShoppingBag, status: "Ativo", color: "text-orange-500" },
    { name: "ZuuMob", desc: "Mobilidade urbana", icon: Car, status: "Ativo", color: "text-purple-500" },
    { name: "ZuuPay", desc: "Carteira digital", icon: DollarSign, status: "Em breve", color: "text-emerald-500" },
    { name: "ZUZU", desc: "Assistente IA", icon: Sparkles, status: "Em breve", color: "text-blue-500" },
    { name: "ZuuPlace", desc: "Classificados", icon: MapPin, status: "Ativo", color: "text-pink-500" },
    { name: "ZuuAds", desc: "Publicidade", icon: Megaphone, status: "Em breve", color: "text-amber-500" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Serviços da Plataforma</h2>
      <p className="text-sm text-muted-foreground">Visão geral de todos os serviços do ecossistema Zuuppi</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map(s => (
          <motion.div key={s.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <s.icon size={22} className={s.color} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full",
              s.status === "Ativo" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
              {s.status.toUpperCase()}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

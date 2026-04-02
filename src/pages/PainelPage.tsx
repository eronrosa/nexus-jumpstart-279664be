import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Store, Package, Clock, CheckCircle, ChefHat, XCircle,
  ChevronDown, ChevronUp, ArrowLeft, Plus, Pencil, Trash2, Save, X,
  UtensilsCrossed, ImagePlus, ToggleLeft, ToggleRight,
  LayoutDashboard, History, Bell,
  Menu as MenuIcon, Activity, Zap, Search,
  Star, TrendingUp, CreditCard,
  DollarSign, CircleDot,
  Gift, MapPinned, UserCircle, Award, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardTab from "@/components/DashboardTab";
import PromocoesTab from "@/components/PromocoesTab";
import AvaliacoesTab from "@/components/painel/AvaliacoesTab";
import FinanceiroTab from "@/components/painel/FinanceiroTab";
import PagamentoTab from "@/components/painel/PagamentoTab";
import ServicosTab from "@/components/painel/ServicosTab";
import PerfilTab from "@/components/painel/PerfilTab";
import RecomendacoesTab from "@/components/painel/RecomendacoesTab";

/* ─── Types ─── */
interface OrderItem {
  id: string; item_name: string; item_price: number; quantity: number; item_image: string | null;
}
interface Order {
  id: string; restaurant_name: string; status: string; total: number; delivery_fee: number;
  created_at: string; user_id: string; restaurant_id: string; order_items: OrderItem[];
}
interface StoreHours { day: string; open: string; close: string; closed: boolean; }
interface StoreData {
  id: string; owner_id: string; name: string; category: string;
  logo_url: string | null; cover_url: string | null; description: string | null; is_active: boolean;
  address_street: string | null; address_number: string | null; address_neighborhood: string | null;
  address_city: string | null; address_state: string | null; address_zip: string | null;
  opening_hours: StoreHours[] | null;
}
const DEFAULT_HOURS: StoreHours[] = [
  { day: "Segunda", open: "08:00", close: "18:00", closed: false },
  { day: "Terça", open: "08:00", close: "18:00", closed: false },
  { day: "Quarta", open: "08:00", close: "18:00", closed: false },
  { day: "Quinta", open: "08:00", close: "18:00", closed: false },
  { day: "Sexta", open: "08:00", close: "18:00", closed: false },
  { day: "Sábado", open: "09:00", close: "14:00", closed: false },
  { day: "Domingo", open: "00:00", close: "00:00", closed: true },
];
interface MenuItem {
  id: string; store_id: string; name: string; category: string; price: number;
  description: string | null; image_url: string | null; is_available: boolean; sort_order: number;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
const STATUS_FLOW = ["pendente", "em_preparo", "entregue", "cancelado"];
const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pendente: { label: "Pendente", icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20" },
  em_preparo: { label: "Em Preparo", icon: ChefHat, color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/20" },
  entregue: { label: "Entregue", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
};
const MENU_CATEGORIES = ["Entradas", "Pratos", "Lanches", "Bebidas", "Sobremesas", "Combos", "Outro"];

/* ─── Sidebar Section Title ─── */
function SidebarSection({ title }: { title: string }) {
  return <p className="text-[10px] font-extrabold text-muted-foreground/70 uppercase tracking-[0.15em] px-3 pt-5 pb-1.5">{title}</p>;
}

/* ─── Sidebar Nav Item ─── */
function NavItem({ icon: Icon, label, active, badge, badgeText, onClick, collapsed }: {
  icon: React.ElementType; label: string; active: boolean; badge?: number; badgeText?: string; onClick: () => void; collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <button onClick={onClick} title={label}
        className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all relative ${
          active ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}>
        <Icon size={18} />
        {badge != null && badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">{badge}</span>
        )}
      </button>
    );
  }
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
        active
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
      }`}>
      <Icon size={16} className={active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"} />
      <span className="flex-1 text-left">{label}</span>
      {badgeText && (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
        }`}>{badgeText}</span>
      )}
      {badge != null && badge > 0 && (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive text-destructive-foreground"
        }`}>{badge}</span>
      )}
    </button>
  );
}

/* ─── Store Setup Form ─── */
function StoreSetupForm({ onCreated }: { onCreated: (s: StoreData) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Restaurante");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const categories = ["Restaurante", "Hamburgueria", "Pizzaria", "Japonês", "Lanchonete", "Farmácia", "Floricultura", "Mercado", "Outro"];

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("stores")
      .insert({ owner_id: user.id, name: name.trim(), category, description: description.trim() || null })
      .select().single();
    setSaving(false);
    if (error) { toast.error("Erro ao criar loja"); return; }
    toast.success("Loja criada com sucesso!");
    onCreated(data as unknown as StoreData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/10">
            <Store size={36} className="text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Crie sua loja</h2>
          <p className="text-muted-foreground mt-2">Configure seu estabelecimento e comece a vender</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-xl shadow-black/5">
          <div>
            <label className="text-sm font-semibold text-foreground">Nome do estabelecimento</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Restaurante Mitsuba"
              className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Categoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Descrição (opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Breve descrição..."
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none" />
          </div>
          <button onClick={handleCreate} disabled={!name.trim() || saving}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 text-sm">
            {saving ? "Criando..." : "Criar Estabelecimento"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Order Card ─── */
function OrderCard({ order, onStatusChange }: { order: Order; onStatusChange: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[order.status] ?? statusConfig.pendente;
  const Icon = cfg.icon;
  const next = (() => { const idx = STATUS_FLOW.indexOf(order.status); return idx < 2 ? STATUS_FLOW[idx + 1] : null; })();
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) + " • " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all duration-300">
      <button className="w-full text-left px-5 py-4 flex items-start justify-between gap-4" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border`}>
            <Icon size={18} className={cfg.color} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm">Pedido #{order.id.slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          <span className="text-sm font-bold text-foreground">{fmt(order.total)}</span>
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-border px-5 py-4 space-y-3">
            {order.order_items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                {item.item_image && <img src={item.item_image} alt={item.item_name} className="w-11 h-11 rounded-xl object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{item.item_name}</p>
                  <p className="text-xs text-muted-foreground">{fmt(item.item_price)} × {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{fmt(item.item_price * item.quantity)}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-border space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entrega</span>
                <span className="text-foreground">{order.delivery_fee === 0 ? "Grátis" : fmt(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span className="text-primary">{fmt(order.total)}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {next && (
                <button onClick={() => onStatusChange(order.id, next)}
                  className="flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2">
                  <Zap size={14} /> Marcar como {statusConfig[next].label}
                </button>
              )}
              {order.status !== "cancelado" && order.status !== "entregue" && (
                <button onClick={() => onStatusChange(order.id, "cancelado")}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all">
                  Cancelar
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Menu Item Form ─── */
function MenuItemForm({ storeId, item, onSaved, onCancel }: {
  storeId: string; item?: MenuItem | null; onSaved: (item: MenuItem) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState(item?.category ?? "Pratos");
  const [price, setPrice] = useState(item?.price?.toString() ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx 5MB)"); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${storeId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar imagem"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("menu-images").getPublicUrl(path);
    setImageUrl(publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !price) return;
    const priceNum = parseFloat(price.replace(",", "."));
    if (isNaN(priceNum) || priceNum <= 0) { toast.error("Preço inválido"); return; }
    setSaving(true);
    const payload = { name: name.trim(), category, price: priceNum, description: description.trim() || null, image_url: imageUrl || null };
    if (item) {
      const { data, error } = await supabase.from("menu_items").update(payload).eq("id", item.id).select().single();
      setSaving(false);
      if (error) { toast.error("Erro ao atualizar item"); return; }
      toast.success("Item atualizado!");
      onSaved(data as MenuItem);
    } else {
      const { data, error } = await supabase.from("menu_items").insert({ store_id: storeId, ...payload }).select().single();
      setSaving(false);
      if (error) { toast.error("Erro ao adicionar item"); return; }
      toast.success("Item adicionado ao cardápio!");
      onSaved(data as MenuItem);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-lg shadow-black/5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground text-lg">{item ? "Editar Item" : "Novo Item"}</h3>
        <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
      </div>
      <div className="flex items-center gap-4">
        <div onClick={() => fileRef.current?.click()}
          className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all overflow-hidden shrink-0">
          {uploading ? <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            : imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            : <ImagePlus size={28} className="text-muted-foreground/40" />}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <div>
          <p className="text-sm font-medium text-foreground">Foto do produto</p>
          <p className="text-xs text-muted-foreground mt-0.5">JPG ou PNG, máximo 5MB</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-foreground">Nome do item *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: X-Burger Especial"
            className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Preço (R$) *</label>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="29.90" type="text" inputMode="decimal"
            className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
            {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-foreground">Descrição (opcional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Ingredientes, detalhes..."
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none" />
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 border border-border text-foreground font-semibold py-3 rounded-xl text-sm hover:bg-secondary transition-all">Cancelar</button>
        <button onClick={handleSave} disabled={!name.trim() || !price || saving}
          className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md shadow-primary/20 flex items-center justify-center gap-2">
          <Save size={14} /> {saving ? "Salvando..." : item ? "Atualizar" : "Adicionar"}
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Cardápio Tab ─── */
function CardapioTab({ storeId }: { storeId: string }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [filterCategory, setFilterCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("menu_items").select("*").eq("store_id", storeId)
        .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
      if (data) setMenuItems(data as MenuItem[]);
      setLoading(false);
    };
    load();
  }, [storeId]);

  const handleSaved = (item: MenuItem) => {
    setMenuItems(prev => { const idx = prev.findIndex(i => i.id === item.id); if (idx >= 0) { const arr = [...prev]; arr[idx] = item; return arr; } return [...prev, item]; });
    setShowForm(false); setEditingItem(null);
  };
  const handleToggleAvailable = async (item: MenuItem) => {
    const { error } = await supabase.from("menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
  };
  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Remover "${item.name}" do cardápio?`)) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (error) { toast.error("Erro ao remover"); return; }
    setMenuItems(prev => prev.filter(i => i.id !== item.id));
    toast.success("Item removido");
  };

  const categories = ["Todos", ...new Set(menuItems.map(i => i.category))];
  let filtered = filterCategory === "Todos" ? menuItems : menuItems.filter(i => i.category === filterCategory);
  if (searchQuery) filtered = filtered.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const grouped = filtered.reduce((acc, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc; }, {} as Record<string, MenuItem[]>);

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl h-20 animate-pulse border border-border" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground text-xl">Cardápio</h3>
          <p className="text-sm text-muted-foreground">{menuItems.length} {menuItems.length === 1 ? "item" : "itens"} cadastrados</p>
        </div>
        {!showForm && !editingItem && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
            <Plus size={16} /> Novo item
          </button>
        )}
      </div>
      {(showForm || editingItem) && (
        <MenuItemForm storeId={storeId} item={editingItem} onSaved={handleSaved} onCancel={() => { setShowForm(false); setEditingItem(null); }} />
      )}
      {menuItems.length > 0 && !showForm && !editingItem && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar item..."
              className="w-full h-10 rounded-xl border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(c => (
              <button key={c} onClick={() => setFilterCategory(c)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterCategory === c ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      {!showForm && !editingItem && (
        menuItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed size={32} className="text-muted-foreground/40" />
            </div>
            <p className="font-bold text-foreground text-lg">Cardápio vazio</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione itens para seus clientes verem</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{cat}</p>
              <div className="space-y-2">
                {items.map(item => (
                  <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:shadow-md hover:shadow-black/5 transition-all duration-200 ${!item.is_available ? "opacity-40" : ""}`}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                        <UtensilsCrossed size={22} className="text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.name}</p>
                      {item.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>}
                      <p className="text-sm font-bold text-primary mt-1">{fmt(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleToggleAvailable(item)} title={item.is_available ? "Desativar" : "Ativar"}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        {item.is_available ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
                      </button>
                      <button onClick={() => setEditingItem(item)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )
      )}
    </div>
  );
}

/* ─── Delivery Zones Tab ─── */
interface DeliveryZone {
  id: string; store_id: string; zone_name: string; radius_km: number;
  delivery_fee: number; min_order: number; estimated_time: string; is_active: boolean;
}

function DeliveryZonesTab({ storeId }: { storeId: string }) {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  // Form state
  const [zoneName, setZoneName] = useState("");
  const [radiusKm, setRadiusKm] = useState("5");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [minOrder, setMinOrder] = useState("0");
  const [estimatedTime, setEstimatedTime] = useState("60 min");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("delivery_zones").select("*").eq("store_id", storeId).order("radius_km", { ascending: true });
      if (data) setZones(data as DeliveryZone[]);
      setLoading(false);
    };
    load();
  }, [storeId]);

  const resetForm = () => {
    setZoneName(""); setRadiusKm("5"); setDeliveryFee("0"); setMinOrder("0"); setEstimatedTime("60 min");
    setShowForm(false); setEditingZone(null);
  };

  const startEdit = (z: DeliveryZone) => {
    setZoneName(z.zone_name); setRadiusKm(z.radius_km.toString()); setDeliveryFee(z.delivery_fee.toString());
    setMinOrder(z.min_order.toString()); setEstimatedTime(z.estimated_time);
    setEditingZone(z); setShowForm(true);
  };

  const handleSave = async () => {
    if (!zoneName.trim()) return;
    setSaving(true);
    const payload = {
      zone_name: zoneName.trim(),
      radius_km: parseFloat(radiusKm) || 5,
      delivery_fee: parseFloat(deliveryFee) || 0,
      min_order: parseFloat(minOrder) || 0,
      estimated_time: estimatedTime.trim() || "60 min",
    };
    if (editingZone) {
      const { data, error } = await supabase.from("delivery_zones").update(payload).eq("id", editingZone.id).select().single();
      if (error) { toast.error("Erro ao atualizar zona"); setSaving(false); return; }
      setZones(prev => prev.map(z => z.id === editingZone.id ? data as DeliveryZone : z));
      toast.success("Zona atualizada!");
    } else {
      const { data, error } = await supabase.from("delivery_zones").insert({ store_id: storeId, ...payload }).select().single();
      if (error) { toast.error("Erro ao criar zona"); setSaving(false); return; }
      setZones(prev => [...prev, data as DeliveryZone]);
      toast.success("Zona de entrega criada!");
    }
    setSaving(false);
    resetForm();
  };

  const handleToggle = async (z: DeliveryZone) => {
    const { error } = await supabase.from("delivery_zones").update({ is_active: !z.is_active }).eq("id", z.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    setZones(prev => prev.map(x => x.id === z.id ? { ...x, is_active: !x.is_active } : x));
  };

  const handleDelete = async (z: DeliveryZone) => {
    if (!confirm(`Remover a zona "${z.zone_name}"?`)) return;
    const { error } = await supabase.from("delivery_zones").delete().eq("id", z.id);
    if (error) { toast.error("Erro ao remover"); return; }
    setZones(prev => prev.filter(x => x.id !== z.id));
    toast.success("Zona removida");
  };

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl h-20 animate-pulse border border-border" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground text-xl">Áreas de Entrega</h3>
          <p className="text-sm text-muted-foreground">Configure as zonas de entrega, taxas e tempos estimados</p>
        </div>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
            <Plus size={16} /> Nova zona
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-lg shadow-black/5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-lg">{editingZone ? "Editar Zona" : "Nova Zona de Entrega"}</h3>
            <button onClick={resetForm} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground">Nome da zona *</label>
              <input value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="Ex: Centro, Zona Sul, Até 3km"
                className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Raio (km)</label>
              <input value={radiusKm} onChange={e => setRadiusKm(e.target.value)} placeholder="5" type="text" inputMode="decimal"
                className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Taxa de entrega (R$)</label>
              <input value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} placeholder="5.00" type="text" inputMode="decimal"
                className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Pedido mínimo (R$)</label>
              <input value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="15.00" type="text" inputMode="decimal"
                className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Tempo estimado</label>
              <input value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} placeholder="30-45 min"
                className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={resetForm} className="flex-1 border border-border text-foreground font-semibold py-3 rounded-xl text-sm hover:bg-secondary transition-all">Cancelar</button>
            <button onClick={handleSave} disabled={!zoneName.trim() || saving}
              className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md shadow-primary/20 flex items-center justify-center gap-2">
              <Save size={14} /> {saving ? "Salvando..." : editingZone ? "Atualizar" : "Criar zona"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Zone list */}
      {zones.length === 0 && !showForm ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <MapPinned size={32} className="text-muted-foreground/40" />
          </div>
          <p className="font-bold text-foreground text-lg">Nenhuma zona configurada</p>
          <p className="text-sm text-muted-foreground mt-1">Adicione zonas para definir taxas e tempos de entrega por região</p>
        </div>
      ) : (
        <div className="space-y-2">
          {zones.map(z => (
            <motion.div key={z.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-md hover:shadow-black/5 transition-all duration-200 ${!z.is_active ? "opacity-40" : ""}`}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPinned size={20} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{z.zone_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Raio: {z.radius_km} km • Tempo: {z.estimated_time}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{fmt(z.delivery_fee)}</p>
                  <p className="text-[10px] text-muted-foreground">taxa de entrega</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{fmt(z.min_order)}</p>
                  <p className="text-[10px] text-muted-foreground">pedido mínimo</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleToggle(z)} title={z.is_active ? "Desativar" : "Ativar"}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors">
                    {z.is_active ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
                  </button>
                  <button onClick={() => startEdit(z)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(z)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Placeholder Tab (for features not yet built) ─── */
function PlaceholderTab({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <Icon size={32} className="text-muted-foreground/40" />
      </div>
      <p className="font-bold text-foreground text-lg">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>
      <span className="inline-block mt-4 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">Em breve</span>
    </div>
  );
}

/* ═══════════════════ Main Page ═══════════════════ */
const PainelPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [store, setStore] = useState<StoreData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inicio");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuItemsCount, setMenuItemsCount] = useState(0);

  const [editingStore, setEditingStore] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [editStreet, setEditStreet] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editNeighborhood, setEditNeighborhood] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editZip, setEditZip] = useState("");
  const [editHours, setEditHours] = useState<StoreHours[]>(DEFAULT_HOURS);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    const loadStore = async () => {
      const { data } = await supabase.from("stores").select("*").eq("owner_id", user.id).limit(1).single();
      if (data) setStore(data as unknown as StoreData);
      setStoreLoading(false);
    };
    loadStore();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!store) return;
    const loadOrders = async () => {
      const { data } = await supabase.from("orders").select("*, order_items(*)").eq("restaurant_id", store.id).order("created_at", { ascending: false });
      if (data) setOrders(data as Order[]);
      setLoading(false);
    };
    const loadMenuCount = async () => {
      const { count } = await supabase.from("menu_items").select("*", { count: "exact", head: true }).eq("store_id", store.id);
      if (count != null) setMenuItemsCount(count);
    };
    loadOrders();
    loadMenuCount();
    const channel = supabase
      .channel('merchant-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${store.id}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", payload.new.id).single();
            if (data) { setOrders(prev => [data as Order, ...prev]); toast.info("🔔 Novo pedido recebido!"); }
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [store]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    toast.success(`Status atualizado: ${statusConfig[newStatus]?.label ?? newStatus}`);
  };

  const handleSaveStore = async () => {
    if (!store) return;
    const payload = {
      name: editName.trim(), category: editCategory, description: editDescription.trim() || null,
      address_street: editStreet.trim() || null, address_number: editNumber.trim() || null,
      address_neighborhood: editNeighborhood.trim() || null, address_city: editCity.trim() || null,
      address_state: editState.trim() || null, address_zip: editZip.trim() || null,
      opening_hours: JSON.parse(JSON.stringify(editHours)),
    };
    const { error } = await supabase.from("stores").update(payload as any).eq("id", store.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    setStore({ ...store, ...payload, opening_hours: editHours });
    setEditingStore(false);
    toast.success("Dados atualizados!");
  };

  const startEditing = () => {
    if (!store) return;
    setEditName(store.name); setEditCategory(store.category); setEditDescription(store.description ?? "");
    setEditStreet(store.address_street ?? ""); setEditNumber(store.address_number ?? "");
    setEditNeighborhood(store.address_neighborhood ?? ""); setEditCity(store.address_city ?? "");
    setEditState(store.address_state ?? ""); setEditZip(store.address_zip ?? "");
    setEditHours((store.opening_hours as StoreHours[] | null) ?? DEFAULT_HOURS);
    setEditingStore(true);
  };

  const handleImageUpload = async (file: File, type: "logo" | "cover") => {
    if (!store) return;
    const setter = type === "logo" ? setUploadingLogo : setUploadingCover;
    setter(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${store.id}/${type}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Erro ao enviar imagem"); setter(false); return; }
    const { data: urlData } = supabase.storage.from("menu-images").getPublicUrl(path);
    const url = urlData.publicUrl;
    const updateCol = type === "logo" ? { logo_url: url } : { cover_url: url };
    const { error: dbErr } = await supabase.from("stores").update(updateCol).eq("id", store.id);
    if (dbErr) { toast.error("Erro ao salvar URL"); setter(false); return; }
    setStore({ ...store, ...updateCol });
    setter(false);
    toast.success(`${type === "logo" ? "Logo" : "Capa"} atualizada!`);
  };

  const handleToggleActive = async () => {
    if (!store) return;
    const { error } = await supabase.from("stores").update({ is_active: !store.is_active }).eq("id", store.id);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    setStore({ ...store, is_active: !store.is_active });
    toast.success(store.is_active ? "Loja fechada" : "Loja aberta!");
  };

  if (authLoading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return <StoreSetupForm onCreated={s => setStore(s)} />;
  }

  const pendingOrders = orders.filter(o => o.status === "pendente");
  const preparingOrders = orders.filter(o => o.status === "em_preparo");
  const completedOrders = orders.filter(o => o.status === "entregue" || o.status === "cancelado");
  const deliveredOrders = orders.filter(o => o.status === "entregue");
  const _todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = deliveredOrders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).reduce((s, o) => s + Number(o.total), 0);
  const weekOrders = orders.filter(o => { const d = new Date(o.created_at); const now = new Date(); const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24); return diff <= 7; });
  const weekRevenue = weekOrders.filter(o => o.status === "entregue").reduce((s, o) => s + Number(o.total), 0);
  const lastWeekOrders = orders.filter(o => { const d = new Date(o.created_at); const now = new Date(); const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24); return diff > 7 && diff <= 14; });
  const lastWeekRevenue = lastWeekOrders.filter(o => o.status === "entregue").reduce((s, o) => s + Number(o.total), 0);

  const _storeAddress = [store.address_street, store.address_number].filter(Boolean).join(", ") +
    (store.address_neighborhood ? `, ${store.address_neighborhood}` : "") +
    (store.address_city ? `, ${store.address_city}` : "") +
    (store.address_state ? `, ${store.address_state}` : "");

  /* ─── Nav sections modeled after iFood ─── */
  const navSections = [
    {
      title: null,
      items: [{ id: "inicio", icon: LayoutDashboard, label: "Início" }],
    },
    {
      title: null,
      items: [
        { id: "avaliações", icon: Star, label: "Avaliações" },
        { id: "pedidos", icon: Package, label: "Pedidos", badge: pendingOrders.length + preparingOrders.length },
        { id: "financeiro", icon: DollarSign, label: "Financeiro" },
      ],
    },
    {
      title: null,
      items: [
        { id: "cardapio", icon: UtensilsCrossed, label: "Cardápio" },
        { id: "horario", icon: Clock, label: "Horários" },
        { id: "areas_entrega", icon: MapPinned, label: "Áreas de entrega" },
        { id: "pagamento", icon: CreditCard, label: "Formas de pagamento" },
        { id: "promocoes", icon: Gift, label: "Promoções" },
      ],
    },
    {
      title: null,
      items: [
        { id: "servicos", icon: Sparkles, label: "Serviços", badgeText: "NOVO!" },
        { id: "perfil", icon: UserCircle, label: "Perfil" },
        { id: "performance", icon: TrendingUp, label: "Desempenho" },
        { id: "recomendacoes", icon: Award, label: "Recomendações" },
        { id: "descricao", icon: Pencil, label: "Descrição e logo" },
      ],
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "inicio":
        const todayDelivered = deliveredOrders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
        const todayTicket = todayDelivered.length > 0 ? todayRevenue / todayDelivered.length : 0;
        const monthOrders = orders.filter(o => { const d = new Date(o.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
        const monthDelivered = monthOrders.filter(o => o.status === "entregue");
        const monthRevenue = monthDelivered.reduce((s, o) => s + Number(o.total), 0);
        const monthTicket = monthDelivered.length > 0 ? monthRevenue / monthDelivered.length : 0;
        const monthName = new Date().toLocaleDateString("pt-BR", { month: "long" });

        return (
          <div className="space-y-6">
            {/* Status banner */}
            <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full shrink-0 ${store.is_active ? "bg-emerald-500" : "bg-destructive"}`} />
              <div>
                <p className={`text-sm font-bold ${store.is_active ? "text-emerald-600" : "text-destructive"}`}>
                  {store.is_active ? "Restaurante aberto" : "Restaurante fechado"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {store.is_active ? "Dentro do horário programado" : "Fora do horário programado"}
                </p>
              </div>
            </div>

            {/* Recommendation banner */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Zap size={20} className="text-primary" />
                  Abra nos horários que os clientes mais procuram você
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Estabelecimentos com seu tipo de cozinha vendem bastante nestes horários.
                </p>
              </div>
              <button onClick={() => setActiveTab("horario")}
                className="bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 whitespace-nowrap">
                Ver recomendação
              </button>
            </div>

            {/* Acompanhamento tempo real (iFood clone) */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-lg font-bold text-foreground">Acompanhamento</h3>
                <span className="text-sm text-muted-foreground">tempo real</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-0 divide-x divide-border">
                {/* Today stats - highlighted */}
                <div className="pr-4 border-b-4 border-primary pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Pedidos de hoje</p>
                  <p className="text-2xl font-bold text-foreground">{todayDelivered.length} <span className="text-sm font-normal text-muted-foreground">pedidos</span></p>
                  <p className="text-xs text-muted-foreground mt-1">{fmt(todayRevenue)}</p>
                </div>
                <div className="px-4 border-b-4 border-primary pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Ticket médio de hoje</p>
                  <p className="text-2xl font-bold text-foreground">{fmt(todayTicket)}</p>
                </div>
                {/* Month stats */}
                <div className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Pedidos de {monthName}</p>
                  <p className="text-sm font-semibold text-foreground">{monthDelivered.length} pedidos</p>
                  <p className="text-xs text-muted-foreground mt-1">{fmt(monthRevenue)}</p>
                </div>
                <div className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Ticket médio de {monthName}</p>
                  <p className="text-sm font-semibold text-foreground">{fmt(monthTicket)}</p>
                </div>
                <div className="pl-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Avaliação no App</p>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <Star size={14} className="text-amber-500 fill-amber-500" /> 4,9
                  </p>
                </div>
              </div>
            </div>

            {/* Quick info cards row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Configurações de entrega</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo de retirada</p>
                    <p className="text-lg font-bold text-foreground">0 minuto</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo de entrega</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-foreground">60 minutos</p>
                      <button onClick={() => setActiveTab("areas_entrega")} className="text-xs text-primary font-bold hover:underline">Alterar</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Informes</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Dicas de Promoções</p>
                      <button onClick={() => setActiveTab("promocoes")} className="text-xs text-primary font-bold hover:underline">Ler mais</button>
                    </div>
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded">NOVO</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Atendimento Financeiro</p>
                      <button onClick={() => setActiveTab("financeiro")} className="text-xs text-primary font-bold hover:underline">Ler mais</button>
                    </div>
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded">NOVO</span>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Últimas faturas</p>
                {deliveredOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma fatura disponível</p>
                ) : (
                  <div className="space-y-2">
                    {deliveredOrders.slice(0, 3).map(o => (
                      <div key={o.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</span>
                        <span className="font-bold text-foreground">{fmt(o.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Conquistas / Super Restaurantes */}
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <Award size={32} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">Conquistas ZuuFood</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Complete medalhas, ganhe pontos e troque por prêmios</p>
              </div>
              <button className="border border-primary text-primary font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/5 transition-all whitespace-nowrap">
                Conhecer
              </button>
            </div>

            {/* Results section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Resultados</h3>
                <button onClick={() => setActiveTab("performance")} className="text-sm text-primary font-bold hover:underline">Ver mais</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <p className="text-sm font-semibold text-foreground mb-3">Pedidos</p>
                  <div className="flex items-end gap-8">
                    <div>
                      <p className="text-3xl font-bold text-primary">{weekOrders.length}</p>
                      <p className="text-xs text-muted-foreground">Esta semana</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-muted-foreground">{lastWeekOrders.length}</p>
                      <p className="text-xs text-muted-foreground">Semana passada</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <p className="text-sm font-semibold text-foreground mb-3">Faturamento</p>
                  <div className="flex items-end gap-8">
                    <div>
                      <p className="text-3xl font-bold text-emerald-600">{fmt(weekRevenue)}</p>
                      <p className="text-xs text-muted-foreground">Esta semana</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-muted-foreground">{fmt(lastWeekRevenue)}</p>
                      <p className="text-xs text-muted-foreground">Semana passada</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "pedidos":
        return loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl h-20 animate-pulse border border-border" />)}</div>
        ) : [...pendingOrders, ...preparingOrders].length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-muted-foreground/40" />
            </div>
            <p className="font-bold text-foreground text-lg">Nenhum pedido ativo</p>
            <p className="text-sm text-muted-foreground mt-1">Novos pedidos aparecerão aqui em tempo real</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-500/20">
                {pendingOrders.length} pendente{pendingOrders.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs font-bold bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-500/20">
                {preparingOrders.length} em preparo
              </span>
            </div>
            {[...pendingOrders, ...preparingOrders].map(order => (
              <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
            ))}
          </div>
        );

      case "cardapio":
        return <CardapioTab storeId={store.id} />;

      case "performance":
        return <DashboardTab storeId={store.id} />;

      case "historico":
        return completedOrders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <History size={32} className="text-muted-foreground/40" />
            </div>
            <p className="font-bold text-foreground text-lg">Sem histórico</p>
            <p className="text-sm text-muted-foreground mt-1">Pedidos concluídos aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedOrders.map(order => <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />)}
          </div>
        );

      case "horario":
        return (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-foreground text-xl">Horário de Funcionamento</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Configure os dias e horários em que sua loja está disponível</p>
                </div>
                {!editingStore ? (
                  <button onClick={startEditing} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-bold transition-colors">
                    <Pencil size={14} /> Editar
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setEditingStore(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium"><X size={14} /> Cancelar</button>
                    <button onClick={handleSaveStore} className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-bold hover:bg-primary/90 transition-all"><Save size={14} /> Salvar</button>
                  </div>
                )}
              </div>
              {editingStore ? (
                <div className="space-y-2">
                  {editHours.map((h, idx) => (
                    <div key={h.day} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${h.closed ? "bg-muted/30 border-border" : "bg-background border-input"}`}>
                      <span className="text-sm font-semibold text-foreground w-24 shrink-0">{h.day}</span>
                      <button onClick={() => setEditHours(prev => prev.map((x, i) => i === idx ? { ...x, closed: !x.closed } : x))}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${h.closed ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}`}>
                        {h.closed ? "Fechado" : "Aberto"}
                      </button>
                      {!h.closed && (
                        <>
                          <input type="time" value={h.open}
                            onChange={e => setEditHours(prev => prev.map((x, i) => i === idx ? { ...x, open: e.target.value } : x))}
                            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                          <span className="text-muted-foreground text-sm">às</span>
                          <input type="time" value={h.close}
                            onChange={e => setEditHours(prev => prev.map((x, i) => i === idx ? { ...x, close: e.target.value } : x))}
                            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {(store.opening_hours as StoreHours[] ?? DEFAULT_HOURS).map(h => (
                    <div key={h.day} className="flex items-center justify-between text-sm p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                      <span className="text-foreground font-medium">{h.day}</span>
                      <span className={h.closed ? "text-destructive font-semibold" : "text-muted-foreground"}>
                        {h.closed ? "Fechado" : `${h.open} — ${h.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "descricao":
        return (
          <div className="space-y-6">
            {/* Logo & Cover Upload */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-40 bg-muted">
                {store.cover_url ? (
                  <img src={store.cover_url} alt="Capa" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <ImagePlus size={32} className="text-muted-foreground/40" />
                  </div>
                )}
                <label className={`absolute bottom-3 right-3 flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-all ${
                  uploadingCover ? "bg-muted text-muted-foreground" : "bg-card/90 backdrop-blur text-foreground hover:bg-card"
                } border border-border shadow-sm`}>
                  <ImagePlus size={14} />
                  {uploadingCover ? "Enviando..." : "Alterar capa"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingCover}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "cover"); }} />
                </label>
              </div>
              <div className="px-6 pb-6 -mt-10 relative">
                <div className="flex items-end gap-4">
                  <label className="relative cursor-pointer group">
                    <div className="w-20 h-20 rounded-2xl border-4 border-card bg-card shadow-lg overflow-hidden">
                      {store.logo_url ? (
                        <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Store size={28} className="text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImagePlus size={18} className="text-white" />
                    </div>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "logo"); }} />
                    {uploadingLogo && <div className="absolute inset-0 rounded-2xl bg-background/60 flex items-center justify-center"><span className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}
                  </label>
                  <div className="pb-1">
                    <p className="font-bold text-foreground text-lg">{store.name}</p>
                    <p className="text-sm text-muted-foreground">{store.category}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Data */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-foreground text-xl">Dados do Estabelecimento</h3>
                {!editingStore ? (
                  <button onClick={startEditing} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-bold transition-colors">
                    <Pencil size={14} /> Editar
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setEditingStore(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium"><X size={14} /> Cancelar</button>
                    <button onClick={handleSaveStore} className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-bold hover:bg-primary/90 transition-all"><Save size={14} /> Salvar</button>
                  </div>
                )}
              </div>
              {editingStore ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Informações básicas</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-foreground">Nome</label>
                        <input value={editName} onChange={e => setEditName(e.target.value)}
                          className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-foreground">Categoria</label>
                        <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                          className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
                          {["Restaurante", "Hamburgueria", "Pizzaria", "Japonês", "Lanchonete", "Farmácia", "Floricultura", "Mercado", "Outro"].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground">Descrição</label>
                      <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3}
                        className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Endereço</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-foreground">Rua</label>
                        <input value={editStreet} onChange={e => setEditStreet(e.target.value)} placeholder="Rua, Avenida..."
                          className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-foreground">Número</label>
                        <input value={editNumber} onChange={e => setEditNumber(e.target.value)} placeholder="123"
                          className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-foreground">Bairro</label>
                        <input value={editNeighborhood} onChange={e => setEditNeighborhood(e.target.value)} placeholder="Bairro"
                          className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-foreground">Cidade</label>
                        <input value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="Cidade"
                          className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-foreground">UF</label>
                        <input value={editState} onChange={e => setEditState(e.target.value)} placeholder="SP" maxLength={2}
                          className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-foreground">CEP</label>
                        <input value={editZip} onChange={e => setEditZip(e.target.value)} placeholder="00000-000"
                          className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {store.description && <p className="text-sm text-muted-foreground leading-relaxed">{store.description}</p>}
                  {(store.address_street || store.address_city) && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Endereço</p>
                      <p className="text-sm text-foreground">
                        {[store.address_street, store.address_number].filter(Boolean).join(", ")}
                        {store.address_neighborhood && ` — ${store.address_neighborhood}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {[store.address_city, store.address_state].filter(Boolean).join(" - ")}
                        {store.address_zip && ` • CEP ${store.address_zip}`}
                      </p>
                    </div>
                  )}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">ID da loja</p>
                    <code className="text-xs bg-background px-3 py-1.5 rounded-lg border border-border select-all">{store.id}</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "avaliações":
        return <PlaceholderTab icon={Star} title="Avaliações" description="Veja o que seus clientes estão dizendo sobre sua loja e responda avaliações" />;
      case "financeiro":
        return <PlaceholderTab icon={DollarSign} title="Financeiro" description="Acompanhe suas faturas, taxas, repasses e extrato financeiro detalhado" />;
      case "areas_entrega":
        return <DeliveryZonesTab storeId={store.id} />;
      case "pagamento":
        return <PlaceholderTab icon={CreditCard} title="Formas de pagamento" description="Gerencie as formas de pagamento aceitas pelo seu estabelecimento" />;
      case "promocoes":
        return <PromocoesTab storeId={store.id} />;
      case "servicos":
        return <PlaceholderTab icon={Sparkles} title="Serviços" description="Descubra ferramentas e integrações para impulsionar suas vendas" />;
      case "perfil":
        return <PlaceholderTab icon={UserCircle} title="Perfil" description="Gerencie seus dados pessoais, documentos e informações do responsável" />;

      case "recomendacoes":
        return <PlaceholderTab icon={Award} title="Recomendações" description="Receba dicas personalizadas para melhorar o desempenho da sua loja" />;

      default:
        return null;
    }
  };

  const currentNavItem = navSections.flatMap(s => s.items).find(i => i.id === activeTab);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 shrink-0 ${sidebarOpen ? "w-[260px]" : "w-[72px]"}`}>
        {/* Store status + brand */}
        <div className="p-4 border-b border-border space-y-3">
          {sidebarOpen && (
            <button onClick={handleToggleActive} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-secondary/50 transition-all">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${store.is_active ? "bg-emerald-500" : "bg-destructive"}`} />
              <div className="text-left">
                <p className={`text-xs font-bold ${store.is_active ? "text-emerald-600" : "text-destructive"}`}>
                  {store.is_active ? "Restaurante aberto" : "Restaurante fechado"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {store.is_active ? "Dentro do horário programado" : "Fora do horário"}
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {sIdx > 0 && <div className="border-t border-border my-2 mx-1" />}
              {sidebarOpen && section.title && <SidebarSection title={section.title} />}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavItem key={item.id} icon={item.icon} label={item.label} active={activeTab === item.id}
                    badge={'badge' in item ? (item as any).badge : undefined}
                    badgeText={'badgeText' in item ? (item as any).badgeText : undefined}
                    onClick={() => setActiveTab(item.id)} collapsed={!sidebarOpen} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-border space-y-0.5">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <MenuIcon size={16} />
            {sidebarOpen && <span>Recolher</span>}
          </button>
          <button onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <ArrowLeft size={16} />
            {sidebarOpen && <span>Voltar ao app</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="lg:hidden text-muted-foreground hover:text-foreground">
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                {store.logo_url && <img src={store.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover hidden md:block" />}
                <div>
                  <h1 className="font-bold text-foreground text-sm lg:text-base">{store.name}</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                  <Activity size={13} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-600">{fmt(todayRevenue)} hoje</span>
                </div>
                {pendingOrders.length > 0 && (
                  <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                    <Bell size={13} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-600">{pendingOrders.length} pendente{pendingOrders.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
              <button onClick={handleToggleActive}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  store.is_active
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                    : "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                }`}>
                <CircleDot size={10} className={store.is_active ? "text-emerald-500" : "text-destructive"} />
                {store.is_active ? "Disponível" : "Indisponível"}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="lg:hidden flex gap-1 overflow-x-auto px-4 py-2 bg-card border-b border-border">
          {navSections.flatMap(s => s.items).map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === item.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
              }`}>
              <item.icon size={13} />
              {item.label}
              {'badge' in item && (item as any).badge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[9px] px-1.5 py-0.5 rounded-full font-bold">{(item as any).badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Page title */}
        <div className="px-4 lg:px-8 pt-5 pb-2">
          <h2 className="text-xl font-bold text-foreground">{currentNavItem?.label ?? "Painel"}</h2>
        </div>

        {/* Content */}
        <main className="flex-1 px-4 lg:px-8 pb-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default PainelPage;

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Store, Package, Clock, CheckCircle, ChefHat, XCircle,
  ChevronDown, ChevronUp, ArrowLeft, Plus, Pencil, Trash2, Save, X,
  UtensilsCrossed, ImagePlus, ToggleLeft, ToggleRight,
  LayoutDashboard, History, Settings, Bell,
  Menu as MenuIcon, Activity, Zap, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardTab from "@/components/DashboardTab";

/* ─── Types ─── */
interface OrderItem {
  id: string; item_name: string; item_price: number; quantity: number; item_image: string | null;
}
interface Order {
  id: string; restaurant_name: string; status: string; total: number; delivery_fee: number;
  created_at: string; user_id: string; restaurant_id: string; order_items: OrderItem[];
}
interface StoreData {
  id: string; owner_id: string; name: string; category: string;
  logo_url: string | null; cover_url: string | null; description: string | null; is_active: boolean;
}
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

/* ─── Sidebar Nav Item ─── */
function NavItem({ icon: Icon, label, active, badge, onClick }: {
  icon: React.ElementType; label: string; active: boolean; badge?: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
        active
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
      }`}>
      <Icon size={18} className={active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"} />
      <span className="flex-1 text-left">{label}</span>
      {badge != null && badge > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
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
    onCreated(data as StoreData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full">
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
        <button onClick={onCancel} className="flex-1 border border-border text-foreground font-semibold py-3 rounded-xl text-sm hover:bg-secondary transition-all">
          Cancelar
        </button>
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

/* ═══════════════════ Main Page ═══════════════════ */
const PainelPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [store, setStore] = useState<StoreData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [editingStore, setEditingStore] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    const loadStore = async () => {
      const { data } = await supabase.from("stores").select("*").eq("owner_id", user.id).limit(1).single();
      if (data) setStore(data as StoreData);
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
    loadOrders();
    const channel = supabase
      .channel('merchant-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${store.id}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", payload.new.id).single();
            if (data) { setOrders(prev => [data as Order, ...prev]); toast.info("Novo pedido recebido!"); }
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
    const { error } = await supabase.from("stores").update({ name: editName.trim(), category: editCategory, description: editDescription.trim() || null }).eq("id", store.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    setStore({ ...store, name: editName.trim(), category: editCategory, description: editDescription.trim() || null });
    setEditingStore(false);
    toast.success("Dados atualizados!");
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
  const todayRevenue = deliveredOrders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).reduce((s, o) => s + Number(o.total), 0);

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "pedidos", icon: Package, label: "Pedidos Ativos", badge: pendingOrders.length + preparingOrders.length },
    { id: "cardapio", icon: UtensilsCrossed, label: "Cardápio" },
    { id: "historico", icon: History, label: "Histórico" },
    { id: "loja", icon: Settings, label: "Configurações" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab storeId={store.id} />;
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
            {[...pendingOrders, ...preparingOrders].map(order => (
              <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
            ))}
          </div>
        );
      case "cardapio":
        return <CardapioTab storeId={store.id} />;
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
      case "loja":
        return (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-foreground text-xl">Dados do Estabelecimento</h3>
                {!editingStore ? (
                  <button onClick={() => { setEditName(store.name); setEditCategory(store.category); setEditDescription(store.description ?? ""); setEditingStore(true); }}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-bold transition-colors">
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
                <div className="space-y-4">
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
                  <div>
                    <label className="text-sm font-semibold text-foreground">Descrição</label>
                    <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3}
                      className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center shadow-inner">
                      <Store size={28} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">{store.name}</p>
                      <p className="text-sm text-muted-foreground">{store.category}</p>
                    </div>
                  </div>
                  {store.description && <p className="text-sm text-muted-foreground leading-relaxed">{store.description}</p>}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">ID da loja</p>
                    <code className="text-xs bg-background px-3 py-1.5 rounded-lg border border-border select-all">{store.id}</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 ${sidebarOpen ? "w-[260px]" : "w-[72px]"}`}>
        {/* Logo/Brand */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Store size={20} className="text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
                <p className="font-bold text-foreground text-sm truncate">{store.name}</p>
                <p className="text-xs text-muted-foreground truncate">{store.category}</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarOpen && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">Menu</p>}
          {navItems.map(item => (
            sidebarOpen ? (
              <NavItem key={item.id} icon={item.icon} label={item.label} active={activeTab === item.id} badge={item.badge} onClick={() => setActiveTab(item.id)} />
            ) : (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all relative ${
                  activeTab === item.id ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-secondary"
                }`} title={item.label}>
                <item.icon size={20} />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">{item.badge}</span>
                )}
              </button>
            )
          ))}
        </nav>

        {/* Sidebar toggle + logout */}
        <div className="p-3 border-t border-border space-y-1">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <MenuIcon size={18} />
            {sidebarOpen && <span>Recolher</span>}
          </button>
          <button onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <ArrowLeft size={18} />
            {sidebarOpen && <span>Voltar ao app</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="lg:hidden text-muted-foreground hover:text-foreground">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="font-bold text-foreground text-lg lg:text-xl">
                  {navItems.find(n => n.id === activeTab)?.label ?? "Painel"}
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Gerencie seu estabelecimento</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Quick stats in header */}
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                  <Activity size={14} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-600">{fmt(todayRevenue)} hoje</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                  <Bell size={14} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-600">{pendingOrders.length} pendente{pendingOrders.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${store.is_active ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                {store.is_active ? "Aberto" : "Fechado"}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="lg:hidden flex gap-1 overflow-x-auto px-4 py-2 bg-card border-b border-border">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === item.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
              }`}>
              <item.icon size={14} />
              {item.label}
              {item.badge != null && item.badge > 0 && (
                <span className="bg-primary-foreground/20 text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full font-bold">{item.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Quick KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 lg:px-8 py-4">
          {[
            { label: "Pendentes", value: pendingOrders.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10", borderColor: "border-amber-500/10" },
            { label: "Em Preparo", value: preparingOrders.length, icon: ChefHat, color: "text-blue-600", bg: "bg-blue-500/10", borderColor: "border-blue-500/10" },
            { label: "Entregues", value: deliveredOrders.length, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500/10", borderColor: "border-emerald-500/10" },
            { label: "Total", value: orders.length, icon: Package, color: "text-primary", bg: "bg-primary/10", borderColor: "border-primary/10" },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} border ${stat.borderColor} rounded-2xl p-4 flex items-center gap-3`}>
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
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

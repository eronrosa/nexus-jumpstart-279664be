import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Store, Package, Clock, CheckCircle, ChefHat, XCircle,
  ChevronDown, ChevronUp, ArrowLeft, Plus, Pencil, Trash2, Save, X,
  UtensilsCrossed, ImagePlus, ToggleLeft, ToggleRight, GripVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/* ─── Types ─── */
interface OrderItem {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  item_image: string | null;
}

interface Order {
  id: string;
  restaurant_name: string;
  status: string;
  total: number;
  delivery_fee: number;
  created_at: string;
  user_id: string;
  restaurant_id: string;
  order_items: OrderItem[];
}

interface StoreData {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  store_id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

const STATUS_FLOW = ["pendente", "em_preparo", "entregue", "cancelado"];
const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pendente: { label: "Pendente", icon: Clock, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  em_preparo: { label: "Em Preparo", icon: ChefHat, color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  entregue: { label: "Entregue", icon: CheckCircle, color: "bg-green-500/10 text-green-600 border-green-500/30" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "bg-red-500/10 text-red-600 border-red-500/30" },
};

const MENU_CATEGORIES = ["Entradas", "Pratos", "Lanches", "Bebidas", "Sobremesas", "Combos", "Outro"];

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
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error("Erro ao criar loja"); return; }
    toast.success("Loja criada com sucesso!");
    onCreated(data as StoreData);
  };

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Store size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Cadastre seu Estabelecimento</h2>
        <p className="text-muted-foreground text-sm mt-1">Configure sua loja para começar a receber pedidos</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">Nome do estabelecimento</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Restaurante Mitsuba"
            className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Descrição (opcional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Breve descrição do seu estabelecimento..."
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>
        <button onClick={handleCreate} disabled={!name.trim() || saving}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? "Criando..." : "Criar Estabelecimento"}
        </button>
      </div>
    </div>
  );
}

/* ─── Order Card ─── */
function OrderCard({ order, onStatusChange }: { order: Order; onStatusChange: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[order.status] ?? statusConfig.pendente;
  const Icon = cfg.icon;

  const nextStatus = () => {
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx < 2) return STATUS_FLOW[idx + 1];
    return null;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
      " • " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const next = nextStatus();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden">
      <button className="w-full text-left px-4 py-4 flex items-start justify-between gap-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color} border`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
            <p className="font-semibold text-foreground text-sm">Pedido #{order.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
          <span className="text-sm font-bold text-foreground">{fmt(order.total)}</span>
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-border px-4 py-3 space-y-2">
            {order.order_items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                {item.item_image && <img src={item.item_image} alt={item.item_name} className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{item.item_name}</p>
                  <p className="text-xs text-muted-foreground">{fmt(item.item_price)} × {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{fmt(item.item_price * item.quantity)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-border flex justify-between text-sm">
              <span className="text-muted-foreground">Entrega</span>
              <span className="text-foreground">{order.delivery_fee === 0 ? "Grátis" : fmt(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span>Total</span>
              <span className="text-primary">{fmt(order.total)}</span>
            </div>
            <div className="flex gap-2 pt-2">
              {next && (
                <button onClick={() => onStatusChange(order.id, next)}
                  className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  {next === "em_preparo" ? "🔥" : "✅"} Marcar como {statusConfig[next].label}
                </button>
              )}
              {order.status !== "cancelado" && order.status !== "entregue" && (
                <button onClick={() => onStatusChange(order.id, "cancelado")}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
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

/* ─── Menu Item Form (Add/Edit) ─── */
function MenuItemForm({ storeId, item, onSaved, onCancel }: {
  storeId: string;
  item?: MenuItem | null;
  onSaved: (item: MenuItem) => void;
  onCancel: () => void;
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
    if (item) {
      // Update
      const { data, error } = await supabase.from("menu_items")
        .update({ name: name.trim(), category, price: priceNum, description: description.trim() || null, image_url: imageUrl || null })
        .eq("id", item.id)
        .select()
        .single();
      setSaving(false);
      if (error) { toast.error("Erro ao atualizar item"); return; }
      toast.success("Item atualizado!");
      onSaved(data as MenuItem);
    } else {
      // Insert
      const { data, error } = await supabase.from("menu_items")
        .insert({ store_id: storeId, name: name.trim(), category, price: priceNum, description: description.trim() || null, image_url: imageUrl || null })
        .select()
        .single();
      setSaving(false);
      if (error) { toast.error("Erro ao adicionar item"); return; }
      toast.success("Item adicionado ao cardápio!");
      onSaved(data as MenuItem);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">{item ? "Editar Item" : "Novo Item"}</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
      </div>

      {/* Image */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => fileRef.current?.click()}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden shrink-0"
        >
          {uploading ? (
            <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus size={24} className="text-muted-foreground/50" />
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <p className="text-xs text-muted-foreground">Clique para adicionar foto do produto (máx 5MB)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground">Nome do item *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: X-Burger Especial"
            className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Preço (R$) *</label>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="29.90" type="text" inputMode="decimal"
            className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Descrição (opcional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Breve descrição do item..."
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 border border-border text-foreground font-medium py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors">
          Cancelar
        </button>
        <button onClick={handleSave} disabled={!name.trim() || !price || saving}
          className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("menu_items")
        .select("*")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (data) setMenuItems(data as MenuItem[]);
      setLoading(false);
    };
    load();
  }, [storeId]);

  const handleSaved = (item: MenuItem) => {
    setMenuItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx >= 0) { const arr = [...prev]; arr[idx] = item; return arr; }
      return [...prev, item];
    });
    setShowForm(false);
    setEditingItem(null);
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
  const filtered = filterCategory === "Todos" ? menuItems : menuItems.filter(i => i.category === filterCategory);

  // Group by category
  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl h-20 animate-pulse border border-border" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground text-lg">Cardápio</h3>
          <p className="text-xs text-muted-foreground">{menuItems.length} {menuItems.length === 1 ? "item" : "itens"}</p>
        </div>
        {!showForm && !editingItem && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors">
            <Plus size={16} /> Adicionar item
          </button>
        )}
      </div>

      {/* Form */}
      {(showForm || editingItem) && (
        <MenuItemForm
          storeId={storeId}
          item={editingItem}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
        />
      )}

      {/* Category filter */}
      {menuItems.length > 0 && !showForm && !editingItem && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filterCategory === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-secondary/80"}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Items list */}
      {!showForm && !editingItem && (
        menuItems.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed size={48} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground">Cardápio vazio</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione itens ao cardápio para seus clientes verem</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{cat}</p>
              <div className="space-y-2">
                {items.map(item => (
                  <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`bg-card border border-border rounded-xl p-3 flex items-center gap-3 ${!item.is_available ? "opacity-50" : ""}`}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <UtensilsCrossed size={20} className="text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{item.name}</p>
                      {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                      <p className="text-sm font-bold text-primary mt-0.5">{fmt(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleToggleAvailable(item)} title={item.is_available ? "Desativar" : "Ativar"}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        {item.is_available ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => setEditingItem(item)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(item)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 size={14} />
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

/* ─── Main Page ─── */
const PainelPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [store, setStore] = useState<StoreData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pedidos");

  const [editingStore, setEditingStore] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");

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
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("restaurant_id", store.id)
        .order("created_at", { ascending: false });
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
    const { error } = await supabase.from("stores").update({
      name: editName.trim(), category: editCategory, description: editDescription.trim() || null,
    }).eq("id", store.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    setStore({ ...store, name: editName.trim(), category: editCategory, description: editDescription.trim() || null });
    setEditingStore(false);
    toast.success("Dados atualizados!");
  };

  if (authLoading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-card border-b border-border z-10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
            <h1 className="text-lg font-bold text-foreground">Painel do Estabelecimento</h1>
          </div>
        </div>
        <StoreSetupForm onCreated={s => setStore(s)} />
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === "pendente");
  const preparingOrders = orders.filter(o => o.status === "em_preparo");
  const completedOrders = orders.filter(o => o.status === "entregue" || o.status === "cancelado");

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Store size={18} className="text-primary" /> {store.name}
              </h1>
              <p className="text-xs text-muted-foreground">{store.category} • Painel de gerenciamento</p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${store.is_active ? "bg-green-500/10 text-green-600 border border-green-500/30" : "bg-red-500/10 text-red-600 border border-red-500/30"}`}>
            {store.is_active ? "Aberto" : "Fechado"}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Pendentes", value: pendingOrders.length, color: "text-yellow-600", bg: "bg-yellow-500/10" },
            { label: "Em Preparo", value: preparingOrders.length, color: "text-blue-600", bg: "bg-blue-500/10" },
            { label: "Concluídos", value: completedOrders.length, color: "text-green-600", bg: "bg-green-500/10" },
            { label: "Total Pedidos", value: orders.length, color: "text-primary", bg: "bg-primary/10" },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="pedidos" className="gap-1.5">
              <Package size={14} /> Pedidos {pendingOrders.length > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">{pendingOrders.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="cardapio" className="gap-1.5">
              <UtensilsCrossed size={14} /> Cardápio
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5">
              <Clock size={14} /> Histórico
            </TabsTrigger>
            <TabsTrigger value="loja" className="gap-1.5">
              <Store size={14} /> Loja
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos">
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl h-20 animate-pulse border border-border" />)}</div>
            ) : [...pendingOrders, ...preparingOrders].length === 0 ? (
              <div className="text-center py-16">
                <Package size={48} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-muted-foreground">Nenhum pedido ativo</p>
                <p className="text-xs text-muted-foreground mt-1">Novos pedidos aparecerão aqui em tempo real</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...pendingOrders, ...preparingOrders].map(order => (
                  <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cardapio">
            <CardapioTab storeId={store.id} />
          </TabsContent>

          <TabsContent value="historico">
            {completedOrders.length === 0 ? (
              <div className="text-center py-16">
                <Clock size={48} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-muted-foreground">Sem histórico ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedOrders.map(order => (
                  <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="loja">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-lg">Dados do Estabelecimento</h3>
                {!editingStore ? (
                  <button onClick={() => { setEditName(store.name); setEditCategory(store.category); setEditDescription(store.description ?? ""); setEditingStore(true); }}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                    <Pencil size={14} /> Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditingStore(false)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><X size={14} /> Cancelar</button>
                    <button onClick={handleSaveStore} className="flex items-center gap-1 text-sm text-primary font-semibold"><Save size={14} /> Salvar</button>
                  </div>
                )}
              </div>

              {editingStore ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">Nome</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Categoria</label>
                    <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                      className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                      {["Restaurante", "Hamburgueria", "Pizzaria", "Japonês", "Lanchonete", "Farmácia", "Floricultura", "Mercado", "Outro"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Descrição</label>
                    <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Store size={22} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{store.name}</p>
                      <p className="text-sm text-muted-foreground">{store.category}</p>
                    </div>
                  </div>
                  {store.description && <p className="text-sm text-muted-foreground">{store.description}</p>}
                  <div className="text-xs text-muted-foreground">
                    ID da loja: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{store.id}</code>
                    <p className="mt-1 text-muted-foreground/70">Use este ID como restaurant_id ao cadastrar seu restaurante no ZuuFood.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PainelPage;

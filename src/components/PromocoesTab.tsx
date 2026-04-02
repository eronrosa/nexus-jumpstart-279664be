import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Save, X, Gift, Tag, Percent, DollarSign,
  ToggleLeft, ToggleRight, Calendar, Clock, Copy, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Promotion {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order: number;
  coupon_code: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function PromocoesTab({ storeId }: { storeId: string }) {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("10");
  const [minOrder, setMinOrder] = useState("0");
  const [couponCode, setCouponCode] = useState("");
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 16));
  const [endsAt, setEndsAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("store_promotions")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      if (data) setPromos(data as Promotion[]);
      setLoading(false);
    };
    load();
  }, [storeId]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setDiscountType("percentage"); setDiscountValue("10");
    setMinOrder("0"); setCouponCode(""); setStartsAt(new Date().toISOString().slice(0, 16)); setEndsAt("");
    setShowForm(false); setEditing(null);
  };

  const startEdit = (p: Promotion) => {
    setTitle(p.title); setDescription(p.description ?? "");
    setDiscountType(p.discount_type); setDiscountValue(p.discount_value.toString());
    setMinOrder(p.min_order.toString()); setCouponCode(p.coupon_code ?? "");
    setStartsAt(p.starts_at.slice(0, 16)); setEndsAt(p.ends_at?.slice(0, 16) ?? "");
    setEditing(p); setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const dv = parseFloat(discountValue.replace(",", "."));
    if (isNaN(dv) || dv <= 0) { toast.error("Valor de desconto inválido"); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      discount_type: discountType,
      discount_value: dv,
      min_order: parseFloat(minOrder.replace(",", ".")) || 0,
      coupon_code: couponCode.trim().toUpperCase() || null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    };
    if (editing) {
      const { data, error } = await supabase.from("store_promotions").update(payload).eq("id", editing.id).select().single();
      if (error) { toast.error("Erro ao atualizar promoção"); setSaving(false); return; }
      setPromos(prev => prev.map(p => p.id === editing.id ? data as Promotion : p));
      toast.success("Promoção atualizada!");
    } else {
      const { data, error } = await supabase.from("store_promotions").insert({ store_id: storeId, ...payload }).select().single();
      if (error) { toast.error("Erro ao criar promoção"); setSaving(false); return; }
      setPromos(prev => [data as Promotion, ...prev]);
      toast.success("Promoção criada!");
    }
    setSaving(false);
    resetForm();
  };

  const handleToggle = async (p: Promotion) => {
    const { error } = await supabase.from("store_promotions").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    setPromos(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  };

  const handleDelete = async (p: Promotion) => {
    if (!confirm(`Remover a promoção "${p.title}"?`)) return;
    const { error } = await supabase.from("store_promotions").delete().eq("id", p.id);
    if (error) { toast.error("Erro ao remover"); return; }
    setPromos(prev => prev.filter(x => x.id !== p.id));
    toast.success("Promoção removida");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const isExpired = (p: Promotion) => p.ends_at && new Date(p.ends_at) < new Date();
  const isActive = (p: Promotion) => p.is_active && !isExpired(p) && new Date(p.starts_at) <= new Date();

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl h-20 animate-pulse border border-border" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground text-xl">Promoções</h3>
          <p className="text-sm text-muted-foreground">{promos.length} promoção(ões) cadastrada(s)</p>
        </div>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
            <Plus size={16} /> Nova promoção
          </button>
        )}
      </div>

      {/* Stats cards */}
      {promos.length > 0 && !showForm && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Sparkles size={18} className="text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-foreground">Ativas</p>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{promos.filter(p => isActive(p)).length}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock size={18} className="text-amber-600" />
              </div>
              <p className="text-sm font-semibold text-foreground">Agendadas</p>
            </div>
            <p className="text-3xl font-bold text-amber-600">{promos.filter(p => p.is_active && new Date(p.starts_at) > new Date()).length}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Tag size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">Expiradas</p>
            </div>
            <p className="text-3xl font-bold text-muted-foreground">{promos.filter(p => isExpired(p)).length}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-lg">{editing ? "Editar Promoção" : "Nova Promoção"}</h3>
              <button onClick={resetForm} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Título da promoção *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Frete grátis acima de R$50"
                  className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Descrição (opcional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Detalhes da promoção..."
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground">Tipo de desconto</label>
                <div className="mt-1.5 flex gap-2">
                  <button onClick={() => setDiscountType("percentage")}
                    className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold border transition-all ${
                      discountType === "percentage" ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" : "border-input bg-background text-foreground hover:bg-secondary"
                    }`}>
                    <Percent size={14} /> Porcentagem
                  </button>
                  <button onClick={() => setDiscountType("fixed")}
                    className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold border transition-all ${
                      discountType === "fixed" ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" : "border-input bg-background text-foreground hover:bg-secondary"
                    }`}>
                    <DollarSign size={14} /> Valor fixo
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground">
                  Valor do desconto {discountType === "percentage" ? "(%)" : "(R$)"} *
                </label>
                <input value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "10" : "5.00"} type="text" inputMode="decimal"
                  className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground">Pedido mínimo (R$)</label>
                <input value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="0.00" type="text" inputMode="decimal"
                  className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground">Código do cupom</label>
                <div className="mt-1.5 flex gap-2">
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="PROMO10"
                    className="flex-1 h-11 rounded-xl border border-input bg-background px-4 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
                  <button onClick={() => setCouponCode(generateCode())} title="Gerar código"
                    className="h-11 px-3 rounded-xl border border-input bg-background hover:bg-secondary transition-all text-muted-foreground hover:text-foreground">
                    <Sparkles size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground">Início</label>
                <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)}
                  className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground">Fim (opcional)</label>
                <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)}
                  className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={resetForm} className="flex-1 border border-border text-foreground font-semibold py-3 rounded-xl text-sm hover:bg-secondary transition-all">Cancelar</button>
              <button onClick={handleSave} disabled={!title.trim() || saving}
                className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md shadow-primary/20 flex items-center justify-center gap-2">
                <Save size={14} /> {saving ? "Salvando..." : editing ? "Atualizar" : "Criar promoção"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {promos.length === 0 && !showForm ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Gift size={32} className="text-muted-foreground/40" />
          </div>
          <p className="font-bold text-foreground text-lg">Nenhuma promoção</p>
          <p className="text-sm text-muted-foreground mt-1">Crie promoções para atrair mais clientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {promos.map(p => {
            const expired = isExpired(p);
            const active = isActive(p);
            const scheduled = p.is_active && new Date(p.starts_at) > new Date();
            return (
              <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`bg-card border border-border rounded-xl p-5 hover:shadow-md hover:shadow-black/5 transition-all duration-200 ${!p.is_active || expired ? "opacity-50" : ""}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      active ? "bg-emerald-500/10" : scheduled ? "bg-amber-500/10" : "bg-muted"
                    }`}>
                      {discountType === "percentage"
                        ? <Percent size={20} className={active ? "text-emerald-600" : scheduled ? "text-amber-600" : "text-muted-foreground"} />
                        : <DollarSign size={20} className={active ? "text-emerald-600" : scheduled ? "text-amber-600" : "text-muted-foreground"} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{p.title}</p>
                        {active && <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-500/20 shrink-0">ATIVA</span>}
                        {scheduled && <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-500/20 shrink-0">AGENDADA</span>}
                        {expired && <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-lg border border-border shrink-0">EXPIRADA</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {p.discount_type === "percentage" ? `${p.discount_value}% de desconto` : `${fmt(p.discount_value)} de desconto`}
                        {p.min_order > 0 && ` • Mín. ${fmt(p.min_order)}`}
                      </p>
                      {p.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(p.starts_at).toLocaleDateString("pt-BR")}</span>
                        {p.ends_at && <span>→ {new Date(p.ends_at).toLocaleDateString("pt-BR")}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.coupon_code && (
                      <button onClick={() => copyCode(p.coupon_code!)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-xs font-mono font-bold text-foreground transition-all" title="Copiar código">
                        <Copy size={12} /> {p.coupon_code}
                      </button>
                    )}
                    <button onClick={() => handleToggle(p)} title={p.is_active ? "Desativar" : "Ativar"}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      {p.is_active ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
                    </button>
                    <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

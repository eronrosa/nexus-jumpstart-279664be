import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Save, X, ImagePlus, Calendar, Clock,
  MapPin, Users, Ticket, Eye, EyeOff, ChevronDown, ChevronUp,
  Minus, DollarSign, BarChart3, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EventTicket {
  id: string;
  event_id: string;
  name: string;
  price: number;
  description: string | null;
  available: number;
  max_per_purchase: number;
  sort_order: number;
  is_active: boolean;
}

interface EventData {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  event_date: string;
  event_time: string;
  location: string;
  venue: string;
  category: string;
  age_rating: string;
  is_active: boolean;
  created_at: string;
  event_tickets?: EventTicket[];
}

interface Purchase {
  id: string;
  user_id: string;
  quantity: number;
  unit_price: number;
  total_paid: number;
  payment_method: string;
  status: string;
  created_at: string;
  ticket_name?: string;
}

const EVENT_CATEGORIES = ["Sertanejo", "Pagode", "Forró", "Rock", "Eletrônica", "Festa", "Esportivo", "Cultural", "Universitário", "Outro"];
const AGE_RATINGS = ["Livre", "14+", "16+", "18+"];
const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

/* ── Event Form ── */
function EventForm({ event, onSaved, onCancel }: {
  event?: EventData | null; onSaved: (ev: EventData) => void; onCancel: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [imageUrl, setImageUrl] = useState(event?.image_url ?? "");
  const [eventDate, setEventDate] = useState(event?.event_date ?? "");
  const [eventTime, setEventTime] = useState(event?.event_time ?? "20:00");
  const [location, setLocation] = useState(event?.location ?? "");
  const [venue, setVenue] = useState(event?.venue ?? "");
  const [category, setCategory] = useState(event?.category ?? "Festa");
  const [ageRating, setAgeRating] = useState(event?.age_rating ?? "Livre");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Tickets
  const [tickets, setTickets] = useState<{ name: string; price: string; description: string; available: string; maxPerPurchase: string }[]>(
    event?.event_tickets?.map(t => ({
      name: t.name, price: t.price.toString(), description: t.description ?? "",
      available: t.available.toString(), maxPerPurchase: t.max_per_purchase.toString(),
    })) ?? [{ name: "Entrada Geral", price: "", description: "Acesso ao evento", available: "100", maxPerPurchase: "5" }]
  );

  const addTicket = () => setTickets([...tickets, { name: "", price: "", description: "", available: "100", maxPerPurchase: "5" }]);
  const removeTicket = (i: number) => setTickets(tickets.filter((_, idx) => idx !== i));
  const updateTicket = (i: number, field: string, val: string) => {
    const arr = [...tickets];
    (arr[i] as any)[field] = val;
    setTickets(arr);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx 5MB)"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `events/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar imagem"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("menu-images").getPublicUrl(path);
    setImageUrl(publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !eventDate || !location.trim() || !venue.trim()) {
      toast.error("Preencha todos os campos obrigatórios"); return;
    }
    const validTickets = tickets.filter(t => t.name.trim() && t.price);
    if (validTickets.length === 0) { toast.error("Adicione pelo menos um lote de ingresso"); return; }

    setSaving(true);
    const payload = {
      organizer_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl || null,
      event_date: eventDate,
      event_time: eventTime,
      location: location.trim(),
      venue: venue.trim(),
      category,
      age_rating: ageRating,
    };

    try {
      let eventId: string;
      if (event) {
        const { error } = await supabase.from("events").update(payload).eq("id", event.id);
        if (error) throw error;
        eventId = event.id;
        // Delete old tickets and re-create
        await supabase.from("event_tickets").delete().eq("event_id", event.id);
      } else {
        const { data, error } = await supabase.from("events").insert(payload).select().single();
        if (error) throw error;
        eventId = data.id;
      }

      // Insert tickets
      const ticketPayloads = validTickets.map((t, i) => ({
        event_id: eventId,
        name: t.name.trim(),
        price: parseFloat(t.price.replace(",", ".")),
        description: t.description.trim() || null,
        available: parseInt(t.available) || 100,
        max_per_purchase: parseInt(t.maxPerPurchase) || 5,
        sort_order: i,
      }));
      const { error: tErr } = await supabase.from("event_tickets").insert(ticketPayloads);
      if (tErr) throw tErr;

      // Fetch full event
      const { data: full } = await supabase.from("events").select("*, event_tickets(*)").eq("id", eventId).single();
      setSaving(false);
      toast.success(event ? "Evento atualizado!" : "Evento criado!");
      onSaved(full as unknown as EventData);
    } catch (err: any) {
      setSaving(false);
      toast.error(err.message || "Erro ao salvar evento");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-lg shadow-black/5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground text-lg">{event ? "Editar Evento" : "Novo Evento"}</h3>
        <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
      </div>

      {/* Image */}
      <div className="flex items-center gap-4">
        <div onClick={() => fileRef.current?.click()} className="w-32 h-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all overflow-hidden shrink-0">
          {uploading ? <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            : imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            : <ImagePlus size={24} className="text-muted-foreground/40" />}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <div>
          <p className="text-sm font-medium text-foreground">Imagem do evento</p>
          <p className="text-xs text-muted-foreground">Proporção 16:9 recomendada</p>
        </div>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-foreground">Título do evento *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Festival Sertanejo 2026" className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Data *</label>
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Horário *</label>
          <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Cidade / Estado *</label>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: São Paulo - SP" className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Local / Venue *</label>
          <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Ex: Allianz Parque" className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
            {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Classificação</label>
          <select value={ageRating} onChange={e => setAgeRating(e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
            {AGE_RATINGS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">Descrição</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Descrição do evento..." className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none" />
      </div>

      {/* Tickets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-foreground">Lotes de Ingresso *</label>
          <button onClick={addTicket} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"><Plus size={14} /> Adicionar lote</button>
        </div>
        <div className="space-y-3">
          {tickets.map((t, i) => (
            <div key={i} className="bg-secondary/30 border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">LOTE {i + 1}</span>
                {tickets.length > 1 && (
                  <button onClick={() => removeTicket(i)} className="text-xs text-destructive hover:underline flex items-center gap-1"><Trash2 size={12} /> Remover</button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <input value={t.name} onChange={e => updateTicket(i, "name", e.target.value)} placeholder="Nome do lote" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <div>
                  <input value={t.price} onChange={e => updateTicket(i, "price", e.target.value)} placeholder="Preço" type="text" inputMode="decimal" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <div>
                  <input value={t.available} onChange={e => updateTicket(i, "available", e.target.value)} placeholder="Qtd" type="number" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
              </div>
              <input value={t.description} onChange={e => updateTicket(i, "description", e.target.value)} placeholder="Descrição do lote (opcional)" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 border border-border text-foreground font-semibold py-3 rounded-xl text-sm hover:bg-secondary transition-all">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md shadow-primary/20 flex items-center justify-center gap-2">
          <Save size={14} /> {saving ? "Salvando..." : event ? "Atualizar" : "Criar Evento"}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main Tab ── */
export default function EventosTab() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<Record<string, Purchase[]>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("events").select("*, event_tickets(*)").eq("organizer_id", user.id).order("event_date", { ascending: false });
      if (data) setEvents(data as unknown as EventData[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const loadPurchases = async (eventId: string) => {
    if (purchases[eventId]) return;
    const { data } = await supabase.from("ticket_purchases").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
    if (data) {
      // Map ticket names
      const ev = events.find(e => e.id === eventId);
      const mapped = data.map((p: any) => {
        const ticket = ev?.event_tickets?.find(t => t.id === p.ticket_id);
        return { ...p, ticket_name: ticket?.name ?? "Ingresso" };
      });
      setPurchases(prev => ({ ...prev, [eventId]: mapped }));
    }
  };

  const handleSaved = (ev: EventData) => {
    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === ev.id);
      if (idx >= 0) { const arr = [...prev]; arr[idx] = ev; return arr; }
      return [ev, ...prev];
    });
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleToggleActive = async (ev: EventData) => {
    const { error } = await supabase.from("events").update({ is_active: !ev.is_active }).eq("id", ev.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_active: !e.is_active } : e));
    toast.success(ev.is_active ? "Evento desativado" : "Evento ativado");
  };

  const handleDelete = async (ev: EventData) => {
    if (!confirm(`Excluir "${ev.title}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("events").delete().eq("id", ev.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setEvents(prev => prev.filter(e => e.id !== ev.id));
    toast.success("Evento excluído");
  };

  const toggleExpand = (id: string) => {
    if (expandedEvent === id) { setExpandedEvent(null); return; }
    setExpandedEvent(id);
    loadPurchases(id);
  };

  const filtered = searchQuery
    ? events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : events;

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl h-24 animate-pulse border border-border" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-bold text-foreground text-xl">Meus Eventos</h3>
          <p className="text-sm text-muted-foreground">{events.length} evento{events.length !== 1 ? "s" : ""} cadastrado{events.length !== 1 ? "s" : ""}</p>
        </div>
        {!showForm && !editingEvent && (
          <Button onClick={() => setShowForm(true)} className="rounded-xl shadow-md shadow-primary/20">
            <Plus size={16} className="mr-2" /> Novo Evento
          </Button>
        )}
      </div>

      {(showForm || editingEvent) && (
        <EventForm event={editingEvent} onSaved={handleSaved} onCancel={() => { setShowForm(false); setEditingEvent(null); }} />
      )}

      {!showForm && !editingEvent && events.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar evento..." className="w-full h-10 rounded-xl border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
        </div>
      )}

      {!showForm && !editingEvent && (
        filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Ticket size={32} className="text-muted-foreground/40" />
            </div>
            <p className="font-bold text-foreground text-lg">Nenhum evento</p>
            <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro evento e comece a vender ingressos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ev => {
              const totalTickets = ev.event_tickets?.reduce((s, t) => s + t.available, 0) ?? 0;
              const evPurchases = purchases[ev.id] ?? [];
              const totalSold = evPurchases.reduce((s, p) => s + p.quantity, 0);
              const totalRevenue = evPurchases.reduce((s, p) => s + Number(p.total_paid), 0);
              const isExpanded = expandedEvent === ev.id;
              const isPast = new Date(ev.event_date) < new Date();

              return (
                <motion.div key={ev.id} layout className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all">
                  <button className="w-full text-left px-4 py-4 flex items-start gap-4" onClick={() => toggleExpand(ev.id)}>
                    {ev.image_url ? (
                      <img src={ev.image_url} alt="" className="w-16 h-16 md:w-20 md:h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Ticket size={22} className="text-primary" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground text-sm truncate">{ev.title}</p>
                        {!ev.is_active && <Badge variant="secondary" className="text-[9px]">Inativo</Badge>}
                        {isPast && <Badge variant="outline" className="text-[9px] text-muted-foreground">Encerrado</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1"><Calendar size={12} />{new Date(ev.event_date).toLocaleDateString("pt-BR")}</span>
                        <span className="flex items-center gap-1"><Clock size={12} />{ev.event_time}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} />{ev.location}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">{ev.category}</Badge>
                        <span className="text-xs text-muted-foreground">{ev.event_tickets?.length ?? 0} lotes · {totalTickets} ingressos</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 p-4">
                          <div className="bg-secondary/50 rounded-xl p-3 text-center">
                            <Ticket size={16} className="mx-auto text-primary mb-1" />
                            <p className="text-lg font-bold text-foreground">{totalSold}</p>
                            <p className="text-[10px] text-muted-foreground">Vendidos</p>
                          </div>
                          <div className="bg-secondary/50 rounded-xl p-3 text-center">
                            <DollarSign size={16} className="mx-auto text-primary mb-1" />
                            <p className="text-lg font-bold text-foreground">{fmt(totalRevenue)}</p>
                            <p className="text-[10px] text-muted-foreground">Receita</p>
                          </div>
                          <div className="bg-secondary/50 rounded-xl p-3 text-center">
                            <Users size={16} className="mx-auto text-primary mb-1" />
                            <p className="text-lg font-bold text-foreground">{evPurchases.length}</p>
                            <p className="text-[10px] text-muted-foreground">Compradores</p>
                          </div>
                        </div>

                        {/* Ticket lotes */}
                        <div className="px-4 pb-3">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Lotes</p>
                          <div className="space-y-1.5">
                            {ev.event_tickets?.map(t => (
                              <div key={t.id} className="flex items-center justify-between text-sm bg-secondary/30 rounded-lg px-3 py-2">
                                <div>
                                  <span className="font-medium text-foreground">{t.name}</span>
                                  <span className="text-muted-foreground ml-2">· {t.available} disponíveis</span>
                                </div>
                                <span className="font-bold text-primary">{fmt(t.price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recent purchases */}
                        {evPurchases.length > 0 && (
                          <div className="px-4 pb-3">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Últimas vendas</p>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {evPurchases.slice(0, 10).map(p => (
                                <div key={p.id} className="flex items-center justify-between text-xs bg-secondary/30 rounded-lg px-3 py-2">
                                  <div>
                                    <span className="font-medium text-foreground">{p.quantity}x {p.ticket_name}</span>
                                    <span className="text-muted-foreground ml-2">· {p.payment_method.toUpperCase()}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-foreground">{fmt(Number(p.total_paid))}</span>
                                    <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 px-4 pb-4">
                          <button onClick={() => handleToggleActive(ev)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${ev.is_active ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"}`}>
                            {ev.is_active ? <><EyeOff size={14} /> Desativar</> : <><Eye size={14} /> Ativar</>}
                          </button>
                          <button onClick={() => { setEditingEvent(ev); setExpandedEvent(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2">
                            <Pencil size={14} /> Editar
                          </button>
                          <button onClick={() => handleDelete(ev)} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

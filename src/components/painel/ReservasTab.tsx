import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, Clock, Users, CheckCircle, XCircle, Phone, User, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Reservation {
  id: string;
  store_id: string;
  user_id: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  guest_name: string;
  guest_phone: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pendente", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20" },
  confirmed: { label: "Confirmada", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
  cancelled: { label: "Cancelada", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
  completed: { label: "Concluída", color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/20" },
};

export default function ReservasTab({ storeId }: { storeId: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadReservations = async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("store_id", storeId)
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });
    if (!error && data) setReservations(data as Reservation[]);
    setLoading(false);
  };

  useEffect(() => {
    loadReservations();
    const channel = supabase
      .channel("store-reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `store_id=eq.${storeId}` },
        () => loadReservations()
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [storeId]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success(`Reserva ${STATUS_MAP[status]?.label.toLowerCase() || status}`);
  };

  const filtered = filter === "all" ? reservations : reservations.filter(r => r.status === filter);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayReservations = reservations.filter(r => r.reservation_date === todayStr && r.status !== "cancelled");
  const pendingCount = reservations.filter(r => r.status === "pending").length;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl h-24 animate-pulse border border-border" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Hoje</p>
          <p className="text-2xl font-bold text-foreground">{todayReservations.length}</p>
          <p className="text-[11px] text-muted-foreground">reservas</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-[11px] text-muted-foreground">aguardando</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Total confirmadas</p>
          <p className="text-2xl font-bold text-emerald-600">{reservations.filter(r => r.status === "confirmed").length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Total geral</p>
          <p className="text-2xl font-bold text-foreground">{reservations.length}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {[
          { id: "all", label: "Todas" },
          { id: "pending", label: "Pendentes" },
          { id: "confirmed", label: "Confirmadas" },
          { id: "completed", label: "Concluídas" },
          { id: "cancelled", label: "Canceladas" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0 transition-colors ${
              filter === tab.id
                ? "border-primary text-primary bg-primary/5"
                : "border-border text-muted-foreground bg-card hover:border-primary/30"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reservations list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays size={48} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">Nenhuma reserva encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">As reservas dos clientes aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((r, i) => {
              const st = STATUS_MAP[r.status] || STATUS_MAP.pending;
              const isToday = r.reservation_date === todayStr;
              const dateFormatted = new Date(r.reservation_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-card border rounded-2xl p-4 ${isToday ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User size={14} className="text-muted-foreground" />
                        <span className="font-bold text-foreground text-sm">{r.guest_name}</span>
                        {isToday && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">HOJE</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CalendarDays size={12} /> {dateFormatted}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {r.reservation_time}</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {r.guests} pessoas</span>
                      </div>
                      {r.guest_phone && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Phone size={11} /> {r.guest_phone}</p>
                      )}
                      {r.notes && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><FileText size={11} /> {r.notes}</p>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${st.bg} ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  {r.status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateStatus(r.id, "confirmed")}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-600 transition-colors">
                        <CheckCircle size={14} /> Confirmar
                      </button>
                      <button onClick={() => updateStatus(r.id, "cancelled")}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-card border border-destructive text-destructive text-xs font-bold py-2.5 rounded-xl hover:bg-destructive/5 transition-colors">
                        <XCircle size={14} /> Recusar
                      </button>
                    </div>
                  )}
                  {r.status === "confirmed" && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateStatus(r.id, "completed")}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-600 transition-colors">
                        <CheckCircle size={14} /> Concluir
                      </button>
                      <button onClick={() => updateStatus(r.id, "cancelled")}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-card border border-border text-muted-foreground text-xs font-bold py-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                        <XCircle size={14} /> Cancelar
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, ThumbsUp, MessageSquare, TrendingUp, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Review {
  id: string;
  order_id: string;
  store_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
  customer_name?: string;
}

export default function AvaliacoesTab({ storeId }: { storeId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | "pendentes" | "respondidos">("todos");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (data) {
        // Load customer names from profiles
        const userIds = [...new Set(data.map((r: any) => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);

        const nameMap: Record<string, string> = {};
        profiles?.forEach((p: any) => { nameMap[p.user_id] = p.display_name || "Cliente"; });

        setReviews(data.map((r: any) => ({
          ...r,
          customer_name: nameMap[r.user_id] || "Cliente",
        })));
      }
      setLoading(false);
    };
    load();

    // Realtime for new reviews
    const channel = supabase
      .channel('store-reviews')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews', filter: `store_id=eq.${storeId}` },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", (payload.new as any).user_id)
            .single();
          const newReview: Review = {
            ...(payload.new as any),
            customer_name: profile?.display_name || "Cliente",
          };
          setReviews(prev => [newReview, ...prev]);
          toast.info("⭐ Nova avaliação recebida!");
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [storeId]);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from("reviews")
      .update({ reply: replyText.trim(), replied_at: new Date().toISOString() })
      .eq("id", reviewId);
    setSending(false);
    if (error) { toast.error("Erro ao enviar resposta"); return; }
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: replyText.trim(), replied_at: new Date().toISOString() } : r));
    setReplyingId(null);
    setReplyText("");
    toast.success("Resposta enviada!");
  };

  const filtered = filter === "pendentes" ? reviews.filter(r => !r.reply)
    : filter === "respondidos" ? reviews.filter(r => !!r.reply) : reviews;

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const fiveStars = reviews.filter(r => r.rating === 5).length;
  const repliedCount = reviews.filter(r => !!r.reply).length;
  const pendingCount = reviews.filter(r => !r.reply).length;

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl h-20 animate-pulse border border-border" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Star size={18} className="text-amber-500 fill-amber-500" />
            </div>
            <p className="text-sm font-semibold text-foreground">Nota média</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground mt-1">{reviews.length} avaliação(ões)</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ThumbsUp size={18} className="text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-foreground">5 estrelas</p>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{fiveStars}</p>
          <p className="text-xs text-muted-foreground mt-1">{reviews.length > 0 ? ((fiveStars / reviews.length) * 100).toFixed(0) : 0}% do total</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <MessageSquare size={18} className="text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-foreground">Pendentes</p>
          </div>
          <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Aguardando resposta</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Taxa de resposta</p>
          </div>
          <p className="text-3xl font-bold text-primary">{reviews.length > 0 ? ((repliedCount / reviews.length) * 100).toFixed(0) : 0}%</p>
        </div>
      </div>

      {/* Rating distribution */}
      {reviews.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground text-lg mb-4">Distribuição de notas</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(n => {
              const count = reviews.filter(r => r.rating === n).length;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground w-6">{n}</span>
                  <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(["todos", "pendentes", "respondidos"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f === "todos" ? `Todos (${reviews.length})` : f === "pendentes" ? `Pendentes (${pendingCount})` : `Respondidos (${repliedCount})`}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Star size={32} className="text-muted-foreground/40" />
          </div>
          <p className="font-bold text-foreground text-lg">
            {reviews.length === 0 ? "Nenhuma avaliação ainda" : "Nenhuma avaliação neste filtro"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {reviews.length === 0 ? "As avaliações dos clientes aparecerão aqui" : "Tente outro filtro"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:shadow-black/5 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-foreground">{r.customer_name}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"} />
                      ))}
                    </div>
                    {r.reply ? (
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-500/20">RESPONDIDO</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-500/20">PENDENTE</span>
                    )}
                  </div>
                  {r.comment && <p className="text-sm text-foreground mt-1">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    Pedido #{r.order_id.slice(0, 8)} • {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </p>

                  {/* Show reply */}
                  {r.reply && (
                    <div className="mt-3 bg-muted/30 rounded-xl p-3 border border-border">
                      <p className="text-xs font-bold text-muted-foreground mb-1">Sua resposta:</p>
                      <p className="text-sm text-foreground">{r.reply}</p>
                      {r.replied_at && <p className="text-xs text-muted-foreground mt-1">{new Date(r.replied_at).toLocaleDateString("pt-BR")}</p>}
                    </div>
                  )}

                  {/* Reply form */}
                  <AnimatePresence>
                    {replyingId === r.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mt-3">
                        <div className="flex gap-2">
                          <input
                            value={replyText} onChange={e => setReplyText(e.target.value)}
                            placeholder="Escreva sua resposta..."
                            className="flex-1 h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                            onKeyDown={e => e.key === "Enter" && handleReply(r.id)}
                          />
                          <button onClick={() => handleReply(r.id)} disabled={!replyText.trim() || sending}
                            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5">
                            <Send size={14} /> {sending ? "..." : "Enviar"}
                          </button>
                          <button onClick={() => { setReplyingId(null); setReplyText(""); }}
                            className="h-10 w-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                            <X size={16} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {!r.reply && replyingId !== r.id && (
                  <button onClick={() => { setReplyingId(r.id); setReplyText(""); }}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shadow-primary/20">
                    <MessageSquare size={12} /> Responder
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

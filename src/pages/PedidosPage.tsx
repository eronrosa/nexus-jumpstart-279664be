import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingBag, Clock, ChevronDown, ChevronUp, Package, Star, Send, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  item_image: string | null;
}

interface Order {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  status: string;
  total: number;
  delivery_fee: number;
  created_at: string;
  order_items: OrderItem[];
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

const statusColor: Record<string, string> = {
  pendente: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  em_preparo: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  entregue: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelado: "bg-red-500/10 text-red-600 border-red-500/20",
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  em_preparo: "Em Preparo",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const PedidosPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { add, clear, items } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Review state
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (!error && data) setOrders(data as Order[]);
      setLoading(false);

      // Load which orders already have reviews
      const { data: reviews } = await supabase
        .from("reviews")
        .select("order_id")
        .eq("user_id", user.id);
      if (reviews) {
        setReviewedOrders(new Set(reviews.map((r: any) => r.order_id)));
      }
    };

    fetchOrders();

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel('orders-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const newStatus = (payload.new as any).status;
          const restaurantName = (payload.new as any).restaurant_name;
          setOrders(prev =>
            prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
          );
          const label = statusLabel[newStatus] ?? newStatus;
          toast.info(`Pedido atualizado: ${label}`);

          // Browser push notification
          if ("Notification" in window && Notification.permission === "granted") {
            const statusMessages: Record<string, string> = {
              em_preparo: "🍳 Seu pedido está sendo preparado!",
              entregue: "✅ Seu pedido foi entregue!",
              cancelado: "❌ Seu pedido foi cancelado.",
            };
            const body = statusMessages[newStatus] ?? `Status: ${label}`;
            new Notification(`${restaurantName}`, {
              body,
              icon: "/placeholder.svg",
              tag: payload.new.id as string,
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, authLoading, navigate]);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  const reorder = (order: Order) => {
    if (items.length > 0) clear();
    order.order_items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        add({
          id: item.id,
          restaurantId: order.restaurant_name,
          restaurantName: order.restaurant_name,
          name: item.item_name,
          price: item.item_price,
          image: item.item_image || "",
        });
      }
    });
    toast.success("Itens adicionados ao carrinho!");
    navigate("/zuufood");
  };

  const submitReview = async (order: Order) => {
    if (!user) return;
    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({
      order_id: order.id,
      store_id: order.restaurant_id,
      user_id: user.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    });
    setSubmittingReview(false);
    if (error) {
      if (error.code === "23505") toast.error("Você já avaliou este pedido");
      else toast.error("Erro ao enviar avaliação");
      return;
    }
    setReviewedOrders(prev => new Set(prev).add(order.id));
    setReviewingOrderId(null);
    setReviewRating(5);
    setReviewComment("");
    toast.success("Avaliação enviada! Obrigado ⭐");
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) +
      " • " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-foreground">Meus Pedidos</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl h-24 animate-pulse border border-border" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag size={36} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">Nenhum pedido ainda</p>
              <p className="text-muted-foreground text-sm mt-1">Seus pedidos do ZuuFood aparecerão aqui</p>
            </div>
            <button
              onClick={() => navigate("/zuufood")}
              className="mt-2 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl text-sm"
            >
              Pedir agora
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order, i) => {
              const canReview = order.status === "entregue" && !reviewedOrders.has(order.id);
              const alreadyReviewed = reviewedOrders.has(order.id);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden"
                >
                  {/* Order header */}
                  <button
                    className="w-full text-left px-4 py-4 flex items-start justify-between gap-3"
                    onClick={() => toggle(order.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Package size={18} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{order.restaurant_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock size={11} className="text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor[order.status] ?? statusColor.pendente}`}>
                        {statusLabel[order.status] ?? order.status}
                      </span>
                      <span className="text-sm font-bold text-foreground">{fmt(order.total)}</span>
                      {expanded === order.id ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Order details */}
                  {expanded === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border px-4 py-3 flex flex-col gap-2"
                    >
                      {order.order_items.map(item => (
                        <div key={item.id} className="flex items-center gap-3">
                          {item.item_image && (
                            <img src={item.item_image} alt={item.item_name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-medium truncate">{item.item_name}</p>
                            <p className="text-xs text-muted-foreground">{fmt(item.item_price)} × {item.quantity}</p>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{fmt(item.item_price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="mt-2 pt-2 border-t border-border flex justify-between text-sm">
                        <span className="text-muted-foreground">Entrega</span>
                        <span className="text-foreground">{order.delivery_fee === 0 ? "Grátis" : fmt(order.delivery_fee)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">{fmt(order.total)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => reorder(order)}
                          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors"
                        >
                          <RotateCcw size={16} /> Pedir novamente
                        </button>

                        {canReview && (
                          <button
                            onClick={() => { setReviewingOrderId(order.id); setReviewRating(5); setReviewComment(""); }}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-all"
                          >
                            <Star size={14} className="fill-amber-500" /> Avaliar
                          </button>
                        )}

                        {alreadyReviewed && (
                          <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20">
                            <Star size={12} className="fill-emerald-500" /> Avaliado
                          </span>
                        )}
                      </div>

                      {/* Review form */}
                      <AnimatePresence>
                        {reviewingOrderId === order.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                            <p className="text-sm font-bold text-foreground">Como foi seu pedido?</p>

                            {/* Star rating */}
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} onClick={() => setReviewRating(n)} className="p-0.5">
                                  <Star size={28}
                                    className={n <= reviewRating
                                      ? "text-amber-500 fill-amber-500 transition-colors"
                                      : "text-muted-foreground/30 transition-colors hover:text-amber-300"}
                                  />
                                </button>
                              ))}
                              <span className="text-sm font-bold text-foreground ml-2">{reviewRating}/5</span>
                            </div>

                            {/* Comment */}
                            <textarea
                              value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                              placeholder="Deixe um comentário (opcional)..."
                              rows={2}
                              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                            />

                            <div className="flex gap-2">
                              <button onClick={() => setReviewingOrderId(null)}
                                className="flex-1 border border-border text-foreground font-semibold py-2.5 rounded-xl text-sm hover:bg-secondary transition-all">
                                Cancelar
                              </button>
                              <button onClick={() => submitReview(order)} disabled={submittingReview}
                                className="flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5">
                                <Send size={14} /> {submittingReview ? "Enviando..." : "Enviar avaliação"}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PedidosPage;

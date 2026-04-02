import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, Clock, ChevronDown, ChevronUp, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

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
    };

    fetchOrders();
  }, [user, authLoading, navigate]);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

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
            {orders.map((order, i) => (
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

                {/* Order items */}
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
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PedidosPage;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Star, Clock, ShoppingCart, Plus, Minus,
  Trash2, ChevronRight, X, MapPin, Bike, CheckCircle, Store as StoreIcon,
  CreditCard, Banknote, Smartphone, Tag, Home, Building, Mic,
  SlidersHorizontal, Heart, User, Phone, Share2, Wifi, ParkingCircle,
  Music, UtensilsCrossed, Package, Users, ChevronDown, ShieldCheck,
  CalendarDays, ChefHat, Flame, Sparkles, BadgePercent, Trophy
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/* ─── Types ─── */
interface MenuItemData {
  id: string; category: string; name: string; price: number; image: string; description: string;
}
interface RestaurantData {
  id: string; name: string; category: string; rating: number; reviewCount: number;
  deliveryTime: string; minOrder: number; deliveryFee: number; promo: string;
  image: string; logo: string; menu: MenuItemData[]; isDynamic?: boolean;
  openingHours?: any[]; isOpen?: boolean; promotions?: PromotionData[];
}
interface PromotionData {
  id: string; title: string; description: string | null; discount_type: string;
  discount_value: number; min_order: number; coupon_code: string | null;
}
interface AddressData {
  id: string; label: string; street: string; number: string; neighborhood: string;
  city: string; state: string; complement: string | null; zip_code: string; is_default: boolean;
}

/* ─── Static fallback data ─── */
const CATEGORIES = ["Todos", "Japonês", "Hambúrguer", "Pizza", "Lanches", "Saudável", "Sobremesas", "Árabe"];

const FOOD_ICONS = [
  { label: "Pizza", image: "https://img.icons8.com/color/96/pizza.png" },
  { label: "Hambúrguer", image: "https://img.icons8.com/color/96/hamburger.png" },
  { label: "Lanches", image: "https://img.icons8.com/color/96/hot-dog.png" },
  { label: "Sopa", image: "https://img.icons8.com/color/96/soup-plate.png" },
  { label: "Japonês", image: "https://img.icons8.com/color/96/sushi.png" },
  { label: "Café", image: "https://img.icons8.com/color/96/coffee-to-go.png" },
  { label: "Sobremesas", image: "https://img.icons8.com/color/96/cake.png" },
  { label: "Saudável", image: "https://img.icons8.com/color/96/salad.png" },
];

const CUISINES = [
  { label: "Brasileira", image: "https://img.icons8.com/color/48/brazil-circular.png" },
  { label: "Japonesa", image: "https://img.icons8.com/color/48/japan-circular.png" },
  { label: "Italiana", image: "https://img.icons8.com/color/48/italy-circular.png" },
  { label: "Mexicana", image: "https://img.icons8.com/color/48/mexico-circular.png" },
  { label: "Árabe", image: "https://img.icons8.com/color/48/saudi-arabia-circular.png" },
];

const FOOD_BANNERS = [
  { image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80&fit=crop", tag: "Oferta Especial", title: "Chicken Burger", subtitle: "Até 50% OFF", cta: "Peça agora" },
  { image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&fit=crop", tag: "Novidade", title: "Pizza Artesanal", subtitle: "A partir de R$ 29,90", cta: "Ver cardápio" },
  { image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80&fit=crop", tag: "Promo", title: "Combo Japonês", subtitle: "30 peças + Bebida", cta: "Aproveitar" },
];

function FoodBannerCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % FOOD_BANNERS.length), 4000);
    return () => clearInterval(id);
  }, []);

  const b = FOOD_BANNERS[current];

  return (
    <div className="relative rounded-2xl overflow-hidden h-44">
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0">
          <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground bg-primary/80 px-2 py-0.5 rounded-md w-fit mb-1.5">{b.tag}</span>
            <p className="text-xs text-white/80">{b.subtitle}</p>
            <h3 className="text-xl font-extrabold text-white leading-tight">{b.title}</h3>
            <button className="mt-2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full w-fit hover:opacity-90 transition-opacity">{b.cta}</button>
          </div>
        </motion.div>
      </AnimatePresence>
      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {FOOD_BANNERS.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white w-5" : "bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
}

const STATIC_RESTAURANTS: RestaurantData[] = [
  {
    id: "r1", name: "Restaurante Mitsuba", category: "Japonês", rating: 4.8, reviewCount: 0,
    deliveryTime: "30-45 min", minOrder: 25, deliveryFee: 0, promo: "Frete grátis",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80&fit=crop",
    logo: "https://img.icons8.com/color/96/sushi.png",
    menu: [
      { id: "m1", category: "Entradas", name: "Temaki Salmão", price: 22.90, image: "https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&q=80&fit=crop", description: "Temaki com salmão fresco e cream cheese" },
      { id: "m2", category: "Entradas", name: "Edamame", price: 14.90, image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80&fit=crop", description: "Feijão de soja no vapor com sal" },
      { id: "m3", category: "Pratos", name: "Combinado 20 peças", price: 59.90, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=80&fit=crop", description: "Seleção de nigiris e sashimis frescos" },
      { id: "m4", category: "Pratos", name: "Hot Roll Salmão (8 un)", price: 34.90, image: "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=400&q=80&fit=crop", description: "Hot roll empanado com salmão e cream cheese" },
      { id: "m5", category: "Bebidas", name: "Saquê Quente", price: 18.00, image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80&fit=crop", description: "Saquê tradicional japonês servido quente" },
    ],
  },
  {
    id: "r2", name: "Le Max Hamburgueria", category: "Hambúrguer", rating: 4.7, reviewCount: 0,
    deliveryTime: "25-40 min", minOrder: 30, deliveryFee: 5.90, promo: "",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80&fit=crop",
    logo: "https://img.icons8.com/color/96/hamburger.png",
    menu: [
      { id: "b1", category: "Burgers", name: "Le Max Clássico", price: 34.90, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80&fit=crop", description: "Pão brioche, 180g de blend, queijo cheddar e molho especial" },
      { id: "b2", category: "Burgers", name: "Bacon Supreme", price: 42.90, image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80&fit=crop", description: "Duplo blend, bacon crocante, cebola caramelizada" },
      { id: "b3", category: "Burgers", name: "Veggie Burger", price: 32.90, image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&q=80&fit=crop", description: "Blend de grão-de-bico, rúcula e tomate seco" },
      { id: "b4", category: "Acompanhamentos", name: "Batata Frita Crocante", price: 18.90, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80&fit=crop", description: "Batata frita temperada com alecrim" },
      { id: "b5", category: "Bebidas", name: "Milk Shake Chocolate", price: 22.90, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80&fit=crop", description: "Milk shake cremoso de chocolate belga" },
    ],
  },
  {
    id: "r3", name: "Pizza Palace", category: "Pizza", rating: 4.6, reviewCount: 0,
    deliveryTime: "35-50 min", minOrder: 40, deliveryFee: 0, promo: "2 por 1 às terças",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&fit=crop",
    logo: "https://img.icons8.com/color/96/pizza.png",
    menu: [
      { id: "p1", category: "Pizzas Salgadas", name: "Calabresa Acebolada", price: 49.90, image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=400&q=80&fit=crop", description: "Molho de tomate, mussarela, calabresa e cebola" },
      { id: "p2", category: "Pizzas Salgadas", name: "Frango com Catupiry", price: 52.90, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80&fit=crop", description: "Frango desfiado, catupiry e azeitona" },
      { id: "p3", category: "Pizzas Salgadas", name: "4 Queijos", price: 55.90, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80&fit=crop", description: "Mussarela, provolone, gorgonzola e parmesão" },
      { id: "p4", category: "Pizzas Doces", name: "Chocolate com Morango", price: 48.90, image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&q=80&fit=crop", description: "Chocolate ao leite com morangos frescos" },
      { id: "p5", category: "Bebidas", name: "Refrigerante 2L", price: 12.90, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80&fit=crop", description: "Coca-Cola, Guaraná ou Fanta laranja" },
    ],
  },
  {
    id: "r4", name: "Bondinho Carioca", category: "Lanches", rating: 4.5, reviewCount: 0,
    deliveryTime: "20-35 min", minOrder: 20, deliveryFee: 3.90, promo: "",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80&fit=crop",
    logo: "https://img.icons8.com/color/96/hot-dog.png",
    menu: [
      { id: "l1", category: "Lanches", name: "X-Tudo Carioca", price: 24.90, image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80&fit=crop", description: "Pão, hambúrguer, ovo, bacon, presunto e queijo" },
      { id: "l2", category: "Lanches", name: "Coxinha Cremosa (3 un)", price: 19.90, image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&q=80&fit=crop", description: "Coxinha de frango com requeijão cremoso" },
      { id: "l3", category: "Lanches", name: "Pastel de Queijo (2 un)", price: 16.90, image: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=400&q=80&fit=crop", description: "Pastel crocante recheado com queijo derretido" },
      { id: "l4", category: "Bebidas", name: "Suco Natural 500ml", price: 11.90, image: "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=400&q=80&fit=crop", description: "Laranja, maracujá ou limão" },
    ],
  },
];

const CATEGORY_COVERS: Record<string, string> = {
  "Restaurante": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&fit=crop",
  "Hamburgueria": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80&fit=crop",
  "Pizzaria": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&fit=crop",
  "Japonês": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80&fit=crop",
  "Lanchonete": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80&fit=crop",
  "Farmácia": "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80&fit=crop",
  "Floricultura": "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&q=80&fit=crop",
  "Mercado": "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80&fit=crop",
};

const CATEGORY_LOGOS: Record<string, string> = {
  "Restaurante": "https://img.icons8.com/color/96/restaurant.png",
  "Hamburgueria": "https://img.icons8.com/color/96/hamburger.png",
  "Pizzaria": "https://img.icons8.com/color/96/pizza.png",
  "Japonês": "https://img.icons8.com/color/96/sushi.png",
  "Lanchonete": "https://img.icons8.com/color/96/hot-dog.png",
  "Farmácia": "https://img.icons8.com/color/96/pill.png",
  "Floricultura": "https://img.icons8.com/color/96/flower.png",
  "Mercado": "https://img.icons8.com/color/96/shopping-cart.png",
};

const PAYMENT_METHODS = [
  { id: "pix", label: "PIX", icon: Smartphone },
  { id: "credit", label: "Cartão de Crédito", icon: CreditCard },
  { id: "debit", label: "Cartão de Débito", icon: CreditCard },
  { id: "cash", label: "Dinheiro", icon: Banknote },
];

const DAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/* ─── Helpers ─── */
const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

function isStoreOpen(openingHours: any[] | null | undefined): boolean {
  if (!openingHours || openingHours.length === 0) return true; // assume open if no hours set
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const todayHours = openingHours.find((h: any) => h.day === dayName);
  if (!todayHours || !todayHours.enabled) return false;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
}

/* ─── Cart Drawer with Checkout ─── */
function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, increment, decrement, remove, updateNotes, total, count, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ordered, setOrdered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState("pix");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [minOrder, setMinOrder] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<PromotionData | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const restaurantId = items[0]?.restaurantId;

  // Load addresses + delivery info when entering checkout
  useEffect(() => {
    if (step !== "checkout" || !user) return;
    supabase.from("addresses").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data && data.length > 0) {
        setAddresses(data as AddressData[]);
        const def = data.find((a: any) => a.is_default);
        setSelectedAddress(prev => prev ?? (def?.id || data[0].id));
      }
    });
    if (restaurantId) {
      supabase.from("delivery_zones").select("delivery_fee, min_order, estimated_time")
        .eq("store_id", restaurantId).eq("is_active", true)
        .order("radius_km", { ascending: true }).limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setDeliveryFee(Number(data.delivery_fee));
            setMinOrder(Number(data.min_order));
            setEstimatedTime(data.estimated_time ?? "");
          } else {
            setDeliveryFee(0); setMinOrder(0); setEstimatedTime("");
          }
        });
    }
  }, [step, user, restaurantId]);

  // Compute discount
  const discount = (() => {
    if (!appliedCoupon) return 0;
    if (total < Number(appliedCoupon.min_order || 0)) return 0;
    const v = Number(appliedCoupon.discount_value);
    if (appliedCoupon.discount_type === "percent" || appliedCoupon.discount_type === "percentage") {
      return Math.min(total, (total * v) / 100);
    }
    return Math.min(total, v);
  })();

  const grandTotal = Math.max(0, total - discount) + deliveryFee;
  const belowMin = minOrder > 0 && total < minOrder;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code || !restaurantId) return;
    setValidatingCoupon(true);
    const { data, error } = await supabase
      .from("store_promotions")
      .select("id, title, description, discount_type, discount_value, min_order, coupon_code")
      .eq("store_id", restaurantId)
      .eq("is_active", true)
      .ilike("coupon_code", code)
      .maybeSingle();
    setValidatingCoupon(false);
    if (error || !data) { toast.error("Cupom inválido"); return; }
    if (total < Number(data.min_order || 0)) {
      toast.error(`Pedido mínimo de ${fmt(Number(data.min_order))} para este cupom`);
      return;
    }
    setAppliedCoupon(data as PromotionData);
    toast.success(`Cupom "${data.title}" aplicado!`);
  };

  const handleOrder = async () => {
    if (items.length === 0) return;
    if (!user) { onClose(); navigate("/auth"); return; }
    if (step === "cart") { setStep("checkout"); return; }
    if (addresses.length === 0) {
      toast.error("Cadastre um endereço para continuar");
      return;
    }
    if (!selectedAddress) {
      toast.error("Selecione um endereço de entrega");
      return;
    }
    if (belowMin) {
      toast.error(`Pedido mínimo de ${fmt(minOrder)}`);
      return;
    }
    setSaving(true);
    let createdOrderId: string | null = null;
    try {
      const restaurant = items[0];
      const addr = addresses.find(a => a.id === selectedAddress);
      const addressSnapshot = addr ? {
        label: addr.label, street: addr.street, number: addr.number,
        neighborhood: addr.neighborhood, city: addr.city, state: addr.state,
        complement: addr.complement, zip_code: addr.zip_code,
      } : null;

      const { data: orderData, error: orderError } = await supabase
        .from("orders").insert({
          user_id: user.id,
          restaurant_id: restaurant.restaurantId,
          restaurant_name: restaurant.restaurantName,
          status: "pendente",
          total: grandTotal,
          delivery_fee: deliveryFee,
          payment_method: selectedPayment,
          address_snapshot: addressSnapshot,
          notes: notes.trim() || null,
          coupon_code: appliedCoupon?.coupon_code ?? null,
          discount,
          estimated_time: estimatedTime || null,
        }).select().maybeSingle();
      if (orderError) throw orderError;
      if (!orderData) throw new Error("Falha ao criar pedido");
      createdOrderId = orderData.id;

      const orderItems = items.map(item => ({
        order_id: orderData.id, item_id: item.id, item_name: item.name,
        item_price: item.price, quantity: item.qty, item_image: item.image,
        notes: item.notes?.trim() || null,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      setSaving(false);
      setOrdered(true);
      setTimeout(() => {
        setOrdered(false); setStep("cart"); clear(); onClose();
        setNotes(""); setCouponInput(""); setAppliedCoupon(null);
      }, 2800);
    } catch (err) {
      console.error("Erro ao salvar pedido:", err);
      // Rollback: remove parent order if items failed
      if (createdOrderId) {
        await supabase.from("orders").delete().eq("id", createdOrderId);
      }
      toast.error("Erro ao salvar pedido. Tente novamente.");
      setSaving(false);
    }
  };

  const handleClose = () => { setStep("cart"); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40" onClick={handleClose} />
          <motion.div key="drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-card shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                {step === "checkout" ? (
                  <button onClick={() => setStep("cart")} className="p-1 text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
                ) : (
                  <ShoppingCart size={18} className="text-primary" />
                )}
                <span className="font-bold text-foreground">{step === "checkout" ? "Finalizar Pedido" : "Carrinho"}</span>
                {count > 0 && step === "cart" && <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>}
              </div>
              <button onClick={handleClose} className="p-1 text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {ordered ? (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-full gap-4 p-8">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}>
                      <CheckCircle size={64} className="text-emerald-500" />
                    </motion.div>
                    <p className="font-bold text-xl text-foreground text-center">Pedido realizado!</p>
                    <p className="text-sm text-muted-foreground text-center">Seu pedido foi enviado e chegará em breve</p>
                  </motion.div>
                ) : items.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
                    <ShoppingCart size={48} className="text-muted-foreground/30" />
                    <p className="font-semibold text-muted-foreground">Carrinho vazio</p>
                    <p className="text-xs text-muted-foreground">Adicione itens de um restaurante para começar</p>
                  </motion.div>
                ) : step === "cart" ? (
                  <motion.div key="items" className="p-4 space-y-3">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1.5">
                      <MapPin size={12} /> {items[0]?.restaurantName}
                    </p>
                    {items.map(item => (
                      <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                        className="bg-secondary/50 rounded-xl p-2.5 space-y-2">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <StoreIcon size={16} className="text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight truncate">{item.name}</p>
                            <p className="text-xs text-primary font-bold mt-0.5">{fmt(item.price)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => decrement(item.id)} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-border transition-colors"><Minus size={12} /></button>
                            <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                            <button onClick={() => increment(item.id)} className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"><Plus size={12} /></button>
                            <button onClick={() => remove(item.id)} className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center ml-1 hover:bg-destructive/20 transition-colors"><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <input
                          value={item.notes ?? ""}
                          onChange={e => updateNotes(item.id, e.target.value)}
                          placeholder="Ex: sem cebola, sem tomate, ao ponto..."
                          maxLength={200}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  /* ── Checkout step ── */
                  <motion.div key="checkout" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 space-y-5">
                    {/* Address */}
                    <div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5"><MapPin size={13} /> Endereço de entrega</p>
                      {addresses.length === 0 ? (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                          <p className="text-xs text-amber-700 mb-2">Nenhum endereço cadastrado</p>
                          <button onClick={() => { handleClose(); navigate("/perfil"); }} className="text-xs font-bold text-primary">Cadastrar endereço</button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {addresses.map(addr => (
                            <button key={addr.id} onClick={() => setSelectedAddress(addr.id)}
                              className={`w-full text-left p-3 rounded-xl border transition-all ${selectedAddress === addr.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border bg-card hover:border-primary/30"}`}>
                              <div className="flex items-center gap-2">
                                {addr.label === "Casa" ? <Home size={14} className="text-primary shrink-0" /> : <Building size={14} className="text-primary shrink-0" />}
                                <span className="text-sm font-bold text-foreground">{addr.label}</span>
                                {addr.is_default && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">Padrão</span>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{addr.street}, {addr.number} - {addr.neighborhood}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment */}
                    <div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5"><CreditCard size={13} /> Forma de pagamento</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHODS.map(pm => (
                          <button key={pm.id} onClick={() => setSelectedPayment(pm.id)}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${selectedPayment === pm.id ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                            <pm.icon size={16} />
                            {pm.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Coupon */}
                    <div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5"><Tag size={13} /> Cupom de desconto</p>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-emerald-700 truncate">{appliedCoupon.title}</p>
                            <p className="text-xs text-emerald-600">-{fmt(discount)}</p>
                          </div>
                          <button onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}
                            className="text-xs font-bold text-destructive">Remover</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="Inserir código" maxLength={30}
                            className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                          <button onClick={applyCoupon} disabled={validatingCoupon || !couponInput.trim()}
                            className="bg-primary text-primary-foreground font-bold px-4 rounded-xl text-sm disabled:opacity-50">
                            {validatingCoupon ? "..." : "Aplicar"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">Observações (opcional)</p>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Ex: sem cebola, ponto da carne, troco para R$ 50..." rows={2} maxLength={300}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
                    </div>

                    {/* Order summary */}
                    <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide">Resumo</p>
                        {estimatedTime && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} /> {estimatedTime}</span>
                        )}
                      </div>
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                          <span>{item.qty}× {item.name}</span>
                          <span>{fmt(item.price * item.qty)}</span>
                        </div>
                      ))}
                      {belowMin && (
                        <p className="text-xs text-destructive font-semibold pt-1">
                          Pedido mínimo: {fmt(minOrder)} (faltam {fmt(minOrder - total)})
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {items.length > 0 && !ordered && (
              <div className="p-4 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold text-foreground">{fmt(total)}</span>
                </div>
                {step === "checkout" && discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Tag size={13} /> Desconto</span>
                    <span className="font-semibold text-emerald-600">-{fmt(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><Bike size={13} /> Entrega</span>
                  <span className={`font-semibold ${deliveryFee === 0 && step === "checkout" ? "text-emerald-600" : "text-foreground"}`}>
                    {step === "checkout" ? (deliveryFee === 0 ? "Grátis" : fmt(deliveryFee)) : "Calculado no checkout"}
                  </span>
                </div>
                {step === "checkout" && (
                  <div className="flex items-center justify-between font-bold text-base border-t border-border pt-2">
                    <span>Total</span>
                    <span className="text-primary">{fmt(grandTotal)}</span>
                  </div>
                )}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleOrder}
                  disabled={saving || (step === "checkout" && (belowMin || addresses.length === 0))}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? "Finalizando..." : step === "cart" ? `Continuar · ${fmt(total)}` : belowMin ? `Mínimo ${fmt(minOrder)}` : `Confirmar pedido · ${fmt(grandTotal)}`}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Main page ─── */
const ZuuFood = () => {
  const navigate = useNavigate();
  const { add, count, items } = useCart();
  const { user, profile } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantData | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [allRestaurants, setAllRestaurants] = useState<RestaurantData[]>(STATIC_RESTAURANTS);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [reserveDate, setReserveDate] = useState("");
  const [reserveTime, setReserveTime] = useState("");
  const [reserveGuests, setReserveGuests] = useState(2);
  const [reserveName, setReserveName] = useState(profile?.display_name ?? "");
  const [reservePhone, setReservePhone] = useState(profile?.phone ?? "");
  const [reserveNotes, setReserveNotes] = useState("");
  const [reserving, setReserving] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Load user favorites
  useEffect(() => {
    if (!user) { setFavoriteIds(new Set()); return; }
    supabase.from("favorite_stores").select("store_id").eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setFavoriteIds(new Set(data.map((f: any) => f.store_id)));
      });
  }, [user]);

  const toggleFavorite = async (e: React.MouseEvent, storeId: string) => {
    e.stopPropagation();
    if (!user) { toast.error("Faça login para favoritar"); navigate("/auth"); return; }
    const isFav = favoriteIds.has(storeId);
    if (isFav) {
      setFavoriteIds(prev => { const n = new Set(prev); n.delete(storeId); return n; });
      await supabase.from("favorite_stores").delete().eq("user_id", user.id).eq("store_id", storeId);
      toast.success("Removido dos favoritos");
    } else {
      setFavoriteIds(prev => new Set(prev).add(storeId));
      await supabase.from("favorite_stores").insert({ user_id: user.id, store_id: storeId });
      toast.success("Adicionado aos favoritos ❤️");
    }
  };

  // Load dynamic stores + real ratings + delivery zones + promotions
  useEffect(() => {
    const loadStores = async () => {
      const { data: stores } = await supabase
        .from("stores")
        .select("id, name, category, logo_url, cover_url, description, is_active, opening_hours")
        .eq("is_active", true);

      if (!stores || stores.length === 0) return;

      // Fetch real ratings
      const storeIds = stores.map(s => s.id);
      const { data: reviewsData } = await supabase
        .from("reviews").select("store_id, rating").in("store_id", storeIds);

      const ratingMap: Record<string, { sum: number; count: number }> = {};
      reviewsData?.forEach((r: any) => {
        if (!ratingMap[r.store_id]) ratingMap[r.store_id] = { sum: 0, count: 0 };
        ratingMap[r.store_id].sum += r.rating;
        ratingMap[r.store_id].count += 1;
      });

      // Fetch delivery zones
      const { data: zonesData } = await supabase
        .from("delivery_zones").select("store_id, delivery_fee, estimated_time")
        .in("store_id", storeIds).eq("is_active", true)
        .order("radius_km", { ascending: true });

      const zoneMap: Record<string, { fee: number; time: string }> = {};
      zonesData?.forEach((z: any) => {
        if (!zoneMap[z.store_id]) zoneMap[z.store_id] = { fee: Number(z.delivery_fee), time: z.estimated_time };
      });

      // Fetch active promotions
      const { data: promosData } = await supabase
        .from("store_promotions").select("id, store_id, title, description, discount_type, discount_value, min_order, coupon_code")
        .in("store_id", storeIds).eq("is_active", true);

      const promoMap: Record<string, PromotionData[]> = {};
      promosData?.forEach((p: any) => {
        if (!promoMap[p.store_id]) promoMap[p.store_id] = [];
        promoMap[p.store_id].push(p);
      });

      const dynamicRestaurants: RestaurantData[] = stores.map(store => {
        const r = ratingMap[store.id];
        const z = zoneMap[store.id];
        const openHours = store.opening_hours as any[] | null;
        return {
          id: store.id,
          name: store.name,
          category: store.category,
          rating: r ? r.sum / r.count : 0,
          reviewCount: r?.count ?? 0,
          deliveryTime: z?.time || "30-50 min",
          minOrder: 20,
          deliveryFee: z?.fee ?? 0,
          promo: promoMap[store.id]?.[0]?.title || "",
          image: store.cover_url || CATEGORY_COVERS[store.category] || CATEGORY_COVERS["Restaurante"],
          logo: store.logo_url || CATEGORY_LOGOS[store.category] || CATEGORY_LOGOS["Restaurante"],
          menu: [],
          isDynamic: true,
          openingHours: openHours || [],
          isOpen: isStoreOpen(openHours),
          promotions: promoMap[store.id] || [],
        };
      });

      setAllRestaurants([...dynamicRestaurants, ...STATIC_RESTAURANTS]);
    };
    loadStores();
  }, []);

  const handleSelectRestaurant = async (r: RestaurantData) => {
    if (r.isDynamic && r.isOpen === false) {
      toast.error("Este estabelecimento está fechado no momento");
      return;
    }
    if (r.isDynamic && r.menu.length === 0) {
      setLoadingMenu(true);
      setSelectedRestaurant(r);
      const { data: menuItems } = await supabase
        .from("menu_items").select("*").eq("store_id", r.id).eq("is_available", true)
        .order("sort_order", { ascending: true }).order("created_at", { ascending: true });

      if (menuItems && menuItems.length > 0) {
        const mappedMenu: MenuItemData[] = menuItems.map(mi => ({
          id: mi.id, category: mi.category, name: mi.name,
          price: Number(mi.price), image: mi.image_url || "", description: mi.description || "",
        }));
        const updated = { ...r, menu: mappedMenu };
        setSelectedRestaurant(updated);
        setAllRestaurants(prev => prev.map(rest => rest.id === r.id ? updated : rest));
      }
      setLoadingMenu(false);
    } else {
      setSelectedRestaurant(r);
    }
  };

  const filtered = allRestaurants.filter(r => {
    const matchCat = activeCategory === "Todos" || r.category === activeCategory;
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAdd = (item: MenuItemData, restaurant: RestaurantData) => {
    if (items.length > 0 && items[0].restaurantId !== restaurant.id) {
      toast.error("Você só pode pedir de um restaurante por vez. Limpe o carrinho antes.");
      return;
    }
    // Min order is validated at checkout, just add
    add({
      id: item.id, restaurantId: restaurant.id, restaurantName: restaurant.name,
      name: item.name, price: item.price, image: item.image,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 800);
  };

  const menuGroups = selectedRestaurant
    ? selectedRestaurant.menu.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, MenuItemData[]>)
    : {};

  const handleShare = async () => {
    if (!selectedRestaurant) return;
    const url = window.location.href;
    const text = `Confira ${selectedRestaurant.name} no ZuuFood!`;
    if (navigator.share) {
      try { await navigator.share({ title: selectedRestaurant.name, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Link copiado!");
    }
  };

  const handleChatWithStore = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!selectedRestaurant?.isDynamic) { toast.info("Chat disponível apenas para lojas cadastradas"); return; }
    // Find or create conversation with store owner
    const { data: storeData } = await supabase.from("stores").select("owner_id").eq("id", selectedRestaurant.id).single();
    if (!storeData) { toast.error("Loja não encontrada"); return; }
    if (storeData.owner_id === user.id) { toast.info("Você é o dono desta loja"); return; }
    // Check existing conversation
    const { data: myConvs } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", user.id);
    const { data: ownerConvs } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", storeData.owner_id);
    if (myConvs && ownerConvs) {
      const myIds = new Set(myConvs.map(c => c.conversation_id));
      const common = ownerConvs.find(c => myIds.has(c.conversation_id));
      if (common) { navigate("/zuuchat"); return; }
    }
    // Create new private conversation
    const { data: conv, error } = await supabase.from("conversations").insert({ created_by: user.id, type: "private", name: selectedRestaurant.name }).select().single();
    if (error || !conv) { toast.error("Erro ao iniciar conversa"); return; }
    await supabase.from("conversation_members").insert([
      { conversation_id: conv.id, user_id: user.id, role: "member" },
      { conversation_id: conv.id, user_id: storeData.owner_id, role: "admin" },
    ]);
    navigate("/zuuchat");
  };

  const handleReserve = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!selectedRestaurant?.isDynamic) { toast.info("Reservas disponíveis apenas para lojas cadastradas"); return; }
    if (!reserveDate || !reserveTime || !reserveName.trim()) { toast.error("Preencha data, horário e nome"); return; }
    setReserving(true);
    const { error } = await supabase.from("reservations").insert({
      store_id: selectedRestaurant.id,
      user_id: user.id,
      reservation_date: reserveDate,
      reservation_time: reserveTime,
      guests: reserveGuests,
      guest_name: reserveName.trim(),
      guest_phone: reservePhone.trim() || null,
      notes: reserveNotes.trim() || null,
    });
    setReserving(false);
    if (error) { toast.error("Erro ao reservar"); return; }
    toast.success("Reserva enviada! O restaurante irá confirmar em breve.");
    setReserveOpen(false);
    setReserveNotes("");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {!selectedRestaurant ? (
        <>
          {/* ── HEADER ── */}
          <div className="sticky top-0 z-20 bg-[hsl(25_100%_96%)] dark:bg-card px-4 pt-4 pb-3">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingCart size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">
                      {user ? (profile?.display_name ?? "Usuário") : "ZuuFood"}
                    </p>
                    <button onClick={() => navigate("/")} className="text-[11px] text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
                      <MapPin size={10} className="text-primary" /> Sua localização
                      <ChevronRight size={10} className="rotate-90" />
                    </button>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setCartOpen(true)}
                  className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3.5 py-2 text-sm font-semibold text-foreground shadow-sm">
                  <ShoppingCart size={14} className="text-primary" />
                  {count > 0 ? <span className="text-primary font-bold">{count}</span> : <span>Carrinho</span>}
                </motion.button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar restaurante, comida..."
                  className="w-full bg-card border border-border rounded-full pl-10 pr-16 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm" />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Mic size={16} /></button>
                  <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><SlidersHorizontal size={16} /></button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">

            {/* Banner Carousel */}
            <FoodBannerCarousel />

            {/* What's your favourite food? - Large icons without boxes */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Qual sua comida favorita?</h2>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
                {FOOD_ICONS.map(food => (
                  <button key={food.label} onClick={() => {
                    const cat = CATEGORIES.includes(food.label) ? food.label : "Todos";
                    setActiveCategory(cat === activeCategory ? "Todos" : cat);
                  }}
                    className="flex flex-col items-center gap-1 shrink-0 transition-transform hover:scale-105">
                    <img src={food.image} alt={food.label} className={`w-12 h-12 object-contain transition-all ${
                      activeCategory === food.label ? "scale-110 drop-shadow-md" : ""
                    }`} />
                    <span className={`text-xs font-medium ${
                      activeCategory === food.label ? "text-primary font-bold" : "text-foreground"
                    }`}>{food.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Favourite Cuisines */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-3">Cozinhas favoritas</h2>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                {CUISINES.map(cuisine => (
                  <button key={cuisine.label}
                    className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2.5 text-sm whitespace-nowrap hover:border-primary/40 hover:bg-primary/5 transition-all shrink-0 shadow-sm">
                    <img src={cuisine.image} alt={cuisine.label} className="w-6 h-6 rounded-full object-cover" />
                    <span className="font-medium text-foreground">{cuisine.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Fastest Near You */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-foreground">Mais rápidos perto de você</h2>
                <button className="text-xs text-primary font-semibold">Ver todos</button>
              </div>

              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-12">Nenhum restaurante encontrado</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible">
                  {filtered.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleSelectRestaurant(r)}
                      className={`bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-lg transition-all shrink-0 snap-start ${
                        r.isOpen === false ? "opacity-60" : ""
                      }`}
                      style={{ width: "72vw", maxWidth: "320px" }}>
                      <div className="relative h-44 md:h-40">
                        <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        {r.deliveryFee === 0 && (
                          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                            <Bike size={12} /> Frete Grátis
                          </span>
                        )}
                        {r.promo && r.deliveryFee !== 0 && (
                          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                            <Tag size={11} /> {r.promo}
                          </span>
                        )}
                        <button onClick={e => toggleFavorite(e, r.id)} className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-colors shadow-sm ${favoriteIds.has(r.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
                          <Heart size={16} fill={favoriteIds.has(r.id) ? "currentColor" : "none"} />
                        </button>
                        {r.isOpen === false && (
                          <span className="absolute bottom-3 left-3 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">Fechado</span>
                        )}
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={r.logo} alt={r.name} className="w-9 h-9 rounded-xl border border-border bg-card object-cover shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-foreground text-sm truncate">{r.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{r.category} · {r.deliveryTime}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 bg-secondary/80 rounded-lg px-2 py-1">
                          <Star size={12} className="text-yellow-500" fill="currentColor" />
                          <span className="text-xs font-bold text-foreground">{r.rating > 0 ? r.rating.toFixed(1) : "Novo"}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* All restaurants vertical list */}
            {filtered.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground mb-3">Todos os restaurantes</h2>
                <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
                  {filtered.map((r, i) => (
                    <motion.div key={`list-${r.id}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleSelectRestaurant(r)}
                      className={`bg-card rounded-2xl border border-border p-3 flex gap-3 items-center cursor-pointer hover:shadow-md transition-shadow ${r.isOpen === false ? "opacity-60" : ""}`}>
                      <img src={r.logo} alt={r.name} className="w-14 h-14 rounded-xl border border-border bg-card object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.category}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-0.5 text-xs">
                            <Star size={11} className="text-yellow-500" fill="currentColor" />
                            <span className="font-semibold text-foreground">{r.rating > 0 ? r.rating.toFixed(1) : "Novo"}</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-0.5"><Clock size={10} /> {r.deliveryTime}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {r.deliveryFee === 0 ? <span className="text-emerald-600 font-semibold">Grátis</span> : fmt(r.deliveryFee)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around items-center py-2 z-50">
            <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-primary">
              <Home size={20} strokeWidth={1.8} />
              <span className="text-[10px] font-semibold">Food</span>
            </button>
            <button onClick={() => navigate("/")} className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground hover:text-primary transition-colors">
              <StoreIcon size={20} strokeWidth={1.8} />
              <span className="text-[10px] font-medium">Mercado</span>
            </button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setCartOpen(true)}
              className="w-12 h-12 -mt-5 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
              <ShoppingCart size={22} />
            </motion.button>
            <button onClick={() => setCartOpen(true)} className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground hover:text-primary transition-colors relative">
              <ShoppingCart size={20} strokeWidth={1.8} />
              <span className="text-[10px] font-medium">Carrinho</span>
              {count > 0 && (
                <span className="absolute -top-0.5 right-1.5 bg-primary text-primary-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{count}</span>
              )}
            </button>
            <button onClick={() => navigate(user ? "/perfil" : "/auth")} className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground hover:text-primary transition-colors">
              <User size={20} strokeWidth={1.8} />
              <span className="text-[10px] font-medium">Perfil</span>
            </button>
          </nav>
        </>
      ) : (
        <>
        {/* ── RESTAURANT DETAIL VIEW ── */}
        <div className="min-h-screen bg-background">
          {/* Hero banner with search overlay */}
          <div className="relative md:max-w-5xl xl:max-w-7xl md:mx-auto">
            <img src={selectedRestaurant.image} alt={selectedRestaurant.name} className="w-full h-56 md:h-72 lg:h-80 object-cover md:rounded-b-2xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:rounded-b-2xl" />
            <div className="absolute top-3 left-0 right-0 px-4 flex items-center gap-2">
              <button onClick={() => setSelectedRestaurant(null)} className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground shadow">
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input placeholder="Buscar no cardápio..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-card/90 backdrop-blur-sm rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none shadow" />
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setCartOpen(true)} className="relative w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground shadow">
                <ShoppingCart size={18} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{count}</span>
                )}
              </motion.button>
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-card" : "bg-card/50"}`} />
              ))}
            </div>
          </div>

          {/* Two-column layout on desktop */}
          <div className="md:max-w-5xl xl:max-w-7xl md:mx-auto md:grid md:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] md:gap-6 xl:gap-8 md:mt-4">
            {/* LEFT: Info sidebar */}
            <div className="md:sticky md:top-4 md:self-start">
              {/* Restaurant info card */}
              <div className="px-4 md:px-0 -mt-4 md:mt-0 relative z-10">
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    <StoreIcon size={14} className="text-primary" />
                    <span className="text-xs font-semibold text-primary">{selectedRestaurant.category}</span>
                  </div>

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <img src={selectedRestaurant.logo} alt={selectedRestaurant.name} className="w-12 h-12 rounded-xl border border-border bg-card object-cover" />
                      <div>
                        <h1 className="font-extrabold text-foreground text-lg leading-tight">{selectedRestaurant.name}</h1>
                        <p className="text-xs text-muted-foreground">{selectedRestaurant.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Tag size={14} />
                      </button>
                      <button onClick={e => selectedRestaurant && toggleFavorite(e, selectedRestaurant.id)} className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-colors ${selectedRestaurant && favoriteIds.has(selectedRestaurant.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
                        <Heart size={14} fill={selectedRestaurant && favoriteIds.has(selectedRestaurant.id) ? "currentColor" : "none"} />
                      </button>
                      <button onClick={handleShare} className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-emerald-500" />
                      {selectedRestaurant.isOpen !== false ? "Aberto agora" : "Fechado"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bike size={12} className="text-destructive" />
                      {selectedRestaurant.deliveryTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-500" fill="currentColor" />
                      <span className="font-bold text-foreground">{selectedRestaurant.rating > 0 ? selectedRestaurant.rating.toFixed(1) : "Novo"}</span>
                      {selectedRestaurant.reviewCount > 0 && (
                        <span className="underline">({selectedRestaurant.reviewCount > 1000 ? `${(selectedRestaurant.reviewCount / 1000).toFixed(0)}k+` : selectedRestaurant.reviewCount} avaliações)</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-emerald-500 text-card rounded-xl px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bike size={14} />
                        <span className="text-xs font-bold">
                          {selectedRestaurant.deliveryFee === 0 ? "Entrega grátis" : `Entrega ${fmt(selectedRestaurant.deliveryFee)}`}
                          {selectedRestaurant.minOrder > 0 && ` acima de ${fmt(selectedRestaurant.minOrder)}`}
                        </span>
                      </div>
                      {selectedRestaurant.promotions && selectedRestaurant.promotions.length > 0 && (
                        <span className="text-[11px] font-semibold flex items-center gap-0.5">
                          {selectedRestaurant.promotions.length} ofertas <ChevronDown size={12} />
                        </span>
                      )}
                    </div>
                    <button onClick={handleChatWithStore} className="w-10 h-10 rounded-full bg-emerald-500 text-card flex items-center justify-center shadow shrink-0" title="Chat com a loja">
                      <Phone size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Facilities */}
              <div className="px-4 md:px-0 mt-4">
                <h3 className="font-bold text-foreground mb-3">Facilidades</h3>
                <div className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {[
                    { icon: Wifi, label: "Wi-Fi" },
                    { icon: ParkingCircle, label: "Estacionamento" },
                    { icon: Music, label: "Ambiente" },
                    { icon: UtensilsCrossed, label: "Salão" },
                  ].map(f => (
                    <div key={f.label} className="flex flex-col items-center gap-1.5 p-2">
                      <div className="w-11 h-11 rounded-xl border border-border bg-card flex items-center justify-center">
                        <f.icon size={18} className="text-muted-foreground" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium text-center">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order type chips - side by side */}
              <div className="px-4 md:px-0 mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
                {[
                  { icon: Bike, label: "Delivery", active: true },
                  { icon: Package, label: "Retirada", active: false },
                  { icon: Users, label: "Pedido em grupo", active: false },
                ].map(opt => (
                  <button key={opt.label} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0 transition-colors ${
                    opt.active
                      ? "bg-destructive text-destructive-foreground border-destructive"
                      : "bg-card text-foreground border-border hover:border-primary/40"
                  }`}>
                    <opt.icon size={14} />
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Certifications */}
              <div className="px-4 md:px-0 mt-3 grid grid-cols-3 gap-2">
                {[
                  { icon: ShieldCheck, label: "Certificado", sub: "Verificado", onClick: undefined as (() => void) | undefined },
                  { icon: CalendarDays, label: "Reservar mesa", sub: "", onClick: () => { if (!user) navigate("/auth"); else setReserveOpen(true); } },
                  { icon: ChefHat, label: "Catering", sub: "", onClick: undefined },
                ].map(cert => (
                  <button key={cert.label} onClick={cert.onClick}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border border-border bg-card ${cert.onClick ? "hover:border-primary/40 hover:bg-primary/5 cursor-pointer" : ""} transition-colors`}>
                    <cert.icon size={20} className="text-primary" />
                    <span className="text-[11px] font-semibold text-foreground text-center">{cert.label}</span>
                    {cert.sub && <span className="text-[9px] text-muted-foreground">{cert.sub}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: Menu section */}
            <div className="md:min-h-screen">
              {/* Deals & benefits filter */}
              <div className="px-4 md:px-0 mt-4">
                <h3 className="font-bold text-foreground mb-3">Ofertas e destaques</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {[
                    { icon: Flame, label: "Popular", active: true },
                    { icon: Sparkles, label: "Novidades", active: false },
                    { icon: BadgePercent, label: "Promoções", active: false },
                    { icon: Trophy, label: "Mais pedidos", active: false },
                  ].map(tab => (
                    <button key={tab.label} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0 transition-colors ${
                      tab.active
                        ? "border-primary text-primary bg-primary/5"
                        : "border-border text-muted-foreground bg-card hover:border-primary/30"
                    }`}>
                      <tab.icon size={13} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active promotions */}
              {selectedRestaurant.promotions && selectedRestaurant.promotions.length > 0 && (
                <div className="px-4 md:px-0 mt-3 space-y-2">
                  {selectedRestaurant.promotions.map(promo => (
                    <div key={promo.id} className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Tag size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{promo.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {promo.discount_type === "percentage" ? `${promo.discount_value}% de desconto` : `${fmt(promo.discount_value)} de desconto`}
                          {promo.min_order > 0 && ` · Pedido mín. ${fmt(promo.min_order)}`}
                        </p>
                      </div>
                      {promo.coupon_code && (
                        <button onClick={() => { navigator.clipboard.writeText(promo.coupon_code!); toast.success("Código copiado!"); }}
                          className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors">
                          {promo.coupon_code}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Menu items */}
              <div className="px-4 md:px-0 py-4 pb-32 space-y-6">
                {loadingMenu ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl h-20 animate-pulse border border-border" />)}
                  </div>
                ) : selectedRestaurant.menu.length === 0 ? (
                  <div className="text-center py-16">
                    <StoreIcon size={48} className="text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-semibold text-muted-foreground">Cardápio ainda não disponível</p>
                    <p className="text-xs text-muted-foreground mt-1">Este estabelecimento ainda está configurando seus produtos</p>
                  </div>
                ) : (
                  Object.entries(menuGroups).map(([category, menuItems]) => (
                    <section key={category}>
                      <h2 className="text-sm font-extrabold text-foreground mb-3 uppercase tracking-wide">{category}</h2>
                      <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                        {menuItems.map(item => (
                          <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-card rounded-2xl border border-border p-3 flex gap-3 items-center">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                <StoreIcon size={20} className="text-muted-foreground/30" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground leading-tight">{item.name}</p>
                              {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                              <p className="text-sm font-bold text-primary mt-1">{fmt(item.price)}</p>
                            </div>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={() => handleAdd(item, selectedRestaurant)}
                              animate={addedId === item.id ? { scale: [1, 1.3, 1] } : {}}
                              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                addedId === item.id ? "bg-emerald-500 text-card" : "bg-primary text-primary-foreground hover:opacity-90"
                              }`}>
                              {addedId === item.id ? <CheckCircle size={18} /> : <Plus size={18} />}
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      <AnimatePresence>
        {count > 0 && !cartOpen && !selectedRestaurant && (
          <motion.button initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl font-bold text-sm z-30">
            <span className="bg-primary-foreground/20 text-primary-foreground text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center">{count}</span>
            Ver carrinho
            <ShoppingCart size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Reservation Modal */}
      <AnimatePresence>
        {reserveOpen && selectedRestaurant && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center"
            onClick={() => setReserveOpen(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
              className="bg-card w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Reservar mesa</h2>
                <button onClick={() => setReserveOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{selectedRestaurant.name}</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Data</label>
                  <input type="date" value={reserveDate} onChange={e => setReserveDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Horário</label>
                  <input type="time" value={reserveTime} onChange={e => setReserveTime(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Número de pessoas</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setReserveGuests(Math.max(1, reserveGuests - 1))}
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="text-lg font-bold text-foreground w-8 text-center">{reserveGuests}</span>
                    <button onClick={() => setReserveGuests(Math.min(20, reserveGuests + 1))}
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Seu nome</label>
                  <input type="text" value={reserveName} onChange={e => setReserveName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Telefone (opcional)</label>
                  <input type="tel" value={reservePhone} onChange={e => setReservePhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Observações (opcional)</label>
                  <textarea value={reserveNotes} onChange={e => setReserveNotes(e.target.value)}
                    placeholder="Aniversário, cadeirinha, etc."
                    rows={2}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
                </div>
              </div>

              <button onClick={handleReserve} disabled={reserving}
                className="w-full mt-4 bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {reserving ? "Enviando..." : "Confirmar reserva"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZuuFood;

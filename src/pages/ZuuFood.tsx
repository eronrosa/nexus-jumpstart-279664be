import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Star, Clock, ShoppingCart, Plus, Minus,
  Trash2, ChevronRight, X, MapPin, Bike, CheckCircle, Store as StoreIcon,
  CreditCard, Banknote, Smartphone, Tag, Home, Building, Mic,
  SlidersHorizontal, Heart, User, Phone, Share2, Wifi, ParkingCircle,
  Music, UtensilsCrossed, Package, Users, ChevronDown, ShieldCheck,
  CalendarDays, ChefHat, Flame, Sparkles, BadgePercent, Trophy,
  Drumstick, Salad, EggFried, Beef, Cookie, GlassWater, type LucideIcon
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import FoodPreview from "@/components/FoodPreview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoMitsuba from "@/assets/logo-mitsuba.png";
import logoLeMax from "@/assets/logo-lemax.png";
import logoPizzaPalace from "@/assets/logo-pizzapalace.png";
import logoBondinho from "@/assets/logo-bondinho.png";

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
    image: logoMitsuba,
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
    image: logoLeMax,
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
    image: logoPizzaPalace,
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
    image: logoBondinho,
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
  const [orderRef, setOrderRef] = useState<string | null>(null);
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

  const tax = Math.max(0, total - discount) * 0.05;
  const grandTotal = Math.max(0, total - discount) + deliveryFee + tax;
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
      setOrderRef(createdOrderId);
      clear();
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

  const handleClose = () => {
    setStep("cart"); setOrdered(false); setOrderRef(null);
    setNotes(""); setCouponInput(""); setAppliedCoupon(null);
    onClose();
  };

  const ORANGE = "hsl(14_90%_55%)";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />
          <motion.div key="drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            {/* ── Top bar ── */}
            <div className="relative flex items-center justify-center px-5 pt-5 pb-3 shrink-0">
              <button onClick={() => step === "checkout" ? setStep("cart") : handleClose()}
                className="absolute left-5 top-5 w-9 h-9 rounded-full bg-white border border-border shadow-sm flex items-center justify-center">
                <ArrowLeft size={18} className="text-foreground" />
              </button>
              <h2 className="text-lg font-extrabold text-foreground">
                {ordered ? "Pedido" : step === "checkout" ? "Checkout" : "Carrinho"}
              </h2>
              <button onClick={handleClose}
                className="absolute right-5 top-5 w-9 h-9 rounded-full bg-white border border-border shadow-sm flex items-center justify-center">
                {count > 0 && !ordered ? (
                  <span className="relative">
                    <ShoppingCart size={16} className="text-foreground" />
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[hsl(14_90%_55%)] text-white text-[9px] font-bold flex items-center justify-center">{count}</span>
                  </span>
                ) : (
                  <X size={18} className="text-foreground" />
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <AnimatePresence mode="wait">
                {ordered ? (
                  /* ── Success ── */
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center min-h-full gap-3 py-12 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.1 }}
                      className="w-20 h-20 rounded-2xl bg-[hsl(14_90%_55%)]/10 flex items-center justify-center mb-2">
                      <CheckCircle size={44} className="text-[hsl(14_90%_55%)]" strokeWidth={2.2} />
                    </motion.div>
                    <h3 className="text-2xl font-extrabold text-foreground">Pedido confirmado!</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Seu pedido está sendo preparado e logo estará a caminho.
                    </p>
                    {orderRef && (
                      <p className="text-xs font-semibold text-muted-foreground tracking-wider mt-1">
                        Pedido #{orderRef.slice(0, 8).toUpperCase()}
                      </p>
                    )}
                  </motion.div>
                ) : items.length === 0 ? (
                  /* ── Empty state ── */
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center min-h-full gap-3 py-16 text-center">
                    <div className="relative w-28 h-28 rounded-full bg-muted/40 flex items-center justify-center mb-2">
                      <ShoppingCart size={48} className="text-muted-foreground/50" />
                      <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-foreground text-white text-xs font-bold flex items-center justify-center">0</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-foreground">Seu carrinho está vazio</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Explore restaurantes deliciosos e adicione itens ao seu carrinho.
                    </p>
                    <button onClick={handleClose}
                      className="mt-4 w-full max-w-xs bg-[hsl(14_90%_55%)] text-white font-bold py-3.5 rounded-full shadow-lg shadow-[hsl(14_90%_55%)]/30 hover:opacity-90 transition-opacity">
                      Explorar restaurantes
                    </button>
                  </motion.div>
                ) : step === "cart" ? (
                  /* ── Cart items ── */
                  <motion.div key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2">
                    {items.map(item => (
                      <motion.div key={item.id} layout
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                        className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-border/40 p-3 flex items-center gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                            <StoreIcon size={20} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-extrabold text-foreground truncate">{item.name}</p>
                          {item.notes && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">+ {item.notes}</p>
                          )}
                          <p className="text-base font-extrabold text-foreground mt-1">{fmt(item.price * item.qty)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 bg-[hsl(14_90%_55%)]/5 border border-[hsl(14_90%_55%)]/20 rounded-full p-1">
                          <button onClick={() => item.qty > 1 ? decrement(item.id) : remove(item.id)}
                            className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center text-foreground">
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                          <button onClick={() => increment(item.id)}
                            className="w-7 h-7 rounded-full bg-[hsl(14_90%_55%)] text-white flex items-center justify-center">
                            <Plus size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    {/* Promo code */}
                    <div className="flex items-center gap-2 bg-white border border-border rounded-full p-1.5 pl-4 shadow-sm">
                      <Tag size={14} className="text-muted-foreground shrink-0" />
                      {appliedCoupon ? (
                        <>
                          <span className="flex-1 text-sm font-semibold text-foreground truncate">{appliedCoupon.title}</span>
                          <button onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}
                            className="text-xs font-bold text-destructive px-3">Remover</button>
                        </>
                      ) : (
                        <>
                          <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="Código promocional" maxLength={30}
                            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60" />
                          <button onClick={applyCoupon} disabled={validatingCoupon || !couponInput.trim()}
                            className="bg-[hsl(14_90%_55%)] text-white font-bold text-xs px-5 py-2 rounded-full disabled:opacity-50">
                            {validatingCoupon ? "..." : "Aplicar"}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-2xl border border-border/40 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4 mt-2 space-y-2.5">
                      <p className="text-sm font-extrabold text-foreground mb-1">Resumo do pedido</p>
                      <Row label="Subtotal" value={fmt(total)} />
                      {discount > 0 && <Row label="Desconto" value={`-${fmt(discount)}`} accent />}
                      <Row label="Taxa de entrega" value={deliveryFee ? fmt(deliveryFee) : "—"} muted />
                      <Row label="Impostos (5%)" value={fmt(tax)} muted />
                      <div className="border-t border-border pt-2.5 flex items-center justify-between">
                        <span className="text-base font-extrabold text-foreground">Total</span>
                        <span className="text-base font-extrabold text-[hsl(14_90%_55%)]">{fmt(grandTotal)}</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Checkout ── */
                  <motion.div key="checkout" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 pt-2">
                    {/* Payment Methods */}
                    <div className="bg-white rounded-2xl border border-border/40 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-2">
                      {PAYMENT_METHODS.map((pm, i) => {
                        const active = selectedPayment === pm.id;
                        return (
                          <button key={pm.id} onClick={() => setSelectedPayment(pm.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${active ? "bg-[hsl(14_90%_55%)]/5" : "hover:bg-muted/40"} ${i > 0 ? "border-t border-border/40" : ""}`}>
                            <span className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center">
                              <pm.icon size={18} className="text-foreground" />
                            </span>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-bold text-foreground">{pm.label}</p>
                              <p className="text-[11px] text-muted-foreground">Pagamento seguro</p>
                            </div>
                            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${active ? "bg-[hsl(14_90%_55%)] border-[hsl(14_90%_55%)]" : "border-border"}`}>
                              {active && <CheckCircle size={12} className="text-white" />}
                            </span>
                          </button>
                        );
                      })}
                      <button className="w-full flex items-center justify-center gap-2 p-3 border-t border-dashed border-border text-sm font-bold text-[hsl(14_90%_55%)]">
                        <Plus size={14} /> Adicionar método de pagamento
                      </button>
                    </div>

                    {/* Delivery address */}
                    <div>
                      <p className="text-sm font-extrabold text-foreground mb-2">Endereço de entrega</p>
                      {addresses.length === 0 ? (
                        <button onClick={() => { handleClose(); navigate("/perfil"); }}
                          className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
                          <p className="text-sm font-bold text-amber-800">Cadastre um endereço</p>
                          <p className="text-xs text-amber-700 mt-0.5">Toque para adicionar no seu perfil</p>
                        </button>
                      ) : (
                        <div className="space-y-2">
                          {addresses.map(addr => {
                            const active = selectedAddress === addr.id;
                            return (
                              <button key={addr.id} onClick={() => setSelectedAddress(addr.id)}
                                className={`w-full flex items-center gap-3 bg-white rounded-2xl border shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-3.5 text-left transition-all ${active ? "border-[hsl(14_90%_55%)]" : "border-border/40"}`}>
                                <span className="w-10 h-10 rounded-full bg-[hsl(14_90%_55%)]/10 flex items-center justify-center shrink-0">
                                  <MapPin size={16} className="text-[hsl(14_90%_55%)]" />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-bold text-foreground">{addr.label}</p>
                                    {addr.is_default && <span className="text-[9px] bg-foreground text-white px-1.5 py-0.5 rounded font-bold">PADRÃO</span>}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {addr.street}, {addr.number} · {addr.neighborhood}
                                  </p>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Observações para o entregador (opcional)"
                      rows={2} maxLength={300}
                      className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14_90%_55%)]/30 resize-none" />

                    {/* Order Summary */}
                    <div className="bg-white rounded-2xl border border-border/40 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-extrabold text-foreground">Resumo do pedido</p>
                        {estimatedTime && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold">
                            <Clock size={11} /> {estimatedTime}
                          </span>
                        )}
                      </div>
                      <Row label="Subtotal" value={fmt(total)} muted />
                      <Row label="Taxa de entrega" value={deliveryFee === 0 ? "Grátis" : fmt(deliveryFee)} muted />
                      <Row label="Impostos" value={fmt(tax)} muted />
                      {discount > 0 && <Row label="Desconto" value={`-${fmt(discount)}`} accent />}
                      <div className="border-t border-border pt-2.5 flex items-center justify-between">
                        <span className="text-base font-extrabold text-foreground">Total</span>
                        <span className="text-base font-extrabold text-[hsl(14_90%_55%)]">{fmt(grandTotal)}</span>
                      </div>
                      {belowMin && (
                        <p className="text-xs text-destructive font-semibold">
                          Pedido mínimo {fmt(minOrder)} · faltam {fmt(minOrder - total)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Footer CTA ── */}
            <div className="px-5 pb-6 pt-3 shrink-0 bg-gradient-to-t from-white via-white to-white/0">
              {ordered ? (
                <div className="space-y-2">
                  <button onClick={() => { handleClose(); navigate("/pedidos"); }}
                    className="w-full bg-[hsl(14_90%_55%)] text-white font-bold py-3.5 rounded-full shadow-lg shadow-[hsl(14_90%_55%)]/30 hover:opacity-90 transition-opacity">
                    Acompanhar pedido
                  </button>
                  <button onClick={handleClose}
                    className="w-full bg-white border border-border text-foreground font-bold py-3.5 rounded-full">
                    Voltar ao início
                  </button>
                </div>
              ) : items.length > 0 ? (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleOrder}
                  disabled={saving || (step === "checkout" && (belowMin || addresses.length === 0))}
                  className="w-full bg-[hsl(14_90%_55%)] text-white font-bold py-4 rounded-full shadow-lg shadow-[hsl(14_90%_55%)]/30 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving
                    ? "Finalizando..."
                    : step === "cart"
                      ? `Checkout · ${fmt(total)}`
                      : belowMin
                        ? `Mínimo ${fmt(minOrder)}`
                        : `Finalizar pedido · ${fmt(grandTotal)}`}
                </motion.button>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* Reusable summary row */
function Row({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-muted-foreground" : "text-foreground"}>{label}</span>
      <span className={`font-bold ${accent ? "text-emerald-600" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

/* ─── Main page ─── */
const ZuuFood = () => {
  const navigate = useNavigate();
  const { restaurantId: urlRestaurantId } = useParams<{ restaurantId?: string }>();
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
  const [filterOffers, setFilterOffers] = useState(false);
  const [filterRating, setFilterRating] = useState(false);
  const [filterFast, setFilterFast] = useState(false);
  const [sortBy, setSortBy] = useState<"recommended" | "rating" | "time">("recommended");
  const [selectedItem, setSelectedItem] = useState<MenuItemData | null>(null);
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState("");
  const [itemSize, setItemSize] = useState<"small" | "medium" | "large">("medium");
  const [itemIngredients, setItemIngredients] = useState<string[]>([]);
  const sizeMultiplier: Record<"small" | "medium" | "large", number> = { small: 0.85, medium: 1, large: 1.25 };
  const sizeLabel: Record<"small" | "medium" | "large", string> = { small: "Pequeno", medium: "Médio", large: "Grande" };
  const defaultExtras: { id: string; label: string; icon: LucideIcon; price: number }[] = [
    { id: "fries", label: "Batata", icon: Drumstick, price: 6 },
    { id: "cheese", label: "Queijo extra", icon: Cookie, price: 4 },
    { id: "bacon", label: "Bacon", icon: Beef, price: 5 },
    { id: "egg", label: "Ovo", icon: EggFried, price: 3 },
    { id: "sauce", label: "Molho especial", icon: GlassWater, price: 2 },
  ];
  const extrasTotal = itemIngredients.reduce((s, id) => s + (defaultExtras.find(e => e.id === id)?.price ?? 0), 0);
  const itemUnitPrice = selectedItem ? selectedItem.price * sizeMultiplier[itemSize] + extrasTotal : 0;
  const itemTotal = itemUnitPrice * itemQty;

  const openItem = (item: MenuItemData) => {
    setSelectedItem(item);
    setItemQty(1);
    setItemNotes("");
    setItemSize("medium");
    setItemIngredients([]);
  };

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
    navigate(`/zuufood/r/${r.id}`, { replace: false });
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

  const closeRestaurant = () => {
    setSelectedRestaurant(null);
    navigate("/zuufood");
  };

  // Deep-link: open restaurant from URL when allRestaurants is ready
  useEffect(() => {
    if (!urlRestaurantId) return;
    if (selectedRestaurant?.id === urlRestaurantId) return;
    const r = allRestaurants.find(x => x.id === urlRestaurantId);
    if (r) handleSelectRestaurant(r);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlRestaurantId, allRestaurants]);


  const filtered = allRestaurants.filter(r => {
    const matchCat = activeCategory === "Todos" || r.category === activeCategory;
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAdd = (item: MenuItemData, restaurant: RestaurantData, qty: number = 1, notes: string = "") => {
    if (items.length > 0 && items[0].restaurantId !== restaurant.id) {
      toast.error("Você só pode pedir de um restaurante por vez. Limpe o carrinho antes.");
      return;
    }
    add({
      id: item.id, restaurantId: restaurant.id, restaurantName: restaurant.name,
      name: item.name, price: item.price, image: item.image,
      notes: notes.trim() || undefined,
    }, qty);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 800);
    toast.success(`${qty}x ${item.name} adicionado ao carrinho`);
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

  const [showPreview, setShowPreview] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("zuufood:preview-seen") !== "1";
  });
  const dismissPreview = () => {
    sessionStorage.setItem("zuufood:preview-seen", "1");
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {showPreview && !selectedRestaurant && !urlRestaurantId && <FoodPreview onEnter={dismissPreview} />}
      {!selectedRestaurant ? (
        <>
          {/* ── HEADER (Mirqab-style) ── */}
          <div className="sticky top-0 z-20 bg-background px-4 pt-4 pb-3">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => navigate("/")}
                  className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                  <ArrowLeft size={18} className="text-foreground" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[hsl(14_90%_55%)]/10 flex items-center justify-center">
                    <UtensilsCrossed size={16} className="text-[hsl(14_90%_55%)]" />
                  </div>
                  <p className="text-base font-extrabold text-foreground">ZuuFood</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(user ? "/perfil" : "/auth")}
                    className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm relative">
                    <Heart size={16} className="text-foreground" />
                  </button>
                  <button onClick={() => setCartOpen(true)}
                    className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm relative">
                    <ShoppingCart size={16} className="text-foreground" />
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[hsl(14_90%_55%)] text-white text-[9px] font-bold flex items-center justify-center">{count}</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por restaurantes ou pratos"
                  className="w-full bg-card border border-border rounded-full pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14_90%_55%)]/30 shadow-sm placeholder:text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-4 space-y-5">
            {/* HOT DEALS hero card */}
            <div className="relative rounded-3xl overflow-hidden h-44 md:h-56 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200&q=80&auto=format&fit=crop"
                alt="Hot Deals"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow">
                <BadgePercent size={18} className="text-[hsl(14_90%_55%)]" />
              </div>
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white">
                <p className="text-xl md:text-2xl font-extrabold flex items-center gap-1">
                  Hot Deals! <Flame size={18} className="text-[hsl(14_90%_55%)]" />
                </p>
                <p className="text-base md:text-lg font-bold">Até <span className="text-[hsl(14_90%_60%)]">40% OFF</span></p>
              </div>
              <p className="absolute bottom-3 right-4 text-[10px] text-white/80 max-w-[140px] text-right leading-tight">
                Não perca os maiores descontos de hoje.
              </p>
            </div>

            {/* Section title */}
            <h2 className="text-base font-extrabold text-foreground">Todos os restaurantes</h2>

            {/* Category chips with image + label */}
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
              {FOOD_ICONS.map(food => {
                const active = activeCategory === food.label;
                return (
                  <button key={food.label}
                    onClick={() => setActiveCategory(active ? "Todos" : food.label)}
                    className={`shrink-0 flex items-center gap-2 rounded-full pl-1.5 pr-4 py-1.5 border transition-all ${
                      active
                        ? "bg-[hsl(14_90%_55%)] border-[hsl(14_90%_55%)] text-white shadow"
                        : "bg-card border-border text-foreground hover:border-[hsl(14_90%_55%)]/40"
                    }`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center ${active ? "bg-white/20" : "bg-secondary"}`}>
                      <img src={food.image} alt={food.label} className="w-5 h-5 object-contain" />
                    </span>
                    <span className="text-xs font-bold">{food.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
              <button
                onClick={() => setSortBy(sortBy === "rating" ? "time" : sortBy === "time" ? "recommended" : "rating")}
                className="shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 bg-card border border-border text-xs font-semibold text-foreground hover:border-foreground/40 transition-colors">
                <SlidersHorizontal size={12} />
                Ordenar: {sortBy === "rating" ? "Avaliação" : sortBy === "time" ? "Entrega" : "Recomendados"}
                <ChevronDown size={12} />
              </button>
              {[
                { key: "offers", label: "Ofertas", active: filterOffers, toggle: () => setFilterOffers(v => !v) },
                { key: "rating", label: "Avaliação 4.5+", active: filterRating, toggle: () => setFilterRating(v => !v) },
                { key: "fast", label: "Entrega rápida", active: filterFast, toggle: () => setFilterFast(v => !v) },
              ].map(f => (
                <button key={f.key} onClick={f.toggle}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold border transition-all ${
                    f.active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-foreground border-border hover:border-foreground/40"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Restaurant cards — Mirqab-style horizontal */}
            {(() => {
              const list = filtered
                .filter(r => !filterOffers || (r.promo && r.promo.length > 0))
                .filter(r => !filterRating || r.rating >= 4.5)
                .filter(r => !filterFast || parseInt(r.deliveryTime) <= 30)
                .sort((a, b) => {
                  if (sortBy === "rating") return b.rating - a.rating;
                  if (sortBy === "time") return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
                  return 0;
                });
              if (list.length === 0) {
                return <p className="text-center text-muted-foreground text-sm py-16">Nenhum restaurante encontrado</p>;
              }
              return (
                <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
                  {list.map((r, i) => {
                    const offerLabel = r.deliveryFee === 0
                      ? "Frete grátis"
                      : r.promo ? r.promo : `Até ${fmt(5)} OFF`;
                    return (
                      <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => handleSelectRestaurant(r)}
                        className={`bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-lg transition-all relative ${
                          r.isOpen === false ? "opacity-60" : ""
                        }`}>
                        <div className="flex gap-3 p-3">
                          {/* Left image with dark rating chip */}
                          <div className="relative shrink-0">
                            <img src={r.image} alt={r.name}
                              className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-contain bg-white p-2" />
                            <button onClick={e => toggleFavorite(e, r.id)}
                              className={`absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow ${
                                favoriteIds.has(r.id) ? "text-red-500" : "text-muted-foreground"
                              }`}>
                              <Heart size={13} fill={favoriteIds.has(r.id) ? "currentColor" : "none"} />
                            </button>
                          </div>

                          {/* Right content */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div>
                              <p className="text-[10px] font-bold text-[hsl(14_90%_55%)] mb-0.5 uppercase tracking-wide">
                                {offerLabel}
                              </p>
                              <p className="font-extrabold text-foreground text-base leading-tight truncate">{r.name}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-1">{r.category}</p>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                              <span className="flex items-center gap-1">
                                <Clock size={11} /> {r.deliveryTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Bike size={11} /> {r.deliveryFee === 0 ? "Grátis" : fmt(r.deliveryFee)}
                              </span>
                            </div>
                          </div>

                          {/* Right side: rating chip + CTA */}
                          <div className="flex flex-col items-end justify-between py-0.5 shrink-0">
                            <div className="flex items-center gap-1 bg-foreground text-background rounded-full px-2 py-0.5">
                              <Star size={10} className="text-yellow-400" fill="currentColor" />
                              <span className="text-[11px] font-bold">{r.rating > 0 ? r.rating.toFixed(1) : "Novo"}</span>
                            </div>
                            <motion.button whileTap={{ scale: 0.9 }}
                              className="w-9 h-9 rounded-full bg-[hsl(14_90%_55%)] text-white flex items-center justify-center shadow-md">
                              <ArrowLeft size={16} className="rotate-180" />
                            </motion.button>
                          </div>
                        </div>
                        {r.isOpen === false && (
                          <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[9px] font-bold px-2 py-0.5 rounded-full">Fechado</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Bottom Navigation — dark pill style with elevated center */}
          <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-foreground rounded-full px-2 py-2 shadow-2xl">
            <button onClick={() => navigate("/")}
              className="w-11 h-11 rounded-full flex items-center justify-center text-background/70 hover:text-background transition-colors">
              <Home size={18} />
            </button>
            <button className="w-12 h-12 rounded-full bg-[hsl(14_90%_55%)] text-white flex items-center justify-center shadow-md">
              <StoreIcon size={20} />
            </button>
            <button onClick={() => setCartOpen(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-background/70 hover:text-background transition-colors relative">
              <ShoppingCart size={18} />
              {count > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[hsl(14_90%_55%)] text-white text-[9px] font-bold flex items-center justify-center">{count}</span>
              )}
            </button>
            <button onClick={() => navigate(user ? "/perfil" : "/auth")}
              className="w-11 h-11 rounded-full flex items-center justify-center text-background/70 hover:text-background transition-colors">
              <User size={18} />
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
              <button onClick={closeRestaurant} className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground shadow">
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input placeholder="Buscar no cardápio..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-card/90 backdrop-blur-sm rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none shadow" />
              </div>
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/zuufood/r/${selectedRestaurant.id}`;
                  try {
                    if (navigator.share) {
                      await navigator.share({ title: selectedRestaurant.name, text: `Confira ${selectedRestaurant.name} no ZuuFood`, url });
                    } else {
                      await navigator.clipboard.writeText(url);
                      toast.success("Link do restaurante copiado!");
                    }
                  } catch {/* user cancelled */}
                }}
                className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground shadow">
                <Share2 size={16} />
              </button>
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {menuItems.map(item => (
                          <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            onClick={() => openItem(item)}
                            className="relative bg-card rounded-2xl border border-border p-3 flex flex-col cursor-pointer hover:border-primary/40 transition-colors">
                            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <StoreIcon size={24} className="text-muted-foreground/30" />
                                </div>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); }}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/90 backdrop-blur flex items-center justify-center shadow-sm">
                                <Heart size={14} className="text-foreground" />
                              </button>
                            </div>
                            <p className="font-semibold text-sm text-foreground leading-tight line-clamp-1">{item.name}</p>
                            <div className="flex items-end justify-between mt-1">
                              <div>
                                <p className="text-[10px] text-muted-foreground leading-none">A partir de</p>
                                <p className="text-sm font-bold text-primary">{fmt(item.price)}</p>
                              </div>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); handleAdd(item, selectedRestaurant); }}
                                animate={addedId === item.id ? { scale: [1, 1.3, 1] } : {}}
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-md ${
                                  addedId === item.id ? "bg-emerald-500 text-card" : "bg-primary text-primary-foreground hover:opacity-90"
                                }`}>
                                {addedId === item.id ? <CheckCircle size={16} /> : <Plus size={16} />}
                              </motion.button>
                            </div>
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

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedItem && selectedRestaurant && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center"
            onClick={() => setSelectedItem(null)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 240 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full md:max-w-md rounded-t-[28px] md:rounded-[28px] max-h-[92vh] overflow-y-auto shadow-2xl">
              {/* Floating hero */}
              <div className="relative bg-gradient-to-b from-orange-50 via-white to-white pt-6 pb-4">
                <button onClick={() => setSelectedItem(null)}
                  className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center z-10">
                  <ArrowLeft size={18} className="text-foreground" />
                </button>
                <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center z-10">
                  <Heart size={18} className="text-foreground" />
                </button>
                <div className="px-6 flex items-center justify-center h-56">
                  {selectedItem.image ? (
                    <motion.img
                      initial={{ scale: 0.85, rotate: -8, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 140, damping: 14 }}
                      src={selectedItem.image} alt={selectedItem.name}
                      className="max-h-56 w-auto object-contain drop-shadow-2xl"
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-full bg-muted flex items-center justify-center">
                      <StoreIcon size={56} className="text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pt-2 pb-6 space-y-5">
                {/* Title + rating */}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl font-extrabold text-foreground leading-tight">{selectedItem.name}</h2>
                  <div className="flex items-center gap-1 text-sm font-bold text-foreground shrink-0 mt-1">
                    <Star size={14} className="text-[hsl(14_90%_55%)] fill-[hsl(14_90%_55%)]" />
                    4.9 <span className="text-xs text-muted-foreground font-medium">(5.2k)</span>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                </div>

                {selectedItem.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed -mt-2">{selectedItem.description}</p>
                )}

                {/* Size selector */}
                <div className="flex items-center gap-3">
                  {(["small", "medium", "large"] as const).map(s => {
                    const active = itemSize === s;
                    return (
                      <button key={s} onClick={() => setItemSize(s)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full border-2 text-sm font-semibold transition-all ${
                          active
                            ? "bg-[hsl(14_90%_55%)] border-[hsl(14_90%_55%)] text-white shadow-md"
                            : "bg-white border-border text-foreground hover:border-[hsl(14_90%_55%)]/40"
                        }`}>
                        <span className={`w-4 h-4 rounded-full border-2 ${active ? "border-white bg-white/30" : "border-muted-foreground/40"}`} />
                        {sizeLabel[s]}
                      </button>
                    );
                  })}
                </div>

                {/* Add ingredients */}
                <div>
                  <h3 className="text-base font-extrabold text-foreground mb-2">Adicionar ingredientes</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {defaultExtras.map(ex => {
                      const active = itemIngredients.includes(ex.id);
                      return (
                        <button key={ex.id}
                          onClick={() => setItemIngredients(prev =>
                            active ? prev.filter(i => i !== ex.id) : [...prev, ex.id]
                          )}
                          className={`shrink-0 flex items-center gap-2 pl-2 pr-3 py-2 rounded-full border-2 text-xs font-semibold transition-all ${
                            active
                              ? "bg-[hsl(14_90%_55%)]/10 border-[hsl(14_90%_55%)] text-[hsl(14_90%_45%)]"
                              : "bg-white border-border text-foreground"
                          }`}>
                          <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-base">{ex.emoji}</span>
                          {ex.label}
                          <span className="text-[10px] text-muted-foreground">+{fmt(ex.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <textarea value={itemNotes} onChange={e => setItemNotes(e.target.value)}
                  placeholder="Observação para a cozinha (opcional)"
                  rows={2}
                  className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14_90%_55%)]/30 resize-none" />

                {/* Bottom action row */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-1 bg-white border-2 border-[hsl(14_90%_55%)]/20 rounded-full p-1">
                    <button onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <span className="text-base font-bold text-foreground w-6 text-center">{itemQty}</span>
                    <button onClick={() => setItemQty(itemQty + 1)}
                      className="w-9 h-9 rounded-full bg-[hsl(14_90%_55%)] text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      handleAdd(selectedItem, selectedRestaurant, itemQty, itemNotes);
                      setSelectedItem(null);
                    }}
                    className="flex-1 bg-[hsl(14_90%_55%)] text-white font-bold py-3.5 rounded-full text-sm hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(14_90%_55%)]/30">
                    Adicionar ao carrinho · {fmt(itemTotal)}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZuuFood;

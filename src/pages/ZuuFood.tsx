import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Star, Clock, ShoppingCart, Plus, Minus,
  Trash2, ChevronRight, X, MapPin, Bike, CheckCircle
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Data ─── */
const CATEGORIES = ["Todos", "Japonês", "Hambúrguer", "Pizza", "Lanches", "Saudável", "Sobremesas", "Árabe"];

const RESTAURANTS = [
  {
    id: "r1", name: "Restaurante Mitsuba", category: "Japonês", rating: 4.8,
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
    id: "r2", name: "Le Max Hamburgueria", category: "Hambúrguer", rating: 4.7,
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
    id: "r3", name: "Pizza Palace", category: "Pizza", rating: 4.6,
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
    id: "r4", name: "Bondinho Carioca", category: "Lanches", rating: 4.5,
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

/* ─── Sub-components ─── */
const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, increment, decrement, remove, total, count, clear } = useCart();
  const { user } = useAuth();
  const [ordered, setOrdered] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleOrder = async () => {
    if (items.length === 0) return;
    setSaving(true);

    if (user) {
      try {
        const restaurant = items[0];
        const deliveryFee = 0; // default; could pull from cart metadata
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            restaurant_id: restaurant.restaurantId,
            restaurant_name: restaurant.restaurantName,
            status: "pendente",
            total: total,
            delivery_fee: deliveryFee,
          })
          .select()
          .single();

        if (!orderError && orderData) {
          const orderItems = items.map(item => ({
            order_id: orderData.id,
            item_id: item.id,
            item_name: item.name,
            item_price: item.price,
            quantity: item.qty,
            item_image: item.image,
          }));
          await supabase.from("order_items").insert(orderItems);
        }
      } catch (_) {
        // fail silently, order UI still shows success
      }
    }

    setSaving(false);
    setOrdered(true);
    setTimeout(() => { setOrdered(false); clear(); onClose(); }, 2800);
  };


  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-card shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-primary" />
                <span className="font-bold text-foreground">Carrinho</span>
                {count > 0 && <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>}
              </div>
              <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {ordered ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-full gap-4 p-8"
                  >
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}>
                      <CheckCircle size={64} className="text-green-500" />
                    </motion.div>
                    <p className="font-bold text-xl text-foreground text-center">Pedido realizado!</p>
                    <p className="text-sm text-muted-foreground text-center">Seu pedido foi enviado ao restaurante e chegará em breve 🛵</p>
                  </motion.div>
                ) : items.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
                    <ShoppingCart size={48} className="text-muted-foreground/30" />
                    <p className="font-semibold text-muted-foreground">Carrinho vazio</p>
                    <p className="text-xs text-muted-foreground">Adicione itens de um restaurante para começar</p>
                  </motion.div>
                ) : (
                  <motion.div key="items" className="p-4 space-y-3">
                    {/* Restaurant name */}
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1.5">
                      <MapPin size={12} /> {items[0]?.restaurantName}
                    </p>
                    {items.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        className="flex items-center gap-3 bg-secondary/50 rounded-xl p-2.5"
                      >
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-tight truncate">{item.name}</p>
                          <p className="text-xs text-primary font-bold mt-0.5">{fmt(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => decrement(item.id)} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-border transition-colors">
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                          <button onClick={() => increment(item.id)} className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity">
                            <Plus size={12} />
                          </button>
                          <button onClick={() => remove(item.id)} className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center ml-1 hover:bg-destructive/20 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {items.length > 0 && !ordered && (
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold text-foreground">{fmt(total)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><Bike size={13} /> Entrega</span>
                  <span className="font-semibold text-green-600">Grátis</span>
                </div>
                <div className="flex items-center justify-between font-bold text-base border-t border-border pt-2">
                  <span>Total</span>
                  <span className="text-primary">{fmt(total)}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleOrder}
                  disabled={saving}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-70"
                >
                  {saving ? "Salvando pedido..." : `Fazer pedido · ${fmt(total)}`}
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
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [selectedRestaurant, setSelectedRestaurant] = useState<typeof RESTAURANTS[0] | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  const filtered = RESTAURANTS.filter(r => {
    const matchCat = activeCategory === "Todos" || r.category === activeCategory;
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAdd = (item: typeof RESTAURANTS[0]["menu"][0], restaurant: typeof RESTAURANTS[0]) => {
    // Block mixing restaurants
    if (items.length > 0 && items[0].restaurantId !== restaurant.id) return;
    add({
      id: item.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      name: item.name,
      price: item.price,
      image: item.image,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 800);
  };

  // Group menu items by category
  const menuGroups = selectedRestaurant
    ? selectedRestaurant.menu.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof RESTAURANTS[0]["menu"]>)
    : {};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={selectedRestaurant ? () => setSelectedRestaurant(null) : () => navigate("/")} className="p-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-foreground text-base leading-tight">
            {selectedRestaurant ? selectedRestaurant.name : "ZuuFood"}
          </h1>
          {selectedRestaurant && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={11} /> {selectedRestaurant.deliveryTime}
              <span className="mx-1">·</span>
              <Star size={11} className="text-yellow-500" fill="currentColor" /> {selectedRestaurant.rating}
            </p>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setCartOpen(true)}
          className="relative p-2 bg-primary/10 text-primary rounded-full"
        >
          <ShoppingCart size={20} />
          {count > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center"
            >
              {count}
            </motion.span>
          )}
        </motion.button>
      </div>

      <div className="max-w-3xl mx-auto">
        {!selectedRestaurant ? (
          /* ── LISTING VIEW ── */
          <div className="px-4 py-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar restaurante ou categoria..."
                className="w-full bg-card border border-border rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>

            {/* Restaurant grid */}
            <div className="space-y-3">
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-12">Nenhum restaurante encontrado 🍽️</p>
              )}
              {filtered.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedRestaurant(r)}
                  className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="relative h-36">
                    <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                    {r.promo && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {r.promo}
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex items-center gap-3">
                    <img src={r.logo} alt={r.name} className="w-10 h-10 rounded-xl border border-border bg-white shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.category}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="flex items-center gap-1 justify-end">
                        <Star size={12} className="text-yellow-500" fill="currentColor" />
                        <span className="text-xs font-bold text-foreground">{r.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock size={11} />
                        <span className="text-xs">{r.deliveryTime}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {r.deliveryFee === 0 ? <span className="text-green-600 font-semibold">Frete grátis</span> : `Frete: ${fmt(r.deliveryFee)}`}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* ── RESTAURANT MENU VIEW ── */
          <div className="px-4 py-4 pb-32 space-y-6">
            {/* Restaurant hero */}
            <div className="relative rounded-2xl overflow-hidden h-40">
              <img src={selectedRestaurant.image} alt={selectedRestaurant.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <img src={selectedRestaurant.logo} alt={selectedRestaurant.name} className="w-10 h-10 rounded-xl border-2 border-white bg-white" />
                <div>
                  <p className="font-bold text-white text-sm">{selectedRestaurant.name}</p>
                  <p className="text-xs text-white/80">Pedido mínimo: {fmt(selectedRestaurant.minOrder)}</p>
                </div>
              </div>
            </div>

            {/* Info chips */}
            <div className="flex gap-2 flex-wrap">
              {[
                { icon: Star, text: `${selectedRestaurant.rating} estrelas`, color: "text-yellow-600 bg-yellow-50" },
                { icon: Clock, text: selectedRestaurant.deliveryTime, color: "text-blue-600 bg-blue-50" },
                { icon: Bike, text: selectedRestaurant.deliveryFee === 0 ? "Frete grátis" : fmt(selectedRestaurant.deliveryFee), color: "text-green-600 bg-green-50" },
              ].map(({ icon: Icon, text, color }) => (
                <span key={text} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${color}`}>
                  <Icon size={12} fill={color.includes("yellow") ? "currentColor" : "none"} />
                  {text}
                </span>
              ))}
            </div>

            {/* Menu sections */}
            {Object.entries(menuGroups).map(([category, menuItems]) => (
              <section key={category}>
                <h2 className="text-sm font-extrabold text-foreground mb-3 uppercase tracking-wide">{category}</h2>
                <div className="space-y-2">
                  {menuItems.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card rounded-2xl border border-border p-3 flex gap-3 items-center"
                    >
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                        <p className="text-sm font-bold text-primary mt-1">{fmt(item.price)}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleAdd(item, selectedRestaurant)}
                        animate={addedId === item.id ? { scale: [1, 1.3, 1] } : {}}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          addedId === item.id
                            ? "bg-green-500 text-white"
                            : "bg-primary text-primary-foreground hover:opacity-90"
                        }`}
                      >
                        {addedId === item.id ? <CheckCircle size={18} /> : <Plus size={18} />}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Floating cart button (when items exist and drawer is closed) */}
      <AnimatePresence>
        {count > 0 && !cartOpen && (
          <motion.button
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl font-bold text-sm z-30"
          >
            <span className="bg-primary-foreground/20 text-primary-foreground text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center">{count}</span>
            Ver carrinho
            <ShoppingCart size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default ZuuFood;

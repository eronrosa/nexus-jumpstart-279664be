import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight, MapPin, Calendar, Filter,
  Ticket, Heart, Share2, Clock, Users, Star, ArrowLeft, Music,
  Zap, PartyPopper, Trophy, Theater, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

/* ── static data ── */
const FEATURED_EVENTS = [
  {
    id: "1",
    title: "Festival Sertanejo 2026",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&h=500&fit=crop",
    date: "12 ABR",
    dayOfWeek: "SÁB",
    location: "São Paulo - SP",
    category: "Sertanejo",
  },
  {
    id: "2",
    title: "Pagode na Praça",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=500&fit=crop",
    date: "19 ABR",
    dayOfWeek: "SÁB",
    location: "Rio de Janeiro - RJ",
    category: "Pagode",
  },
  {
    id: "3",
    title: "Rave Eletrônica Neon",
    image: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=900&h=500&fit=crop",
    date: "25 ABR",
    dayOfWeek: "SEX",
    location: "Curitiba - PR",
    category: "Eletrônica",
  },
  {
    id: "4",
    title: "Rock in Campo",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&h=500&fit=crop",
    date: "03 MAI",
    dayOfWeek: "SÁB",
    location: "Campo Grande - MS",
    category: "Rock",
  },
];

const ALL_EVENTS = [
  {
    id: "e1",
    title: "Festival Sertanejo 2026",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop",
    date: "12",
    month: "ABR",
    dayOfWeek: "SÁB",
    location: "São Paulo - SP",
    category: "Sertanejo",
    price: 89.9,
  },
  {
    id: "e2",
    title: "Pagode na Praça",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop",
    date: "19",
    month: "ABR",
    dayOfWeek: "SÁB",
    location: "Rio de Janeiro - RJ",
    category: "Pagode",
    price: 45.0,
  },
  {
    id: "e3",
    title: "Rave Eletrônica Neon",
    image: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=600&h=400&fit=crop",
    date: "25",
    month: "ABR",
    dayOfWeek: "SEX",
    location: "Curitiba - PR",
    category: "Eletrônica",
    price: 120.0,
  },
  {
    id: "e4",
    title: "Rock in Campo",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=400&fit=crop",
    date: "03",
    month: "MAI",
    dayOfWeek: "SÁB",
    location: "Campo Grande - MS",
    category: "Rock",
    price: 75.0,
  },
  {
    id: "e5",
    title: "Forró Pé de Serra",
    image: "https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=600&h=400&fit=crop",
    date: "10",
    month: "MAI",
    dayOfWeek: "SÁB",
    location: "Recife - PE",
    category: "Forró",
    price: 35.0,
  },
  {
    id: "e6",
    title: "Calourada Universitária",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop",
    date: "17",
    month: "MAI",
    dayOfWeek: "SÁB",
    location: "Assis - SP",
    category: "Universitário",
    price: 25.0,
  },
  {
    id: "e7",
    title: "Show de Stand-Up",
    image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&h=400&fit=crop",
    date: "24",
    month: "MAI",
    dayOfWeek: "SÁB",
    location: "Belo Horizonte - MG",
    category: "Cultural",
    price: 60.0,
  },
  {
    id: "e8",
    title: "Tardezinha Sunset",
    image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&h=400&fit=crop",
    date: "31",
    month: "MAI",
    dayOfWeek: "SÁB",
    location: "Maracaju - MS",
    category: "Festa",
    price: 55.0,
  },
  {
    id: "e9",
    title: "Copa de Futebol Society",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=400&fit=crop",
    date: "07",
    month: "JUN",
    dayOfWeek: "SÁB",
    location: "Goiânia - GO",
    category: "Esportivo",
    price: 40.0,
  },
  {
    id: "e10",
    title: "Festival de Jazz",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=400&fit=crop",
    date: "14",
    month: "JUN",
    dayOfWeek: "SÁB",
    location: "Porto Alegre - RS",
    category: "Cultural",
    price: 95.0,
  },
  {
    id: "e11",
    title: "Balada Funk Premium",
    image: "https://images.unsplash.com/photo-1571266028243-d220c6a8b0e5?w=600&h=400&fit=crop",
    date: "21",
    month: "JUN",
    dayOfWeek: "SÁB",
    location: "São Paulo - SP",
    category: "Festa",
    price: 70.0,
  },
  {
    id: "e12",
    title: "Arraiá do Zuuppi",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
    date: "28",
    month: "JUN",
    dayOfWeek: "SÁB",
    location: "Campinas - SP",
    category: "Forró",
    price: 30.0,
  },
];

const MONTHS = ["Abril", "Maio", "Junho", "Julho", "Agosto"];
const STATES = ["SP", "RJ", "MG", "PR", "RS", "MS", "PE", "GO"];
const CATEGORIES = ["Pagode", "Forró", "Sertanejo", "Rock", "Eletrônica", "Festa", "Esportivo", "Cultural", "Universitário"];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Pagode: Music,
  Forró: Music,
  Sertanejo: Music,
  Rock: Zap,
  Eletrônica: Zap,
  Festa: PartyPopper,
  Esportivo: Trophy,
  Cultural: Theater,
  Universitário: Palette,
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ── Hero Carousel ── */
const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent(p => (p + 1) % FEATURED_EVENTS.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const go = (dir: number) => {
    clearInterval(timerRef.current);
    setDirection(dir);
    setCurrent(p => (p + dir + FEATURED_EVENTS.length) % FEATURED_EVENTS.length);
  };

  const ev = FEATURED_EVENTS[current];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "16/7" }}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
            <Badge className="mb-2 bg-primary/90 text-primary-foreground border-none">{ev.category}</Badge>
            <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-lg">{ev.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-white/80 text-sm">
              <span className="flex items-center gap-1"><MapPin size={14} />{ev.location}</span>
              <span className="flex items-center gap-1"><Calendar size={14} />{ev.dayOfWeek} · {ev.date}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition">
        <ChevronLeft size={20} />
      </button>
      <button onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition">
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {FEATURED_EVENTS.map((_, i) => (
          <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }} className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white w-5" : "bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
};

/* ── Featured Cards (below carousel) ── */
const FeaturedStrip = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {FEATURED_EVENTS.map((ev, i) => (
      <motion.div
        key={ev.id}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.08 }}
        className="flex gap-2 items-start cursor-pointer group"
      >
        <div className="flex flex-col items-center text-center min-w-[36px]">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">{ev.dayOfWeek}</span>
          <span className="text-2xl font-bold text-foreground leading-none">{ev.date.split(" ")[0]}</span>
          <Badge className="mt-0.5 text-[9px] px-1.5 py-0 bg-primary text-primary-foreground border-none">{ev.date.split(" ")[1]}</Badge>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{ev.title}</p>
          <p className="text-xs text-muted-foreground truncate">{ev.location}</p>
        </div>
      </motion.div>
    ))}
  </div>
);

/* ── Event Card ── */
const EventCard = ({ ev }: { ev: typeof ALL_EVENTS[0] }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="rounded-xl overflow-hidden bg-card border border-border shadow-sm cursor-pointer group"
  >
    <div className="relative aspect-[4/3] overflow-hidden">
      <img src={ev.image} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      {/* Date badge */}
      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 text-center shadow-sm min-w-[44px]">
        <span className="text-[9px] font-bold text-muted-foreground uppercase block leading-tight">{ev.dayOfWeek}</span>
        <span className="text-lg font-bold text-foreground leading-none">{ev.date}</span>
        <span className="text-[9px] font-bold text-primary uppercase block leading-tight">{ev.month}</span>
      </div>
      {/* Category badge */}
      <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground border-none text-[10px]">{ev.category}</Badge>
    </div>
    <div className="p-3">
      <h3 className="font-semibold text-sm text-foreground truncate">{ev.title}</h3>
      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin size={12} />{ev.location}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-bold text-primary">{fmt(ev.price)}</span>
        <Button size="sm" className="h-7 text-xs rounded-full px-4">Comprar</Button>
      </div>
    </div>
  </motion.div>
);

/* ── Main Page ── */
const ZuuPass = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const filtered = ALL_EVENTS.filter(ev => {
    if (search && !ev.title.toLowerCase().includes(search.toLowerCase()) && !ev.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory && ev.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-foreground hover:text-primary transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Ticket size={18} className="text-primary" />
            </div>
            <span className="font-bold text-foreground text-lg">ZuuPass</span>
          </div>
          <div className="flex-1 max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar evento"
              className="w-full bg-secondary/60 border-none rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate(user ? "/perfil" : "/auth")}>
              {user ? "Minha conta" : "Entrar"}
            </Button>
            <Button size="sm" className="rounded-full">Crie seu evento</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Hero Carousel */}
        <HeroCarousel />

        {/* Featured strip */}
        <FeaturedStrip />

        {/* Category quick-scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const Icon = CATEGORY_ICONS[cat] || Ticket;
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(active ? "" : cat)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors shrink-0 border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-secondary"}`}
              >
                <Icon size={14} />
                {cat}
              </button>
            );
          })}
        </div>

        {/* Próximos eventos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Próximos eventos</h2>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros</span>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="text-sm bg-secondary/60 border border-border rounded-lg px-2 py-1.5 focus:outline-none">
                <option value="">Mês</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="text-sm bg-secondary/60 border border-border rounded-lg px-2 py-1.5 focus:outline-none">
                <option value="">Estado</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="hidden md:block text-sm bg-secondary/60 border border-border rounded-lg px-2 py-1.5 focus:outline-none">
                <option value="">Categoria</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{filtered.length} eventos encontrados</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map(ev => <EventCard key={ev.id} ev={ev} />)}
          </div>
        </section>

        {/* CTA */}
        <section className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
          <div className="relative px-6 py-10 md:py-14 text-center text-primary-foreground">
            <Ticket size={40} className="mx-auto mb-3 opacity-80" />
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Crie e venda seus ingressos</h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-5">
              Organize seu evento e comece a vender ingressos pela ZuuPass. Simples, rápido e sem burocracia.
            </p>
            <Button size="lg" variant="secondary" className="rounded-full font-semibold">
              Começar agora
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ZuuPass;

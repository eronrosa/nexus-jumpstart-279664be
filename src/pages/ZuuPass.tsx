import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight, MapPin, Calendar, Filter,
  Ticket, Heart, Share2, Clock, Users, Star, ArrowLeft, Music,
  Zap, PartyPopper, Trophy, Theater, Palette, X, Minus, Plus,
  CreditCard, ShieldCheck, CheckCircle2, ChevronDown, QrCode, Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


/* Deterministic UUID-shaped id from any string (so mock ids satisfy uuid columns) */
const toUuid = (s: string) => {
  let h = "";
  for (let i = 0; i < 32; i++) {
    const c = (s.charCodeAt(i % s.length) * 31 + i * 17) & 0xff;
    h += c.toString(16).padStart(2, "0").slice(-1);
  }
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

const DEFAULT_LOCATION = "Palmitinho - RS";
const AVAILABLE_CITIES = ["Palmitinho - RS", "Porto Alegre - RS", "São Paulo - SP", "Rio de Janeiro - RJ"];



/* ── Types ── */
interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string;
  available: number;
  maxPerPurchase: number;
}

interface EventData {
  id: string;
  title: string;
  image: string;
  date: string;
  month: string;
  dayOfWeek: string;
  fullDate: string;
  time: string;
  location: string;
  venue: string;
  category: string;
  price: number;
  description: string;
  organizer: string;
  rating: number;
  totalReviews: number;
  ageRating: string;
  tickets: TicketType[];
}

/* ── Static Data ── */
const EVENTS: EventData[] = [
  {
    id: "e1", title: "Festival Sertanejo Palmitinho 2026",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&h=500&fit=crop",
    date: "12", month: "ABR", dayOfWeek: "SÁB", fullDate: "12 de Abril de 2026", time: "16:00",
    location: "Palmitinho - RS", venue: "Parque de Exposições", category: "Sertanejo",
    price: 89.9, description: "O maior festival sertanejo da região! Shows ao vivo, praça de alimentação e muita diversão em Palmitinho.",
    organizer: "ZuuPass Eventos", rating: 4.8, totalReviews: 1240, ageRating: "16+",
    tickets: [
      { id: "t1", name: "Pista", price: 89.9, description: "Acesso à área de pista", available: 500, maxPerPurchase: 5 },
      { id: "t2", name: "Front Stage", price: 179.9, description: "Acesso à área frontal do palco", available: 200, maxPerPurchase: 4 },
      { id: "t3", name: "Camarote", price: 349.9, description: "Área VIP com open bar", available: 50, maxPerPurchase: 2 },
    ],
  },

  {
    id: "e2", title: "Pagode na Praça",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=500&fit=crop",
    date: "19", month: "ABR", dayOfWeek: "SÁB", fullDate: "19 de Abril de 2026", time: "14:00",
    location: "Rio de Janeiro - RJ", venue: "Praça da Harmonia", category: "Pagode",
    price: 45.0, description: "Uma tarde inteira de pagode ao ar livre com os melhores grupos da cena carioca. Traga seus amigos e venha curtir na sombra!",
    organizer: "Pagode & Cia", rating: 4.6, totalReviews: 870, ageRating: "14+",
    tickets: [
      { id: "t1", name: "Entrada Geral", price: 45.0, description: "Acesso ao evento", available: 1000, maxPerPurchase: 6 },
      { id: "t2", name: "Área Vip", price: 120.0, description: "Mesa reservada + bebida inclusa", available: 100, maxPerPurchase: 4 },
    ],
  },
  {
    id: "e3", title: "Rave Eletrônica Neon",
    image: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=900&h=500&fit=crop",
    date: "25", month: "ABR", dayOfWeek: "SEX", fullDate: "25 de Abril de 2026", time: "23:00",
    location: "Curitiba - PR", venue: "Galpão Arena", category: "Eletrônica",
    price: 120.0, description: "A maior rave neon do Paraná! DJs internacionais, mapeamento em laser e uma experiência imersiva de som e luz.",
    organizer: "Neon Events", rating: 4.9, totalReviews: 2100, ageRating: "18+",
    tickets: [
      { id: "t1", name: "1º Lote", price: 120.0, description: "Ingresso promocional", available: 300, maxPerPurchase: 4 },
      { id: "t2", name: "2º Lote", price: 160.0, description: "Ingresso padrão", available: 500, maxPerPurchase: 4 },
      { id: "t3", name: "Backstage Pass", price: 450.0, description: "Acesso aos bastidores + meet & greet", available: 20, maxPerPurchase: 2 },
    ],
  },
  {
    id: "e4", title: "Rock in Campo",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&h=500&fit=crop",
    date: "03", month: "MAI", dayOfWeek: "SÁB", fullDate: "03 de Maio de 2026", time: "17:00",
    location: "Campo Grande - MS", venue: "Arena MS", category: "Rock",
    price: 75.0, description: "Festival com bandas nacionais e regionais de rock. Dois palcos, food trucks e muito rock n' roll!",
    organizer: "Rock MS Produções", rating: 4.5, totalReviews: 640, ageRating: "14+",
    tickets: [
      { id: "t1", name: "Pista", price: 75.0, description: "Acesso à área geral", available: 800, maxPerPurchase: 5 },
      { id: "t2", name: "Premium", price: 180.0, description: "Visão privilegiada + lounge", available: 150, maxPerPurchase: 3 },
    ],
  },
  {
    id: "e5", title: "Forró Pé de Serra",
    image: "https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=900&h=500&fit=crop",
    date: "10", month: "MAI", dayOfWeek: "SÁB", fullDate: "10 de Maio de 2026", time: "20:00",
    location: "Recife - PE", venue: "Pátio de São Pedro", category: "Forró",
    price: 35.0, description: "Uma noite de forró autêntico com os mestres do pé de serra nordestino.",
    organizer: "Forró Raiz", rating: 4.7, totalReviews: 430, ageRating: "Livre",
    tickets: [
      { id: "t1", name: "Ingresso Único", price: 35.0, description: "Acesso completo", available: 600, maxPerPurchase: 6 },
    ],
  },
  {
    id: "e6", title: "Calourada Universitária",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&h=500&fit=crop",
    date: "17", month: "MAI", dayOfWeek: "SÁB", fullDate: "17 de Maio de 2026", time: "22:00",
    location: "Assis - SP", venue: "Centro de Eventos UNESP", category: "Universitário",
    price: 25.0, description: "A festa de recepção mais animada do interior paulista!",
    organizer: "Atlética UNESP", rating: 4.3, totalReviews: 310, ageRating: "18+",
    tickets: [
      { id: "t1", name: "Antecipado", price: 25.0, description: "Lote promocional", available: 400, maxPerPurchase: 5 },
      { id: "t2", name: "Na hora", price: 40.0, description: "Compra no dia do evento", available: 200, maxPerPurchase: 3 },
    ],
  },
  {
    id: "e7", title: "Show de Stand-Up",
    image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=900&h=500&fit=crop",
    date: "24", month: "MAI", dayOfWeek: "SÁB", fullDate: "24 de Maio de 2026", time: "21:00",
    location: "Belo Horizonte - MG", venue: "Teatro Alterosa", category: "Cultural",
    price: 60.0, description: "Uma noite de risadas com os comediantes mais engraçados do país.",
    organizer: "Riso Livre", rating: 4.8, totalReviews: 890, ageRating: "16+",
    tickets: [
      { id: "t1", name: "Plateia", price: 60.0, description: "Assento na plateia geral", available: 300, maxPerPurchase: 4 },
      { id: "t2", name: "VIP 1ª Fila", price: 150.0, description: "Primeiras filas + foto com artistas", available: 30, maxPerPurchase: 2 },
    ],
  },
  {
    id: "e8", title: "Tardezinha Sunset",
    image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=900&h=500&fit=crop",
    date: "31", month: "MAI", dayOfWeek: "SÁB", fullDate: "31 de Maio de 2026", time: "15:00",
    location: "Maracaju - MS", venue: "Rancho Bom", category: "Festa",
    price: 55.0, description: "Tardezinha ao pôr-do-sol com música ao vivo, churrasco e drinks especiais.",
    organizer: "Sunset MS", rating: 4.4, totalReviews: 220, ageRating: "16+",
    tickets: [
      { id: "t1", name: "Individual", price: 55.0, description: "Acesso individual", available: 400, maxPerPurchase: 5 },
      { id: "t2", name: "Dupla", price: 90.0, description: "Pacote casal", available: 150, maxPerPurchase: 3 },
    ],
  },
  {
    id: "e9", title: "Copa de Futebol Society",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=900&h=400&fit=crop",
    date: "07", month: "JUN", dayOfWeek: "SÁB", fullDate: "07 de Junho de 2026", time: "08:00",
    location: "Goiânia - GO", venue: "Arena Society GO", category: "Esportivo",
    price: 40.0, description: "Torneio de futebol society com premiação em dinheiro! Monte seu time e venha disputar.",
    organizer: "Society Cup", rating: 4.2, totalReviews: 180, ageRating: "Livre",
    tickets: [
      { id: "t1", name: "Inscrição Time", price: 40.0, description: "Inscrição por jogador", available: 200, maxPerPurchase: 10 },
    ],
  },
  {
    id: "e10", title: "Festival de Jazz",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=900&h=400&fit=crop",
    date: "14", month: "JUN", dayOfWeek: "SÁB", fullDate: "14 de Junho de 2026", time: "19:00",
    location: "Porto Alegre - RS", venue: "Casa de Cultura Mario Quintana", category: "Cultural",
    price: 95.0, description: "Uma noite sofisticada de jazz com músicos premiados e vinho incluso.",
    organizer: "Jazz Sul Festival", rating: 4.9, totalReviews: 560, ageRating: "16+",
    tickets: [
      { id: "t1", name: "Standard", price: 95.0, description: "Assento na área geral", available: 200, maxPerPurchase: 4 },
      { id: "t2", name: "Gold", price: 250.0, description: "Mesa frontal + garrafa de vinho", available: 40, maxPerPurchase: 2 },
    ],
  },
  {
    id: "e11", title: "Balada Funk Premium",
    image: "https://images.unsplash.com/photo-1571266028243-d220c6a8b0e5?w=900&h=400&fit=crop",
    date: "21", month: "JUN", dayOfWeek: "SÁB", fullDate: "21 de Junho de 2026", time: "23:30",
    location: "São Paulo - SP", venue: "Club 041", category: "Festa",
    price: 70.0, description: "A maior balada funk de SP com os MCs mais hypados do momento.",
    organizer: "Funk Premium", rating: 4.5, totalReviews: 1500, ageRating: "18+",
    tickets: [
      { id: "t1", name: "Feminino", price: 50.0, description: "Ingresso feminino", available: 500, maxPerPurchase: 4 },
      { id: "t2", name: "Masculino", price: 70.0, description: "Ingresso masculino", available: 500, maxPerPurchase: 4 },
      { id: "t3", name: "Camarote", price: 300.0, description: "Camarote até 10 pessoas", available: 15, maxPerPurchase: 1 },
    ],
  },
  {
    id: "e12", title: "Arraiá do Zuuppi",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900&h=400&fit=crop",
    date: "28", month: "JUN", dayOfWeek: "SÁB", fullDate: "28 de Junho de 2026", time: "18:00",
    location: "Campinas - SP", venue: "Parque Taquaral", category: "Forró",
    price: 30.0, description: "Festa junina ao estilo Zuuppi! Comidas típicas, quadrilha, forró e fogueira.",
    organizer: "Zuuppi Eventos", rating: 4.6, totalReviews: 350, ageRating: "Livre",
    tickets: [
      { id: "t1", name: "Entrada + 5 fichas", price: 30.0, description: "Acesso + fichas para barracas", available: 800, maxPerPurchase: 6 },
      { id: "t2", name: "Pacote Família", price: 80.0, description: "4 entradas + 20 fichas", available: 100, maxPerPurchase: 2 },
    ],
  },
];

const CATEGORIES = ["Pagode", "Forró", "Sertanejo", "Rock", "Eletrônica", "Festa", "Esportivo", "Cultural", "Universitário"];
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Pagode: Music, Forró: Music, Sertanejo: Music, Rock: Zap, Eletrônica: Zap,
  Festa: PartyPopper, Esportivo: Trophy, Cultural: Theater, Universitário: Palette,
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PAYMENT_METHODS = [
  { id: "pix", label: "PIX", icon: QrCode, desc: "Aprovação instantânea" },
  { id: "credit", label: "Cartão de Crédito", icon: CreditCard, desc: "Até 3x sem juros" },
];

/* ── Hero Carousel ── */
const HeroCarousel = ({ onSelectEvent }: { onSelectEvent: (id: string) => void }) => {
  const featured = EVENTS.slice(0, 4);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => { setDirection(1); setCurrent(p => (p + 1) % featured.length); }, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const go = (dir: number) => { clearInterval(timerRef.current); setDirection(dir); setCurrent(p => (p + dir + featured.length) % featured.length); };
  const ev = featured[current];

  return (
    <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl cursor-pointer aspect-[16/9] sm:aspect-[16/7]" onClick={() => onSelectEvent(ev.id)}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div key={current} custom={direction} initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} className="absolute inset-0">
          <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-3 left-3 right-12 sm:bottom-6 sm:left-6">
            <Badge className="mb-1.5 bg-primary/90 text-primary-foreground border-none text-[10px] sm:text-xs">{ev.category}</Badge>
            <h2 className="text-base sm:text-xl md:text-3xl font-bold text-white drop-shadow-lg leading-tight">{ev.title}</h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-white/80 text-[11px] sm:text-sm">
              <span className="flex items-center gap-1"><MapPin size={12} />{ev.location}</span>
              <span className="flex items-center gap-1"><Calendar size={12} />{ev.dayOfWeek} · {ev.date} {ev.month}</span>
            </div>
            <span className="inline-block mt-1.5 text-sm sm:text-lg font-bold text-white">A partir de {fmt(ev.price)}</span>
          </div>
        </motion.div>
      </AnimatePresence>
      <button onClick={e => { e.stopPropagation(); go(-1); }} className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition"><ChevronLeft size={18} /></button>
      <button onClick={e => { e.stopPropagation(); go(1); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition"><ChevronRight size={18} /></button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {featured.map((_, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); setDirection(i > current ? 1 : -1); setCurrent(i); }} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${i === current ? "bg-white w-4 sm:w-5" : "bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
};

/* ── Event Card ── */
const EventCard = ({ ev, onClick }: { ev: EventData; onClick: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -4, transition: { duration: 0.2 } }} onClick={onClick} className="rounded-xl overflow-hidden bg-card border border-border shadow-sm cursor-pointer group">
    <div className="relative aspect-[4/3] overflow-hidden">
      <img src={ev.image} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-white/95 backdrop-blur-sm rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 text-center shadow-sm min-w-[36px] sm:min-w-[44px]">
        <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase block leading-tight">{ev.dayOfWeek}</span>
        <span className="text-sm sm:text-lg font-bold text-foreground leading-none">{ev.date}</span>
        <span className="text-[8px] sm:text-[9px] font-bold text-primary uppercase block leading-tight">{ev.month}</span>
      </div>
      <Badge className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-primary/90 text-primary-foreground border-none text-[9px] sm:text-[10px] px-1.5 py-0.5">{ev.category}</Badge>
    </div>
    <div className="p-2 sm:p-3">
      <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate">{ev.title}</h3>
      <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-0.5 sm:mt-1 truncate"><MapPin size={10} className="shrink-0" />{ev.location}</p>
      <div className="flex items-center justify-between mt-1.5 sm:mt-2">
        <span className="text-xs sm:text-sm font-bold text-primary">{fmt(ev.price)}</span>
        <Button size="sm" className="h-6 sm:h-7 text-[10px] sm:text-xs rounded-full px-2.5 sm:px-4">Comprar</Button>
      </div>
    </div>
  </motion.div>
);

/* ── Event Detail (full page overlay) ── */
const EventDetail = ({ event, onClose, onBuy }: { event: EventData; onClose: () => void; onBuy: (event: EventData) => void }) => {
  const [liked, setLiked] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-background overflow-y-auto">
      {/* Hero */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[16/7]" style={{ minHeight: 180, maxHeight: 420 }}>
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
        <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between">
          <button onClick={onClose} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition"><ArrowLeft size={18} /></button>
          <div className="flex gap-2">
            <button onClick={() => setLiked(!liked)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition"><Heart size={18} fill={liked ? "currentColor" : "none"} className={liked ? "text-red-500" : ""} /></button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copiado!"); }} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition"><Share2 size={18} /></button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 pb-24 sm:pb-28 -mt-8 sm:-mt-10 relative z-10">
        <div className="flex items-start gap-3">
          <div className="bg-card border border-border rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-center shadow-lg shrink-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase block">{event.dayOfWeek}</span>
            <span className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{event.date}</span>
            <span className="text-[10px] sm:text-xs font-bold text-primary uppercase block">{event.month}</span>
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <Badge className="mb-1 bg-primary/10 text-primary border border-primary/20 text-[10px] sm:text-xs">{event.category}</Badge>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">{event.title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">por {event.organizer}</p>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { icon: Calendar, label: event.fullDate },
            { icon: Clock, label: `Início às ${event.time}` },
            { icon: MapPin, label: event.venue },
            { icon: Users, label: event.ageRating },
          ].map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-center gap-2">
              <item.icon size={16} className="text-primary shrink-0" />
              <span className="text-xs text-foreground font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(event.rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"} />)}
          </div>
          <span className="text-sm font-semibold text-foreground">{event.rating}</span>
          <span className="text-xs text-muted-foreground">({event.totalReviews} avaliações)</span>
        </div>

        {/* Description */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-foreground mb-2">Sobre o evento</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
        </div>

        {/* Location */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-foreground mb-2">Local</h2>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><MapPin size={22} className="text-primary" /></div>
            <div>
              <p className="font-semibold text-foreground">{event.venue}</p>
              <p className="text-sm text-muted-foreground">{event.location}</p>
            </div>
          </div>
        </div>

        {/* Tickets preview */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Ingressos</h2>
          <div className="space-y-2">
            {event.tickets.map(t => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.available} disponíveis</p>
                </div>
                <span className="text-lg font-bold text-primary">{fmt(t.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[61] bg-card/95 backdrop-blur-md border-t border-border px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">A partir de</p>
            <p className="text-lg sm:text-xl font-bold text-primary">{fmt(event.price)}</p>
          </div>
          <Button size="default" className="rounded-full px-5 sm:px-8 font-semibold text-sm sm:text-base h-10 sm:h-11" onClick={() => onBuy(event)}>
            <Ticket size={16} className="mr-1.5" /> Comprar
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Checkout Flow ── */
type CheckoutStep = "tickets" | "payment" | "confirmation";

const CheckoutFlow = ({ event, onClose }: { event: EventData; onClose: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<CheckoutStep>("tickets");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [processing, setProcessing] = useState(false);

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = event.tickets.reduce((acc, t) => acc + (quantities[t.id] || 0) * t.price, 0);

  const updateQty = (id: string, delta: number, max: number) => {
    setQuantities(prev => {
      const v = Math.max(0, Math.min(max, (prev[id] || 0) + delta));
      return { ...prev, [id]: v };
    });
  };

  const handleConfirm = async () => {
    if (!user) { toast.error("Faça login para comprar ingressos"); navigate("/auth"); return; }
    setProcessing(true);
    try {
      const eventUuid = /^[0-9a-f-]{36}$/i.test(event.id) ? event.id : toUuid(event.id);
      const selected = event.tickets.filter(t => (quantities[t.id] || 0) > 0);

      const rows = selected.map(t => {
        const ticketUuid = /^[0-9a-f-]{36}$/i.test(t.id) ? t.id : toUuid(t.id);
        const qty = quantities[t.id];
        const subtotal = qty * t.price * 1.1; // inclui taxa
        return {
          user_id: user.id,
          event_id: eventUuid,
          ticket_id: ticketUuid,
          quantity: qty,
          unit_price: t.price,
          total_paid: Number(subtotal.toFixed(2)),
          payment_method: paymentMethod,
          status: "confirmed",
        };
      });

      const { error } = await supabase.from("ticket_purchases").insert(rows);
      if (error) throw error;

      // Atualiza estoque no banco (afeta apenas eventos reais) e localmente
      await Promise.all(selected.map(async t => {
        const ticketUuid = /^[0-9a-f-]{36}$/i.test(t.id) ? t.id : toUuid(t.id);
        const newAvailable = Math.max(0, t.available - quantities[t.id]);
        await supabase.from("event_tickets").update({ available: newAvailable }).eq("id", ticketUuid);
        t.available = newAvailable;
      }));

      toast.success("Compra confirmada!");
      setStep("confirmation");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao processar compra");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-background w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step !== "tickets" && step !== "confirmation" && (
              <button onClick={() => setStep("tickets")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
            )}
            <div>
              <h2 className="font-bold text-foreground">{step === "tickets" ? "Selecionar ingressos" : step === "payment" ? "Pagamento" : "Compra confirmada!"}</h2>
              <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-none">{event.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Ticket selection */}
            {step === "tickets" && (
              <motion.div key="tickets" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                {/* Event mini card */}
                <div className="flex gap-3 mb-5">
                  <img src={event.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.fullDate} · {event.time}</p>
                    <p className="text-xs text-muted-foreground">{event.venue}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {event.tickets.map(t => {
                    const qty = quantities[t.id] || 0;
                    return (
                      <div key={t.id} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t.available} restantes · Máx {t.maxPerPurchase}/compra</p>
                          </div>
                          <span className="text-base font-bold text-primary whitespace-nowrap">{fmt(t.price)}</span>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => updateQty(t.id, -1, t.maxPerPurchase)} disabled={qty === 0} className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground disabled:opacity-30 hover:bg-secondary transition"><Minus size={16} /></button>
                          <span className="text-base font-bold text-foreground w-6 text-center">{qty}</span>
                          <button onClick={() => updateQty(t.id, 1, t.maxPerPurchase)} disabled={qty >= t.maxPerPurchase} className="w-8 h-8 rounded-full border border-primary bg-primary/10 flex items-center justify-center text-primary disabled:opacity-30 hover:bg-primary/20 transition"><Plus size={16} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalItems > 0 && (
                  <div className="mt-5 bg-card border border-border rounded-xl p-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{totalItems} ingresso{totalItems > 1 ? "s" : ""}</span>
                      <span className="font-semibold text-foreground">{fmt(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-muted-foreground">Taxa de serviço</span>
                      <span className="font-semibold text-foreground">{fmt(totalPrice * 0.1)}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="text-xl font-bold text-primary">{fmt(totalPrice * 1.1)}</span>
                    </div>
                  </div>
                )}

                <Button disabled={totalItems === 0} className="w-full mt-4 rounded-full h-12 font-semibold text-base" onClick={() => setStep("payment")}>
                  Continuar para pagamento
                </Button>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {step === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="font-semibold text-foreground mb-3">Método de pagamento</h3>
                <div className="space-y-2 mb-5">
                  {PAYMENT_METHODS.map(pm => {
                    const Icon = pm.icon;
                    const active = paymentMethod === pm.id;
                    return (
                      <button key={pm.id} onClick={() => setPaymentMethod(pm.id)} className={`w-full flex items-center gap-3 p-4 rounded-xl border transition ${active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary"}`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? "bg-primary/10" : "bg-secondary"}`}>
                          <Icon size={20} className={active ? "text-primary" : "text-muted-foreground"} />
                        </div>
                        <div className="text-left flex-1">
                          <p className={`font-semibold text-sm ${active ? "text-primary" : "text-foreground"}`}>{pm.label}</p>
                          <p className="text-xs text-muted-foreground">{pm.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? "border-primary" : "border-border"}`}>
                          {active && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Order summary */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-foreground text-sm mb-3">Resumo do pedido</h4>
                  {event.tickets.filter(t => (quantities[t.id] || 0) > 0).map(t => (
                    <div key={t.id} className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{quantities[t.id]}x {t.name}</span>
                      <span className="text-foreground">{fmt((quantities[t.id] || 0) * t.price)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Taxa de serviço</span>
                    <span className="text-foreground">{fmt(totalPrice * 0.1)}</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2 flex justify-between">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">{fmt(totalPrice * 1.1)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground mb-4">
                  <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>Pagamento seguro processado pela ZuuPass. Seus dados estão protegidos.</span>
                </div>

                <Button className="w-full rounded-full h-12 font-semibold text-base" onClick={handleConfirm} disabled={processing}>
                  {processing ? (
                    <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Processando...</span>
                  ) : (
                    <>Confirmar e pagar {fmt(totalPrice * 1.1)}</>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === "confirmation" && (
              <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10 }}>
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} className="text-green-500" />
                  </div>
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-1">Compra confirmada!</h3>
                <p className="text-sm text-muted-foreground mb-6">Seu ingresso foi gerado e enviado por e-mail.</p>

                <div className="bg-card border border-border rounded-xl p-4 text-left mb-4">
                  <div className="flex gap-3 mb-3">
                    <img src={event.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.fullDate} · {event.time}</p>
                    </div>
                  </div>
                  {event.tickets.filter(t => (quantities[t.id] || 0) > 0).map(t => (
                    <div key={t.id} className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{quantities[t.id]}x {t.name}</span>
                      <span className="text-foreground">{fmt((quantities[t.id] || 0) * t.price)}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 mt-2 flex justify-between">
                    <span className="font-bold text-foreground">Total pago</span>
                    <span className="font-bold text-primary">{fmt(totalPrice * 1.1)}</span>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3 mb-6">
                  <QrCode size={40} className="text-primary shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm">QR Code do ingresso</p>
                    <p className="text-xs text-muted-foreground">Apresente na entrada do evento</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>Voltar</Button>
                  <Button className="flex-1 rounded-full" onClick={() => { onClose(); navigate("/pedidos"); }}>Meus ingressos</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Main Page ── */
const ZuuPass = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [checkoutEvent, setCheckoutEvent] = useState<EventData | null>(null);


  const filtered = useMemo(() => EVENTS.filter(ev => {
    // Filtragem por localização
    if (currentLocation && ev.location !== currentLocation) return false;
    
    if (search && !ev.title.toLowerCase().includes(search.toLowerCase()) && !ev.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory && ev.category !== selectedCategory) return false;
    return true;
  }), [search, selectedCategory, currentLocation]);


  const openEvent = (id: string) => {
    const ev = EVENTS.find(e => e.id === id);
    if (ev) setSelectedEvent(ev);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center gap-2 sm:gap-3">
          <button onClick={() => navigate("/")} className="text-foreground hover:text-primary transition-colors shrink-0"><ArrowLeft size={20} /></button>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Ticket size={16} className="text-primary" /></div>
            <span className="font-bold text-foreground text-base sm:text-lg hidden sm:inline">ZuuPass</span>
          </div>

          <div className="flex-1 flex items-center gap-2 max-w-xl">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-secondary/50 rounded-full border border-border text-[10px] sm:text-xs text-muted-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0">
                  <MapPin size={14} className="text-primary" />
                  <span className="font-medium text-foreground truncate max-w-[60px] sm:max-w-none">{currentLocation}</span>
                  <ChevronDown size={14} />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {AVAILABLE_CITIES.map(city => (
                  <DropdownMenuItem key={city} onClick={() => setCurrentLocation(city)} className="text-xs cursor-pointer">
                    <MapPin size={12} className="mr-2 text-muted-foreground" />
                    {city}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>



            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar evento" className="w-full bg-secondary/60 border-none rounded-full pl-8 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate(user ? "/perfil" : "/auth")}>{user ? "Minha conta" : "Entrar"}</Button>
            <Button size="sm" className="rounded-full">Crie seu evento</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5 sm:space-y-8">
        <HeroCarousel onSelectEvent={openEvent} />

        {/* Category quick-scroll */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:-mx-4 sm:px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {CATEGORIES.map(cat => {
            const Icon = CATEGORY_ICONS[cat] || Ticket;
            const active = selectedCategory === cat;
            return (
              <button key={cat} onClick={() => setSelectedCategory(active ? "" : cat)} className={`flex items-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors shrink-0 border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-secondary"}`}>
                <Icon size={12} />{cat}
              </button>
            );
          })}
        </div>

        {/* Events grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Próximos eventos</h2>
            <span className="text-sm text-muted-foreground">{filtered.length} eventos</span>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <Ticket size={40} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum evento encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {filtered.map(ev => <EventCard key={ev.id} ev={ev} onClick={() => openEvent(ev.id)} />)}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
          <div className="relative px-6 py-10 md:py-14 text-center text-primary-foreground">
            <Ticket size={40} className="mx-auto mb-3 opacity-80" />
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Crie e venda seus ingressos</h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-5">Organize seu evento e comece a vender ingressos pela ZuuPass. Simples, rápido e sem burocracia.</p>
            <Button size="lg" variant="secondary" className="rounded-full font-semibold">Começar agora</Button>
          </div>
        </section>
      </main>

      {/* Event Detail Overlay */}
      <AnimatePresence>
        {selectedEvent && !checkoutEvent && (
          <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} onBuy={(ev) => { setCheckoutEvent(ev); }} />
        )}
      </AnimatePresence>

      {/* Checkout Overlay */}
      <AnimatePresence>
        {checkoutEvent && (
          <CheckoutFlow event={checkoutEvent} onClose={() => { setCheckoutEvent(null); setSelectedEvent(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZuuPass;

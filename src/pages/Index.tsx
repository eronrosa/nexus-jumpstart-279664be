import { Search, Mic, User, LogIn, Home, ClipboardList, Sparkles, CreditCard, MessageCircle, Flame, Pizza, Ticket, Coffee, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BannerCarousel from "@/components/BannerCarousel";
import ServicesGrid from "@/components/ServicesGrid";
import FeaturedBusinesses from "@/components/FeaturedBusinesses";
import DeliverySection from "@/components/DeliverySection";
import CouponsSection from "@/components/CouponsSection";
import ClassifiedsSection from "@/components/ClassifiedsSection";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

const dailyOffers = [
  { icon: Pizza, label: "Pizza Hut 2x1" },
  { icon: Ticket, label: "Festa Sertaneja 30% OFF" },
  { icon: Coffee, label: "Cupom Coca-Cola grátis" },
  { icon: ShoppingBag, label: "McOferta do dia" },
];

const Index = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Sparkles size={20} className="text-primary" /></div>
              <div>
                <p className="font-semibold text-foreground">
                  {user ? `Olá, ${profile?.display_name ?? "usuário"}` : "Oi, eu sou a Zuzu"}
                </p>
                <p className="text-xs text-muted-foreground">No que posso te ajudar hoje?</p>
              </div>
            </div>
            {/* Auth button (mobile only) */}
            <button
              onClick={() => navigate(user ? "/perfil" : "/auth")}
              className="md:hidden flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
            >
              {user ? (
                profile?.avatar_url
                  ? <img src={profile.avatar_url} className="w-5 h-5 rounded-full object-cover" />
                  : <User size={14} />
              ) : <LogIn size={14} />}
              {user ? "Perfil" : "Entrar"}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Buscar restaurantes, combos, shows, viagens..."
              className="w-full bg-card border border-border rounded-full pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Mic className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground" size={16} />
          </div>

          <BannerCarousel />

          <section>
            <h2 className="text-base font-bold mb-3 flex items-center gap-2"><Flame size={18} className="text-primary" /> Ofertas do dia</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dailyOffers.map((o) => {
                const Icon = o.icon;
                return (
                  <button key={o.label} className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 text-sm whitespace-nowrap hover:bg-secondary transition-colors shrink-0">
                    <Icon size={16} className="text-primary" />
                    <span className="font-medium">{o.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <ServicesGrid />
          <FeaturedBusinesses />
          <DeliverySection />
          <CouponsSection />
          <ClassifiedsSection />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-50">
        {[
          { icon: Home, label: "Início", path: "/" },
          { icon: ClipboardList, label: "Pedidos", path: "/pedidos" },
          { icon: MessageCircle, label: "ZuuChat", path: "/zuuchat" },
          { icon: Sparkles, label: "ZUZU", path: "/" },
          { icon: User, label: "Perfil", path: user ? "/perfil" : "/auth" },
        ].map(({ icon: Icon, label, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Index;

import { Search, Mic } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";
import ServicesGrid from "@/components/ServicesGrid";
import FeaturedBusinesses from "@/components/FeaturedBusinesses";
import DeliverySection from "@/components/DeliverySection";
import CouponsSection from "@/components/CouponsSection";
import ClassifiedsSection from "@/components/ClassifiedsSection";
import Sidebar from "@/components/Sidebar";

const dailyOffers = [
  { emoji: "🍕", label: "Pizza Hut 2x1" },
  { emoji: "🎫", label: "Festa Sertaneja 30% OFF" },
  { emoji: "🥤", label: "Cupom Coca-Cola grátis" },
  { emoji: "🍟", label: "McOferta do dia" },
];

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
              ✨
            </div>
            <div>
              <p className="font-semibold text-foreground">Oi, eu sou a Zuzu 👋</p>
              <p className="text-xs text-muted-foreground">No que posso te ajudar hoje?</p>
            </div>
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

          {/* Banner Carousel */}
          <BannerCarousel />

          {/* Daily Offers */}
          <section>
            <h2 className="text-base font-bold mb-3">🔥 Ofertas do dia</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dailyOffers.map((o) => (
                <button
                  key={o.label}
                  className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 text-sm whitespace-nowrap hover:bg-secondary transition-colors shrink-0"
                >
                  <span>{o.emoji}</span>
                  <span className="font-medium">{o.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Services */}
          <ServicesGrid />

          {/* Featured Businesses */}
          <FeaturedBusinesses />

          {/* Deliveries */}
          <DeliverySection />

          {/* Coupons */}
          <CouponsSection />

          {/* Classifieds */}
          <ClassifiedsSection />

        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-3 z-50">
        {["🏠 Início", "📋 Pedidos", "✨ ZUZU", "💳 Zuupay", "👤 Perfil"].map((item) => (
          <button key={item} className="flex flex-col items-center text-[11px] text-muted-foreground gap-0.5 px-2">
            <span className="text-lg leading-none">{item.split(" ")[0]}</span>
            <span>{item.split(" ")[1]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Index;

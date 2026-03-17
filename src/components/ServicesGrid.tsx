import {
  Utensils, Car, Sparkles, Briefcase, Wrench, Ticket, BookOpen,
  MessageCircle, ShoppingBag, Tag, Phone, CreditCard, MapPin,
  Dumbbell, TrendingUp, Scissors
} from "lucide-react";

const services = [
  { icon: Utensils, label: "ZuuFood", color: "bg-orange-50 text-orange-500" },
  { icon: Car, label: "ZuuMob", color: "bg-blue-50 text-blue-500" },
  { icon: Sparkles, label: "ZUZU", color: "bg-purple-50 text-purple-500" },
  { icon: Briefcase, label: "ZuuPro", color: "bg-yellow-50 text-yellow-600" },
  { icon: Wrench, label: "ZuuWork", color: "bg-gray-100 text-gray-500" },
  { icon: Ticket, label: "ZuuPass", color: "bg-pink-50 text-pink-500" },
  { icon: BookOpen, label: "ZuuBook", color: "bg-teal-50 text-teal-500" },
  { icon: MessageCircle, label: "ZuuChat", color: "bg-green-50 text-green-500" },
  { icon: ShoppingBag, label: "ZuuShop", color: "bg-red-50 text-red-500" },
  { icon: Tag, label: "Cupons", color: "bg-amber-50 text-amber-500" },
  { icon: Phone, label: "ZuuCall", color: "bg-indigo-50 text-indigo-500" },
  { icon: CreditCard, label: "ZuuPay", color: "bg-emerald-50 text-emerald-500" },
  { icon: MapPin, label: "ZuuPlace", color: "bg-rose-50 text-rose-500" },
  { icon: Dumbbell, label: "ZuuFit", color: "bg-cyan-50 text-cyan-500" },
  { icon: TrendingUp, label: "ZuuFund", color: "bg-lime-50 text-lime-600" },
  { icon: Scissors, label: "Zuuoling", color: "bg-fuchsia-50 text-fuchsia-500" },
];

const ServicesGrid = () => {
  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-3">Nossos Serviços</h2>
      <div className="bg-card rounded-2xl p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {services.map(({ icon: Icon, label, color }) => (
          <button
            key={label}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} group-hover:scale-105 transition-transform`}>
              <Icon size={22} />
            </div>
            <span className="text-[11px] text-center text-foreground/80 leading-tight font-medium">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ServicesGrid;

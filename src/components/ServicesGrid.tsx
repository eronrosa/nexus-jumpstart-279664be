import {
  Utensils, Car, Sparkles, Briefcase, Wrench, Ticket, BookOpen,
  MessageCircle, ShoppingBag, Tag, Phone, CreditCard, MapPin,
  Dumbbell, TrendingUp, Scissors
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const services = [
  { icon: Utensils, label: "ZuuFood", color: "bg-orange-50 text-orange-500", path: "/zuufood" },
  { icon: Car, label: "ZuuMob", color: "bg-blue-50 text-blue-500", path: "/zuumob" },
  { icon: Sparkles, label: "ZUZU", color: "bg-purple-50 text-purple-500", path: "/" },
  { icon: Briefcase, label: "ZuuPro", color: "bg-yellow-50 text-yellow-600", path: "/" },
  { icon: Wrench, label: "ZuuWork", color: "bg-gray-100 text-gray-500", path: "/" },
  { icon: Ticket, label: "ZuuPass", color: "bg-pink-50 text-pink-500", path: "/" },
  { icon: BookOpen, label: "ZuuBook", color: "bg-teal-50 text-teal-500", path: "/" },
  { icon: MessageCircle, label: "ZuuChat", color: "bg-green-50 text-green-500", path: "/" },
  { icon: ShoppingBag, label: "ZuuShop", color: "bg-red-50 text-red-500", path: "/" },
  { icon: Tag, label: "Cupons", color: "bg-amber-50 text-amber-500", path: "/" },
  { icon: Phone, label: "ZuuCall", color: "bg-indigo-50 text-indigo-500", path: "/" },
  { icon: CreditCard, label: "ZuuPay", color: "bg-emerald-50 text-emerald-500", path: "/" },
  { icon: MapPin, label: "ZuuPlace", color: "bg-rose-50 text-rose-500", path: "/" },
  { icon: Dumbbell, label: "ZuuFit", color: "bg-cyan-50 text-cyan-500", path: "/" },
  { icon: TrendingUp, label: "ZuuFund", color: "bg-lime-50 text-lime-600", path: "/" },
  { icon: Scissors, label: "Zuuoling", color: "bg-fuchsia-50 text-fuchsia-500", path: "/" },
];

const ServicesGrid = () => {
  const navigate = useNavigate();

  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-3">Nossos Serviços</h2>
      <div className="bg-card rounded-2xl p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {services.map(({ icon: Icon, label, color, path }, i) => (
          <motion.button
            key={label}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-2"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
              <Icon size={22} />
            </div>
            <span className="text-[11px] text-center text-foreground/80 leading-tight font-medium">{label}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default ServicesGrid;

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Tag, Clock, CheckCircle, Share2, Heart } from "lucide-react";

const COUPONS: Record<string, {
  image: string;
  brand: string;
  logo: string;
  discount: string;
  title: string;
  description: string;
  expiresAt: Date;
  remaining: number;
  code: string;
  category: string;
}> = {
  "coupon-1": {
    image: "https://images.unsplash.com/photo-1591047139829-d919b5ca4d3a?auto=format&fit=crop&w=800&q=80",
    brand: "SHOULDER",
    logo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop",
    discount: "-30%",
    title: "Jaquetas importadas com 30% em desconto",
    description: "Aproveite 30% de desconto em toda a linha de jaquetas importadas da Shoulder. Válido para compras no site e lojas físicas participantes.",
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    remaining: 188,
    code: "SHOULDER30",
    category: "Moda",
  },
  "coupon-2": {
    image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=800&q=80",
    brand: "BENEDETTO PIZZARIA",
    logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=80&h=80&fit=crop",
    discount: "-10%",
    title: "Pizza de Calabresa com 10% de desconto",
    description: "Peça a tradicional pizza de Calabresa com 10% de desconto. Válido para delivery e retirada no balcão.",
    expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    remaining: 191,
    code: "PIZZA10",
    category: "Alimentação",
  },
  "coupon-3": {
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    brand: "MOCELLIN CHURRASCARIA",
    logo: "https://images.unsplash.com/photo-1544025162-d76594e8bb9d?w=80&h=80&fit=crop",
    discount: "-44%",
    title: "2 Rodízios por apenas R$ 166,00",
    description: "Dois rodízios completos com todas as carnes e acompanhamentos por apenas R$ 166,00. Reserve sua mesa agora!",
    expiresAt: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000 + 30 * 60 * 1000),
    remaining: 2,
    code: "RODIZIO44",
    category: "Alimentação",
  },
  "coupon-4": {
    image: "https://images.unsplash.com/photo-1579781354199-2cf394134aa7?auto=format&fit=crop&w=800&q=80",
    brand: "STARBUCKS",
    logo: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=80&h=80&fit=crop",
    discount: "2x1",
    title: "Compre um Frappuccino e ganhe outro",
    description: "Peça qualquer Frappuccino e ganhe o segundo gratuitamente. Disponível nas lojas participantes.",
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
    remaining: 320,
    code: "FRAP2X1",
    category: "Cafeteria",
  },
};

const pad = (n: number) => String(n).padStart(2, "0");

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, target.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(Math.max(0, target.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: timeLeft === 0 };
}

const CouponDetail = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get("id") ?? "coupon-1";
  const coupon = COUPONS[id] ?? COUPONS["coupon-1"];

  const { days, hours, minutes, seconds, expired } = useCountdown(coupon.expiresAt);
  const [redeemed, setRedeemed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleRedeem = () => setRedeemed(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const urgent = !expired && days === 0 && hours < 4;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-border flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
          <ArrowLeft size={18} />
          Voltar
        </button>
        <span className="font-bold text-foreground text-sm">Cupom</span>
        <button onClick={() => setLiked(l => !l)} className="p-1">
          <motion.div animate={{ scale: liked ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.3 }}>
            <Heart size={20} className={liked ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
          </motion.div>
        </button>
      </div>

      <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-2xl overflow-hidden h-52"
        >
          <img src={coupon.image} alt={coupon.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <span className="absolute top-3 right-3 bg-primary text-primary-foreground font-extrabold text-sm px-3 py-1 rounded-full">
            {coupon.discount}
          </span>
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <img src={coupon.logo} alt={coupon.brand} className="w-9 h-9 rounded-full border-2 border-white object-cover" />
            <span className="text-white font-bold text-sm">{coupon.brand}</span>
          </div>
        </motion.div>

        {/* Title & category */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <div className="flex items-center gap-2 mb-1">
            <Tag size={13} className="text-primary" />
            <span className="text-xs text-primary font-semibold uppercase tracking-wide">{coupon.category}</span>
          </div>
          <h1 className="text-xl font-bold text-foreground leading-snug">{coupon.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">{coupon.description}</p>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className={`rounded-2xl p-4 ${urgent ? "bg-red-50 border border-red-200" : "bg-card border border-border"}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className={urgent ? "text-red-500" : "text-muted-foreground"} />
            <span className={`text-xs font-semibold ${urgent ? "text-red-500" : "text-muted-foreground"}`}>
              {expired ? "Cupom expirado" : urgent ? "⚠️ Expira em breve!" : "Tempo restante"}
            </span>
          </div>

          {!expired ? (
            <div className="flex gap-3">
              {[
                { value: days, label: "dias" },
                { value: hours, label: "horas" },
                { value: minutes, label: "min" },
                { value: seconds, label: "seg" },
              ].map(({ value, label }) => (
                <div key={label} className="flex-1 flex flex-col items-center">
                  <motion.div
                    key={value}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`w-full text-center text-2xl font-extrabold rounded-xl py-2 ${urgent ? "bg-red-100 text-red-600" : "bg-secondary text-foreground"}`}
                  >
                    {pad(value)}
                  </motion.div>
                  <span className="text-[11px] text-muted-foreground mt-1">{label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">Este cupom não está mais disponível.</p>
          )}

          {!expired && (
            <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
              <Tag size={13} className="text-primary" /> <span className="font-semibold text-foreground">{coupon.remaining}</span> cupons restantes
            </p>
          )}
        </motion.div>

        {/* Redeem button / code */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <AnimatePresence mode="wait">
            {!redeemed ? (
              <motion.button
                key="redeem"
                onClick={handleRedeem}
                disabled={expired}
                whileHover={{ scale: expired ? 1 : 1.02 }}
                whileTap={{ scale: expired ? 1 : 0.97 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-colors ${
                  expired
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {expired ? "Cupom indisponível" : "Resgatar cupom"}
              </motion.button>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 15 }}
                  className="flex justify-center mb-3"
                >
                  <CheckCircle size={44} className="text-green-500" />
                </motion.div>
                <p className="font-bold text-green-700 text-lg">Cupom resgatado!</p>
                <p className="text-sm text-green-600 mt-1 mb-4">Use o código abaixo para aproveitar seu desconto</p>

                <button
                  onClick={handleCopy}
                  className="relative w-full bg-white border-2 border-dashed border-green-400 rounded-xl py-3 px-4 font-mono font-bold text-lg text-green-700 tracking-widest hover:bg-green-50 transition-colors"
                >
                  {coupon.code}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-500 font-sans font-normal">
                    {copied ? "✓ copiado!" : "toque p/ copiar"}
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Share */}
        {!redeemed && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Share2 size={15} />
            Compartilhar oferta
          </motion.button>
        )}

      </div>
    </div>
  );
};

export default CouponDetail;

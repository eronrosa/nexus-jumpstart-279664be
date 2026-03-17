import { motion } from "framer-motion";

const coupons = [
  {
    image: "https://images.unsplash.com/photo-1591047139829-d919b5ca4d3a?auto=format&fit=crop&w=600&q=80",
    brand: "SHOULDER",
    discount: "-30%",
    title: "Jaquetas importadas com 30% em desconto",
    until: "Até 05/01",
    remaining: 188,
  },
  {
    image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=600&q=80",
    brand: "BENEDETTO PIZZARIA",
    discount: "-10%",
    title: "Pizza de Calabresa com 10% de desconto",
    until: "Até 05/01",
    remaining: 191,
  },
  {
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    brand: "MOCELLIN CHURRASCARIA",
    discount: "-44%",
    title: "2 Rodízios por apenas R$ 166,00",
    until: "Até 05/01",
    remaining: 2,
  },
  {
    image: "https://images.unsplash.com/photo-1579781354199-2cf394134aa7?auto=format&fit=crop&w=600&q=80",
    brand: "STARBUCKS",
    discount: "2x1",
    title: "Compre um Frappuccino e ganhe outro",
    until: "Até 10/01",
    remaining: 320,
  },
];

const CouponsSection = () => (
  <section>
    <h2 className="text-base font-bold text-foreground mb-1">Cupons Desconto</h2>
    <p className="text-xs text-muted-foreground mb-3">Super promoções para você, aproveite!</p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {coupons.map((c, i) => (
        <motion.div
          key={c.title}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: i * 0.08, duration: 0.35, ease: "easeOut" }}
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          className="bg-card rounded-2xl overflow-hidden border border-border cursor-pointer"
        >
          <div className="relative">
            <img src={c.image} alt={c.title} className="w-full h-28 object-cover" />
            <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-extrabold px-2 py-0.5 rounded-full">
              {c.discount}
            </span>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{c.brand}</p>
            <p className="text-xs font-semibold leading-tight mt-0.5">{c.title}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">{c.until}</span>
              <span className="text-[10px] text-primary font-semibold">{c.remaining} restantes</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default CouponsSection;

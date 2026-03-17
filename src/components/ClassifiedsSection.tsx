import { motion } from "framer-motion";

const listings = [
  {
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800",
    category: "esporte_lazer",
    title: "Bicicleta Aro 29 - Nova",
    price: "R$ 950,00",
  },
  {
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=800",
    category: "eletronicos",
    title: "iPhone 14 Pro Max 256GB",
    price: "R$ 4.200,00",
  },
  {
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800",
    category: "eletronicos",
    title: "Notebook Gamer Ryzen 7 / 16GB",
    price: "R$ 6.200,00",
  },
  {
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
    category: "motos",
    title: "Yamaha Fazer 250 - 2019",
    price: "R$ 18.500,00",
  },
];

const ClassifiedsSection = () => (
  <section>
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-foreground">Classificados</h2>
      <button className="text-xs text-primary font-semibold hover:underline">Ver todos</button>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {listings.map((l, i) => (
        <motion.div
          key={l.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          className="bg-card rounded-2xl overflow-hidden border border-border cursor-pointer"
        >
          <img src={l.image} alt={l.title} className="w-full h-28 object-cover" />
          <div className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">{l.category}</p>
            <p className="text-xs font-semibold leading-tight mt-0.5">{l.title}</p>
            <p className="text-sm font-bold text-foreground mt-1">{l.price}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default ClassifiedsSection;

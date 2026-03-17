import { motion } from "framer-motion";

const businesses = [
  {
    name: "Pizzaria Bella Napoli",
    category: "Restaurante",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=400&q=80",
    cta: "Ver Cardápio",
  },
  {
    name: "TopFit Academia",
    category: "Fitness",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=400&q=80",
    cta: "Treinar Agora",
  },
  {
    name: "Clínica Viva Bem",
    category: "Saúde",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80",
    cta: "Agendar Consulta",
  },
  {
    name: "Beleza Lounge",
    category: "Salão de Beleza",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=400&q=80",
    cta: "Reservar Horário",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

const FeaturedBusinesses = () => (
  <section>
    <h2 className="text-base font-bold text-foreground mb-1">Empresas em Destaque</h2>
    <p className="text-xs text-muted-foreground mb-3">Conheça negócios e serviços perto de você</p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {businesses.map((b, i) => (
        <motion.div
          key={b.name}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          className="bg-card rounded-2xl overflow-hidden border border-border cursor-pointer"
        >
          <img src={b.image} alt={b.name} className="w-full h-28 object-cover" />
          <div className="p-3">
            <p className="font-semibold text-sm leading-tight">{b.name}</p>
            <p className="text-xs text-muted-foreground">{b.category}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold text-yellow-500">⭐ {b.rating}</span>
              <button className="text-xs text-primary font-semibold hover:underline">{b.cta}</button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default FeaturedBusinesses;

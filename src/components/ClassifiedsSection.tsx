const listings = [
  {
    image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&q=80&w=800",
    category: "esporte_lazer",
    title: "Bicicleta Aro 29 - Nova",
    price: "R$ 950,00",
  },
  {
    image: "https://images.unsplash.com/photo-1678639833215-a08b071485b3?auto=format&fit=crop&q=80&w=800",
    category: "eletronicos",
    title: "iPhone 14 Pro Max 256GB",
    price: "R$ 4.200,00",
  },
  {
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800",
    category: "eletronicos",
    title: "Notebook Gamer Ryzen 7 / 16GB",
    price: "R$ 6.200,00",
  },
  {
    image: "https://images.unsplash.com/photo-1625043818495-301138a35367?auto=format&fit=crop&q=80&w=800",
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
      {listings.map((l) => (
        <div key={l.title} className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-md transition-shadow cursor-pointer">
          <img src={l.image} alt={l.title} className="w-full h-28 object-cover" />
          <div className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">{l.category}</p>
            <p className="text-xs font-semibold leading-tight mt-0.5">{l.title}</p>
            <p className="text-sm font-bold text-foreground mt-1">{l.price}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default ClassifiedsSection;

const deliveries = [
  {
    name: "Restaurante Mitsuba",
    category: "Japonês",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    logo: "https://cdn-icons-png.flaticon.com/128/3081/3081050.png",
  },
  {
    name: "Bondinho Carioca",
    category: "Lanches",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
    logo: "https://cdn-icons-png.flaticon.com/128/3448/3448620.png",
    badge: "WHATSAPP",
  },
  {
    name: "Le Max Hamburgueria",
    category: "Hambúrguer",
    image: "https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?auto=format&fit=crop&w=800&q=80",
    logo: "https://cdn-icons-png.flaticon.com/128/877/877951.png",
  },
  {
    name: "Pizza Palace",
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    logo: "https://cdn-icons-png.flaticon.com/128/3595/3595458.png",
  },
];

const DeliverySection = () => (
  <section>
    <h2 className="text-base font-bold text-foreground mb-1">Deliverys em Alta</h2>
    <p className="text-xs text-muted-foreground mb-3">Bateu aquela fome? Bora fazer um pedido!</p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {deliveries.map((d) => (
        <div key={d.name} className="relative bg-card rounded-2xl overflow-hidden border border-border hover:shadow-md transition-shadow cursor-pointer">
          <img src={d.image} alt={d.name} className="w-full h-28 object-cover" />
          <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">DELIVERY</span>
          {d.badge && (
            <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{d.badge}</span>
          )}
          <div className="p-3 flex items-center gap-2">
            <img src={d.logo} alt={d.name} className="w-8 h-8 rounded-full bg-white border border-border" />
            <div>
              <p className="font-semibold text-xs leading-tight">{d.name}</p>
              <p className="text-[11px] text-muted-foreground">{d.category}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default DeliverySection;

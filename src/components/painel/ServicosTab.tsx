import { Sparkles, Megaphone, BarChart3, Headphones, Shield, Zap, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const SERVICES = [
  {
    id: "ads",
    title: "ZuuFood Ads",
    description: "Impulsione sua loja e apareça em destaque para mais clientes na plataforma.",
    icon: Megaphone,
    color: "text-primary",
    bg: "bg-primary/10",
    tag: "POPULAR",
    tagColor: "bg-primary text-primary-foreground",
  },
  {
    id: "analytics",
    title: "Analytics Pro",
    description: "Relatórios avançados com insights de vendas, clientes e comportamento de compra.",
    icon: BarChart3,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    tag: "NOVO",
    tagColor: "bg-blue-600 text-white",
  },
  {
    id: "support",
    title: "Suporte Premium",
    description: "Atendimento prioritário com gerente de conta dedicado para seu estabelecimento.",
    icon: Headphones,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    tag: null,
    tagColor: "",
  },
  {
    id: "security",
    title: "Proteção Antifraude",
    description: "Sistema inteligente que protege contra pedidos fraudulentos e chargebacks.",
    icon: Shield,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    tag: null,
    tagColor: "",
  },
  {
    id: "turbo",
    title: "Entrega Turbo",
    description: "Priorize suas entregas e ofereça tempos menores que a concorrência.",
    icon: Zap,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    tag: "EM BREVE",
    tagColor: "bg-muted text-muted-foreground",
  },
];

export default function ServicosTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-foreground text-xl">Serviços</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Ferramentas e integrações para impulsionar suas vendas</p>
      </div>

      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
          <Sparkles size={28} className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground">Potencialize seu negócio</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Descubra serviços exclusivos da plataforma ZuuFood para aumentar suas vendas e alcançar mais clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={22} className={s.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-foreground">{s.title}</p>
                    {s.tag && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${s.tagColor}`}>{s.tag}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
                <ExternalLink size={16} className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

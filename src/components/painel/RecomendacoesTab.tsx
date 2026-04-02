import { Award, Clock, TrendingUp, Camera, Star, Zap, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface RecomendacoesTabProps {
  store: {
    logo_url: string | null;
    cover_url: string | null;
    description: string | null;
    opening_hours: unknown;
    address_street: string | null;
  };
  menuItemsCount: number;
  ordersCount: number;
}

export default function RecomendacoesTab({ store, menuItemsCount, ordersCount }: RecomendacoesTabProps) {
  const checks = [
    { id: "logo", label: "Logo do estabelecimento", done: !!store.logo_url, tip: "Adicione uma logo para aumentar a confiança dos clientes", icon: Camera },
    { id: "cover", label: "Foto de capa", done: !!store.cover_url, tip: "Uma boa capa aumenta em 40% os cliques no seu perfil", icon: Camera },
    { id: "description", label: "Descrição da loja", done: !!store.description, tip: "Conte sobre sua loja e o que torna ela especial", icon: Star },
    { id: "hours", label: "Horário de funcionamento", done: !!store.opening_hours, tip: "Defina seus horários para aparecer como aberto corretamente", icon: Clock },
    { id: "address", label: "Endereço completo", done: !!store.address_street, tip: "O endereço ajuda a calcular taxas de entrega e tempo", icon: TrendingUp },
    { id: "menu", label: "Pelo menos 5 itens no cardápio", done: menuItemsCount >= 5, tip: `Você tem ${menuItemsCount} item(ns). Lojas com +5 itens vendem 3x mais`, icon: Zap },
    { id: "orders", label: "Primeiro pedido recebido", done: ordersCount > 0, tip: "Divulgue sua loja para receber seu primeiro pedido!", icon: Award },
  ];

  const completedCount = checks.filter(c => c.done).length;
  const completionPct = Math.round((completedCount / checks.length) * 100);

  const tips = [
    { title: "Melhore suas fotos", desc: "Fotos de qualidade profissional aumentam pedidos em até 30%. Use boa iluminação e ângulos atrativos.", icon: Camera, color: "text-primary", bg: "bg-primary/10" },
    { title: "Expanda seu horário", desc: "Lojas abertas no almoço e jantar faturam 2x mais. Considere abrir aos finais de semana.", icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
    { title: "Crie promoções", desc: "Cupons de desconto atraem novos clientes. Ofereça frete grátis no primeiro pedido.", icon: Award, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { title: "Responda avaliações", desc: "Lojas que respondem avaliações têm taxa de retorno 50% maior.", icon: Star, color: "text-blue-600", bg: "bg-blue-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-foreground text-xl">Recomendações</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Dicas personalizadas para melhorar o desempenho da sua loja</p>
      </div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Award size={28} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Perfil {completionPct}% completo</h3>
            <p className="text-sm text-muted-foreground">{completedCount} de {checks.length} itens concluídos</p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-background overflow-hidden">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 0.8, delay: 0.2 }}
            className="h-full rounded-full bg-primary" />
        </div>
      </motion.div>

      {/* Checklist */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h4 className="font-bold text-foreground mb-4">Checklist do estabelecimento</h4>
        <div className="space-y-2">
          {checks.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${c.done ? "bg-emerald-500/5 border-emerald-500/20" : "bg-background border-input"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.done ? "bg-emerald-500/10" : "bg-muted"}`}>
                  {c.done ? <CheckCircle size={16} className="text-emerald-600" /> : <Icon size={16} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${c.done ? "text-emerald-700 line-through" : "text-foreground"}`}>{c.label}</p>
                  {!c.done && <p className="text-xs text-muted-foreground mt-0.5">{c.tip}</p>}
                </div>
                {c.done && <span className="text-[10px] font-bold text-emerald-600">✓</span>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div>
        <h4 className="font-bold text-foreground mb-4">Dicas para vender mais</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:shadow-black/5 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${t.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={t.color} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

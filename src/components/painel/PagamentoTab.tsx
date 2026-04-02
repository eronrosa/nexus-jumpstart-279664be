import { useState } from "react";
import { CreditCard, Banknote, QrCode, Wallet, ToggleLeft, ToggleRight } from "lucide-react";
import { motion } from "framer-motion";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ElementType;
  enabled: boolean;
  category: "online" | "entrega";
}

const INITIAL_METHODS: PaymentMethod[] = [
  { id: "pix", name: "PIX", icon: QrCode, enabled: true, category: "online" },
  { id: "credit", name: "Cartão de Crédito", icon: CreditCard, enabled: true, category: "online" },
  { id: "debit", name: "Cartão de Débito", icon: CreditCard, enabled: true, category: "online" },
  { id: "wallet", name: "Carteira Digital", icon: Wallet, enabled: false, category: "online" },
  { id: "cash", name: "Dinheiro", icon: Banknote, enabled: true, category: "entrega" },
  { id: "card_delivery", name: "Cartão na Entrega", icon: CreditCard, enabled: false, category: "entrega" },
];

export default function PagamentoTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>(INITIAL_METHODS);

  const toggle = (id: string) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const online = methods.filter(m => m.category === "online");
  const delivery = methods.filter(m => m.category === "entrega");

  const renderGroup = (title: string, items: PaymentMethod[]) => (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-bold text-foreground text-lg mb-4">{title}</h3>
      <div className="space-y-2">
        {items.map(m => {
          const Icon = m.icon;
          return (
            <motion.div key={m.id} layout
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${m.enabled ? "bg-background border-input" : "bg-muted/30 border-border opacity-60"}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${m.enabled ? "bg-primary/10" : "bg-muted"}`}>
                <Icon size={20} className={m.enabled ? "text-primary" : "text-muted-foreground"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.enabled ? "Aceito no seu estabelecimento" : "Desativado"}</p>
              </div>
              <button onClick={() => toggle(m.id)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                {m.enabled
                  ? <ToggleRight size={24} className="text-emerald-500" />
                  : <ToggleLeft size={24} className="text-muted-foreground" />}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-foreground text-xl">Formas de Pagamento</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Ative ou desative os métodos aceitos pelo seu estabelecimento</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard size={22} className="text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{methods.filter(m => m.enabled).length}</p>
            <p className="text-sm text-muted-foreground">formas de pagamento ativas</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <QrCode size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">PIX é o mais usado</p>
            <p className="text-xs text-muted-foreground">78% dos pagamentos no último mês</p>
          </div>
        </div>
      </div>

      {renderGroup("Pagamento Online", online)}
      {renderGroup("Pagamento na Entrega", delivery)}

      <div className="bg-muted/30 border border-border rounded-2xl p-5">
        <p className="text-xs text-muted-foreground">
          💡 <strong className="text-foreground">Dica:</strong> Aceitar mais formas de pagamento aumenta suas vendas em até 25%. Considere ativar todas as opções disponíveis.
        </p>
      </div>
    </div>
  );
}

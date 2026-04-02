import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_REVIEWS = [
  { id: "1", customer: "Maria S.", rating: 5, comment: "Comida maravilhosa! Entrega super rápida.", date: "2026-03-28", order: "#A1B2C3", replied: true },
  { id: "2", customer: "João P.", rating: 4, comment: "Muito bom, mas a porção poderia ser maior.", date: "2026-03-25", order: "#D4E5F6", replied: false },
  { id: "3", customer: "Ana L.", rating: 5, comment: "Melhor hambúrguer da região! Recomendo demais.", date: "2026-03-22", order: "#G7H8I9", replied: true },
  { id: "4", customer: "Carlos R.", rating: 3, comment: "Demorou um pouco mais que o esperado, mas a comida estava boa.", date: "2026-03-20", order: "#J0K1L2", replied: false },
  { id: "5", customer: "Fernanda M.", rating: 5, comment: "Perfeito! Sempre peço daqui.", date: "2026-03-18", order: "#M3N4O5", replied: true },
];

export default function AvaliacoesTab() {
  const [filter, setFilter] = useState<"todos" | "pendentes" | "respondidos">("todos");

  const avgRating = MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length;
  const fiveStars = MOCK_REVIEWS.filter(r => r.rating === 5).length;
  const filtered = filter === "pendentes" ? MOCK_REVIEWS.filter(r => !r.replied)
    : filter === "respondidos" ? MOCK_REVIEWS.filter(r => r.replied) : MOCK_REVIEWS;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Star size={18} className="text-amber-500 fill-amber-500" />
            </div>
            <p className="text-sm font-semibold text-foreground">Nota média</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground mt-1">{MOCK_REVIEWS.length} avaliações</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ThumbsUp size={18} className="text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-foreground">5 estrelas</p>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{fiveStars}</p>
          <p className="text-xs text-muted-foreground mt-1">{((fiveStars / MOCK_REVIEWS.length) * 100).toFixed(0)}% do total</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <MessageSquare size={18} className="text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-foreground">Pendentes</p>
          </div>
          <p className="text-3xl font-bold text-amber-600">{MOCK_REVIEWS.filter(r => !r.replied).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Aguardando resposta</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Taxa de resposta</p>
          </div>
          <p className="text-3xl font-bold text-primary">{((MOCK_REVIEWS.filter(r => r.replied).length / MOCK_REVIEWS.length) * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Rating distribution */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground text-lg mb-4">Distribuição de notas</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(n => {
            const count = MOCK_REVIEWS.filter(r => r.rating === n).length;
            const pct = (count / MOCK_REVIEWS.length) * 100;
            return (
              <div key={n} className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground w-6">{n}</span>
                <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["todos", "pendentes", "respondidos"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f === "todos" ? "Todos" : f === "pendentes" ? "Pendentes" : "Respondidos"}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {filtered.map(r => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:shadow-black/5 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-foreground">{r.customer}</p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"} />
                    ))}
                  </div>
                  {r.replied ? (
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-500/20">RESPONDIDO</span>
                  ) : (
                    <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-500/20">PENDENTE</span>
                  )}
                </div>
                <p className="text-sm text-foreground mt-1">{r.comment}</p>
                <p className="text-xs text-muted-foreground mt-2">Pedido {r.order} • {new Date(r.date).toLocaleDateString("pt-BR")}</p>
              </div>
              {!r.replied && (
                <button className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shadow-primary/20">
                  <MessageSquare size={12} /> Responder
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

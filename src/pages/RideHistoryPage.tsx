import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Star, Clock, RotateCcw, Car } from "lucide-react";
import { motion } from "framer-motion";

const statusLabels: Record<string, string> = {
  completed: "Concluída", cancelled: "Cancelada", searching: "Buscando", accepted: "Aceita",
  arriving: "Chegando", in_progress: "Em viagem",
};
const statusColors: Record<string, string> = {
  completed: "default", cancelled: "destructive", searching: "secondary",
  accepted: "secondary", arriving: "secondary", in_progress: "secondary",
};

const RideHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadRides();
  }, [user]);

  const loadRides = async () => {
    if (!user) return;
    const { data } = await supabase.from("rides").select("*").eq("passenger_id", user.id).order("created_at", { ascending: false });
    if (data) setRides(data);
    setLoading(false);
  };

  const filteredRides = rides.filter((r) => filter === "all" || r.status === filter);
  const formatPrice = (val: number | null) => `R$ ${(val || 0).toFixed(2).replace(".", ",")}`;

  if (selectedRide) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg lg:max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedRide(null)}><ArrowLeft className="h-5 w-5" /></Button>
            <h1 className="text-lg font-bold text-foreground">Detalhes da corrida</h1>
          </div>
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <Badge variant={statusColors[selectedRide.status] as any}>{statusLabels[selectedRide.status] || selectedRide.status}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(selectedRide.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-sm text-foreground">{selectedRide.origin_address}</span></div>
                <div className="ml-1.5 border-l-2 border-dashed border-muted-foreground/30 h-4" />
                <div className="flex items-center gap-3"><MapPin className="h-3 w-3 text-destructive" /><span className="text-sm text-foreground">{selectedRide.destination_address}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">Distância</p><p className="font-bold text-foreground">{selectedRide.distance_km?.toFixed(1)} km</p></div>
                <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">Duração</p><p className="font-bold text-foreground">{selectedRide.duration_minutes} min</p></div>
                <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">Tipo</p><p className="font-bold text-foreground capitalize">{selectedRide.ride_type}</p></div>
                <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">Pagamento</p><p className="font-bold text-foreground uppercase">{selectedRide.payment_method}</p></div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">{formatPrice(selectedRide.final_price || selectedRide.estimated_price)}</span>
              </div>
              {selectedRide.rating_driver && (
                <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /><span className="text-sm text-foreground">Avaliação: {selectedRide.rating_driver}/5</span></div>
              )}
              {selectedRide.status === "completed" && (
                <Button className="w-full rounded-xl" onClick={() => { navigate("/zuumob"); }}><RotateCcw className="h-4 w-4 mr-1" /> Repetir corrida</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/zuumob")}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-bold text-foreground">Histórico de corridas</h1>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {([["all", "Todas"], ["completed", "Concluídas"], ["cancelled", "Canceladas"]] as const).map(([key, label]) => (
            <Button key={key} variant={filter === key ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFilter(key)}>
              {label}
            </Button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-12"><span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}

        {!loading && filteredRides.length === 0 && (
          <div className="text-center py-12">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma corrida encontrada</p>
          </div>
        )}

        <div className="space-y-2">
          {filteredRides.map((ride, i) => (
            <motion.div key={ride.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedRide(ride)}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant={statusColors[ride.status] as any} className="text-xs">{statusLabels[ride.status] || ride.status}</Badge>
                    <span className="text-sm font-bold text-foreground">{formatPrice(ride.final_price || ride.estimated_price)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(ride.created_at).toLocaleDateString("pt-BR")} · {new Date(ride.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{ride.origin_address?.substring(0, 25)}... → {ride.destination_address?.substring(0, 25)}...</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RideHistoryPage;

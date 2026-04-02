import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Car, DollarSign, Star, MapPin, Clock, Power, PowerOff, Navigation, Phone, CheckCircle, XCircle, TrendingUp, Wallet, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const MotoristaPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [pendingRides, setPendingRides] = useState<any[]>([]);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [rideHistory, setRideHistory] = useState<any[]>([]);

  // Registration form state
  const [regForm, setRegForm] = useState({
    full_name: "", cpf: "", cnh: "", phone: "",
    vehicle_brand: "", vehicle_model: "", vehicle_year: "",
    vehicle_plate: "", vehicle_color: "", vehicle_type: "car",
    pix_key: "",
  });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadDriver();
  }, [user]);

  const loadDriver = async () => {
    if (!user) return;
    const { data } = await supabase.from("drivers").select("*").eq("user_id", user.id).single();
    if (data) {
      setDriver(data);
      setIsOnline(data.status === "online");
      loadEarnings(data.id);
      loadRideHistory();
      if (data.status === "online") listenForRides();
    }
    setLoading(false);
  };

  const loadEarnings = async (driverId: string) => {
    const { data } = await supabase.from("driver_earnings").select("*").eq("driver_id", driverId).order("created_at", { ascending: false }).limit(30);
    if (data) setEarnings(data);
  };

  const loadRideHistory = async () => {
    if (!user) return;
    const { data } = await supabase.from("rides").select("*").eq("driver_id", user.id).order("created_at", { ascending: false }).limit(20);
    if (data) setRideHistory(data);
  };

  const registerDriver = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("drivers").insert({
      user_id: user.id,
      full_name: regForm.full_name,
      cpf: regForm.cpf,
      cnh: regForm.cnh,
      phone: regForm.phone,
      vehicle_brand: regForm.vehicle_brand,
      vehicle_model: regForm.vehicle_model,
      vehicle_year: parseInt(regForm.vehicle_year) || 2020,
      vehicle_plate: regForm.vehicle_plate,
      vehicle_color: regForm.vehicle_color,
      vehicle_type: regForm.vehicle_type,
      pix_key: regForm.pix_key,
    }).select().single();

    if (error) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      return;
    }
    setDriver(data);
    toast({ title: "Cadastro realizado!", description: "Aguarde aprovação para começar a dirigir." });
  };

  const toggleOnline = async () => {
    if (!driver) return;
    const newStatus = isOnline ? "offline" : "online";
    await supabase.from("drivers").update({ status: newStatus }).eq("id", driver.id);
    setIsOnline(!isOnline);

    if (newStatus === "online") {
      listenForRides();
      // Update location
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await supabase.from("drivers").update({
          current_lat: pos.coords.latitude,
          current_lng: pos.coords.longitude,
        }).eq("id", driver.id);
      });
    }
    toast({ title: newStatus === "online" ? "Você está online!" : "Você está offline" });
  };

  const listenForRides = () => {
    const channel = supabase
      .channel("new-rides")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rides", filter: "status=eq.searching" }, (payload) => {
        const ride = payload.new as any;
        setPendingRides((prev) => [...prev, ride]);
        toast({ title: "Nova corrida!", description: `${ride.origin_address?.substring(0, 30)}...` });
      })
      .subscribe();
  };

  const acceptRide = async (ride: any) => {
    if (!user || !driver) return;
    const { error } = await supabase.from("rides").update({
      driver_id: user.id,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    }).eq("id", ride.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    await supabase.from("drivers").update({ status: "busy" }).eq("id", driver.id);
    setCurrentRide({ ...ride, status: "accepted", driver_id: user.id });
    setPendingRides((prev) => prev.filter((r) => r.id !== ride.id));
    setIsOnline(false);
  };

  const updateRideStatus = async (status: string) => {
    if (!currentRide || !driver) return;
    const updates: any = { status };
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
      updates.final_price = currentRide.estimated_price;
    }
    await supabase.from("rides").update(updates).eq("id", currentRide.id);

    if (status === "completed") {
      // Record earnings
      const gross = Number(currentRide.estimated_price) || 0;
      const fee = gross * 0.2;
      await supabase.from("driver_earnings").insert({
        driver_id: driver.id,
        ride_id: currentRide.id,
        gross_amount: gross,
        platform_fee: fee,
        net_amount: gross - fee,
      });
      await supabase.from("drivers").update({
        status: "online",
        total_rides: (driver.total_rides || 0) + 1,
        total_earnings: (Number(driver.total_earnings) || 0) + (gross - fee),
      }).eq("id", driver.id);
      setCurrentRide(null);
      setIsOnline(true);
      loadEarnings(driver.id);
      loadRideHistory();
      toast({ title: "Corrida finalizada!", description: `Ganho: R$ ${(gross - fee).toFixed(2)}` });
    } else {
      setCurrentRide({ ...currentRide, status });
    }
  };

  const formatPrice = (val: number | null) => `R$ ${(val || 0).toFixed(2).replace(".", ",")}`;

  const todayEarnings = earnings
    .filter((e) => new Date(e.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, e) => sum + Number(e.net_amount), 0);

  const weekEarnings = earnings
    .filter((e) => {
      const d = new Date(e.created_at);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    })
    .reduce((sum, e) => sum + Number(e.net_amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // REGISTRATION FORM
  if (!driver) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
            <h1 className="text-2xl font-bold text-foreground">Seja motorista ZuuMob</h1>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Dados pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Nome completo" value={regForm.full_name} onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })} />
              <Input placeholder="CPF" value={regForm.cpf} onChange={(e) => setRegForm({ ...regForm, cpf: e.target.value })} />
              <Input placeholder="CNH" value={regForm.cnh} onChange={(e) => setRegForm({ ...regForm, cnh: e.target.value })} />
              <Input placeholder="Telefone" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Dados do veículo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button variant={regForm.vehicle_type === "car" ? "default" : "outline"} className="flex-1" onClick={() => setRegForm({ ...regForm, vehicle_type: "car" })}>
                  <Car className="h-4 w-4 mr-1" /> Carro
                </Button>
                <Button variant={regForm.vehicle_type === "moto" ? "default" : "outline"} className="flex-1" onClick={() => setRegForm({ ...regForm, vehicle_type: "moto" })}>
                  🏍️ Moto
                </Button>
              </div>
              <Input placeholder="Marca" value={regForm.vehicle_brand} onChange={(e) => setRegForm({ ...regForm, vehicle_brand: e.target.value })} />
              <Input placeholder="Modelo" value={regForm.vehicle_model} onChange={(e) => setRegForm({ ...regForm, vehicle_model: e.target.value })} />
              <Input placeholder="Ano" type="number" value={regForm.vehicle_year} onChange={(e) => setRegForm({ ...regForm, vehicle_year: e.target.value })} />
              <Input placeholder="Placa" value={regForm.vehicle_plate} onChange={(e) => setRegForm({ ...regForm, vehicle_plate: e.target.value })} />
              <Input placeholder="Cor" value={regForm.vehicle_color} onChange={(e) => setRegForm({ ...regForm, vehicle_color: e.target.value })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Dados bancários</CardTitle></CardHeader>
            <CardContent>
              <Input placeholder="Chave PIX" value={regForm.pix_key} onChange={(e) => setRegForm({ ...regForm, pix_key: e.target.value })} />
            </CardContent>
          </Card>

          <Button className="w-full h-12 rounded-xl text-base font-bold" onClick={registerDriver}>
            Cadastrar como motorista
          </Button>
        </div>
      </div>
    );
  }

  // DRIVER DASHBOARD
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">ZuuMob Motorista</h1>
              <p className="text-xs text-muted-foreground">{driver.full_name}</p>
            </div>
          </div>
          <Button
            onClick={toggleOnline}
            className={`rounded-full px-6 ${isOnline ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}`}
          >
            {isOnline ? <><PowerOff className="h-4 w-4 mr-1" /> Ficar Offline</> : <><Power className="h-4 w-4 mr-1" /> Ficar Online</>}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Current ride */}
        {currentRide && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary border-2">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary">{currentRide.status === "accepted" ? "Aceita" : currentRide.status === "arriving" ? "Chegando" : "Em viagem"}</Badge>
                  <span className="font-bold text-foreground">{formatPrice(currentRide.estimated_price)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-sm text-foreground truncate">{currentRide.origin_address}</span></div>
                  <div className="ml-1 border-l-2 border-dashed border-muted-foreground/30 h-3" />
                  <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-destructive" /><span className="text-sm text-foreground truncate">{currentRide.destination_address}</span></div>
                </div>
                <div className="flex gap-2">
                  {currentRide.status === "accepted" && <Button className="flex-1" onClick={() => updateRideStatus("arriving")}>Cheguei no local</Button>}
                  {currentRide.status === "arriving" && <Button className="flex-1" onClick={() => updateRideStatus("in_progress")}>Iniciar viagem</Button>}
                  {currentRide.status === "in_progress" && <Button className="flex-1" onClick={() => updateRideStatus("completed")}>Finalizar corrida</Button>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pending ride requests */}
        {pendingRides.length > 0 && !currentRide && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Corridas disponíveis</h3>
            {pendingRides.map((ride) => (
              <motion.div key={ride.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-foreground">{formatPrice(ride.estimated_price)}</span>
                      <span className="text-xs text-muted-foreground">{ride.distance_km?.toFixed(1)} km · {ride.duration_minutes} min</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-3">{ride.origin_address} → {ride.destination_address}</p>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => acceptRide(ride)}><CheckCircle className="h-4 w-4 mr-1" /> Aceitar</Button>
                      <Button variant="outline" onClick={() => setPendingRides((p) => p.filter((r) => r.id !== ride.id))}><XCircle className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats & Tabs */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center"><DollarSign className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-xs text-muted-foreground">Hoje</p><p className="font-bold text-foreground">{formatPrice(todayEarnings)}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-xs text-muted-foreground">Semana</p><p className="font-bold text-foreground">{formatPrice(weekEarnings)}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><Star className="h-5 w-5 mx-auto text-yellow-500 mb-1" /><p className="text-xs text-muted-foreground">Avaliação</p><p className="font-bold text-foreground">{Number(driver.rating).toFixed(1)}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="history">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="earnings">Ganhos</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-2">
            {rideHistory.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma corrida ainda</p>}
            {rideHistory.map((ride) => (
              <Card key={ride.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={ride.status === "completed" ? "default" : "secondary"}>{ride.status}</Badge>
                    <span className="text-sm font-bold text-foreground">{formatPrice(ride.final_price || ride.estimated_price)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{ride.origin_address} → {ride.destination_address}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(ride.created_at).toLocaleDateString("pt-BR")}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="earnings" className="space-y-2">
            <Card><CardContent className="p-4"><div className="flex justify-between"><span className="text-muted-foreground">Total acumulado</span><span className="font-bold text-foreground">{formatPrice(Number(driver.total_earnings))}</span></div></CardContent></Card>
            {earnings.map((e) => (
              <Card key={e.id}>
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatPrice(Number(e.net_amount))}</p>
                    <p className="text-xs text-muted-foreground">Taxa: {formatPrice(Number(e.platform_fee))}</p>
                  </div>
                  <Badge variant={e.status === "paid" ? "default" : "secondary"}>{e.status === "paid" ? "Pago" : "Pendente"}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">{driver.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg text-foreground">{driver.full_name}</p>
                    <p className="text-sm text-muted-foreground">{driver.vehicle_brand} {driver.vehicle_model} · {driver.vehicle_plate}</p>
                    <div className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /><span className="text-sm text-foreground">{Number(driver.rating).toFixed(1)}</span><span className="text-xs text-muted-foreground">· {driver.total_rides} corridas</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">CPF:</span> <span className="text-foreground">{driver.cpf}</span></div>
                  <div><span className="text-muted-foreground">CNH:</span> <span className="text-foreground">{driver.cnh}</span></div>
                  <div><span className="text-muted-foreground">Telefone:</span> <span className="text-foreground">{driver.phone}</span></div>
                  <div><span className="text-muted-foreground">PIX:</span> <span className="text-foreground">{driver.pix_key}</span></div>
                </div>
                <Badge variant={driver.is_approved ? "default" : "secondary"}>
                  {driver.is_approved ? "Aprovado" : "Aguardando aprovação"}
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MotoristaPage;

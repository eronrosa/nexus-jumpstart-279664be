import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Car, DollarSign, Star, MapPin, Power, PowerOff, CheckCircle,
  XCircle, TrendingUp, ArrowLeft, ArrowRight, User, FileText,
  CreditCard, Eye, Wallet, BarChart3, Clock, AlertCircle, Settings,
  Phone, LogOut, MessageCircle, Bike
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── ONBOARDING ────────────────────────────────────────────────────────────────
interface RegForm {
  full_name: string; cpf: string; birth_date: string; phone: string; email: string;
  cnh: string; cnh_category: string; cnh_expiry: string;
  vehicle_type: string; vehicle_brand: string; vehicle_model: string;
  vehicle_year: string; vehicle_plate: string; vehicle_color: string;
  bank_name: string; account_type: string; agency: string; account: string;
  pix_key: string; pix_holder: string;
  accepted_terms: boolean;
}

const defaultRegForm: RegForm = {
  full_name: "", cpf: "", birth_date: "", phone: "", email: "",
  cnh: "", cnh_category: "B", cnh_expiry: "",
  vehicle_type: "car", vehicle_brand: "", vehicle_model: "",
  vehicle_year: "", vehicle_plate: "", vehicle_color: "",
  bank_name: "", account_type: "corrente", agency: "", account: "",
  pix_key: "", pix_holder: "",
  accepted_terms: false,
};

const stepTitles = ["Dados Pessoais", "CNH e Documentos", "Veículo", "Dados Bancários", "Revisão"];
const stepIcons = [User, FileText, Car, CreditCard, Eye];

const carBrands = ["Chevrolet", "Fiat", "Ford", "Honda", "Hyundai", "Jeep", "Nissan", "Renault", "Toyota", "Volkswagen"];

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const mockWeekEarnings = [
  { day: "Seg", current: 120, previous: 95 },
  { day: "Ter", current: 185, previous: 140 },
  { day: "Qua", current: 95, previous: 165 },
  { day: "Qui", current: 210, previous: 130 },
  { day: "Sex", current: 280, previous: 220 },
  { day: "Sáb", current: 340, previous: 310 },
  { day: "Dom", current: 150, previous: 175 },
];

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
  const [acceptCountdown, setAcceptCountdown] = useState(0);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Registration
  const [regForm, setRegForm] = useState<RegForm>(defaultRegForm);
  const [regStep, setRegStep] = useState(0);

  const updateForm = (key: keyof RegForm, value: string | boolean) => setRegForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadDriver();
  }, [user]);

  const loadDriver = useCallback(async () => {
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
  }, [user]);

  const loadEarnings = async (driverId: string) => {
    const { data } = await supabase.from("driver_earnings").select("*").eq("driver_id", driverId).order("created_at", { ascending: false }).limit(50);
    if (data) setEarnings(data);
  };

  const loadRideHistory = async () => {
    if (!user) return;
    const { data } = await supabase.from("rides").select("*").eq("driver_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (data) setRideHistory(data);
  };

  const registerDriver = async () => {
    if (!user || !regForm.accepted_terms) {
      toast({ title: "Aceite os termos para continuar", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.from("drivers").insert({
      user_id: user.id, full_name: regForm.full_name, cpf: regForm.cpf,
      cnh: regForm.cnh, phone: regForm.phone,
      vehicle_brand: regForm.vehicle_brand, vehicle_model: regForm.vehicle_model,
      vehicle_year: parseInt(regForm.vehicle_year) || 2020,
      vehicle_plate: regForm.vehicle_plate, vehicle_color: regForm.vehicle_color,
      vehicle_type: regForm.vehicle_type, pix_key: regForm.pix_key,
      bank_account: `${regForm.bank_name} | Ag: ${regForm.agency} | Cc: ${regForm.account}`,
    }).select().single();
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setDriver(data);
    toast({ title: "Cadastro enviado!", description: "Em até 48h você receberá a confirmação." });
  };

  const toggleOnline = async () => {
    if (!driver) return;
    const newStatus = isOnline ? "offline" : "online";
    await supabase.from("drivers").update({ status: newStatus }).eq("id", driver.id);
    setIsOnline(!isOnline);
    if (newStatus === "online") {
      listenForRides();
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await supabase.from("drivers").update({ current_lat: pos.coords.latitude, current_lng: pos.coords.longitude }).eq("id", driver.id);
      });
    }
    toast({ title: newStatus === "online" ? "Você está online!" : "Você está offline" });
  };

  const listenForRides = () => {
    supabase.channel("new-rides-driver")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rides", filter: "status=eq.searching" }, (payload) => {
        const ride = payload.new as any;
        setPendingRides((prev) => [...prev, ride]);
        setAcceptCountdown(15);
        toast({ title: "🚗 Nova corrida!", description: `${ride.origin_address?.substring(0, 30)}...` });
      }).subscribe();
  };

  // Countdown for ride acceptance
  useEffect(() => {
    if (acceptCountdown <= 0) return;
    const t = setTimeout(() => {
      setAcceptCountdown((c) => {
        if (c <= 1) { setPendingRides((p) => p.slice(1)); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [acceptCountdown]);

  const acceptRide = async (ride: any) => {
    if (!user || !driver) return;
    const { error } = await supabase.from("rides").update({
      driver_id: user.id, status: "accepted", accepted_at: new Date().toISOString(),
    }).eq("id", ride.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    await supabase.from("drivers").update({ status: "busy" }).eq("id", driver.id);
    setCurrentRide({ ...ride, status: "accepted", driver_id: user.id });
    setPendingRides((prev) => prev.filter((r) => r.id !== ride.id));
    setAcceptCountdown(0);
    setIsOnline(false);
  };

  const updateRideStatus = async (status: string) => {
    if (!currentRide || !driver) return;
    const updates: any = { status };
    if (status === "completed") { updates.completed_at = new Date().toISOString(); updates.final_price = currentRide.estimated_price; }
    await supabase.from("rides").update(updates).eq("id", currentRide.id);

    if (status === "completed") {
      const gross = Number(currentRide.estimated_price) || 0;
      const fee = gross * 0.23;
      const net = gross - fee;
      await supabase.from("driver_earnings").insert({ driver_id: driver.id, ride_id: currentRide.id, gross_amount: gross, platform_fee: fee, net_amount: net });
      await supabase.from("drivers").update({ status: "online", total_rides: (driver.total_rides || 0) + 1, total_earnings: (Number(driver.total_earnings) || 0) + net }).eq("id", driver.id);
      setDriver({ ...driver, total_rides: (driver.total_rides || 0) + 1, total_earnings: (Number(driver.total_earnings) || 0) + net });
      setCurrentRide(null);
      setIsOnline(true);
      loadEarnings(driver.id);
      loadRideHistory();
      toast({ title: "Corrida finalizada!", description: `Ganho líquido: R$ ${net.toFixed(2)}` });
    } else {
      setCurrentRide({ ...currentRide, status });
    }
  };

  const formatPrice = (val: number | null) => `R$ ${(val || 0).toFixed(2).replace(".", ",")}`;

  const todayEarnings = earnings.filter((e) => new Date(e.created_at).toDateString() === new Date().toDateString()).reduce((s, e) => s + Number(e.net_amount), 0);
  const weekEarnings = earnings.filter((e) => (new Date().getTime() - new Date(e.created_at).getTime()) / 86400000 <= 7).reduce((s, e) => s + Number(e.net_amount), 0);
  const monthEarnings = earnings.filter((e) => (new Date().getTime() - new Date(e.created_at).getTime()) / 86400000 <= 30).reduce((s, e) => s + Number(e.net_amount), 0);

  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: rideHistory.filter((ride) => ride.rating_passenger === r).length || (r === 5 ? 12 : r === 4 ? 5 : r === 3 ? 2 : 0),
  }));
  const totalRatingCount = ratingDistribution.reduce((s, r) => s + r.count, 0) || 1;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  // ─── ONBOARDING ──────────────────────────────────────────────────────
  if (!driver) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border p-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => regStep > 0 ? setRegStep(regStep - 1) : navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Seja motorista ZuuMob</h1>
              <p className="text-xs text-muted-foreground">Etapa {regStep + 1} de 5 — {stepTitles[regStep]}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="flex items-center gap-1 mb-6">
            {stepTitles.map((_, i) => {
              const Icon = stepIcons[i];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${i <= regStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {i < stepTitles.length - 1 && <div className={`h-0.5 w-full ${i < regStep ? "bg-primary" : "bg-muted"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-8">
          <AnimatePresence mode="wait">
            <motion.div key={regStep} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.2 }}>
              {/* Step 1: Personal */}
              {regStep === 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Dados pessoais</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Input placeholder="Nome completo *" value={regForm.full_name} onChange={(e) => updateForm("full_name", e.target.value)} />
                    <Input placeholder="CPF *" value={regForm.cpf} onChange={(e) => updateForm("cpf", e.target.value)} />
                    <Input placeholder="Data de nascimento" type="date" value={regForm.birth_date} onChange={(e) => updateForm("birth_date", e.target.value)} />
                    <Input placeholder="Telefone (WhatsApp) *" value={regForm.phone} onChange={(e) => updateForm("phone", e.target.value)} />
                    <Input placeholder="E-mail" type="email" value={regForm.email} onChange={(e) => updateForm("email", e.target.value)} />
                  </CardContent>
                </Card>
              )}

              {/* Step 2: CNH */}
              {regStep === 1 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> CNH e Documentos</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Input placeholder="Número da CNH *" value={regForm.cnh} onChange={(e) => updateForm("cnh", e.target.value)} />
                    <Select value={regForm.cnh_category} onValueChange={(v) => updateForm("cnh_category", v)}>
                      <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                      <SelectContent>
                        {["A", "B", "AB", "C", "D", "E"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Validade da CNH" type="date" value={regForm.cnh_expiry} onChange={(e) => updateForm("cnh_expiry", e.target.value)} />
                    <div className="bg-muted/50 rounded-xl p-4 text-center text-sm text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      Upload de fotos da CNH disponível em breve
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Vehicle */}
              {regStep === 2 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Car className="h-5 w-5 text-primary" /> Dados do Veículo</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Button variant={regForm.vehicle_type === "car" ? "default" : "outline"} className="flex-1" onClick={() => updateForm("vehicle_type", "car")}><Car className="h-4 w-4 mr-1" /> Carro</Button>
                      <Button variant={regForm.vehicle_type === "moto" ? "default" : "outline"} className="flex-1" onClick={() => updateForm("vehicle_type", "moto")}><Bike className="h-4 w-4 mr-1" /> Moto</Button>
                    </div>
                    <Select value={regForm.vehicle_brand} onValueChange={(v) => updateForm("vehicle_brand", v)}>
                      <SelectTrigger><SelectValue placeholder="Marca *" /></SelectTrigger>
                      <SelectContent>{carBrands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Modelo *" value={regForm.vehicle_model} onChange={(e) => updateForm("vehicle_model", e.target.value)} />
                    <Input placeholder="Ano *" type="number" value={regForm.vehicle_year} onChange={(e) => updateForm("vehicle_year", e.target.value)} />
                    <Input placeholder="Placa *" value={regForm.vehicle_plate} onChange={(e) => updateForm("vehicle_plate", e.target.value)} />
                    <Input placeholder="Cor *" value={regForm.vehicle_color} onChange={(e) => updateForm("vehicle_color", e.target.value)} />
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Bank */}
              {regStep === 3 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Dados Bancários</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Input placeholder="Banco" value={regForm.bank_name} onChange={(e) => updateForm("bank_name", e.target.value)} />
                    <Select value={regForm.account_type} onValueChange={(v) => updateForm("account_type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrente">Conta Corrente</SelectItem>
                        <SelectItem value="poupanca">Conta Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input placeholder="Agência" className="flex-1" value={regForm.agency} onChange={(e) => updateForm("agency", e.target.value)} />
                      <Input placeholder="Conta" className="flex-1" value={regForm.account} onChange={(e) => updateForm("account", e.target.value)} />
                    </div>
                    <Input placeholder="Chave PIX *" value={regForm.pix_key} onChange={(e) => updateForm("pix_key", e.target.value)} />
                    <Input placeholder="Nome do titular" value={regForm.pix_holder} onChange={(e) => updateForm("pix_holder", e.target.value)} />
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Review */}
              {regStep === 4 && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Revisão do cadastro</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { title: "Pessoal", items: [["Nome", regForm.full_name], ["CPF", regForm.cpf], ["Telefone", regForm.phone]] },
                        { title: "CNH", items: [["Número", regForm.cnh], ["Categoria", regForm.cnh_category]] },
                        { title: "Veículo", items: [["Tipo", regForm.vehicle_type === "car" ? "Carro" : "Moto"], ["Marca", regForm.vehicle_brand], ["Modelo", regForm.vehicle_model], ["Placa", regForm.vehicle_plate], ["Cor", regForm.vehicle_color]] },
                        { title: "Banco", items: [["PIX", regForm.pix_key]] },
                      ].map((section) => (
                        <div key={section.title}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{section.title}</p>
                          {section.items.map(([label, value]) => (
                            <div key={label} className="flex justify-between text-sm py-0.5">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="text-foreground font-medium">{value || "—"}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <div className="flex items-start gap-2">
                    <Checkbox checked={regForm.accepted_terms} onCheckedChange={(v) => updateForm("accepted_terms", !!v)} />
                    <p className="text-xs text-muted-foreground">Aceito os termos de uso e política de privacidade do ZuuMob</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {regStep > 0 && <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setRegStep(regStep - 1)}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>}
            {regStep < 4 && <Button className="flex-1 rounded-xl" onClick={() => setRegStep(regStep + 1)}>Próximo <ArrowRight className="h-4 w-4 ml-1" /></Button>}
            {regStep === 4 && (
              <Button className="flex-1 h-12 rounded-xl text-base font-bold" onClick={registerDriver} disabled={!regForm.accepted_terms}>
                Enviar cadastro
              </Button>
            )}
          </div>

          {regStep === 4 && (
            <p className="text-xs text-center text-muted-foreground mt-4">Seu cadastro está em análise. Em até 48h você receberá a confirmação.</p>
          )}
        </div>
      </div>
    );
  }

  // ─── DRIVER DASHBOARD ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={driver.photo_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground">{driver.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-base font-bold text-foreground">{driver.full_name}</h1>
              <div className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /><span className="text-xs text-foreground">{Number(driver.rating).toFixed(1)}</span></div>
            </div>
          </div>
          <Button onClick={toggleOnline} className={`rounded-full px-5 h-10 text-sm font-semibold ${isOnline ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}`}>
            {isOnline ? <><PowerOff className="h-4 w-4 mr-1.5" /> Offline</> : <><Power className="h-4 w-4 mr-1.5" /> Online</>}
          </Button>
        </div>
      </div>

      {/* Pending ride overlay */}
      <AnimatePresence>
        {pendingRides.length > 0 && !currentRide && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed inset-x-0 top-0 z-50 bg-card/95 backdrop-blur-md border-b-2 border-primary p-4 shadow-2xl">
            <div className="max-w-lg mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">🚗 Nova corrida!</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{acceptCountdown}s</span>
                  <Progress value={(acceptCountdown / 15) * 100} className="w-20 h-2" />
                </div>
              </div>
              {(() => {
                const ride = pendingRides[0];
                const gross = Number(ride.estimated_price) || 0;
                const net = gross * 0.77;
                return (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-sm text-foreground truncate">{ride.origin_address}</span></div>
                      <div className="ml-1 border-l-2 border-dashed border-muted-foreground/30 h-3" />
                      <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-destructive" /><span className="text-sm text-foreground truncate">{ride.destination_address}</span></div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">{ride.distance_km?.toFixed(1)} km · {ride.duration_minutes} min</span>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 flex justify-between">
                      <div><p className="text-xs text-muted-foreground">Valor da corrida</p><p className="font-bold text-foreground">{formatPrice(gross)}</p></div>
                      <div className="text-right"><p className="text-xs text-muted-foreground">Seu ganho (77%)</p><p className="font-bold text-primary">{formatPrice(net)}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 h-12 rounded-xl text-base font-bold" onClick={() => acceptRide(ride)}><CheckCircle className="h-5 w-5 mr-1.5" /> ACEITAR</Button>
                      <Button variant="outline" className="rounded-xl h-12" onClick={() => { setPendingRides((p) => p.slice(1)); setAcceptCountdown(0); }}><XCircle className="h-5 w-5" /></Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Current ride */}
        {currentRide && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary border-2">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary text-primary-foreground">
                    {currentRide.status === "accepted" ? "Aceita" : currentRide.status === "arriving" ? "Chegando" : "Em viagem"}
                  </Badge>
                  <span className="font-bold text-foreground">{formatPrice(currentRide.estimated_price)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-sm text-foreground truncate">{currentRide.origin_address}</span></div>
                  <div className="ml-1 border-l-2 border-dashed border-muted-foreground/30 h-3" />
                  <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-destructive" /><span className="text-sm text-foreground truncate">{currentRide.destination_address}</span></div>
                </div>
                <div className="flex gap-2">
                  {currentRide.status === "accepted" && <Button className="flex-1 rounded-xl" onClick={() => updateRideStatus("arriving")}>Cheguei no local</Button>}
                  {currentRide.status === "arriving" && <Button className="flex-1 rounded-xl" onClick={() => updateRideStatus("in_progress")}>Iniciar viagem</Button>}
                  {currentRide.status === "in_progress" && <Button className="flex-1 rounded-xl" onClick={() => updateRideStatus("completed")}>Finalizar corrida</Button>}
                  <Button variant="outline" size="icon" className="rounded-xl"><MessageCircle className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Online status card */}
        {!currentRide && (
          <Card className={`border-2 ${isOnline ? "border-primary/50" : "border-transparent"}`}>
            <CardContent className="p-4 text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${isOnline ? "bg-primary/10" : "bg-muted"}`}>
                {isOnline ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}><Car className="h-6 w-6 text-primary" /></motion.div> : <Car className="h-6 w-6 text-muted-foreground" />}
              </div>
              <p className="text-sm font-semibold text-foreground">{isOnline ? "Aguardando corridas..." : "Você está offline"}</p>
              <p className="text-xs text-muted-foreground">{isOnline ? "Fique atento ao celular" : "Fique online para receber corridas"}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card><CardContent className="p-3 text-center"><DollarSign className="h-4 w-4 mx-auto text-primary mb-1" /><p className="text-[10px] text-muted-foreground">Hoje</p><p className="text-sm font-bold text-foreground">{formatPrice(todayEarnings)}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><TrendingUp className="h-4 w-4 mx-auto text-primary mb-1" /><p className="text-[10px] text-muted-foreground">Semana</p><p className="text-sm font-bold text-foreground">{formatPrice(weekEarnings)}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><BarChart3 className="h-4 w-4 mx-auto text-primary mb-1" /><p className="text-[10px] text-muted-foreground">Mês</p><p className="text-sm font-bold text-foreground">{formatPrice(monthEarnings)}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><Car className="h-4 w-4 mx-auto text-primary mb-1" /><p className="text-[10px] text-muted-foreground">Corridas</p><p className="text-sm font-bold text-foreground">{driver.total_rides}</p></CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
            <TabsTrigger value="earnings" className="text-xs">Ganhos</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
            <TabsTrigger value="ratings" className="text-xs">Avaliações</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Config</TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Ganhos por dia da semana</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={mockWeekEarnings}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="current" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Esta semana" />
                    <Bar dataKey="previous" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Semana anterior" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {!driver.is_approved && (
              <Card className="border-yellow-500/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <div><p className="text-sm font-semibold text-foreground">Cadastro em análise</p><p className="text-xs text-muted-foreground">Aguarde a aprovação para começar a dirigir</p></div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* EARNINGS */}
          <TabsContent value="earnings" className="space-y-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div><p className="text-xs text-muted-foreground">Saldo disponível</p><p className="text-2xl font-bold text-primary">{formatPrice(Number(driver.total_earnings))}</p></div>
                  <Button size="sm" className="rounded-xl"><Wallet className="h-4 w-4 mr-1" /> Solicitar saque</Button>
                </div>
              </CardContent>
            </Card>
            <h3 className="text-sm font-semibold text-foreground">Extrato detalhado</h3>
            {earnings.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhum ganho registrado</p>}
            {earnings.map((e) => {
              const gross = Number(e.gross_amount);
              const fee = Number(e.platform_fee);
              const net = Number(e.net_amount);
              return (
                <Card key={e.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                      <Badge variant={e.status === "paid" ? "default" : "secondary"} className="text-xs">{e.status === "paid" ? "Pago" : "Pendente"}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Bruto: {formatPrice(gross)}</p>
                        <p className="text-muted-foreground">Taxa (23%): -{formatPrice(fee)}</p>
                      </div>
                      <p className="text-lg font-bold text-primary self-center">{formatPrice(net)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* HISTORY */}
          <TabsContent value="history" className="space-y-2">
            {rideHistory.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma corrida ainda</p>}
            {rideHistory.map((ride) => (
              <Card key={ride.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={ride.status === "completed" ? "default" : "secondary"} className="text-xs">
                      {ride.status === "completed" ? "Concluída" : ride.status === "cancelled" ? "Cancelada" : ride.status}
                    </Badge>
                    <span className="text-sm font-bold text-foreground">{formatPrice(ride.final_price || ride.estimated_price)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{ride.origin_address} → {ride.destination_address}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{new Date(ride.created_at).toLocaleDateString("pt-BR")}</span>
                    <span className="text-xs text-muted-foreground">{ride.distance_km?.toFixed(1)} km · {ride.duration_minutes} min</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* RATINGS */}
          <TabsContent value="ratings" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{Number(driver.rating).toFixed(1)}</p>
                    <div className="flex gap-0.5 justify-center">
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`h-3 w-3 ${s <= Math.round(Number(driver.rating)) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{driver.total_rides} corridas</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {ratingDistribution.map((r) => (
                      <div key={r.stars} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-3">{r.stars}</span>
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(r.count / totalRatingCount) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-6 text-right">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="space-y-2">
            {[
              { icon: User, label: "Editar dados pessoais" },
              { icon: Car, label: "Editar dados do veículo" },
              { icon: CreditCard, label: "Alterar chave PIX" },
              { icon: AlertCircle, label: "Notificações" },
              { icon: Phone, label: "Suporte via WhatsApp" },
            ].map((item) => (
              <Card key={item.label} className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm text-foreground">{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            ))}
            <Card className="cursor-pointer hover:border-destructive/30 transition-colors" onClick={() => navigate("/")}>
              <CardContent className="p-3 flex items-center gap-3">
                <LogOut className="h-5 w-5 text-destructive" />
                <span className="text-sm text-destructive">Sair</span>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MotoristaPage;

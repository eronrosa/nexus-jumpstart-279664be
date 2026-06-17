import { useState, useEffect, useCallback } from "react";
import { useDriverGPSSender } from "@/hooks/useDriverGPS";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Car, DollarSign, Star, MapPin, Power, PowerOff, CheckCircle,
  XCircle, TrendingUp, ArrowLeft, ArrowRight, User, FileText,
  CreditCard, Eye, Wallet, BarChart3, Clock, AlertCircle, Settings,
  Phone, LogOut, MessageCircle, Bike, Navigation
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── TYPES ─────────────────────────────────────────────────────────────────────
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

const mockWeekEarnings = [
  { day: "Seg", current: 120, previous: 95 },
  { day: "Ter", current: 185, previous: 140 },
  { day: "Qua", current: 95, previous: 165 },
  { day: "Qui", current: 210, previous: 130 },
  { day: "Sex", current: 280, previous: 220 },
  { day: "Sáb", current: 340, previous: 310 },
  { day: "Dom", current: 150, previous: 175 },
];

// ─── DESIGN HELPERS ────────────────────────────────────────────────────────────
const ZM = {
  bg: "#0A0A0A",
  bgSec: "#111318",
  bgCard: "#161B22",
  bgElev: "#1C2128",
  green: "#00E676",
  greenDim: "#00C853",
  textPri: "#F0F6FC",
  textSec: "#8B949E",
  textMut: "#484F58",
  border: "rgba(240,246,252,0.06)",
  borderActive: "rgba(0,230,118,0.3)",
  danger: "#FF4757",
  glow: "0 0 24px rgba(0,230,118,0.15)",
};

const zmInput = (extra?: string) => `w-full h-10 px-3 py-2 rounded-xl text-sm font-dm outline-none transition-all duration-200 focus:shadow-[0_0_0_1px_rgba(0,230,118,0.3)] placeholder:text-[#484F58] ${extra || ""}`;
const zmCard = "rounded-xl p-4 transition-all duration-200";

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
  const [regForm, setRegForm] = useState<RegForm>(defaultRegForm);
  const [regStep, setRegStep] = useState(0);
  const [lastGpsUpdate, setLastGpsUpdate] = useState<Date | null>(null);

  const updateForm = (key: keyof RegForm, value: string | boolean) => setRegForm((prev) => ({ ...prev, [key]: value }));

  // GPS tracking: send location every 3 seconds when online or busy
  useDriverGPSSender(driver?.id || null, isOnline || !!currentRide);

  // Listen for own GPS updates to show timestamp
  useEffect(() => {
    if (!driver?.id || (!isOnline && !currentRide)) return;
    const channel = supabase
      .channel(`gps-indicator-${driver.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_locations", filter: `driver_id=eq.${driver.id}` }, () => {
        setLastGpsUpdate(new Date());
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [driver?.id, isOnline, currentRide]);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadDriver();
  }, [user]);

  const loadDriver = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.error("Error loading driver:", error);
    }

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
        toast({ title: "Nova corrida!", description: `${ride.origin_address?.substring(0, 30)}...` });
      }).subscribe();
  };

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-dm" style={{ backgroundColor: ZM.bg }}>
      <span className="w-8 h-8 rounded-full animate-spin" style={{ border: `2px solid ${ZM.bgCard}`, borderTopColor: ZM.green }} />
    </div>
  );

  // ─── ONBOARDING ──────────────────────────────────────────────────────
  if (!driver) {
    return (
      <div className="zuumob-dark min-h-screen font-dm" style={{ backgroundColor: ZM.bg }}>
        <div className="p-4" style={{ backgroundColor: ZM.bgSec, borderBottom: `1px solid ${ZM.border}` }}>
          <div className="max-w-lg lg:max-w-2xl mx-auto flex items-center gap-3">
            <button className="w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}` }}
              onClick={() => regStep > 0 ? setRegStep(regStep - 1) : navigate("/")}>
              <ArrowLeft className="h-5 w-5" style={{ color: ZM.textPri }} />
            </button>
            <div className="flex-1">
              <h1 className="font-syne text-lg font-bold" style={{ color: ZM.green }}>Seja motorista ZuuMob</h1>
              <p className="text-xs" style={{ color: ZM.textSec }}>Etapa {regStep + 1} de 5 — {stepTitles[regStep]}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="max-w-lg lg:max-w-2xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-1 mb-6">
            {stepTitles.map((_, i) => {
              const Icon = stepIcons[i];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-200"
                    style={{ backgroundColor: i <= regStep ? ZM.green : ZM.bgElev, color: i <= regStep ? "#000" : ZM.textMut }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {i < stepTitles.length - 1 && <div className="h-0.5 w-full" style={{ backgroundColor: i < regStep ? ZM.green : ZM.bgElev }} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-lg lg:max-w-2xl mx-auto px-4 pb-8">
          <AnimatePresence mode="wait">
            <motion.div key={regStep} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.2 }}>
              {/* Step 1: Personal */}
              {regStep === 0 && (
                <div className={zmCard} style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.border}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5" style={{ color: ZM.green }} />
                    <h2 className="font-syne text-lg font-bold" style={{ color: ZM.textPri }}>Dados pessoais</h2>
                  </div>
                  <div className="space-y-3">
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Nome completo *" value={regForm.full_name} onChange={(e) => updateForm("full_name", e.target.value)} />
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="CPF *" value={regForm.cpf} onChange={(e) => updateForm("cpf", e.target.value)} />
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Data de nascimento" type="date" value={regForm.birth_date} onChange={(e) => updateForm("birth_date", e.target.value)} />
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Telefone (WhatsApp) *" value={regForm.phone} onChange={(e) => updateForm("phone", e.target.value)} />
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="E-mail" type="email" value={regForm.email} onChange={(e) => updateForm("email", e.target.value)} />
                  </div>
                </div>
              )}

              {/* Step 2: CNH */}
              {regStep === 1 && (
                <div className={zmCard} style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.border}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5" style={{ color: ZM.green }} />
                    <h2 className="font-syne text-lg font-bold" style={{ color: ZM.textPri }}>CNH e Documentos</h2>
                  </div>
                  <div className="space-y-3">
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Número da CNH *" value={regForm.cnh} onChange={(e) => updateForm("cnh", e.target.value)} />
                    <select className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} value={regForm.cnh_category} onChange={(e) => updateForm("cnh_category", e.target.value)}>
                      {["A", "B", "AB", "C", "D", "E"].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Validade da CNH" type="date" value={regForm.cnh_expiry} onChange={(e) => updateForm("cnh_expiry", e.target.value)} />
                    <div className="rounded-xl p-4 text-center text-sm" style={{ backgroundColor: ZM.bgElev, color: ZM.textSec }}>
                      <FileText className="h-8 w-8 mx-auto mb-2" style={{ color: ZM.textMut }} />
                      Upload de fotos da CNH disponível em breve
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Vehicle */}
              {regStep === 2 && (
                <div className={zmCard} style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.border}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Car className="h-5 w-5" style={{ color: ZM.green }} />
                    <h2 className="font-syne text-lg font-bold" style={{ color: ZM.textPri }}>Dados do Veículo</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {[{ val: "car", label: "Carro", icon: <Car className="h-4 w-4" /> }, { val: "moto", label: "Moto", icon: <Bike className="h-4 w-4" /> }].map((t) => (
                        <button key={t.val} className="flex-1 py-2.5 rounded-[14px] flex items-center justify-center gap-1.5 text-sm font-semibold transition-all duration-200"
                          style={{ backgroundColor: regForm.vehicle_type === t.val ? ZM.green : ZM.bgElev, color: regForm.vehicle_type === t.val ? "#000" : ZM.textPri, border: `1px solid ${regForm.vehicle_type === t.val ? ZM.green : ZM.border}` }}
                          onClick={() => updateForm("vehicle_type", t.val)}>{t.icon} {t.label}</button>
                      ))}
                    </div>
                    <select className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} value={regForm.vehicle_brand} onChange={(e) => updateForm("vehicle_brand", e.target.value)}>
                      <option value="">Marca *</option>
                      {carBrands.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Modelo *" value={regForm.vehicle_model} onChange={(e) => updateForm("vehicle_model", e.target.value)} />
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Ano *" type="number" value={regForm.vehicle_year} onChange={(e) => updateForm("vehicle_year", e.target.value)} />
                    <input className={zmInput("font-mono-jb uppercase")} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Placa *" value={regForm.vehicle_plate} onChange={(e) => updateForm("vehicle_plate", e.target.value)} />
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Cor *" value={regForm.vehicle_color} onChange={(e) => updateForm("vehicle_color", e.target.value)} />
                  </div>
                </div>
              )}

              {/* Step 4: Bank */}
              {regStep === 3 && (
                <div className={zmCard} style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.border}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5" style={{ color: ZM.green }} />
                    <h2 className="font-syne text-lg font-bold" style={{ color: ZM.textPri }}>Dados Bancários</h2>
                  </div>
                  <div className="space-y-3">
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Banco" value={regForm.bank_name} onChange={(e) => updateForm("bank_name", e.target.value)} />
                    <select className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} value={regForm.account_type} onChange={(e) => updateForm("account_type", e.target.value)}>
                      <option value="corrente">Conta Corrente</option>
                      <option value="poupanca">Conta Poupança</option>
                    </select>
                    <div className="flex gap-2">
                      <input className={zmInput("flex-1 font-mono-jb")} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Agência" value={regForm.agency} onChange={(e) => updateForm("agency", e.target.value)} />
                      <input className={zmInput("flex-1 font-mono-jb")} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Conta" value={regForm.account} onChange={(e) => updateForm("account", e.target.value)} />
                    </div>
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Chave PIX *" value={regForm.pix_key} onChange={(e) => updateForm("pix_key", e.target.value)} />
                    <input className={zmInput()} style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }} placeholder="Nome do titular" value={regForm.pix_holder} onChange={(e) => updateForm("pix_holder", e.target.value)} />
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {regStep === 4 && (
                <div className="space-y-4">
                  <div className={zmCard} style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.border}` }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="h-5 w-5" style={{ color: ZM.green }} />
                      <h2 className="font-syne text-lg font-bold" style={{ color: ZM.textPri }}>Revisão do cadastro</h2>
                    </div>
                    <div className="space-y-4">
                      {[
                        { title: "Pessoal", items: [["Nome", regForm.full_name], ["CPF", regForm.cpf], ["Telefone", regForm.phone]] },
                        { title: "CNH", items: [["Número", regForm.cnh], ["Categoria", regForm.cnh_category]] },
                        { title: "Veículo", items: [["Tipo", regForm.vehicle_type === "car" ? "Carro" : "Moto"], ["Marca", regForm.vehicle_brand], ["Modelo", regForm.vehicle_model], ["Placa", regForm.vehicle_plate], ["Cor", regForm.vehicle_color]] },
                        { title: "Banco", items: [["PIX", regForm.pix_key]] },
                      ].map((section) => (
                        <div key={section.title}>
                          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: ZM.textMut }}>{section.title}</p>
                          {section.items.map(([label, value]) => (
                            <div key={label} className="flex justify-between text-sm py-0.5">
                              <span style={{ color: ZM.textSec }}>{label}</span>
                              <span className={`font-medium ${label === "Placa" ? "font-mono-jb" : ""}`} style={{ color: ZM.textPri }}>{value || "—"}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox checked={regForm.accepted_terms} onCheckedChange={(v) => updateForm("accepted_terms", !!v)} />
                    <p className="text-xs" style={{ color: ZM.textSec }}>Aceito os termos de uso e política de privacidade do ZuuMob</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {regStep > 0 && (
              <button className="flex-1 h-11 rounded-[14px] flex items-center justify-center gap-1 text-sm font-semibold transition-all duration-200"
                style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textPri }}
                onClick={() => setRegStep(regStep - 1)}><ArrowLeft className="h-4 w-4" /> Voltar</button>
            )}
            {regStep < 4 && (
              <button className="flex-1 h-11 rounded-[14px] flex items-center justify-center gap-1 text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,230,118,0.2)]"
                style={{ backgroundColor: ZM.green, color: "#000" }}
                onClick={() => setRegStep(regStep + 1)}>Próximo <ArrowRight className="h-4 w-4" /></button>
            )}
            {regStep === 4 && (
              <button className="flex-1 h-12 rounded-[14px] text-base font-semibold font-dm transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,230,118,0.2)]"
                style={{ backgroundColor: regForm.accepted_terms ? ZM.green : ZM.bgElev, color: regForm.accepted_terms ? "#000" : ZM.textMut }}
                onClick={registerDriver} disabled={!regForm.accepted_terms}>
                Enviar cadastro
              </button>
            )}
          </div>

          {regStep === 4 && (
            <p className="text-xs text-center mt-4" style={{ color: ZM.textSec }}>Seu cadastro está em análise. Em até 48h você receberá a confirmação.</p>
          )}
        </div>
      </div>
    );
  }

  // ─── DRIVER DASHBOARD ────────────────────────────────────────────────
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "earnings", label: "Ganhos", icon: DollarSign },
    { id: "history", label: "Histórico", icon: Clock },
    { id: "ratings", label: "Avaliações", icon: Star },
    { id: "settings", label: "Config", icon: Settings },
  ];

  return (
    <div className="zuumob-dark min-h-screen font-dm" style={{ backgroundColor: ZM.bg }}>
      {/* Header */}
      <div className="p-4" style={{ backgroundColor: ZM.bgSec, borderBottom: `1px solid ${ZM.border}` }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}` }}
              onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" style={{ color: ZM.textPri }} />
            </button>
            <Avatar className="h-10 w-10" style={{ border: `2px solid ${ZM.green}` }}>
              <AvatarImage src={driver.photo_url || ""} />
              <AvatarFallback style={{ backgroundColor: ZM.green, color: "#000" }}>{driver.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-base font-syne font-bold" style={{ color: ZM.textPri }}>{driver.full_name}</h1>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span className="text-xs font-mono-jb" style={{ color: ZM.textPri }}>{Number(driver.rating).toFixed(1)}</span>
              </div>
            </div>
          </div>
          <button onClick={toggleOnline}
            className="rounded-[14px] px-5 h-10 text-sm font-semibold font-dm flex items-center gap-1.5 transition-all duration-200"
            style={{ backgroundColor: isOnline ? ZM.danger : ZM.green, color: isOnline ? "#fff" : "#000" }}>
            {isOnline ? <><PowerOff className="h-4 w-4" /> Offline</> : <><Power className="h-4 w-4" /> Online</>}
          </button>
        </div>
      </div>

      {/* Pending ride overlay */}
      <AnimatePresence>
        {pendingRides.length > 0 && !currentRide && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed inset-x-0 top-0 z-50 backdrop-blur-md p-4 shadow-2xl"
            style={{ backgroundColor: "rgba(17,19,24,0.95)", borderBottom: `2px solid ${ZM.green}` }}>
            <div className="max-w-lg lg:max-w-2xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-syne text-lg font-bold" style={{ color: ZM.textPri }}>Nova corrida!</h3>
                <div className="flex items-center gap-2">
                  <span className="font-mono-jb text-sm font-bold" style={{ color: ZM.green }}>{acceptCountdown}s</span>
                  <div className="w-20 h-2 rounded-full overflow-hidden" style={{ backgroundColor: ZM.bgElev }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(acceptCountdown / 15) * 100}%`, backgroundColor: ZM.green }} />
                  </div>
                </div>
              </div>
              {(() => {
                const ride = pendingRides[0];
                const gross = Number(ride.estimated_price) || 0;
                const net = gross * 0.77;
                return (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ZM.green }} /><span className="text-sm truncate" style={{ color: ZM.textPri }}>{ride.origin_address}</span></div>
                      <div className="ml-1 h-3" style={{ borderLeft: `2px dashed ${ZM.textMut}` }} />
                      <div className="flex items-center gap-2"><MapPin className="h-3 w-3" style={{ color: ZM.danger }} /><span className="text-sm truncate" style={{ color: ZM.textPri }}>{ride.destination_address}</span></div>
                    </div>
                    <div className="text-sm" style={{ color: ZM.textSec }}>
                      <span className="font-mono-jb">{ride.distance_km?.toFixed(1)}</span> km · <span className="font-mono-jb">{ride.duration_minutes}</span> min
                    </div>
                    <div className="rounded-xl p-3 flex justify-between" style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}` }}>
                      <div><p className="text-xs" style={{ color: ZM.textSec }}>Valor da corrida</p><p className="font-mono-jb font-bold" style={{ color: ZM.textPri }}>{formatPrice(gross)}</p></div>
                      <div className="text-right"><p className="text-xs" style={{ color: ZM.textSec }}>Seu ganho (77%)</p><p className="font-mono-jb font-bold" style={{ color: ZM.green }}>{formatPrice(net)}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 h-12 rounded-[14px] text-base font-semibold font-dm flex items-center justify-center gap-1.5 transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,230,118,0.2)]"
                        style={{ backgroundColor: ZM.green, color: "#000" }}
                        onClick={() => acceptRide(ride)}><CheckCircle className="h-5 w-5" /> ACEITAR</button>
                      <button className="w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-200"
                        style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}`, color: ZM.textSec }}
                        onClick={() => { setPendingRides((p) => p.slice(1)); setAcceptCountdown(0); }}><XCircle className="h-5 w-5" /></button>
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
            <div className={zmCard} style={{ backgroundColor: ZM.bgCard, border: `2px solid ${ZM.borderActive}`, boxShadow: ZM.glow }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ backgroundColor: "rgba(0,230,118,0.1)", color: ZM.green }}>
                  {currentRide.status === "accepted" ? "Aceita" : currentRide.status === "arriving" ? "Chegando" : "Em viagem"}
                </span>
                <span className="font-mono-jb font-bold" style={{ color: ZM.textPri }}>{formatPrice(currentRide.estimated_price)}</span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ZM.green }} /><span className="text-sm truncate" style={{ color: ZM.textPri }}>{currentRide.origin_address}</span></div>
                <div className="ml-1 h-3" style={{ borderLeft: `2px dashed ${ZM.textMut}` }} />
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3" style={{ color: ZM.danger }} /><span className="text-sm truncate" style={{ color: ZM.textPri }}>{currentRide.destination_address}</span></div>
              </div>
              <div className="flex gap-2">
                {currentRide.status === "accepted" && <button className="flex-1 h-10 rounded-[14px] font-semibold transition-all duration-200" style={{ backgroundColor: ZM.green, color: "#000" }} onClick={() => updateRideStatus("arriving")}>Cheguei no local</button>}
                {currentRide.status === "arriving" && <button className="flex-1 h-10 rounded-[14px] font-semibold transition-all duration-200" style={{ backgroundColor: ZM.green, color: "#000" }} onClick={() => updateRideStatus("in_progress")}>Iniciar viagem</button>}
                {currentRide.status === "in_progress" && <button className="flex-1 h-10 rounded-[14px] font-semibold transition-all duration-200" style={{ backgroundColor: ZM.green, color: "#000" }} onClick={() => updateRideStatus("completed")}>Finalizar corrida</button>}
                <button className="w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-200" style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}` }}>
                  <MessageCircle className="h-4 w-4" style={{ color: ZM.textPri }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Online status card */}
        {!currentRide && (
          <div className={zmCard} style={{ backgroundColor: ZM.bgCard, border: `2px solid ${isOnline ? ZM.borderActive : "transparent"}`, boxShadow: isOnline ? ZM.glow : "none" }}>
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: isOnline ? "rgba(0,230,118,0.1)" : ZM.bgElev }}>
                {isOnline ? (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Car className="h-6 w-6" style={{ color: ZM.green }} />
                  </motion.div>
                ) : (
                  <Car className="h-6 w-6" style={{ color: ZM.textMut }} />
                )}
              </div>
              <p className="text-sm font-semibold" style={{ color: ZM.textPri }}>{isOnline ? "Aguardando corridas..." : "Você está offline"}</p>
              <p className="text-xs" style={{ color: ZM.textSec }}>{isOnline ? "Fique atento ao celular" : "Fique online para receber corridas"}</p>
              {/* GPS Indicator */}
              {isOnline && (
                <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: ZM.bgElev, border: `1px solid ${ZM.border}` }}>
                  <div className="relative flex items-center justify-center">
                    <Navigation className="h-3.5 w-3.5" style={{ color: lastGpsUpdate ? ZM.green : ZM.textMut }} />
                    {lastGpsUpdate && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: ZM.green, opacity: 0.6 }} />
                    )}
                  </div>
                  <span className="text-[11px] font-mono" style={{ color: lastGpsUpdate ? ZM.green : ZM.textMut }}>
                    {lastGpsUpdate
                      ? `GPS atualizado: ${lastGpsUpdate.toLocaleTimeString("pt-BR")}`
                      : "GPS aguardando sinal..."}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: DollarSign, label: "Hoje", value: formatPrice(todayEarnings) },
            { icon: TrendingUp, label: "Semana", value: formatPrice(weekEarnings) },
            { icon: BarChart3, label: "Mês", value: formatPrice(monthEarnings) },
            { icon: Car, label: "Corridas", value: String(driver.total_rides) },
          ].map((stat) => (
            <div key={stat.label} className={zmCard + " text-center"} style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.border}` }}>
              <stat.icon className="h-4 w-4 mx-auto mb-1" style={{ color: ZM.green }} />
              <p className="text-[10px]" style={{ color: ZM.textSec }}>{stat.label}</p>
              <p className="text-sm font-mono-jb font-bold" style={{ color: ZM.textPri }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden" style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.border}` }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 text-xs font-semibold transition-all duration-200 flex flex-col items-center gap-1"
              style={{ backgroundColor: activeTab === tab.id ? "rgba(0,230,118,0.1)" : "transparent", color: activeTab === tab.id ? ZM.green : ZM.textSec, borderBottom: activeTab === tab.id ? `2px solid ${ZM.green}` : "2px solid transparent" }}>
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <div className={zmCard} style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.border}` }}>
              <h3 className="font-syne text-sm font-bold mb-3" style={{ color: ZM.textPri }}>Ganhos por dia da semana</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mockWeekEarnings}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ZM.border} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: ZM.textSec, fontFamily: "DM Sans" }} />
                  <YAxis tick={{ fontSize: 11, fill: ZM.textSec, fontFamily: "JetBrains Mono" }} />
                  <Tooltip contentStyle={{ background: ZM.bgElev, border: `1px solid ${ZM.border}`, borderRadius: 12, fontSize: 12, color: ZM.textPri, fontFamily: "DM Sans" }} />
                  <Bar dataKey="current" fill="#00E676" radius={[4, 4, 0, 0]} name="Esta semana" />
                  <Bar dataKey="previous" fill="#1C2128" radius={[4, 4, 0, 0]} name="Semana anterior" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {!driver.is_approved && (
              <div className={zmCard + " flex items-center gap-3"} style={{ backgroundColor: ZM.bgCard, border: "1px solid rgba(255,107,53,0.3)" }}>
                <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: "#FF6B35" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: ZM.textPri }}>Cadastro em análise</p>
                  <p className="text-xs" style={{ color: ZM.textSec }}>Aguarde a aprovação para começar a dirigir</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EARNINGS */}
        {activeTab === "earnings" && (
          <div className="space-y-3">
            <div className={zmCard} style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.borderActive}`, boxShadow: ZM.glow }}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs" style={{ color: ZM.textSec }}>Saldo disponível</p>
                  <p className="text-2xl font-mono-jb font-bold" style={{ color: ZM.green }}>{formatPrice(Number(driver.total_earnings))}</p>
                </div>
                <button className="h-9 px-4 rounded-[14px] text-sm font-semibold flex items-center gap-1.5 transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,230,118,0.2)]"
                  style={{ backgroundColor: ZM.green, color: "#000" }}><Wallet className="h-4 w-4" /> Solicitar saque</button>
              </div>
            </div>
            <h3 className="font-syne text-sm font-bold" style={{ color: ZM.textPri }}>Extrato detalhado</h3>
            {earnings.length === 0 && <p className="text-center py-8 text-sm" style={{ color: ZM.textSec }}>Nenhum ganho registrado</p>}
            {earnings.map((e) => {
              const gross = Number(e.gross_amount);
              const fee = Number(e.platform_fee);
              const net = Number(e.net_amount);
              return (
                <div key={e.id} className={zmCard} style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.border}` }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono-jb" style={{ color: ZM.textSec }}>{new Date(e.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                      style={{ backgroundColor: e.status === "paid" ? "rgba(0,230,118,0.1)" : ZM.bgElev, color: e.status === "paid" ? ZM.green : ZM.textSec }}>
                      {e.status === "paid" ? "Pago" : "Pendente"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="space-y-0.5">
                      <p className="font-mono-jb" style={{ color: ZM.textSec }}>Bruto: {formatPrice(gross)}</p>
                      <p className="font-mono-jb" style={{ color: ZM.textSec }}>Taxa (23%): -{formatPrice(fee)}</p>
                    </div>
                    <p className="text-lg font-mono-jb font-bold self-center" style={{ color: ZM.green }}>{formatPrice(net)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-2">
            {rideHistory.length === 0 && <p className="text-center py-8 text-sm" style={{ color: ZM.textSec }}>Nenhuma corrida ainda</p>}
            {rideHistory.map((ride) => (
              <div key={ride.id} className={zmCard} style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.border}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                    style={{ backgroundColor: ride.status === "completed" ? "rgba(0,230,118,0.1)" : ZM.bgElev, color: ride.status === "completed" ? ZM.green : ZM.textSec }}>
                    {ride.status === "completed" ? "Concluída" : ride.status === "cancelled" ? "Cancelada" : ride.status}
                  </span>
                  <span className="font-mono-jb font-bold" style={{ color: ZM.textPri }}>{formatPrice(ride.final_price || ride.estimated_price)}</span>
                </div>
                <p className="text-xs truncate" style={{ color: ZM.textSec }}>{ride.origin_address} → {ride.destination_address}</p>
                <div className="flex justify-between mt-1">
                  <span className="text-xs font-mono-jb" style={{ color: ZM.textMut }}>{new Date(ride.created_at).toLocaleDateString("pt-BR")}</span>
                  <span className="text-xs font-mono-jb" style={{ color: ZM.textMut }}>{ride.distance_km?.toFixed(1)} km · {ride.duration_minutes} min</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RATINGS */}
        {activeTab === "ratings" && (
          <div className={zmCard} style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.border}` }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-mono-jb font-bold" style={{ color: ZM.textPri }}>{Number(driver.rating).toFixed(1)}</p>
                <div className="flex gap-0.5 justify-center">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`h-3 w-3 ${s <= Math.round(Number(driver.rating)) ? "fill-yellow-500 text-yellow-500" : ""}`} style={s > Math.round(Number(driver.rating)) ? { color: ZM.textMut } : {}} />)}
                </div>
                <p className="text-xs font-mono-jb mt-1" style={{ color: ZM.textSec }}>{driver.total_rides} corridas</p>
              </div>
              <div className="flex-1 space-y-1">
                {ratingDistribution.map((r) => (
                  <div key={r.stars} className="flex items-center gap-2">
                    <span className="text-xs w-3 font-mono-jb" style={{ color: ZM.textSec }}>{r.stars}</span>
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: ZM.bgElev }}>
                      <div className="h-full rounded-full bg-yellow-500" style={{ width: `${(r.count / totalRatingCount) * 100}%` }} />
                    </div>
                    <span className="text-xs w-6 text-right font-mono-jb" style={{ color: ZM.textSec }}>{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-2">
            {[
              { icon: User, label: "Editar dados pessoais" },
              { icon: Car, label: "Editar dados do veículo" },
              { icon: CreditCard, label: "Alterar chave PIX" },
              { icon: AlertCircle, label: "Notificações" },
              { icon: Phone, label: "Suporte via WhatsApp" },
            ].map((item) => (
              <button key={item.label} className={zmCard + " w-full flex items-center gap-3 cursor-pointer"} style={{ backgroundColor: ZM.bgCard, border: `1px solid ${ZM.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ZM.borderActive; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ZM.border; }}>
                <item.icon className="h-5 w-5" style={{ color: ZM.green }} />
                <span className="text-sm" style={{ color: ZM.textPri }}>{item.label}</span>
                <ArrowRight className="h-4 w-4 ml-auto" style={{ color: ZM.textMut }} />
              </button>
            ))}
            <button className={zmCard + " w-full flex items-center gap-3 cursor-pointer"} style={{ backgroundColor: ZM.bgCard, border: "1px solid rgba(255,71,87,0.2)" }}
              onClick={() => navigate("/")}>
              <LogOut className="h-5 w-5" style={{ color: ZM.danger }} />
              <span className="text-sm" style={{ color: ZM.danger }}>Sair</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MotoristaPage;

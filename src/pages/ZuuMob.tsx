import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Navigation, Search, Star, Clock, Car, Bike, Crown,
  CreditCard, Wallet, QrCode, X, Locate, ArrowLeft, Phone,
  MessageCircle, AlertTriangle, History, Shield, Gauge
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

type RideStatus = "idle" | "selecting_destination" | "choosing_ride" | "searching" | "accepted" | "arriving" | "in_progress" | "completed";

interface Location { lat: number; lng: number; address: string; }

interface MockDriver {
  id: string; name: string; photo: string; rating: number;
  totalRides: number; vehicle: string; plate: string; color: string;
  lat: number; lng: number; type: string;
}

const rideTypes = [
  { id: "standard", name: "ZuuMob Standard", icon: <Car className="h-6 w-6" />, multiplier: 1, eta: "5 min", description: "Viagem acessível" },
  { id: "comfort", name: "ZuuMob Comfort", icon: <Crown className="h-6 w-6" />, multiplier: 1.3, eta: "8 min", description: "Conforto premium" },
  { id: "moto", name: "ZuuMob Moto", icon: <Bike className="h-6 w-6" />, multiplier: 0.6, eta: "3 min", description: "Rápido e econômico" },
];

const paymentMethods = [
  { id: "pix", label: "PIX", icon: <QrCode className="h-4 w-4" /> },
  { id: "card", label: "Cartão", icon: <CreditCard className="h-4 w-4" /> },
  { id: "wallet", label: "Saldo Zuuppi", icon: <Wallet className="h-4 w-4" /> },
];

const quickMessages = ["Estou chegando", "Aguarde 2 min", "Onde você está?", "Já estou no local"];

const getMockDrivers = (lat: number, lng: number): MockDriver[] => [
  { id: "1", name: "Carlos Silva", photo: "https://i.pravatar.cc/150?img=11", rating: 4.8, totalRides: 1247, vehicle: "Toyota Corolla", plate: "ABC-1234", color: "Preto", lat: lat + 0.003, lng: lng + 0.002, type: "standard" },
  { id: "2", name: "Roberto Mendes", photo: "https://i.pravatar.cc/150?img=15", rating: 4.9, totalRides: 3891, vehicle: "Honda Civic", plate: "XYZ-5678", color: "Prata", lat: lat - 0.002, lng: lng + 0.004, type: "comfort" },
  { id: "3", name: "Lucas Moto", photo: "https://i.pravatar.cc/150?img=20", rating: 4.7, totalRides: 892, vehicle: "Honda CG 160", plate: "MOT-9012", color: "Vermelha", lat: lat + 0.001, lng: lng - 0.003, type: "moto" },
  { id: "4", name: "Ana Paula", photo: "https://i.pravatar.cc/150?img=32", rating: 4.95, totalRides: 2104, vehicle: "Hyundai HB20", plate: "DEF-3456", color: "Branco", lat: lat - 0.004, lng: lng - 0.001, type: "standard" },
  { id: "5", name: "Pedro Santos", photo: "https://i.pravatar.cc/150?img=53", rating: 4.6, totalRides: 567, vehicle: "Yamaha Fazer", plate: "MOT-7890", color: "Azul", lat: lat + 0.002, lng: lng + 0.005, type: "moto" },
];

const ZuuMob = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const driverMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const mockDriverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const animFrameRef = useRef<number>(0);

  const [rideStatus, setRideStatus] = useState<RideStatus>("idle");
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedRideType, setSelectedRideType] = useState("standard");
  const [selectedPayment, setSelectedPayment] = useState("pix");
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [mockDriver, setMockDriver] = useState<MockDriver | null>(null);
  const [driverEta, setDriverEta] = useState(0);
  const [tripProgress, setTripProgress] = useState(0);
  const [tripTimeLeft, setTripTimeLeft] = useState(0);
  const [mockSpeed, setMockSpeed] = useState(0);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string }[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Initialize map & mock drivers
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    if (!MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-43.1729, -22.9068],
      zoom: 14,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo({ center: [longitude, latitude], zoom: 15 });
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:18px;height:18px;background:hsl(122,39%,42%);border-radius:50%;border:3px solid white;box-shadow:0 0 0 0 rgba(76,175,80,0.4);animation:pulse-ring 1.5s infinite"></div>`;
        userMarkerRef.current = new mapboxgl.Marker(el).setLngLat([longitude, latitude]).addTo(map);
        reverseGeocode(latitude, longitude).then((addr) => setOrigin({ lat: latitude, lng: longitude, address: addr }));
        addMockDriversToMap(latitude, longitude, map);
      },
      () => {
        const lat = -22.9068, lng = -43.1729;
        setOrigin({ lat, lng, address: "Rio de Janeiro, RJ" });
        addMockDriversToMap(lat, lng, map);
      }
    );
    return () => { cancelAnimationFrame(animFrameRef.current); map.remove(); };
  }, []);

  const addMockDriversToMap = (lat: number, lng: number, map: mapboxgl.Map) => {
    const drivers = getMockDrivers(lat, lng);
    driverMarkersRef.current.forEach((m) => m.remove());
    driverMarkersRef.current = [];
    drivers.forEach((d) => {
      const el = document.createElement("div");
      el.innerHTML = d.type === "moto"
        ? `<div style="width:32px;height:32px;background:hsl(122,39%,42%);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);animation:float 3s ease-in-out infinite"><span style="font-size:16px">🏍️</span></div>`
        : `<div style="width:32px;height:32px;background:hsl(122,39%,42%);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);animation:float 3s ease-in-out infinite"><span style="font-size:16px">🚗</span></div>`;
      const marker = new mapboxgl.Marker(el).setLngLat([d.lng, d.lat]).addTo(map);
      driverMarkersRef.current.push(marker);
    });
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    if (!MAPBOX_TOKEN) return "Localização atual";
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=pt`);
      const data = await res.json();
      return data.features?.[0]?.place_name || "Localização atual";
    } catch { return "Localização atual"; }
  };

  const searchDestination = useCallback(async (query: string) => {
    setDestinationQuery(query);
    if (!query || query.length < 3 || !MAPBOX_TOKEN) { setSuggestions([]); return; }
    try {
      const center = origin ? `${origin.lng},${origin.lat}` : "-43.1729,-22.9068";
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&language=pt&country=BR&proximity=${center}&limit=5`);
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch { setSuggestions([]); }
  }, [origin]);

  const selectDestination = (feature: any) => {
    const [lng, lat] = feature.center;
    const dest: Location = { lat, lng, address: feature.place_name };
    setDestination(dest);
    setDestinationQuery(feature.place_name);
    setSuggestions([]);
    setRideStatus("choosing_ride");
    if (origin) calculateRoute(origin, dest);
  };

  const calculateRoute = async (orig: Location, dest: Location) => {
    if (!MAPBOX_TOKEN || !mapRef.current) return;
    try {
      const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${orig.lng},${orig.lat};${dest.lng},${dest.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`);
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) return;
      const distKm = route.distance / 1000;
      const durMin = Math.round(route.duration / 60);
      setEstimatedDistance(distKm);
      setEstimatedDuration(durMin);
      setEstimatedPrice(5 + distKm * 2.5 + durMin * 0.3);

      const map = mapRef.current;
      if (map.getSource("route")) {
        (map.getSource("route") as mapboxgl.GeoJSONSource).setData(route.geometry);
      } else {
        map.addLayer({
          id: "route", type: "line",
          source: { type: "geojson", data: route.geometry },
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#4CAF50", "line-width": 5, "line-opacity": 0.8 },
        });
      }
      new mapboxgl.Marker({ color: "#4CAF50" }).setLngLat([dest.lng, dest.lat]).addTo(map);
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([orig.lng, orig.lat]);
      bounds.extend([dest.lng, dest.lat]);
      map.fitBounds(bounds, { padding: 100 });
    } catch (err) { console.error("Route error:", err); }
  };

  const getPrice = (type: string) => estimatedPrice * (rideTypes.find((r) => r.id === type)?.multiplier || 1);
  const formatPrice = (val: number) => `R$ ${val.toFixed(2).replace(".", ",")}`;

  const requestRide = async () => {
    if (!user || !origin || !destination) {
      toast({ title: "Erro", description: "Faça login e selecione origem/destino", variant: "destructive" });
      return;
    }
    setIsRequesting(true);
    setRideStatus("searching");

    const price = getPrice(selectedRideType);
    const { data, error } = await supabase.from("rides").insert({
      passenger_id: user.id, status: "searching",
      origin_lat: origin.lat, origin_lng: origin.lng, origin_address: origin.address,
      destination_lat: destination.lat, destination_lng: destination.lng, destination_address: destination.address,
      estimated_price: price, distance_km: estimatedDistance, duration_minutes: estimatedDuration,
      ride_type: selectedRideType, payment_method: selectedPayment,
    }).select().single();

    if (error) {
      toast({ title: "Erro ao solicitar corrida", description: error.message, variant: "destructive" });
      setRideStatus("choosing_ride");
      setIsRequesting(false);
      return;
    }
    setCurrentRide(data);

    // Subscribe to real ride updates
    supabase.channel(`ride-${data.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${data.id}` }, (payload) => {
        const updated = payload.new as any;
        setCurrentRide(updated);
        if (updated.status === "completed") { setRideStatus("completed"); }
        else if (updated.status === "cancelled") { setRideStatus("idle"); toast({ title: "Corrida cancelada" }); }
      }).subscribe();

    // Mock driver acceptance after 5-8 seconds
    const delay = 5000 + Math.random() * 3000;
    setTimeout(() => {
      const drivers = origin ? getMockDrivers(origin.lat, origin.lng) : [];
      const compatible = drivers.filter((d) => selectedRideType === "moto" ? d.type === "moto" : d.type !== "moto");
      const chosen = compatible[Math.floor(Math.random() * compatible.length)] || drivers[0];
      setMockDriver(chosen);
      setRideStatus("accepted");
      setDriverEta(Math.floor(Math.random() * 5) + 3);
      setIsRequesting(false);
      toast({ title: "Motorista encontrado!", description: `${chosen.name} está a caminho` });

      // Animate driver marker moving toward user
      if (mapRef.current && origin) {
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:40px;height:40px;background:hsl(122,39%,42%);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);border:3px solid white"><span style="font-size:20px">${chosen.type === "moto" ? "🏍️" : "🚗"}</span></div>`;
        mockDriverMarkerRef.current = new mapboxgl.Marker(el).setLngLat([chosen.lng, chosen.lat]).addTo(mapRef.current);
        animateDriverToUser(chosen, origin);
      }
    }, delay);
  };

  const animateDriverToUser = (driver: MockDriver, userLoc: Location) => {
    const steps = 120;
    let step = 0;
    const dLat = (userLoc.lat - driver.lat) / steps;
    const dLng = (userLoc.lng - driver.lng) / steps;

    const animate = () => {
      step++;
      if (step > steps || !mockDriverMarkerRef.current) return;
      const newLng = driver.lng + dLng * step;
      const newLat = driver.lat + dLat * step;
      mockDriverMarkerRef.current.setLngLat([newLng, newLat]);
      setMockSpeed(Math.floor(30 + Math.random() * 40));

      if (step === Math.floor(steps * 0.7)) {
        setRideStatus("arriving");
        setDriverEta(1);
      }
      if (step >= steps) {
        setDriverEta(0);
        return;
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
  };

  const startTrip = () => {
    setRideStatus("in_progress");
    setTripProgress(0);
    setTripTimeLeft(estimatedDuration);

    // Simulate trip progress
    const totalMs = Math.min(estimatedDuration, 5) * 1000 * 3; // speed up for demo
    const intervalMs = 200;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += intervalMs;
      const pct = Math.min((elapsed / totalMs) * 100, 100);
      setTripProgress(pct);
      setTripTimeLeft(Math.max(0, Math.ceil(estimatedDuration * (1 - elapsed / totalMs))));
      setMockSpeed(Math.floor(20 + Math.random() * 60));
      if (pct >= 100) {
        clearInterval(interval);
        completeTrip();
      }
    }, intervalMs);
  };

  const completeTrip = async () => {
    setRideStatus("completed");
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    if (currentRide) {
      await supabase.from("rides").update({ status: "completed", completed_at: new Date().toISOString(), final_price: currentRide.estimated_price }).eq("id", currentRide.id);
    }
  };

  const submitRating = async () => {
    if (currentRide && rating > 0) {
      await supabase.from("ride_ratings").insert({
        ride_id: currentRide.id,
        from_user: user?.id || "",
        to_user: currentRide.driver_id || mockDriver?.id || "",
        rating,
        comment: ratingComment || null,
      });
    }
    toast({ title: "Obrigado pela avaliação!" });
    resetRide();
  };

  const cancelRide = async () => {
    if (currentRide) await supabase.from("rides").update({ status: "cancelled" }).eq("id", currentRide.id);
    cancelAnimationFrame(animFrameRef.current);
    mockDriverMarkerRef.current?.remove();
    resetRide();
  };

  const resetRide = () => {
    setRideStatus("idle");
    setCurrentRide(null);
    setDestination(null);
    setDestinationQuery("");
    setMockDriver(null);
    setRating(0);
    setRatingComment("");
    setShowChat(false);
    setChatMessages([]);
    setTripProgress(0);
    setIsRequesting(false);
    mockDriverMarkerRef.current?.remove();
  };

  const sendQuickMessage = (msg: string) => {
    setChatMessages((prev) => [...prev, { from: "you", text: msg }]);
    setTimeout(() => {
      const replies = ["Ok, entendi!", "Certo, já estou vendo você", "Sem problemas!", "Perfeito!"];
      setChatMessages((prev) => [...prev, { from: "driver", text: replies[Math.floor(Math.random() * replies.length)] }]);
    }, 1500);
  };

  const centerOnUser = () => {
    if (origin && mapRef.current) mapRef.current.flyTo({ center: [origin.lng, origin.lat], zoom: 15 });
  };

  // Confetti particles
  const confettiParticles = showConfetti ? Array.from({ length: 40 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 0.5,
    color: ["hsl(122,39%,42%)", "hsl(45,100%,50%)", "hsl(0,84%,60%)", "hsl(210,100%,56%)", "hsl(300,76%,60%)"][i % 5],
  })) : [];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <style>{`
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(76,175,80,0.4); } 70% { box-shadow: 0 0 0 15px rgba(76,175,80,0); } 100% { box-shadow: 0 0 0 0 rgba(76,175,80,0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes radar { 0% { transform: scale(0); opacity: 0.8; } 100% { transform: scale(3); opacity: 0; } }
        @keyframes confetti-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
      `}</style>

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
          {confettiParticles.map((p) => (
            <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: "-5%", width: 10, height: 10, backgroundColor: p.color, borderRadius: p.id % 2 === 0 ? "50%" : "0", animation: `confetti-fall 2.5s ${p.delay}s ease-in forwards` }} />
          ))}
        </div>
      )}

      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0 z-0" />
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 z-0 bg-muted flex items-center justify-center">
          <div className="text-center p-6">
            <Car className="h-16 w-16 mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground text-sm">Configure VITE_MAPBOX_TOKEN para exibir o mapa</p>
            <p className="text-muted-foreground text-xs mt-2">A interface funciona normalmente sem o mapa</p>
          </div>
        </div>
      )}

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="bg-card/90 backdrop-blur-sm shadow-lg rounded-full" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 bg-card/90 backdrop-blur-sm shadow-lg rounded-full px-4 py-2.5 flex items-center gap-2 cursor-pointer"
            onClick={() => { if (rideStatus === "idle") { setRideStatus("selecting_destination"); } }}>
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{destination ? destination.address.substring(0, 30) + "..." : "Para onde?"}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="bg-card/90 backdrop-blur-sm shadow-lg rounded-full" onClick={() => navigate("/zuumob/historico")}>
              <History className="h-4 w-4" />
            </Button>
            <Avatar className="h-9 w-9 border-2 border-primary shadow-lg cursor-pointer" onClick={() => navigate(user ? "/perfil" : "/auth")}>
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Sou Motorista button */}
      {rideStatus === "idle" && (
        <Button variant="outline" size="sm" className="absolute top-20 right-4 z-10 bg-card/90 backdrop-blur-sm shadow-lg rounded-full text-xs"
          onClick={() => navigate("/motorista")}>
          <Car className="h-3 w-3 mr-1" /> Sou Motorista
        </Button>
      )}

      {/* Center button */}
      <Button variant="ghost" size="icon" className="absolute bottom-[320px] right-4 z-10 bg-card/90 backdrop-blur-sm shadow-lg rounded-full" onClick={centerOnUser}>
        <Locate className="h-5 w-5 text-primary" />
      </Button>

      {/* Radar animation during searching */}
      {rideStatus === "searching" && origin && (
        <div className="absolute z-5 pointer-events-none" style={{ left: "50%", top: "40%", transform: "translate(-50%,-50%)" }}>
          {[0, 0.5, 1].map((d) => (
            <div key={d} style={{ position: "absolute", width: 60, height: 60, left: -30, top: -30, borderRadius: "50%", border: "2px solid hsl(122,39%,42%)", animation: `radar 2s ${d}s ease-out infinite` }} />
          ))}
        </div>
      )}

      {/* Bottom Sheets */}
      <AnimatePresence mode="wait">
        {/* IDLE / SELECTING DESTINATION */}
        {(rideStatus === "idle" || rideStatus === "selecting_destination") && (
          <motion.div key="dest" initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-card rounded-t-[24px] shadow-2xl">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Para onde você vai?</h3>
              <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-foreground truncate flex-1">{origin?.address || "Obtendo localização..."}</span>
              </div>
              <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                <MapPin className="h-4 w-4 text-destructive flex-shrink-0" />
                <Input placeholder="Buscar destino..." value={destinationQuery} onChange={(e) => searchDestination(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm" />
                {destinationQuery && <X className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => { setDestinationQuery(""); setSuggestions([]); }} />}
              </div>
              {suggestions.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {suggestions.map((s: any) => (
                    <button key={s.id} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/70 flex items-center gap-3 transition-colors" onClick={() => selectDestination(s)}>
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="truncate"><p className="text-sm font-medium text-foreground truncate">{s.text}</p><p className="text-xs text-muted-foreground truncate">{s.place_name}</p></div>
                    </button>
                  ))}
                </div>
              )}
              {suggestions.length === 0 && !destinationQuery && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Favoritos</p>
                  {[{ icon: Navigation, label: "Casa" }, { icon: MapPin, label: "Trabalho" }].map((f) => (
                    <button key={f.label} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/70 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><f.icon className="h-4 w-4 text-primary" /></div>
                      <div><p className="text-sm font-medium text-foreground">{f.label}</p><p className="text-xs text-muted-foreground">Adicionar endereço</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CHOOSING RIDE */}
        {rideStatus === "choosing_ride" && destination && (
          <motion.div key="choose" initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-card rounded-t-[24px] shadow-2xl">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Distância</p><p className="font-bold text-foreground">{estimatedDistance.toFixed(1)} km</p></div>
                <div className="text-right"><p className="text-sm text-muted-foreground">Tempo estimado</p><p className="font-bold text-foreground">{estimatedDuration} min</p></div>
              </div>
              <div className="space-y-2">
                {rideTypes.map((rt) => (
                  <button key={rt.id} onClick={() => setSelectedRideType(rt.id)}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all ${selectedRideType === rt.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted/70"}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedRideType === rt.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{rt.icon}</div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground text-sm">{rt.name}</p>
                      <p className="text-xs text-muted-foreground">{rt.description} · <Clock className="inline h-3 w-3" /> {rt.eta}</p>
                    </div>
                    <p className="font-bold text-foreground">{formatPrice(getPrice(rt.id))}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {paymentMethods.map((pm) => (
                  <button key={pm.id} onClick={() => setSelectedPayment(pm.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${selectedPayment === pm.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted/70"}`}>
                    {pm.icon}{pm.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => { setRideStatus("idle"); setDestination(null); setDestinationQuery(""); }}><X className="h-4 w-4" /></Button>
                <Button className="flex-1 h-12 rounded-xl text-base font-bold" onClick={requestRide} disabled={isRequesting}>
                  {isRequesting ? <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : `Solicitar ZuuMob · ${formatPrice(getPrice(selectedRideType))}`}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SEARCHING */}
        {rideStatus === "searching" && (
          <motion.div key="search" initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-card rounded-t-[24px] shadow-2xl">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
            <div className="p-6 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <motion.div className="absolute inset-0 rounded-full bg-primary/10" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Car className="h-10 w-10 text-primary" />
                  </motion.div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Procurando seu motorista...</h3>
                <p className="text-sm text-muted-foreground mt-1">Conectando você ao motorista mais próximo</p>
              </div>
              <motion.div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} style={{ width: "40%" }} />
              </motion.div>
              <Button variant="destructive" className="rounded-xl" onClick={cancelRide}>Cancelar corrida</Button>
            </div>
          </motion.div>
        )}

        {/* ACCEPTED / ARRIVING */}
        {(rideStatus === "accepted" || rideStatus === "arriving") && mockDriver && (
          <motion.div key="found" initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-card rounded-t-[24px] shadow-2xl">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-primary ${rideStatus === "arriving" ? "animate-pulse" : ""}`} />
                <span className="text-sm font-semibold text-foreground">
                  {rideStatus === "accepted" ? `Motorista a caminho · ${driverEta} min` : "Motorista chegando!"}
                </span>
              </div>

              {/* Driver card */}
              <div className="flex items-center gap-4 bg-muted/50 rounded-xl p-4">
                <Avatar className="h-14 w-14 border-2 border-primary">
                  <AvatarImage src={mockDriver.photo} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{mockDriver.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{mockDriver.name}</p>
                  <p className="text-xs text-muted-foreground">{mockDriver.vehicle} {mockDriver.color}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /><span className="text-xs font-semibold text-foreground">{mockDriver.rating}</span></div>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{mockDriver.totalRides} corridas</span>
                  </div>
                </div>
                <div className="bg-primary/10 px-3 py-1.5 rounded-lg"><p className="text-sm font-bold text-primary">{mockDriver.plate}</p></div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => toast({ title: "Ligando para motorista..." })}><Phone className="h-4 w-4 mr-1" /> Ligar</Button>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowChat(!showChat)}><MessageCircle className="h-4 w-4 mr-1" /> Chat</Button>
              </div>

              {/* Quick chat */}
              {showChat && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-2">
                  {chatMessages.length > 0 && (
                    <div className="max-h-24 overflow-y-auto space-y-1">
                      {chatMessages.map((m, i) => (
                        <div key={i} className={`text-xs px-3 py-1.5 rounded-lg max-w-[70%] ${m.from === "you" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted text-foreground"}`}>{m.text}</div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {quickMessages.map((msg) => (
                      <button key={msg} onClick={() => sendQuickMessage(msg)} className="text-xs bg-muted/70 hover:bg-muted text-foreground px-3 py-1.5 rounded-full transition-colors">{msg}</button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Route summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-sm text-foreground truncate">{origin?.address}</span></div>
                <div className="ml-1.5 border-l-2 border-dashed border-muted-foreground/30 h-4" />
                <div className="flex items-center gap-3"><MapPin className="h-3 w-3 text-destructive" /><span className="text-sm text-foreground truncate">{destination?.address}</span></div>
              </div>

              <div className="flex gap-2">
                {rideStatus === "arriving" && <Button className="flex-1 rounded-xl" onClick={startTrip}>Iniciar viagem</Button>}
                <Button variant="destructive" size="sm" className="rounded-xl" onClick={cancelRide}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* IN PROGRESS */}
        {rideStatus === "in_progress" && (
          <motion.div key="trip" initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-card rounded-t-[24px] shadow-2xl">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-semibold text-foreground">Em viagem</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {mockSpeed} km/h</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {tripTimeLeft} min</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <Progress value={tripProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Origem</span>
                  <span>{Math.round(tripProgress)}%</span>
                  <span>Destino</span>
                </div>
              </div>

              {/* Destination */}
              <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground truncate">{destination?.address}</span>
              </div>

              {/* Driver + SOS */}
              {mockDriver && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10"><AvatarImage src={mockDriver.photo} /><AvatarFallback className="bg-primary text-primary-foreground">{mockDriver.name[0]}</AvatarFallback></Avatar>
                    <div><p className="text-sm font-semibold text-foreground">{mockDriver.name}</p><p className="text-xs text-muted-foreground">{mockDriver.plate}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="rounded-full h-9 w-9" onClick={() => setShowChat(!showChat)}><MessageCircle className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" className="rounded-full h-9 w-9 border-destructive/50 text-destructive hover:bg-destructive/10"><Shield className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}

              {showChat && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {quickMessages.map((msg) => (
                      <button key={msg} onClick={() => sendQuickMessage(msg)} className="text-xs bg-muted/70 hover:bg-muted text-foreground px-3 py-1.5 rounded-full transition-colors">{msg}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* COMPLETED */}
        {rideStatus === "completed" && (
          <motion.div key="done" initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-card rounded-t-[24px] shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
            <div className="p-6 space-y-5">
              <div className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                  className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Star className="h-8 w-8 text-primary" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground">Corrida finalizada!</h3>
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Origem</span><span className="text-foreground truncate ml-4 max-w-[60%] text-right">{origin?.address}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Destino</span><span className="text-foreground truncate ml-4 max-w-[60%] text-right">{destination?.address}</span></div>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Distância</span><span className="text-foreground">{estimatedDistance.toFixed(1)} km</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Duração</span><span className="text-foreground">{estimatedDuration} min</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pagamento</span><span className="text-foreground">{paymentMethods.find((p) => p.id === selectedPayment)?.label}</span></div>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between text-base font-bold"><span className="text-foreground">Total</span><span className="text-primary">{formatPrice(currentRide?.final_price || getPrice(selectedRideType))}</span></div>
              </div>

              {/* Rating */}
              <div className="text-center space-y-3">
                <p className="text-sm font-semibold text-foreground">Avalie seu motorista{mockDriver ? ` - ${mockDriver.name}` : ""}</p>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)} className="p-1 transition-transform hover:scale-110">
                      <Star className={`h-9 w-9 ${s <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
                <Textarea placeholder="Deixe um comentário (opcional)" value={ratingComment} onChange={(e) => setRatingComment(e.target.value)}
                  className="text-sm resize-none h-20" />
              </div>

              <Button className="w-full h-12 rounded-xl text-base font-bold" onClick={submitRating}>
                Concluir e Avaliar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZuuMob;

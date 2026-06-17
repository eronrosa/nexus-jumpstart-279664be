import { useState, useEffect, useRef, useCallback } from "react";
import ZuuMobHome from "@/components/ZuuMobHome";
import TripDetailsSheet from "@/components/TripDetailsSheet";
import { useDriverGPSReceiver } from "@/hooks/useDriverGPS";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Navigation, Search, Star, Clock, Car, Bike, Crown,
  CreditCard, Wallet, QrCode, X, Locate, ArrowLeft, Phone,
  MessageCircle, History, Shield, Gauge
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
  { id: "comfort", name: "ZuuMob Comfort", icon: <Crown className="h-6 w-6" />, multiplier: 1.3, eta: "8 min", description: "Conforto premium", badge: "Premium" },
  { id: "moto", name: "ZuuMob Moto", icon: <Bike className="h-6 w-6" />, multiplier: 0.6, eta: "3 min", description: "Rápido e econômico", badge: "Mais rápido" },
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
  const [showPreview, setShowPreview] = useState(true);
  const dismissPreview = () => setShowPreview(false);
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

  // Real-time GPS tracking of driver on the map
  const activeDriverId = currentRide?.driver_id || null;
  useDriverGPSReceiver(activeDriverId, useCallback((lat: number, lng: number) => {
    if (mockDriverMarkerRef.current) {
      mockDriverMarkerRef.current.setLngLat([lng, lat]);
    }
  }, []));
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    if (!MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: origin ? [origin.lng, origin.lat] : [-53.4146, -27.2831], // Palmitinho - RS default
      zoom: 14,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo({ center: [longitude, latitude], zoom: 15 });
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:18px;height:18px;background:#00E676;border-radius:50%;border:3px solid white;box-shadow:0 0 0 0 rgba(0,230,118,0.4);animation:zm-pulse-ring 1.5s infinite"></div>`;
        userMarkerRef.current = new mapboxgl.Marker(el).setLngLat([longitude, latitude]).addTo(map);
        reverseGeocode(latitude, longitude).then((addr) => setOrigin({ lat: latitude, lng: longitude, address: addr }));
        addMockDriversToMap(latitude, longitude, map);
      },
      () => {
        const lat = -27.2831, lng = -53.4146; // Palmitinho - RS
        setOrigin({ lat, lng, address: "Palmitinho, RS" });

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
      const icon = d.type === "moto"
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 16l1-3h5l1 3"/><circle cx="5" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M12 16l2-5h4l2 5"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M5 17h14v-5l-2-4H7L5 12z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>`;
      el.innerHTML = `<div style="width:32px;height:32px;background:#161B22;border:1px solid rgba(10,10,10,0.08);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(0,230,118,0.15);animation:zm-float 3s ease-in-out infinite">${icon}</div>`;
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
    if (!query || query.length < 3) { setSuggestions([]); return; }
    if (!MAPBOX_TOKEN) {
      // Mock suggestions for testing when token is missing
      if (query.toLowerCase().includes("palmitinho")) {
        setSuggestions([{
          id: "mock-1",
          text: "Palmitinho",
          place_name: "Palmitinho, Rio Grande do Sul, Brasil",
          center: [-53.4146, -27.2831]
        }]);
      } else {
        setSuggestions([]);
      }
      return;
    }
    try {
      // Prioritize proximity to current origin
      const proximity = origin ? `&proximity=${origin.lng},${origin.lat}` : "";
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&language=pt&country=BR&limit=5${proximity}`);
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
    if (!MAPBOX_TOKEN) {
      // Mock route info
      setEstimatedDistance(5.2);
      setEstimatedDuration(12);
      setEstimatedPrice(5 + 5.2 * 2.5 + 12 * 0.3);
      return;
    }
    if (!mapRef.current) return;
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
          paint: { "line-color": "#00E676", "line-width": 4, "line-opacity": 0.85, "line-blur": 1 },
        });
      }
      new mapboxgl.Marker({ color: "#00E676" }).setLngLat([dest.lng, dest.lat]).addTo(map);
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
      passenger_id: user.id, 
      status: "searching",
      origin_lat: origin.lat, 
      origin_lng: origin.lng, 
      origin_address: origin.address,
      destination_lat: destination.lat, 
      destination_lng: destination.lng, 
      destination_address: destination.address,
      estimated_price: price, 
      distance_km: estimatedDistance, 
      duration_minutes: estimatedDuration,
      ride_type: selectedRideType, 
      payment_method: selectedPayment,
    }).select().single();

    if (error) {
      toast({ title: "Erro ao solicitar corrida", description: error.message, variant: "destructive" });
      setRideStatus("choosing_ride");
      setIsRequesting(false);
      return;
    }
    setCurrentRide(data);

    supabase.channel(`ride-${data.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${data.id}` }, (payload) => {
        const updated = payload.new as any;
        setCurrentRide(updated);
        if (updated.status === "completed") { setRideStatus("completed"); }
        else if (updated.status === "cancelled") { setRideStatus("idle"); toast({ title: "Corrida cancelada" }); }
      }).subscribe();

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

      if (mapRef.current && origin) {
        const el = document.createElement("div");
        const icon = chosen.type === "moto"
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7F8FA" stroke-width="2.5"><path d="M4 16l1-3h5l1 3"/><circle cx="5" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M12 16l2-5h4l2 5"/></svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7F8FA" stroke-width="2.5"><path d="M5 17h14v-5l-2-4H7L5 12z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>`;
        el.innerHTML = `<div style="width:40px;height:40px;background:#00E676;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(0,230,118,0.3);border:2px solid rgba(0,230,118,0.5)">${icon}</div>`;
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

    const totalMs = Math.min(estimatedDuration, 5) * 1000 * 3;
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

  const confettiParticles = showConfetti ? Array.from({ length: 40 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 0.5,
    color: ["#00E676", "#FFD600", "#FF4757", "#448AFF", "#E040FB"][i % 5],
  })) : [];

  return (
    <div className="zuumob-dark relative h-screen w-full overflow-hidden font-dm" style={{ backgroundColor: "#F7F8FA" }}>
      {showPreview && <ZuuMobHome onSearchOpen={dismissPreview} />}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes zm-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(0,230,118,0.4); } 70% { box-shadow: 0 0 0 15px rgba(0,230,118,0); } 100% { box-shadow: 0 0 0 0 rgba(0,230,118,0); } }
        @keyframes zm-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes zm-radar { 0% { transform: scale(0); opacity: 0.8; } 100% { transform: scale(3); opacity: 0; } }
        @keyframes zm-confetti-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
      ` }} />

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
          {confettiParticles.map((p) => (
            <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: "-5%", width: 10, height: 10, backgroundColor: p.color, borderRadius: p.id % 2 === 0 ? "50%" : "0", animation: `zm-confetti-fall 2.5s ${p.delay}s ease-in forwards` }} />
          ))}
        </div>
      )}

      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0 z-0" />
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 z-0 flex items-center justify-center" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="text-center p-6">
            <Car className="h-16 w-16 mx-auto mb-4" style={{ color: "#00E676" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>Configure VITE_MAPBOX_TOKEN para exibir o mapa</p>
            <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>A interface funciona normalmente sem o mapa</p>
          </div>
        </div>
      )}

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center gap-3">
          <button
            className="w-10 h-10 rounded-[14px] flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:border-zm-green/30"
            style={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(10,10,10,0.08)" }}
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: "#0A0A0A" }} />
          </button>
          <div
            className="flex-1 rounded-[14px] px-4 py-2.5 flex items-center gap-2 cursor-pointer backdrop-blur-md transition-all duration-200 hover:border-zm-green/30"
            style={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(10,10,10,0.08)" }}
            onClick={() => { if (rideStatus === "idle") { setRideStatus("selecting_destination"); } }}
          >
            <Search className="h-4 w-4" style={{ color: "#6B7280" }} />
            <span className="text-sm font-medium" style={{ color: "#6B7280" }}>{destination ? destination.address.substring(0, 30) + "..." : "Para onde?"}</span>
          </div>
          <div className="flex gap-2">
            <button
              className="w-10 h-10 rounded-[14px] flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:border-zm-green/30"
              style={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(10,10,10,0.08)" }}
              onClick={() => navigate("/zuumob/historico")}
            >
              <History className="h-4 w-4" style={{ color: "#0A0A0A" }} />
            </button>
            <Avatar
              className="h-9 w-9 cursor-pointer"
              style={{ border: "2px solid #00E676" }}
              onClick={() => navigate(user ? "/perfil" : "/auth")}
            >
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-xs font-semibold" style={{ backgroundColor: "#00E676", color: "#000000" }}>{profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        {/* ZuuMob logo */}
        <div className="mt-2 ml-1">
          <span className="font-syne text-lg font-bold" style={{ color: "#00E676" }}>ZuuMob</span>
        </div>
      </div>

      {/* Sou Motorista button */}
      {/* Botão de motorista flutuante */}
      {rideStatus === "idle" && (
        <button
          className="absolute top-24 right-4 z-10 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all duration-200 shadow-lg hover:scale-105"
          style={{ backgroundColor: "#00E676", color: "#000000" }}
          onClick={() => navigate("/motorista")}
        >
          <Car className="h-4 w-4" /> Painel do Motorista
        </button>
      )}

      {/* Center button */}
      <button
        className="absolute bottom-[320px] right-4 z-10 w-10 h-10 rounded-[14px] flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,230,118,0.15)]"
        style={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(10,10,10,0.08)" }}
        onClick={centerOnUser}
      >
        <Locate className="h-5 w-5" style={{ color: "#00E676" }} />
      </button>

      {/* Radar animation during searching */}
      {rideStatus === "searching" && origin && (
        <div className="absolute z-5 pointer-events-none" style={{ left: "50%", top: "40%", transform: "translate(-50%,-50%)" }}>
          {[0, 0.5, 1].map((d) => (
            <div key={d} style={{ position: "absolute", width: 60, height: 60, left: -30, top: -30, borderRadius: "50%", border: "2px solid #00E676", animation: `zm-radar 2s ${d}s ease-out infinite` }} />
          ))}
        </div>
      )}

      {/* Bottom Sheets */}
      <AnimatePresence mode="wait">
        {/* IDLE / SELECTING DESTINATION */}
        {(rideStatus === "idle" || rideStatus === "selecting_destination") && (
          <motion.div key="dest" initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[28px] shadow-2xl"
            style={{ backgroundColor: "#FFFFFF" }}>
            <div className="w-12 h-1.5 rounded-full mx-auto mt-3" style={{ backgroundColor: "#9CA3AF" }} />
            <div className="p-5 space-y-4">
              <h3 className="font-syne text-lg font-bold" style={{ color: "#0A0A0A" }}>Para onde você vai?</h3>
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: "#F1F3F5" }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#00E676" }} />
                <span className="text-sm truncate flex-1" style={{ color: "#0A0A0A" }}>{origin?.address || "Obtendo localização..."}</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: "#F1F3F5" }}>
                <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: "#FF4757" }} />
                <input
                  placeholder="Buscar destino..."
                  value={destinationQuery}
                  onChange={(e) => searchDestination(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-sm font-dm placeholder:text-[#9CA3AF]"
                  style={{ color: "#0A0A0A" }}
                />
                {destinationQuery && <X className="h-4 w-4 cursor-pointer" style={{ color: "#6B7280" }} onClick={() => { setDestinationQuery(""); setSuggestions([]); }} />}
              </div>
              {suggestions.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {suggestions.map((s: any) => (
                    <button key={s.id} className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 hover:border-[rgba(0,230,118,0.3)]"
                      style={{ border: "1px solid transparent" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F1F3F5"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.3)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                      onClick={() => selectDestination(s)}>
                      <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: "#6B7280" }} />
                      <div className="truncate">
                        <p className="text-sm font-medium truncate" style={{ color: "#0A0A0A" }}>{s.text}</p>
                        <p className="text-xs truncate" style={{ color: "#6B7280" }}>{s.place_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {suggestions.length === 0 && !destinationQuery && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Favoritos</p>
                  {[{ icon: Navigation, label: "Casa" }, { icon: MapPin, label: "Trabalho" }].map((f) => (
                    <button key={f.label} className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200"
                      style={{ border: "1px solid transparent" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F1F3F5"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.3)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,230,118,0.1)" }}>
                        <f.icon className="h-4 w-4" style={{ color: "#00E676" }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#0A0A0A" }}>{f.label}</p>
                        <p className="text-xs" style={{ color: "#6B7280" }}>Adicionar endereço</p>
                      </div>
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
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[28px] shadow-2xl"
            style={{ backgroundColor: "#FFFFFF" }}>
            <div className="w-12 h-1.5 rounded-full mx-auto mt-3" style={{ backgroundColor: "#9CA3AF" }} />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "#6B7280" }}>Distância</p>
                  <p className="font-syne font-bold" style={{ color: "#0A0A0A" }}><span className="font-mono-jb">{estimatedDistance.toFixed(1)}</span> km</p>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: "#6B7280" }}>Tempo estimado</p>
                  <p className="font-syne font-bold" style={{ color: "#0A0A0A" }}><span className="font-mono-jb">{estimatedDuration}</span> min</p>
                </div>
              </div>
              <div className="space-y-2">
                {rideTypes.map((rt) => (
                  <button key={rt.id} onClick={() => setSelectedRideType(rt.id)}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl transition-all duration-200"
                    style={{
                      backgroundColor: selectedRideType === rt.id ? "rgba(0,230,118,0.05)" : "#F1F3F5",
                      border: `2px solid ${selectedRideType === rt.id ? "rgba(0,230,118,0.3)" : "transparent"}`,
                      boxShadow: selectedRideType === rt.id ? "0 0 24px rgba(0,230,118,0.15)" : "none",
                    }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: selectedRideType === rt.id ? "#00E676" : "#FFFFFF", color: selectedRideType === rt.id ? "#000000" : "#0A0A0A" }}>{rt.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>{rt.name}</p>
                        {"badge" in rt && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: "rgba(0,230,118,0.1)", color: "#00E676" }}>{(rt as any).badge}</span>}
                      </div>
                      <p className="text-xs" style={{ color: "#6B7280" }}>{rt.description} · <Clock className="inline h-3 w-3" /> <span className="font-mono-jb">{rt.eta}</span></p>
                    </div>
                    <p className="font-mono-jb font-semibold" style={{ color: selectedRideType === rt.id ? "#00E676" : "#0A0A0A" }}>{formatPrice(getPrice(rt.id))}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {paymentMethods.map((pm) => (
                  <button key={pm.id} onClick={() => setSelectedPayment(pm.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: selectedPayment === pm.id ? "#00E676" : "#F1F3F5",
                      color: selectedPayment === pm.id ? "#000000" : "#6B7280",
                      border: `1px solid ${selectedPayment === pm.id ? "#00E676" : "rgba(10,10,10,0.08)"}`,
                    }}>
                    {pm.icon}{pm.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-200"
                  style={{ backgroundColor: "#F1F3F5", border: "1px solid rgba(10,10,10,0.08)", color: "#0A0A0A" }}
                  onClick={() => { setRideStatus("idle"); setDestination(null); setDestinationQuery(""); }}
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  className="flex-1 h-12 rounded-[14px] text-base font-semibold font-dm flex items-center justify-center transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,230,118,0.2)]"
                  style={{ backgroundColor: "#00E676", color: "#000000" }}
                  onClick={requestRide}
                  disabled={isRequesting}
                >
                  {isRequesting ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : `Solicitar ZuuMob · ${formatPrice(getPrice(selectedRideType))}`}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SEARCHING */}
        {rideStatus === "searching" && (
          <motion.div key="search" initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[28px] shadow-2xl"
            style={{ backgroundColor: "#FFFFFF" }}>
            <div className="w-12 h-1.5 rounded-full mx-auto mt-3" style={{ backgroundColor: "#9CA3AF" }} />
            <div className="p-6 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <motion.div className="absolute inset-0 rounded-full" style={{ backgroundColor: "rgba(0,230,118,0.1)" }} animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Car className="h-10 w-10" style={{ color: "#00E676" }} />
                  </motion.div>
                </div>
              </div>
              <div>
                <h3 className="font-syne text-lg font-bold" style={{ color: "#0A0A0A" }}>Procurando seu motorista...</h3>
                <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Conectando você ao motorista mais próximo</p>
              </div>
              <motion.div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F3F5" }}>
                <motion.div className="h-full rounded-full" style={{ width: "40%", backgroundColor: "#00E676" }} animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
              </motion.div>
              <button
                className="w-full py-2.5 rounded-[14px] text-sm font-semibold font-dm transition-all duration-200"
                style={{ backgroundColor: "#FF4757", color: "#0A0A0A" }}
                onClick={cancelRide}
              >
                Cancelar corrida
              </button>
            </div>
          </motion.div>
        )}

        {/* ACCEPTED / ARRIVING */}
        {(rideStatus === "accepted" || rideStatus === "arriving") && mockDriver && (
          <motion.div key="found" initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[28px] shadow-2xl"
            style={{ backgroundColor: "#FFFFFF" }}>
            <div className="w-12 h-1.5 rounded-full mx-auto mt-3" style={{ backgroundColor: "#9CA3AF" }} />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${rideStatus === "arriving" ? "animate-pulse" : ""}`} style={{ backgroundColor: "#00E676" }} />
                <span className="text-sm font-semibold font-dm" style={{ color: "#0A0A0A" }}>
                  {rideStatus === "accepted" ? `Motorista a caminho · ${driverEta} min` : "Motorista chegando!"}
                </span>
              </div>

              {/* Driver card */}
              <div className="flex items-center gap-4 rounded-xl p-4" style={{ backgroundColor: "#F1F3F5", border: "1px solid rgba(10,10,10,0.08)" }}>
                <Avatar className="h-14 w-14" style={{ border: "2px solid #00E676" }}>
                  <AvatarImage src={mockDriver.photo} />
                  <AvatarFallback style={{ backgroundColor: "#00E676", color: "#000" }}>{mockDriver.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold font-dm" style={{ color: "#0A0A0A" }}>{mockDriver.name}</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>{mockDriver.vehicle} {mockDriver.color}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /><span className="text-xs font-mono-jb font-semibold" style={{ color: "#0A0A0A" }}>{mockDriver.rating}</span></div>
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>·</span>
                    <span className="text-xs font-mono-jb" style={{ color: "#6B7280" }}>{mockDriver.totalRides} corridas</span>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.2)" }}>
                  <p className="text-sm font-mono-jb font-bold" style={{ color: "#00E676" }}>{mockDriver.plate}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-[14px] flex items-center justify-center gap-1.5 text-sm font-semibold transition-all duration-200"
                  style={{ backgroundColor: "#F1F3F5", border: "1px solid rgba(10,10,10,0.08)", color: "#0A0A0A" }}
                  onClick={() => toast({ title: "Ligando para motorista..." })}>
                  <Phone className="h-4 w-4" style={{ color: "#00E676" }} /> Ligar
                </button>
                <button className="flex-1 py-2.5 rounded-[14px] flex items-center justify-center gap-1.5 text-sm font-semibold transition-all duration-200"
                  style={{ backgroundColor: "#F1F3F5", border: "1px solid rgba(10,10,10,0.08)", color: "#0A0A0A" }}
                  onClick={() => setShowChat(!showChat)}>
                  <MessageCircle className="h-4 w-4" style={{ color: "#00E676" }} /> Chat
                </button>
              </div>

              {/* Quick chat */}
              {showChat && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-2">
                  {chatMessages.length > 0 && (
                    <div className="max-h-24 overflow-y-auto space-y-1">
                      {chatMessages.map((m, i) => (
                        <div key={i} className={`text-xs px-3 py-1.5 rounded-lg max-w-[70%] font-dm ${m.from === "you" ? "ml-auto" : ""}`}
                          style={{ backgroundColor: m.from === "you" ? "#00E676" : "#F1F3F5", color: m.from === "you" ? "#000000" : "#0A0A0A" }}>{m.text}</div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {quickMessages.map((msg) => (
                      <button key={msg} onClick={() => sendQuickMessage(msg)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all duration-200"
                        style={{ backgroundColor: "#F1F3F5", color: "#0A0A0A", border: "1px solid rgba(10,10,10,0.08)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,118,0.3)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(10,10,10,0.08)"; }}
                      >{msg}</button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Route summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#00E676" }} /><span className="text-sm truncate" style={{ color: "#0A0A0A" }}>{origin?.address}</span></div>
                <div className="ml-1.5 h-4" style={{ borderLeft: "2px dashed #484F58" }} />
                <div className="flex items-center gap-3"><MapPin className="h-3 w-3" style={{ color: "#FF4757" }} /><span className="text-sm truncate" style={{ color: "#0A0A0A" }}>{destination?.address}</span></div>
              </div>

              <div className="flex gap-2">
                {rideStatus === "arriving" && (
                  <button className="flex-1 h-12 rounded-[14px] font-semibold font-dm transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,230,118,0.2)]"
                    style={{ backgroundColor: "#00E676", color: "#000000" }}
                    onClick={startTrip}>Iniciar viagem</button>
                )}
                <button className="px-4 h-10 rounded-[14px] text-sm font-semibold font-dm flex items-center gap-1 transition-all duration-200"
                  style={{ backgroundColor: "rgba(255,71,87,0.1)", color: "#FF4757", border: "1px solid rgba(255,71,87,0.2)" }}
                  onClick={cancelRide}>
                  <X className="h-4 w-4" /> Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* IN PROGRESS */}
        {rideStatus === "in_progress" && (
          <motion.div key="trip" initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[28px] shadow-2xl"
            style={{ backgroundColor: "#FFFFFF" }}>
            <div className="w-12 h-1.5 rounded-full mx-auto mt-3" style={{ backgroundColor: "#9CA3AF" }} />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#00E676" }} />
                  <span className="text-sm font-syne font-bold" style={{ color: "#0A0A0A" }}>Em viagem</span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: "#6B7280" }}>
                  <span className="flex items-center gap-1 font-mono-jb"><Gauge className="h-3 w-3" /> {mockSpeed} km/h</span>
                  <span className="flex items-center gap-1 font-mono-jb"><Clock className="h-3 w-3" /> {tripTimeLeft} min</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F3F5" }}>
                  <div className="h-full rounded-full transition-all duration-200" style={{ width: `${tripProgress}%`, backgroundColor: "#00E676", boxShadow: "0 0 12px rgba(0,230,118,0.3)" }} />
                </div>
                <div className="flex justify-between text-xs font-mono-jb" style={{ color: "#6B7280" }}>
                  <span>Origem</span>
                  <span>{Math.round(tripProgress)}%</span>
                  <span>Destino</span>
                </div>
              </div>

              {/* Destination */}
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: "#F1F3F5", border: "1px solid rgba(10,10,10,0.08)" }}>
                <MapPin className="h-4 w-4" style={{ color: "#00E676" }} />
                <span className="text-sm truncate" style={{ color: "#0A0A0A" }}>{destination?.address}</span>
              </div>

              {/* Driver + SOS */}
              {mockDriver && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10" style={{ border: "2px solid #00E676" }}>
                      <AvatarImage src={mockDriver.photo} />
                      <AvatarFallback style={{ backgroundColor: "#00E676", color: "#000" }}>{mockDriver.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>{mockDriver.name}</p>
                      <p className="text-xs font-mono-jb" style={{ color: "#6B7280" }}>{mockDriver.plate}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                      style={{ backgroundColor: "#F1F3F5", border: "1px solid rgba(10,10,10,0.08)" }}
                      onClick={() => setShowChat(!showChat)}>
                      <MessageCircle className="h-4 w-4" style={{ color: "#0A0A0A" }} />
                    </button>
                    <button className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                      style={{ backgroundColor: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.2)" }}>
                      <Shield className="h-4 w-4" style={{ color: "#FF4757" }} />
                    </button>
                  </div>
                </div>
              )}

              {showChat && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {quickMessages.map((msg) => (
                      <button key={msg} onClick={() => sendQuickMessage(msg)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all duration-200"
                        style={{ backgroundColor: "#F1F3F5", color: "#0A0A0A", border: "1px solid rgba(10,10,10,0.08)" }}>{msg}</button>
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
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[28px] shadow-2xl max-h-[85vh] overflow-y-auto"
            style={{ backgroundColor: "#FFFFFF" }}>
            <div className="w-12 h-1.5 rounded-full mx-auto mt-3" style={{ backgroundColor: "#9CA3AF" }} />
            <div className="p-6 space-y-5">
              <div className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: "rgba(0,230,118,0.1)" }}>
                  <Star className="h-8 w-8" style={{ color: "#00E676" }} />
                </motion.div>
                <h3 className="font-syne text-xl font-bold" style={{ color: "#0A0A0A" }}>Corrida finalizada!</h3>
              </div>

              {/* Summary */}
              <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: "#F1F3F5", border: "1px solid rgba(10,10,10,0.08)" }}>
                <div className="flex justify-between text-sm"><span style={{ color: "#6B7280" }}>Origem</span><span className="truncate ml-4 max-w-[60%] text-right" style={{ color: "#0A0A0A" }}>{origin?.address}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: "#6B7280" }}>Destino</span><span className="truncate ml-4 max-w-[60%] text-right" style={{ color: "#0A0A0A" }}>{destination?.address}</span></div>
                <div className="my-2" style={{ borderTop: "1px solid rgba(10,10,10,0.08)" }} />
                <div className="flex justify-between text-sm"><span style={{ color: "#6B7280" }}>Distância</span><span className="font-mono-jb" style={{ color: "#0A0A0A" }}>{estimatedDistance.toFixed(1)} km</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: "#6B7280" }}>Duração</span><span className="font-mono-jb" style={{ color: "#0A0A0A" }}>{estimatedDuration} min</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: "#6B7280" }}>Pagamento</span><span style={{ color: "#0A0A0A" }}>{paymentMethods.find((p) => p.id === selectedPayment)?.label}</span></div>
                <div className="my-2" style={{ borderTop: "1px solid rgba(10,10,10,0.08)" }} />
                <div className="flex justify-between text-base font-bold"><span style={{ color: "#0A0A0A" }}>Total</span><span className="font-mono-jb" style={{ color: "#00E676" }}>{formatPrice(currentRide?.final_price || getPrice(selectedRideType))}</span></div>
              </div>

              {/* Rating */}
              <div className="text-center space-y-3">
                <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>Avalie seu motorista{mockDriver ? ` - ${mockDriver.name}` : ""}</p>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)} className="p-1 transition-transform hover:scale-110">
                      <Star className={`h-9 w-9 ${s <= rating ? "fill-yellow-500 text-yellow-500" : ""}`} style={s > rating ? { color: "#9CA3AF" } : {}} />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Deixe um comentário (opcional)"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full text-sm resize-none h-20 rounded-xl p-3 outline-none focus:shadow-[0_0_0_1px_rgba(0,230,118,0.3)] font-dm placeholder:text-[#9CA3AF]"
                  style={{ backgroundColor: "#F1F3F5", border: "1px solid rgba(10,10,10,0.08)", color: "#0A0A0A" }}
                />
              </div>

              <button
                className="w-full h-12 rounded-[14px] text-base font-semibold font-dm transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,230,118,0.2)]"
                style={{ backgroundColor: "#00E676", color: "#000000" }}
                onClick={submitRating}
              >
                Concluir e Avaliar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZuuMob;

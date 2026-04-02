import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Search, Star, Clock, Car, Bike, Crown, CreditCard, Wallet, QrCode, X, ChevronUp, ChevronDown, Locate, ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

type RideStatus = "idle" | "selecting_destination" | "choosing_ride" | "searching" | "accepted" | "arriving" | "in_progress" | "completed";

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface RideType {
  id: string;
  name: string;
  icon: React.ReactNode;
  multiplier: number;
  eta: string;
  description: string;
}

const rideTypes: RideType[] = [
  { id: "standard", name: "ZuuMob Standard", icon: <Car className="h-6 w-6" />, multiplier: 1, eta: "5 min", description: "Viagem acessível" },
  { id: "comfort", name: "ZuuMob Comfort", icon: <Crown className="h-6 w-6" />, multiplier: 1.3, eta: "8 min", description: "Conforto premium" },
  { id: "moto", name: "ZuuMob Moto", icon: <Bike className="h-6 w-6" />, multiplier: 0.6, eta: "3 min", description: "Rápido e econômico" },
];

const paymentMethods = [
  { id: "pix", label: "PIX", icon: <QrCode className="h-4 w-4" /> },
  { id: "card", label: "Cartão", icon: <CreditCard className="h-4 w-4" /> },
  { id: "wallet", label: "Saldo Zuuppi", icon: <Wallet className="h-4 w-4" /> },
];

const ZuuMob = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

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
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [driverInfo, setDriverInfo] = useState<any>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    if (!MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-43.1729, -22.9068], // Rio de Janeiro default
      zoom: 14,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    // Get user location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo({ center: [longitude, latitude], zoom: 15 });

        // User marker with pulse
        const el = document.createElement("div");
        el.className = "user-location-marker";
        el.innerHTML = `
          <div style="width:18px;height:18px;background:hsl(122,39%,42%);border-radius:50%;border:3px solid white;box-shadow:0 0 0 0 rgba(76,175,80,0.4);animation:pulse-ring 1.5s infinite"></div>
        `;
        userMarkerRef.current = new mapboxgl.Marker(el).setLngLat([longitude, latitude]).addTo(map);

        reverseGeocode(latitude, longitude).then((addr) => {
          setOrigin({ lat: latitude, lng: longitude, address: addr });
        });
      },
      () => {
        setOrigin({ lat: -22.9068, lng: -43.1729, address: "Rio de Janeiro, RJ" });
      }
    );

    return () => map.remove();
  }, []);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    if (!MAPBOX_TOKEN) return "Localização atual";
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=pt`);
      const data = await res.json();
      return data.features?.[0]?.place_name || "Localização atual";
    } catch {
      return "Localização atual";
    }
  };

  const searchDestination = useCallback(async (query: string) => {
    setDestinationQuery(query);
    if (!query || query.length < 3 || !MAPBOX_TOKEN) {
      setSuggestions([]);
      return;
    }
    try {
      const center = origin ? `${origin.lng},${origin.lat}` : "-43.1729,-22.9068";
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&language=pt&country=BR&proximity=${center}&limit=5`);
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch {
      setSuggestions([]);
    }
  }, [origin]);

  const selectDestination = (feature: any) => {
    const [lng, lat] = feature.center;
    const dest: Location = { lat, lng, address: feature.place_name };
    setDestination(dest);
    setDestinationQuery(feature.place_name);
    setSuggestions([]);
    setRideStatus("choosing_ride");

    if (origin) {
      calculateRoute(origin, dest);
    }
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

      // Base price calculation
      const basePrice = 5 + distKm * 2.5 + durMin * 0.3;
      setEstimatedPrice(basePrice);

      // Draw route on map
      const map = mapRef.current;
      if (map.getSource("route")) {
        (map.getSource("route") as mapboxgl.GeoJSONSource).setData(route.geometry);
      } else {
        map.addLayer({
          id: "route",
          type: "line",
          source: { type: "geojson", data: route.geometry },
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#4CAF50", "line-width": 5, "line-opacity": 0.8 },
        });
      }

      // Add destination marker
      new mapboxgl.Marker({ color: "#4CAF50" }).setLngLat([dest.lng, dest.lat]).addTo(map);

      // Fit bounds
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([orig.lng, orig.lat]);
      bounds.extend([dest.lng, dest.lat]);
      map.fitBounds(bounds, { padding: 100 });
    } catch (err) {
      console.error("Route error:", err);
    }
  };

  const getPrice = (type: string) => {
    const rt = rideTypes.find((r) => r.id === type);
    return estimatedPrice * (rt?.multiplier || 1);
  };

  const requestRide = async () => {
    if (!user || !origin || !destination) {
      toast({ title: "Erro", description: "Faça login e selecione origem/destino", variant: "destructive" });
      return;
    }

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
      return;
    }

    setCurrentRide(data);

    // Subscribe to ride updates
    const channel = supabase
      .channel(`ride-${data.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${data.id}` }, (payload) => {
        const updated = payload.new as any;
        setCurrentRide(updated);
        if (updated.status === "accepted") {
          setRideStatus("accepted");
          loadDriverInfo(updated.driver_id);
        } else if (updated.status === "arriving") {
          setRideStatus("arriving");
        } else if (updated.status === "in_progress") {
          setRideStatus("in_progress");
        } else if (updated.status === "completed") {
          setRideStatus("completed");
        } else if (updated.status === "cancelled") {
          setRideStatus("idle");
          toast({ title: "Corrida cancelada" });
        }
      })
      .subscribe();

    // Simulate driver acceptance after 5s for demo
    setTimeout(async () => {
      // In production, a real driver would accept
    }, 5000);
  };

  const loadDriverInfo = async (driverId: string) => {
    // driver_id on rides is the user_id, so we query drivers by user_id
    const { data } = await supabase.from("drivers").select("*").eq("user_id", driverId).single();
    if (data) setDriverInfo(data);
  };

  const cancelRide = async () => {
    if (!currentRide) return;
    await supabase.from("rides").update({ status: "cancelled" }).eq("id", currentRide.id);
    setRideStatus("idle");
    setCurrentRide(null);
    setDestination(null);
    setDestinationQuery("");
  };

  const centerOnUser = () => {
    if (origin && mapRef.current) {
      mapRef.current.flyTo({ center: [origin.lng, origin.lat], zoom: 15 });
    }
  };

  const formatPrice = (val: number) => `R$ ${val.toFixed(2).replace(".", ",")}`;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Pulse animation style */}
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(76,175,80,0.4); }
          70% { box-shadow: 0 0 0 15px rgba(76,175,80,0); }
          100% { box-shadow: 0 0 0 0 rgba(76,175,80,0); }
        }
      `}</style>

      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* No token fallback */}
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 z-0 bg-muted flex items-center justify-center">
          <div className="text-center p-6">
            <Car className="h-16 w-16 mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground text-sm">Configure VITE_MAPBOX_TOKEN para exibir o mapa</p>
          </div>
        </div>
      )}

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="bg-card/90 backdrop-blur-sm shadow-lg rounded-full" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 bg-card/90 backdrop-blur-sm shadow-lg rounded-full px-4 py-2.5 flex items-center gap-2 cursor-pointer" onClick={() => { setRideStatus("selecting_destination"); setSheetExpanded(true); }}>
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Para onde?</span>
          </div>
          <Avatar className="h-9 w-9 border-2 border-primary shadow-lg cursor-pointer" onClick={() => navigate(user ? "/perfil" : "/auth")}>
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Center button */}
      <Button variant="ghost" size="icon" className="absolute bottom-[320px] right-4 z-10 bg-card/90 backdrop-blur-sm shadow-lg rounded-full" onClick={centerOnUser}>
        <Locate className="h-5 w-5 text-primary" />
      </Button>

      {/* Bottom Sheet */}
      <AnimatePresence mode="wait">
        {/* IDLE / SELECTING DESTINATION */}
        {(rideStatus === "idle" || rideStatus === "selecting_destination") && (
          <motion.div
            key="destination-sheet"
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-card rounded-t-3xl shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Para onde você vai?</h3>

              {/* Origin */}
              <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-foreground truncate flex-1">{origin?.address || "Obtendo localização..."}</span>
              </div>

              {/* Destination input */}
              <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                <MapPin className="h-4 w-4 text-destructive flex-shrink-0" />
                <Input
                  placeholder="Buscar destino..."
                  value={destinationQuery}
                  onChange={(e) => searchDestination(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
                />
                {destinationQuery && (
                  <X className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => { setDestinationQuery(""); setSuggestions([]); }} />
                )}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {suggestions.map((s: any) => (
                    <button key={s.id} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/70 flex items-center gap-3 transition-colors" onClick={() => selectDestination(s)}>
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-medium text-foreground truncate">{s.text}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.place_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Recent / Favorites placeholder */}
              {suggestions.length === 0 && !destinationQuery && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Favoritos</p>
                  <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/70 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Navigation className="h-4 w-4 text-primary" /></div>
                    <div><p className="text-sm font-medium text-foreground">Casa</p><p className="text-xs text-muted-foreground">Adicionar endereço</p></div>
                  </button>
                  <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/70 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><MapPin className="h-4 w-4 text-primary" /></div>
                    <div><p className="text-sm font-medium text-foreground">Trabalho</p><p className="text-xs text-muted-foreground">Adicionar endereço</p></div>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CHOOSING RIDE TYPE */}
        {rideStatus === "choosing_ride" && destination && (
          <motion.div
            key="ride-type-sheet"
            initial={{ y: 400 }}
            animate={{ y: 0 }}
            exit={{ y: 400 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-card rounded-t-3xl shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
            <div className="p-5 space-y-4">
              {/* Route info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Distância</p>
                  <p className="font-bold text-foreground">{estimatedDistance.toFixed(1)} km</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tempo estimado</p>
                  <p className="font-bold text-foreground">{estimatedDuration} min</p>
                </div>
              </div>

              {/* Ride type cards */}
              <div className="space-y-2">
                {rideTypes.map((rt) => (
                  <button
                    key={rt.id}
                    onClick={() => setSelectedRideType(rt.id)}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all ${
                      selectedRideType === rt.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50 hover:bg-muted/70"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedRideType === rt.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {rt.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground text-sm">{rt.name}</p>
                      <p className="text-xs text-muted-foreground">{rt.description} · <Clock className="inline h-3 w-3" /> {rt.eta}</p>
                    </div>
                    <p className="font-bold text-foreground">{formatPrice(getPrice(rt.id))}</p>
                  </button>
                ))}
              </div>

              {/* Payment method */}
              <div className="flex gap-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setSelectedPayment(pm.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedPayment === pm.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {pm.icon}
                    {pm.label}
                  </button>
                ))}
              </div>

              {/* Request button */}
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => { setRideStatus("idle"); setDestination(null); setDestinationQuery(""); }}>
                  <X className="h-4 w-4" />
                </Button>
                <Button className="flex-1 h-12 rounded-xl text-base font-bold" onClick={requestRide}>
                  Solicitar ZuuMob · {formatPrice(getPrice(selectedRideType))}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SEARCHING FOR DRIVER */}
        {rideStatus === "searching" && (
          <motion.div
            key="searching-sheet"
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-card rounded-t-3xl shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                  <Search className="h-8 w-8 text-primary" />
                </motion.div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Procurando motorista...</h3>
                <p className="text-sm text-muted-foreground mt-1">Aguarde enquanto encontramos o motorista ideal</p>
              </div>
              <Button variant="outline" className="rounded-xl" onClick={cancelRide}>
                Cancelar corrida
              </Button>
            </div>
          </motion.div>
        )}

        {/* ACCEPTED / ARRIVING / IN PROGRESS */}
        {(rideStatus === "accepted" || rideStatus === "arriving" || rideStatus === "in_progress") && (
          <motion.div
            key="ride-active-sheet"
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-card rounded-t-3xl shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
            <div className="p-5 space-y-4">
              {/* Status bar */}
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${rideStatus === "in_progress" ? "bg-primary animate-pulse" : "bg-primary"}`} />
                <span className="text-sm font-semibold text-foreground">
                  {rideStatus === "accepted" && "Motorista a caminho"}
                  {rideStatus === "arriving" && "Motorista chegando"}
                  {rideStatus === "in_progress" && "Em viagem"}
                </span>
              </div>

              {/* Driver info */}
              {driverInfo && (
                <div className="flex items-center gap-4 bg-muted/50 rounded-xl p-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={driverInfo.photo_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">{driverInfo.full_name?.[0] || "M"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{driverInfo.full_name || "Motorista"}</p>
                    <p className="text-xs text-muted-foreground">{driverInfo.vehicle_brand} {driverInfo.vehicle_model} · {driverInfo.vehicle_plate}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs text-foreground">{Number(driverInfo.rating).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="rounded-full h-10 w-10">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="rounded-full h-10 w-10">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Route summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm text-foreground truncate">{origin?.address}</span>
                </div>
                <div className="ml-1.5 border-l-2 border-dashed border-muted-foreground/30 h-4" />
                <div className="flex items-center gap-3">
                  <MapPin className="h-3 w-3 text-destructive" />
                  <span className="text-sm text-foreground truncate">{destination?.address}</span>
                </div>
              </div>

              {rideStatus !== "in_progress" && (
                <Button variant="outline" className="w-full rounded-xl" onClick={cancelRide}>
                  Cancelar corrida
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* COMPLETED */}
        {rideStatus === "completed" && (
          <motion.div
            key="completed-sheet"
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-card rounded-t-3xl shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Corrida finalizada!</h3>
              <p className="text-sm text-muted-foreground">
                {formatPrice(currentRide?.final_price || getPrice(selectedRideType))}
              </p>
              {/* Rating */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className="p-1">
                    <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                  </button>
                ))}
              </div>
              <Button className="w-full rounded-xl" onClick={() => { setRideStatus("idle"); setCurrentRide(null); setDestination(null); setDestinationQuery(""); }}>
                Fechar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZuuMob;

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sends the driver's GPS location to Supabase every 3 seconds.
 * Updates both `drivers.current_lat/lng` and upserts into `driver_locations`.
 */
export function useDriverGPSSender(
  driverId: string | null,
  isActive: boolean // true when driver is online or busy
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<number | null>(null);
  const latestPos = useRef<{ lat: number; lng: number; heading: number | null }>({
    lat: 0,
    lng: 0,
    heading: null,
  });

  const sendLocation = useCallback(async () => {
    if (!driverId) return;
    const { lat, lng, heading } = latestPos.current;
    if (lat === 0 && lng === 0) return;

    // Update drivers table (for quick access)
    await supabase
      .from("drivers")
      .update({ current_lat: lat, current_lng: lng })
      .eq("id", driverId);

    // Upsert driver_locations for realtime subscribers
    await supabase.from("driver_locations").upsert(
      {
        driver_id: driverId,
        lat,
        lng,
        heading,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "driver_id" }
    );
  }, [driverId]);

  useEffect(() => {
    if (!isActive || !driverId) {
      // Cleanup
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      intervalRef.current = null;
      watchRef.current = null;
      return;
    }

    // Watch GPS position continuously
    if ("geolocation" in navigator) {
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          latestPos.current = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading,
          };
        },
        (err) => console.warn("GPS error:", err.message),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
      );
    }

    // Send every 3 seconds
    sendLocation(); // immediate first send
    intervalRef.current = setInterval(sendLocation, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      intervalRef.current = null;
      watchRef.current = null;
    };
  }, [isActive, driverId, sendLocation]);
}

/**
 * Subscribes to a specific driver's location updates in real-time.
 * Returns the latest location via the callback.
 */
export function useDriverGPSReceiver(
  driverId: string | null,
  onLocationUpdate: (lat: number, lng: number, heading: number | null) => void
) {
  const callbackRef = useRef(onLocationUpdate);
  callbackRef.current = onLocationUpdate;

  useEffect(() => {
    if (!driverId) return;

    const channel = supabase
      .channel(`driver-gps-${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driver_locations",
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const loc = payload.new as any;
          if (loc?.lat && loc?.lng) {
            callbackRef.current(loc.lat, loc.lng, loc.heading);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "drivers",
          filter: `id=eq.${driverId}`,
        },
        (payload) => {
          const d = payload.new as any;
          if (d?.current_lat && d?.current_lng) {
            callbackRef.current(d.current_lat, d.current_lng, null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);
}


-- Motoristas
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text,
  cpf text,
  cnh text,
  phone text,
  photo_url text,
  vehicle_brand text,
  vehicle_model text,
  vehicle_year int,
  vehicle_plate text,
  vehicle_color text,
  vehicle_type text DEFAULT 'car',
  status text DEFAULT 'offline',
  current_lat float,
  current_lng float,
  rating decimal DEFAULT 5.0,
  total_rides int DEFAULT 0,
  total_earnings decimal DEFAULT 0,
  is_approved boolean DEFAULT false,
  bank_account text,
  pix_key text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers view own profile" ON public.drivers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Drivers insert own profile" ON public.drivers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Drivers update own profile" ON public.drivers FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Public view online drivers" ON public.drivers FOR SELECT TO anon USING (status = 'online');
CREATE POLICY "Authenticated view online drivers" ON public.drivers FOR SELECT TO authenticated USING (status IN ('online', 'busy'));

-- Corridas
CREATE TABLE public.rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid NOT NULL,
  driver_id uuid,
  status text DEFAULT 'searching',
  origin_lat float,
  origin_lng float,
  origin_address text,
  destination_lat float,
  destination_lng float,
  destination_address text,
  estimated_price decimal,
  final_price decimal,
  distance_km float,
  duration_minutes int,
  ride_type text DEFAULT 'standard',
  payment_method text DEFAULT 'pix',
  rating_passenger int,
  rating_driver int,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passengers view own rides" ON public.rides FOR SELECT TO authenticated USING (passenger_id = auth.uid());
CREATE POLICY "Passengers create rides" ON public.rides FOR INSERT TO authenticated WITH CHECK (passenger_id = auth.uid());
CREATE POLICY "Passengers update own rides" ON public.rides FOR UPDATE TO authenticated USING (passenger_id = auth.uid());
CREATE POLICY "Drivers view assigned rides" ON public.rides FOR SELECT TO authenticated USING (driver_id = auth.uid());
CREATE POLICY "Drivers update assigned rides" ON public.rides FOR UPDATE TO authenticated USING (driver_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;

-- Localização em tempo real
CREATE TABLE public.driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  lat float NOT NULL,
  lng float NOT NULL,
  heading float,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view driver locations" ON public.driver_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers update own location" ON public.driver_locations FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.drivers WHERE drivers.id = driver_locations.driver_id AND drivers.user_id = auth.uid())
);
CREATE POLICY "Drivers update location" ON public.driver_locations FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.drivers WHERE drivers.id = driver_locations.driver_id AND drivers.user_id = auth.uid())
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

-- Avaliações de corrida
CREATE TABLE public.ride_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  rating int NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ride_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ratings" ON public.ride_ratings FOR SELECT TO authenticated USING (from_user = auth.uid() OR to_user = auth.uid());
CREATE POLICY "Users insert ratings" ON public.ride_ratings FOR INSERT TO authenticated WITH CHECK (from_user = auth.uid());

-- Ganhos do motorista
CREATE TABLE public.driver_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  gross_amount decimal NOT NULL,
  platform_fee decimal NOT NULL DEFAULT 0,
  net_amount decimal NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers view own earnings" ON public.driver_earnings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.drivers WHERE drivers.id = driver_earnings.driver_id AND drivers.user_id = auth.uid())
);

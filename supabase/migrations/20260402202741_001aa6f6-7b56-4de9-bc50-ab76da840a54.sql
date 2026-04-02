
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  radius_km NUMERIC NOT NULL DEFAULT 5,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  min_order NUMERIC NOT NULL DEFAULT 0,
  estimated_time TEXT NOT NULL DEFAULT '60 min',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Public/anon can view active zones of active stores
CREATE POLICY "Public view active delivery zones"
  ON public.delivery_zones FOR SELECT TO anon
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.stores WHERE stores.id = delivery_zones.store_id AND stores.is_active = true
  ));

-- Authenticated users can view active zones
CREATE POLICY "Authenticated view active delivery zones"
  ON public.delivery_zones FOR SELECT TO authenticated
  USING (is_active = true);

-- Store owners can view all their zones
CREATE POLICY "Owners view their delivery zones"
  ON public.delivery_zones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = delivery_zones.store_id AND stores.owner_id = auth.uid()));

-- Store owners can insert zones
CREATE POLICY "Owners insert delivery zones"
  ON public.delivery_zones FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = delivery_zones.store_id AND stores.owner_id = auth.uid()));

-- Store owners can update zones
CREATE POLICY "Owners update delivery zones"
  ON public.delivery_zones FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = delivery_zones.store_id AND stores.owner_id = auth.uid()));

-- Store owners can delete zones
CREATE POLICY "Owners delete delivery zones"
  ON public.delivery_zones FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = delivery_zones.store_id AND stores.owner_id = auth.uid()));


CREATE TABLE public.store_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 10,
  min_order NUMERIC NOT NULL DEFAULT 0,
  coupon_code TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.store_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view active promotions"
  ON public.store_promotions FOR SELECT TO anon
  USING (is_active = true AND (ends_at IS NULL OR ends_at > now()) AND starts_at <= now());

CREATE POLICY "Authenticated view active promotions"
  ON public.store_promotions FOR SELECT TO authenticated
  USING (is_active = true AND (ends_at IS NULL OR ends_at > now()) AND starts_at <= now());

CREATE POLICY "Owners view their promotions"
  ON public.store_promotions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_promotions.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Owners insert promotions"
  ON public.store_promotions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_promotions.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Owners update promotions"
  ON public.store_promotions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_promotions.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Owners delete promotions"
  ON public.store_promotions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_promotions.store_id AND stores.owner_id = auth.uid()));

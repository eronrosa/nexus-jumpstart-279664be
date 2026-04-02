
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT,
  reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Public view reviews"
  ON public.reviews FOR SELECT TO anon
  USING (true);

CREATE POLICY "Authenticated view reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (true);

-- Users can insert review for their own orders
CREATE POLICY "Users insert own review"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.orders WHERE orders.id = reviews.order_id AND orders.user_id = auth.uid())
  );

-- Store owners can update reviews (to add reply)
CREATE POLICY "Owners reply to reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = reviews.store_id AND stores.owner_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

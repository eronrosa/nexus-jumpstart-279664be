
CREATE TABLE public.favorite_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

ALTER TABLE public.favorite_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own favorites" ON public.favorite_stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own favorites" ON public.favorite_stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own favorites" ON public.favorite_stores
  FOR DELETE USING (auth.uid() = user_id);

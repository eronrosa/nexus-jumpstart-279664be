
-- Create reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 2,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Users can create their own reservations
CREATE POLICY "Users create own reservations"
ON public.reservations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own reservations
CREATE POLICY "Users view own reservations"
ON public.reservations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Store owners can view reservations for their store
CREATE POLICY "Owners view store reservations"
ON public.reservations FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = reservations.store_id AND stores.owner_id = auth.uid()
));

-- Store owners can update reservation status
CREATE POLICY "Owners update store reservations"
ON public.reservations FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = reservations.store_id AND stores.owner_id = auth.uid()
));

-- Admins can view all reservations
CREATE POLICY "Admins view all reservations"
ON public.reservations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;

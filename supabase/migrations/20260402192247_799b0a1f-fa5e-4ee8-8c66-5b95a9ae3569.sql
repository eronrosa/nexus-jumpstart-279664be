
-- Create stores table linking users to their establishments
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Restaurante',
  logo_url text,
  cover_url text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Owners can manage their own stores
CREATE POLICY "Owners view their stores" ON public.stores FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert their stores" ON public.stores FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update their stores" ON public.stores FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

-- Allow merchants (store owners) to update orders for their restaurant
CREATE POLICY "Store owners update order status" ON public.orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.owner_id = auth.uid() AND stores.id::text = orders.restaurant_id));

-- Trigger for updated_at on stores
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Store owners can also view orders for their restaurant
CREATE POLICY "Store owners view their orders" ON public.orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.owner_id = auth.uid() AND stores.id::text = orders.restaurant_id));

-- Store owners can view order items for their restaurant orders  
CREATE POLICY "Store owners view order items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders 
    JOIN public.stores ON stores.id::text = orders.restaurant_id 
    WHERE orders.id = order_items.order_id AND stores.owner_id = auth.uid()
  ));

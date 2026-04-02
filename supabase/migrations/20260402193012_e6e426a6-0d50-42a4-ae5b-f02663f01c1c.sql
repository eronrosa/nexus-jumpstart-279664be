
-- Create menu_items table
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Geral',
  price numeric NOT NULL,
  description text,
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Store owners full CRUD on their menu items
CREATE POLICY "Owners view menu items" ON public.menu_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = menu_items.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Owners insert menu items" ON public.menu_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = menu_items.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Owners update menu items" ON public.menu_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = menu_items.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Owners delete menu items" ON public.menu_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = menu_items.store_id AND stores.owner_id = auth.uid()));

-- Public can view available menu items (for customer app)
CREATE POLICY "Public view available menu items" ON public.menu_items FOR SELECT TO anon
  USING (is_available = true);

-- Also let any authenticated user see available items (for customer browsing)
CREATE POLICY "Authenticated view available menu items" ON public.menu_items FOR SELECT TO authenticated
  USING (is_available = true);

-- Trigger for updated_at
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- Storage RLS: owners can upload/delete, public can view
CREATE POLICY "Anyone can view menu images" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Authenticated users upload menu images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'menu-images');
CREATE POLICY "Authenticated users update menu images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'menu-images');
CREATE POLICY "Authenticated users delete menu images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'menu-images');

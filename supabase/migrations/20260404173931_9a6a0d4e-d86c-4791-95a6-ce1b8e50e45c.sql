-- Admin policies for orders
CREATE POLICY "Admins view all orders"
ON public.orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for rides
CREATE POLICY "Admins view all rides"
ON public.rides FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all rides"
ON public.rides FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
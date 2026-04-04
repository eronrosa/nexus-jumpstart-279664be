-- Allow admins to see ALL stores (including inactive)
CREATE POLICY "Admins view all stores"
ON public.stores
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any store
CREATE POLICY "Admins update all stores"
ON public.stores
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete stores
CREATE POLICY "Admins delete stores"
ON public.stores
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
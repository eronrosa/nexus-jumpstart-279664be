CREATE POLICY "Public view active stores"
ON public.stores FOR SELECT
TO anon
USING (is_active = true);

CREATE POLICY "Authenticated view active stores"
ON public.stores FOR SELECT
TO authenticated
USING (is_active = true);

-- Allow admins to view all profiles
CREATE POLICY "Admins view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete reviews (moderation)
CREATE POLICY "Admins delete reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all driver_earnings
CREATE POLICY "Admins view all earnings"
ON public.driver_earnings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

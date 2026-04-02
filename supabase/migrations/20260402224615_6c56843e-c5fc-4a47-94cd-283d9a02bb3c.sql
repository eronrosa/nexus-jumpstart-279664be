CREATE OR REPLACE FUNCTION public.admin_update_driver(
  _driver_id uuid,
  _is_approved boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  UPDATE drivers SET is_approved = _is_approved WHERE id = _driver_id;
END;
$$;
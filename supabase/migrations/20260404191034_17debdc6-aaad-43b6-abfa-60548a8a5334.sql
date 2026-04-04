
CREATE TABLE public.user_presence (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
  last_seen timestamptz NOT NULL DEFAULT now(),
  typing_in uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view presence" ON public.user_presence
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users update own presence" ON public.user_presence
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users insert own presence" ON public.user_presence
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

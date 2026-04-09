
-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL DEFAULT '20:00',
  location TEXT NOT NULL,
  venue TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Festa',
  age_rating TEXT NOT NULL DEFAULT 'Livre',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view active events" ON public.events FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Authenticated view active events" ON public.events FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Organizers view own events" ON public.events FOR SELECT TO authenticated USING (organizer_id = auth.uid());
CREATE POLICY "Organizers insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "Organizers update own events" ON public.events FOR UPDATE TO authenticated USING (organizer_id = auth.uid());
CREATE POLICY "Organizers delete own events" ON public.events FOR DELETE TO authenticated USING (organizer_id = auth.uid());
CREATE POLICY "Admins view all events" ON public.events FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all events" ON public.events FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event tickets (lotes)
CREATE TABLE public.event_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  available INTEGER NOT NULL DEFAULT 100,
  max_per_purchase INTEGER NOT NULL DEFAULT 5,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view active tickets" ON public.event_tickets FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Authenticated view active tickets" ON public.event_tickets FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Organizers view own tickets" ON public.event_tickets FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_tickets.event_id AND events.organizer_id = auth.uid()));
CREATE POLICY "Organizers insert tickets" ON public.event_tickets FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = event_tickets.event_id AND events.organizer_id = auth.uid()));
CREATE POLICY "Organizers update tickets" ON public.event_tickets FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_tickets.event_id AND events.organizer_id = auth.uid()));
CREATE POLICY "Organizers delete tickets" ON public.event_tickets FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_tickets.event_id AND events.organizer_id = auth.uid()));

-- Ticket purchases
CREATE TABLE public.ticket_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.event_tickets(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_paid NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'pix',
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases" ON public.ticket_purchases FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create purchases" ON public.ticket_purchases FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Organizers view event purchases" ON public.ticket_purchases FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM events WHERE events.id = ticket_purchases.event_id AND events.organizer_id = auth.uid()));
CREATE POLICY "Admins view all purchases" ON public.ticket_purchases FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));


CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet owner read" ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "wallet owner insert" ON public.wallets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "wallet owner update" ON public.wallets FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pix','pay','transfer','deposit')),
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  counterparty TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX ON public.wallet_transactions(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx owner read" ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "tx owner insert" ON public.wallet_transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic operation: deposit / withdraw / transfer
CREATE OR REPLACE FUNCTION public.wallet_operation(
  _type TEXT,
  _amount NUMERIC,
  _description TEXT DEFAULT NULL,
  _counterparty TEXT DEFAULT NULL,
  _recipient_user_id UUID DEFAULT NULL
) RETURNS public.wallets
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _wallet public.wallets;
  _recipient_wallet public.wallets;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  IF _type NOT IN ('pix','pay','transfer','deposit') THEN RAISE EXCEPTION 'invalid type'; END IF;

  INSERT INTO public.wallets(user_id) VALUES (_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO _wallet FROM public.wallets WHERE user_id = _uid FOR UPDATE;

  IF _type = 'deposit' THEN
    UPDATE public.wallets SET balance = balance + _amount WHERE id = _wallet.id RETURNING * INTO _wallet;
    INSERT INTO public.wallet_transactions(wallet_id, user_id, type, direction, amount, description, counterparty)
      VALUES (_wallet.id, _uid, 'deposit', 'in', _amount, COALESCE(_description,'Depósito'), _counterparty);
  ELSE
    IF _wallet.balance < _amount THEN RAISE EXCEPTION 'insufficient funds'; END IF;
    UPDATE public.wallets SET balance = balance - _amount WHERE id = _wallet.id RETURNING * INTO _wallet;
    INSERT INTO public.wallet_transactions(wallet_id, user_id, type, direction, amount, description, counterparty)
      VALUES (_wallet.id, _uid, _type, 'out', _amount, _description, _counterparty);

    IF _type = 'transfer' AND _recipient_user_id IS NOT NULL AND _recipient_user_id <> _uid THEN
      INSERT INTO public.wallets(user_id) VALUES (_recipient_user_id) ON CONFLICT (user_id) DO NOTHING;
      SELECT * INTO _recipient_wallet FROM public.wallets WHERE user_id = _recipient_user_id FOR UPDATE;
      UPDATE public.wallets SET balance = balance + _amount WHERE id = _recipient_wallet.id;
      INSERT INTO public.wallet_transactions(wallet_id, user_id, type, direction, amount, description, counterparty)
        VALUES (_recipient_wallet.id, _recipient_user_id, 'transfer', 'in', _amount, COALESCE(_description,'Transferência recebida'), _counterparty);
    END IF;
  END IF;

  RETURN _wallet;
END; $$;

REVOKE ALL ON FUNCTION public.wallet_operation(TEXT, NUMERIC, TEXT, TEXT, UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.wallet_operation(TEXT, NUMERIC, TEXT, TEXT, UUID) TO authenticated;

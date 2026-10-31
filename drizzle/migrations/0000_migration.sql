
-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  signature text NOT NULL DEFAULT '',
  brand_voice text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Credit wallets (read-only for users; changed only by security definer functions)
CREATE TABLE public.credit_wallets (
  user_id uuid PRIMARY KEY,
  plan text NOT NULL DEFAULT 'free',
  subscription_credits integer NOT NULL DEFAULT 0 CHECK (subscription_credits >= 0),
  bonus_credits integer NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  topup_credits integer NOT NULL DEFAULT 0 CHECK (topup_credits >= 0),
  period_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_wallets TO authenticated;
GRANT ALL ON public.credit_wallets TO service_role;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet select" ON public.credit_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  kind text NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'committed',
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX credit_ledger_user_idx ON public.credit_ledger (user_id, created_at DESC);
GRANT SELECT ON public.credit_ledger TO authenticated;
GRANT ALL ON public.credit_ledger TO service_role;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ledger select" ON public.credit_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Draft generations
CREATE TABLE public.drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL DEFAULT 'reply',
  incoming_email text NOT NULL DEFAULT '',
  sender text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT '',
  strategy text NOT NULL DEFAULT '',
  lead_id uuid,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX drafts_user_idx ON public.drafts (user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.drafts TO authenticated;
GRANT ALL ON public.drafts TO service_role;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own drafts select" ON public.drafts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own drafts insert" ON public.drafts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own drafts delete" ON public.drafts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_user_idx ON public.leads (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own leads select" ON public.leads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own leads insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own leads update" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own leads delete" ON public.leads FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Outbox: every email waits for individual review
CREATE TABLE public.outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid,
  to_email text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending_review',
  provider text,
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outbox_user_idx ON public.outbox (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outbox TO authenticated;
GRANT ALL ON public.outbox TO service_role;
ALTER TABLE public.outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own outbox select" ON public.outbox FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own outbox insert" ON public.outbox FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending_review');
CREATE POLICY "own outbox update" ON public.outbox FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status <> 'sent') WITH CHECK (auth.uid() = user_id AND status IN ('pending_review'));
CREATE POLICY "own outbox delete" ON public.outbox FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Per-user mailbox connections (server-only)
CREATE TABLE public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;

-- Signup: profile + wallet with one-time 1,000 credit bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.credit_wallets (user_id, bonus_credits) VALUES (NEW.id, 1000) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.credit_ledger (user_id, amount, kind, reason) VALUES (NEW.id, 1000, 'bonus', 'Free sign-up bonus');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reserve credits before an AI or scraper call. Spends expiring subscription credits first,
-- then the sign-up bonus, then top-up credits.
CREATE OR REPLACE FUNCTION public.reserve_credits(_amount integer, _reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  w public.credit_wallets%ROWTYPE;
  _sub integer; _bonus integer; _top integer; _left integer;
  _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _amount NOT IN (50, 100) THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  SELECT * INTO w FROM public.credit_wallets WHERE user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'insufficient_credits'; END IF;
  -- Expired subscription period: unused subscription credits do not roll over
  IF w.period_end IS NOT NULL AND w.period_end < now() THEN
    w.subscription_credits := 0;
    UPDATE public.credit_wallets SET subscription_credits = 0 WHERE user_id = _uid;
  END IF;
  IF w.subscription_credits + w.bonus_credits + w.topup_credits < _amount THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;
  _left := _amount;
  _sub := LEAST(w.subscription_credits, _left); _left := _left - _sub;
  _bonus := LEAST(w.bonus_credits, _left); _left := _left - _bonus;
  _top := LEAST(w.topup_credits, _left); _left := _left - _top;
  UPDATE public.credit_wallets SET
    subscription_credits = subscription_credits - _sub,
    bonus_credits = bonus_credits - _bonus,
    topup_credits = topup_credits - _top,
    updated_at = now()
  WHERE user_id = _uid;
  INSERT INTO public.credit_ledger (user_id, amount, kind, reason, status, breakdown)
  VALUES (_uid, -_amount, 'spend', _reason, 'committed', jsonb_build_object('subscription', _sub, 'bonus', _bonus, 'topup', _top))
  RETURNING id INTO _id;
  RETURN _id;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_credits(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_credits(integer, text) TO authenticated, service_role;

-- Refund a failed request (server-only)
CREATE OR REPLACE FUNCTION public.refund_credits(_ledger_id uuid, _user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.credit_ledger%ROWTYPE;
BEGIN
  SELECT * INTO l FROM public.credit_ledger WHERE id = _ledger_id AND user_id = _user_id AND kind = 'spend' AND status = 'committed' FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  UPDATE public.credit_wallets SET
    subscription_credits = subscription_credits + COALESCE((l.breakdown->>'subscription')::int, 0),
    bonus_credits = bonus_credits + COALESCE((l.breakdown->>'bonus')::int, 0),
    topup_credits = topup_credits + COALESCE((l.breakdown->>'topup')::int, 0),
    updated_at = now()
  WHERE user_id = _user_id;
  UPDATE public.credit_ledger SET status = 'refunded' WHERE id = _ledger_id;
END; $$;
REVOKE ALL ON FUNCTION public.refund_credits(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, uuid) TO service_role;

-- Subscription renewal: resets subscription credits to the plan amount (no rollover)
CREATE OR REPLACE FUNCTION public.apply_subscription(_user_id uuid, _plan text, _credits integer, _period_end timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.credit_wallets SET plan = _plan, subscription_credits = _credits, period_end = _period_end, updated_at = now() WHERE user_id = _user_id;
  INSERT INTO public.credit_ledger (user_id, amount, kind, reason) VALUES (_user_id, _credits, 'subscription', _plan || ' monthly credits');
END; $$;
REVOKE ALL ON FUNCTION public.apply_subscription(uuid, text, integer, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription(uuid, text, integer, timestamptz) TO service_role;

-- Top-up purchase: adds credits that carry over
CREATE OR REPLACE FUNCTION public.add_topup(_user_id uuid, _credits integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.credit_wallets SET topup_credits = topup_credits + _credits, updated_at = now() WHERE user_id = _user_id;
  INSERT INTO public.credit_ledger (user_id, amount, kind, reason) VALUES (_user_id, _credits, 'topup', 'Top-up pack');
END; $$;
REVOKE ALL ON FUNCTION public.add_topup(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_topup(uuid, integer) TO service_role;

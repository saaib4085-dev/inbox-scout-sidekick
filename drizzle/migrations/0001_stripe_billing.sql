ALTER TABLE public.credit_wallets ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.credit_wallets ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

CREATE TABLE public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.stripe_events TO service_role;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Subscription ended: plan credits stop; bonus and top-up credits stay
CREATE OR REPLACE FUNCTION public.end_subscription(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.credit_wallets SET plan = 'free', subscription_credits = 0, period_end = NULL,
    stripe_subscription_id = NULL, updated_at = now() WHERE user_id = _user_id;
END; $$;
REVOKE ALL ON FUNCTION public.end_subscription(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.end_subscription(uuid) TO service_role;

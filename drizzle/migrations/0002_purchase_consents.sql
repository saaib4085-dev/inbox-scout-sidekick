CREATE TABLE public.purchase_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product text NOT NULL,
  price_eur numeric(10,2) NOT NULL,
  consent_version text NOT NULL,
  waived_withdrawal boolean NOT NULL,
  adult_or_guardian boolean NOT NULL,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX purchase_consents_user_idx ON public.purchase_consents (user_id, created_at DESC);
GRANT SELECT ON public.purchase_consents TO authenticated;
GRANT ALL ON public.purchase_consents TO service_role;
ALTER TABLE public.purchase_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own consents select" ON public.purchase_consents FOR SELECT TO authenticated USING (auth.uid() = user_id);
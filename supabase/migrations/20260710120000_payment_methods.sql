-- Payment methods: cards/wallets for paying, bank accounts for owner payouts

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('payment', 'payout')),
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'apple_pay', 'google_pay', 'bank_account')),
  label TEXT NOT NULL DEFAULT '',
  brand TEXT,
  last_four TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  account_holder_name TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS payment_methods_category_idx ON public.payment_methods(user_id, category);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_methods_select_own" ON public.payment_methods;
CREATE POLICY "payment_methods_select_own" ON public.payment_methods
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_insert_own" ON public.payment_methods;
CREATE POLICY "payment_methods_insert_own" ON public.payment_methods
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_update_own" ON public.payment_methods;
CREATE POLICY "payment_methods_update_own" ON public.payment_methods
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_delete_own" ON public.payment_methods;
CREATE POLICY "payment_methods_delete_own" ON public.payment_methods
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Demo seed
INSERT INTO public.payment_methods (
  id, user_id, category, type, label, brand, last_four, is_default
) VALUES
(
  'pm1',
  'a1111111-1111-4111-8111-111111111111',
  'payment',
  'credit_card',
  'כרטיס אשראי',
  'Visa',
  '4242',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payment_methods (
  id, user_id, category, type, label, bank_name, bank_branch, last_four, account_holder_name, is_default
) VALUES
(
  'pm2',
  'a2222222-2222-4222-8222-222222222222',
  'payout',
  'bank_account',
  'חשבון בנק',
  'בנק לאומי',
  '800',
  '5678',
  'דני כהן',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

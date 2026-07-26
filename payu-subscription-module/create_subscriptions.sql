-- Create the subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid NOT NULL, -- Assuming shop_id relates to the tenant/shop
  plan text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL, -- 'active', 'failed', 'pending', etc.
  transaction_id text UNIQUE NOT NULL,
  payu_transaction_id text,
  payment_mode text,
  paid_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read their own shop's subscriptions
-- (Adjust the shop_id logic based on how your multi-tenant setup is structured)
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (
  -- Example: assumes auth.uid() is the user and there's a way to link user to shop_id
  -- Replace this with your actual tenant-isolation logic
  shop_id IN (SELECT shop_id FROM user_shops WHERE user_id = auth.uid())
);

-- Migration: Add withdrawals, kyc reasons, and tontine enhancements

-- 1. Update profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS funds_available BIGINT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_reject_reason TEXT;

-- 2. Update tontines table
ALTER TABLE public.tontines ADD COLUMN IF NOT EXISTS accumulated_savings BIGINT DEFAULT 0;
ALTER TABLE public.tontines ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- 3. Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    method TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Policies for withdrawal_requests
DROP POLICY IF EXISTS "Withdrawal requests select policy" ON public.withdrawal_requests;
CREATE POLICY "Withdrawal requests select policy" 
ON public.withdrawal_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Withdrawal requests insert policy" ON public.withdrawal_requests;
CREATE POLICY "Withdrawal requests insert policy" 
ON public.withdrawal_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Withdrawal requests update policy" ON public.withdrawal_requests;
CREATE POLICY "Withdrawal requests update policy" 
ON public.withdrawal_requests FOR UPDATE USING (true);

-- Add to realtime replication if possible (avoiding errors if already present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'withdrawal_requests'
  ) THEN
    NULL;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

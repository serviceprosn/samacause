-- Migration: Fix RLS Security for Profiles, Direct Messages and Withdrawal Requests

-- 1. Profiles Update Policy: allow admins to update profiles (needed for KYC approval/rejection)
DROP POLICY IF EXISTS "Les administrateurs peuvent modifier tous les profils" ON public.profiles;
CREATE POLICY "Les administrateurs peuvent modifier tous les profils" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 2. Direct Messages Policies: secure select, insert, update
DROP POLICY IF EXISTS "Les messages directs sont visibles par tous" ON public.direct_messages;
CREATE POLICY "Les messages directs sont visibles par les participants et les admins" 
ON public.direct_messages FOR SELECT 
USING (
  auth.uid()::text = sender_id 
  OR auth.uid()::text = receiver_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Tout le monde peut envoyer des messages directs" ON public.direct_messages;
CREATE POLICY "Les utilisateurs peuvent envoyer des messages directs en tant qu'eux-mêmes" 
ON public.direct_messages FOR INSERT 
WITH CHECK (
  auth.uid()::text = sender_id
);

DROP POLICY IF EXISTS "Les messages directs peuvent être mis à jour" ON public.direct_messages;
CREATE POLICY "Les messages directs peuvent être mis à jour par les participants et les admins" 
ON public.direct_messages FOR UPDATE 
USING (
  auth.uid()::text = receiver_id 
  OR auth.uid()::text = sender_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 3. Withdrawal Requests Policies: secure select, insert, update
DROP POLICY IF EXISTS "Withdrawal requests select policy" ON public.withdrawal_requests;
CREATE POLICY "Withdrawal requests select policy" 
ON public.withdrawal_requests FOR SELECT 
USING (
  auth.uid()::text = user_id::text 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Withdrawal requests insert policy" ON public.withdrawal_requests;
CREATE POLICY "Withdrawal requests insert policy" 
ON public.withdrawal_requests FOR INSERT 
WITH CHECK (
  auth.uid()::text = user_id::text
);

DROP POLICY IF EXISTS "Withdrawal requests update policy" ON public.withdrawal_requests;
CREATE POLICY "Withdrawal requests update policy" 
ON public.withdrawal_requests FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Migration: Add missing KYC and account configuration columns to public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS id_card_recto TEXT,
ADD COLUMN IF NOT EXISTS id_card_verso TEXT,
ADD COLUMN IF NOT EXISTS selfie TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS cni_number TEXT,
ADD COLUMN IF NOT EXISTS dob TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'citizen' CHECK (account_type IN ('citizen', 'company', 'ngo')),
ADD COLUMN IF NOT EXISTS following TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS followers TEXT[] DEFAULT '{}';

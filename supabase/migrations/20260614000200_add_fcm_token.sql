-- Migration: Add fcm_token column to public.profiles for Firebase Cloud Messaging push notifications
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fcm_token TEXT;

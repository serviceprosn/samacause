-- Migration: Create contact_messages table for public contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    recipient TEXT DEFAULT 'mouhamethsarr98@gmail.com',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insertions so anyone can send a message
CREATE POLICY "Allow public insertions" 
ON public.contact_messages FOR INSERT 
WITH CHECK (true);

-- Policy: Allow only administrators to view submitted contact messages
CREATE POLICY "Allow admin read access" 
ON public.contact_messages FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

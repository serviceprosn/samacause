-- Migration to add missing campaign columns (image_before, image_after, gallery)
-- Matches the production schema updates

-- 1. Petitions table
ALTER TABLE public.petitions ADD COLUMN IF NOT EXISTS image_before TEXT DEFAULT '';
ALTER TABLE public.petitions ADD COLUMN IF NOT EXISTS image_after TEXT DEFAULT '';
ALTER TABLE public.petitions ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';

-- 2. Cagnottes table
ALTER TABLE public.cagnottes ADD COLUMN IF NOT EXISTS image_before TEXT DEFAULT '';
ALTER TABLE public.cagnottes ADD COLUMN IF NOT EXISTS image_after TEXT DEFAULT '';

-- 3. Volunteer Missions table
ALTER TABLE public.volunteer_missions ADD COLUMN IF NOT EXISTS image_before TEXT DEFAULT '';
ALTER TABLE public.volunteer_missions ADD COLUMN IF NOT EXISTS image_after TEXT DEFAULT '';

-- Migration: Secure Remaining RLS Policies for Petitions, Cagnottes, Tontines, and Volunteers

-- 1. Petitions: Restrict update to organizer or admin
DROP POLICY IF EXISTS "Les organisateurs et admins peuvent modifier les pétitions" ON public.petitions;
CREATE POLICY "Les organisateurs et admins peuvent modifier les pétitions" 
ON public.petitions FOR UPDATE 
USING (
  auth.uid()::text = organizer->>'id' 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 2. Cagnottes: Restrict update to organizer or admin
DROP POLICY IF EXISTS "Les organisateurs et admins peuvent modifier les cagnottes" ON public.cagnottes;
CREATE POLICY "Les organisateurs et admins peuvent modifier les cagnottes" 
ON public.cagnottes FOR UPDATE 
USING (
  auth.uid()::text = organizer->>'id' 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 3. Tontines: Restrict update to organizer, members, or admin
DROP POLICY IF EXISTS "Les membres et organisateurs peuvent modifier les tontines" ON public.tontines;
CREATE POLICY "Les membres et organisateurs peuvent modifier les tontines" 
ON public.tontines FOR UPDATE 
USING (
  auth.uid()::text = organizer->>'id'
  OR (members @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text)))
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 4. Volunteer Missions: Restrict update to organizer or admin
DROP POLICY IF EXISTS "Les organisateurs et admins peuvent modifier les missions" ON public.volunteer_missions;
CREATE POLICY "Les organisateurs et admins peuvent modifier les missions" 
ON public.volunteer_missions FOR UPDATE 
USING (
  auth.uid()::text = organizer->>'id' 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. Volunteer Applications: Restrict update to parent mission organizer or admin
DROP POLICY IF EXISTS "Les organisateurs et admins peuvent modifier les candidatures" ON public.volunteer_applications;
CREATE POLICY "Les organisateurs et admins peuvent modifier les candidatures" 
ON public.volunteer_applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.volunteer_missions m
    WHERE m.id = volunteer_applications.mission_id 
    AND auth.uid()::text = m.organizer->>'id'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

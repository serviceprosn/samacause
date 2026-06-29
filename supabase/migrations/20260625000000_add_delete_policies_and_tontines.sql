-- Migration: Enable DELETE policies for creators and admins on all campaigns and tontines

-- 1. Petitions
DROP POLICY IF EXISTS "Les administrateurs peuvent supprimer les pétitions" ON public.petitions;
DROP POLICY IF EXISTS "Les créateurs peuvent supprimer leurs pétitions" ON public.petitions;

CREATE POLICY "Les administrateurs peuvent supprimer les pétitions" 
ON public.petitions FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Les créateurs peuvent supprimer leurs pétitions" 
ON public.petitions FOR DELETE 
USING (
  auth.uid()::text = organizer->>'id'
);


-- 2. Cagnottes
DROP POLICY IF EXISTS "Les administrateurs peuvent supprimer les cagnottes" ON public.cagnottes;
DROP POLICY IF EXISTS "Les créateurs peuvent supprimer leurs cagnottes" ON public.cagnottes;

CREATE POLICY "Les administrateurs peuvent supprimer les cagnottes" 
ON public.cagnottes FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Les créateurs peuvent supprimer leurs cagnottes" 
ON public.cagnottes FOR DELETE 
USING (
  auth.uid()::text = organizer->>'id'
);


-- 3. Volunteer Missions
DROP POLICY IF EXISTS "Les administrateurs peuvent supprimer les missions de bénévolat" ON public.volunteer_missions;
DROP POLICY IF EXISTS "Les créateurs peuvent supprimer leurs missions de bénévolat" ON public.volunteer_missions;

CREATE POLICY "Les administrateurs peuvent supprimer les missions de bénévolat" 
ON public.volunteer_missions FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Les créateurs peuvent supprimer leurs missions de bénévolat" 
ON public.volunteer_missions FOR DELETE 
USING (
  auth.uid()::text = organizer->>'id'
);


-- 4. Volunteer Applications
DROP POLICY IF EXISTS "Les administrateurs peuvent supprimer les candidatures de bénévolat" ON public.volunteer_applications;
DROP POLICY IF EXISTS "Les créateurs de missions peuvent supprimer les candidatures" ON public.volunteer_applications;

CREATE POLICY "Les administrateurs peuvent supprimer les candidatures de bénévolat" 
ON public.volunteer_applications FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Les créateurs de missions peuvent supprimer les candidatures" 
ON public.volunteer_applications FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.volunteer_missions m
    WHERE m.id = volunteer_applications.mission_id 
    AND auth.uid()::text = m.organizer->>'id'
  )
);


-- 5. Tontines
DROP POLICY IF EXISTS "Les administrateurs peuvent supprimer les tontines" ON public.tontines;
DROP POLICY IF EXISTS "Les créateurs peuvent supprimer leurs tontines" ON public.tontines;

CREATE POLICY "Les administrateurs peuvent supprimer les tontines" 
ON public.tontines FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Les créateurs peuvent supprimer leurs tontines" 
ON public.tontines FOR DELETE 
USING (
  auth.uid()::text = organizer->>'id'
);

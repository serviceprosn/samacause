-- RLS Policies to allow administrators to delete records from campaigns and volunteer missions

-- 1. Petitions Delete Policy
DROP POLICY IF EXISTS "Les administrateurs peuvent supprimer les pétitions" ON public.petitions;
CREATE POLICY "Les administrateurs peuvent supprimer les pétitions" 
ON public.petitions FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 2. Cagnottes Delete Policy
DROP POLICY IF EXISTS "Les administrateurs peuvent supprimer les cagnottes" ON public.cagnottes;
CREATE POLICY "Les administrateurs peuvent supprimer les cagnottes" 
ON public.cagnottes FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 3. Volunteer Missions Delete Policy
DROP POLICY IF EXISTS "Les administrateurs peuvent supprimer les missions de bénévolat" ON public.volunteer_missions;
CREATE POLICY "Les administrateurs peuvent supprimer les missions de bénévolat" 
ON public.volunteer_missions FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 4. Volunteer Applications Delete Policy
DROP POLICY IF EXISTS "Les administrateurs peuvent supprimer les candidatures de bénévolat" ON public.volunteer_applications;
CREATE POLICY "Les administrateurs peuvent supprimer les candidatures de bénévolat" 
ON public.volunteer_applications FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ================================================================================
-- SCHEMA SQL POUR SAMA CAUSE (SUPABASE)
-- Copiez et collez ce script dans l'éditeur SQL de votre console Supabase.
-- ================================================================================

-- 1. TABLE DES PROFILS UTILISATEURS
-- Cette table est liée à la table d'authentification intégrée d'auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'organizer', 'admin')),
    verified BOOLEAN DEFAULT FALSE,
    avatar TEXT,
    trust_score INT DEFAULT 50,
    badges TEXT[] DEFAULT '{}',
    bio TEXT,
    address TEXT,
    country TEXT,
    region TEXT,
    id_card_recto TEXT,
    id_card_verso TEXT,
    selfie TEXT,
    verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected')),
    cni_number TEXT,
    dob TEXT,
    account_type TEXT DEFAULT 'citizen' CHECK (account_type IN ('citizen', 'company', 'ngo')),
    following TEXT[] DEFAULT '{}',
    followers TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- Activez la sécurité de niveau ligne (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Création des politiques RLS pour les profils
CREATE POLICY "Les profils sont visibles par tout le monde" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. TABLE DES PÉTITIONS
CREATE TABLE IF NOT EXISTS public.petitions (
    id TEXT PRIMARY KEY, -- ID généré par l'application (ex: pet_abc123)
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image TEXT,
    category TEXT NOT NULL CHECK (category IN ('sante', 'education', 'infrastructure', 'environnement', 'social')),
    signatures_count INT DEFAULT 0,
    signatures_target INT NOT NULL,
    recipient TEXT NOT NULL,
    location TEXT NOT NULL,
    date_limit TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'active', 'rejected', 'closed')),
    organizer JSONB NOT NULL, -- Stockage des infos simplifiées de l'organisateur
    updates JSONB DEFAULT '[]'::jsonb,
    signers JSONB DEFAULT '[]'::jsonb,
    boosted BOOLEAN DEFAULT FALSE,
    boost_level TEXT CHECK (boost_level IN ('ndamel', 'teranga', 'lion')),
    viewed_by_admin BOOLEAN DEFAULT FALSE,
    rejection_feedback TEXT
);

ALTER TABLE public.petitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les pétitions sont visibles par tous" 
ON public.petitions FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des pétitions" 
ON public.petitions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Les organisateurs et admins peuvent modifier les pétitions" 
ON public.petitions FOR UPDATE USING (true);

-- 3. TABLE DES CAGNOTTES
CREATE TABLE IF NOT EXISTS public.cagnottes (
    id TEXT PRIMARY KEY, -- ID généré par l'application (ex: cag_abc123)
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image TEXT,
    category TEXT NOT NULL CHECK (category IN ('forage', 'ecole', 'mosquee', 'ambulance', 'eclairage', 'sante', 'autre')),
    amount_collected BIGINT DEFAULT 0,
    amount_target BIGINT NOT NULL,
    location TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'active', 'rejected', 'completed')),
    organizer JSONB NOT NULL,
    is_diaspora_targeted BOOLEAN DEFAULT FALSE,
    updates JSONB DEFAULT '[]'::jsonb,
    expenses JSONB DEFAULT '[]'::jsonb,
    donors JSONB DEFAULT '[]'::jsonb,
    documents TEXT[] DEFAULT '{}',
    gallery TEXT[] DEFAULT '{}',
    viewed_by_admin BOOLEAN DEFAULT FALSE,
    rejection_feedback TEXT
);

ALTER TABLE public.cagnottes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les cagnottes sont visibles par tous" 
ON public.cagnottes FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des cagnottes" 
ON public.cagnottes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Les organisateurs et admins peuvent modifier les cagnottes" 
ON public.cagnottes FOR UPDATE USING (true);


-- 4. DÉGÂT DES TRIGGERS POUR LA CRÉATION DE PROFIL AUTOMATIQUE
-- Ce trigger insère automatiquement un profil dans public.profiles lors de l'inscription auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role, verified, avatar, trust_score, badges, country, region)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'citizen'),
    COALESCE((new.raw_user_meta_data->>'verified')::boolean, false),
    COALESCE(new.raw_user_meta_data->>'avatar', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23a1a1aa"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'),
    COALESCE((new.raw_user_meta_data->>'trust_score')::int, 50),
    '{}',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'region'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger de liaison
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 5. TABLE DES TONTINES CITOYENNES
CREATE TABLE IF NOT EXISTS public.tontines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('public', 'private')),
    participants_max INT NOT NULL,
    joined_count INT DEFAULT 1,
    cotisation BIGINT NOT NULL,
    frequency TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    order_type TEXT,
    status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'active', 'completed')),
    organizer JSONB NOT NULL,
    members JSONB DEFAULT '[]'::jsonb,
    payments JSONB DEFAULT '[]'::jsonb,
    activity_logs JSONB DEFAULT '[]'::jsonb,
    votes JSONB DEFAULT '[]'::jsonb,
    chat JSONB DEFAULT '[]'::jsonb,
    guarantee_fund_active BOOLEAN DEFAULT FALSE,
    guarantee_fund_amount INT DEFAULT 0,
    guarantee_fund_total INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.tontines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les tontines sont visibles par tous" 
ON public.tontines FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des tontines" 
ON public.tontines FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Les membres et organisateurs peuvent modifier les tontines" 
ON public.tontines FOR UPDATE USING (true);


-- 6. TABLE DES MISSIONS DE BÉNÉVOLAT
CREATE TABLE IF NOT EXISTS public.volunteer_missions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image TEXT,
    location TEXT NOT NULL,
    duration TEXT NOT NULL,
    needs TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('social', 'environnement', 'education', 'sante')),
    volunteers_target INT NOT NULL,
    volunteers_count INT DEFAULT 0,
    organizer JSONB NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed'))
);

ALTER TABLE public.volunteer_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les missions de bénévolat sont visibles par tous" 
ON public.volunteer_missions FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des missions" 
ON public.volunteer_missions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Les organisateurs et admins peuvent modifier les missions" 
ON public.volunteer_missions FOR UPDATE USING (true);


-- 7. TABLE DES CANDIDATURES DE BÉNÉVOLAT
CREATE TABLE IF NOT EXISTS public.volunteer_applications (
    id TEXT PRIMARY KEY,
    mission_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    applied_at TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les candidatures de bénévolat sont visibles par tous" 
ON public.volunteer_applications FOR SELECT USING (true);

CREATE POLICY "Tout le monde peut postuler à une mission" 
ON public.volunteer_applications FOR INSERT WITH CHECK (true);

CREATE POLICY "Les organisateurs et admins peuvent modifier les candidatures" 
ON public.volunteer_applications FOR UPDATE USING (true);


-- 8. TABLE DES MESSAGES DIRECTS (CHAT CHATBOT)
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les messages directs sont visibles par tous" 
ON public.direct_messages FOR SELECT USING (true);

CREATE POLICY "Tout le monde peut envoyer des messages directs" 
ON public.direct_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Les messages directs peuvent être mis à jour" 
ON public.direct_messages FOR UPDATE USING (true);

-- 9. RÉPLICATION EN TEMPS RÉEL (SUPABASE REALTIME)
-- Permet de diffuser les modifications en direct à tous les clients connectés
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.petitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cagnottes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tontines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteer_missions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteer_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;


-- ================================================================================
-- MISES A JOUR POST-INITIALISATION (COLONNES AVANT/APRES & GALERIE PETITIONS)
-- ================================================================================

ALTER TABLE public.cagnottes ADD COLUMN IF NOT EXISTS image_before TEXT;
ALTER TABLE public.cagnottes ADD COLUMN IF NOT EXISTS image_after TEXT;

ALTER TABLE public.petitions ADD COLUMN IF NOT EXISTS image_before TEXT;
ALTER TABLE public.petitions ADD COLUMN IF NOT EXISTS image_after TEXT;
ALTER TABLE public.petitions ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';

ALTER TABLE public.volunteer_missions ADD COLUMN IF NOT EXISTS image_before TEXT;
ALTER TABLE public.volunteer_missions ADD COLUMN IF NOT EXISTS image_after TEXT;


-- ================================================================================
-- CONFIGURATION SUPABASE STORAGE (BUCKETS & POLITIQUES RLS)
-- ================================================================================

-- Création des buckets de stockage (cagnottes, petitions, profiles, volunteer, tontines)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('cagnottes', 'cagnottes', true),
  ('petitions', 'petitions', true),
  ('profiles', 'profiles', true),
  ('volunteer', 'volunteer', true),
  ('tontines', 'tontines', true)
ON CONFLICT (id) DO NOTHING;

-- Dropper les politiques existantes pour éviter des erreurs lors de ré-exécutions répétées
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Access" ON storage.objects;

-- Autoriser l'accès public en lecture sur les objets de stockage
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('cagnottes', 'petitions', 'profiles', 'volunteer', 'tontines'));

-- Autoriser l'insertion d'objets pour les utilisateurs authentifiés
CREATE POLICY "Authenticated Insert Access" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id IN ('cagnottes', 'petitions', 'profiles', 'volunteer', 'tontines'));

-- Autoriser les utilisateurs à modifier ou supprimer leurs propres fichiers
CREATE POLICY "Owner Update Access" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner);

CREATE POLICY "Owner Delete Access" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (auth.uid() = owner);





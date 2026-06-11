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

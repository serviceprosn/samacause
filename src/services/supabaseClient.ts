import { createClient } from '@supabase/supabase-js';
import { Petition, Cagnotte, User } from '../types';

// 1. INITIALISATION DU CLIENT SUPABASE
// Remplacez ces variables par les identifiants de votre projet Supabase
// (généralement stockés dans des variables d'environnement .env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://votre-projet.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'votre-cle-api-anon';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* 
================================================================================
PARTIE 1 : AUTHENTIFICATION (Google, Email/Password, Sessions)
================================================================================
*/

/**
 * Connexion directe via Google OAuth.
 * Gère automatiquement le login social et la redirection.
 */
export const signInWithGoogle = async (rememberMe: boolean = true) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        // Supabase persiste automatiquement la session si configuré.
        // Optionnellement, vous pouvez configurer persistSession dans createClient
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la connexion Google :', error);
    throw error;
  }
};

/**
 * Inscription par Email, Mot de passe et champs personnalisés.
 */
export const signUpWithEmail = async (
  name: string,
  email: string,
  phone: string,
  pass: string,
  country: string,
  region: string
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        // Enregistrement des attributs du profil dans les métadonnées de l'utilisateur
        data: {
          full_name: name,
          phone: phone,
          country: country,
          region: region,
          role: 'citizen', // Rôle par défaut
          verified: false,
          trust_score: 50,
          avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' // Avatar par défaut
        }
      }
    });

    if (error) throw error;

    // Création d'une entrée parallèle dans votre table personnalisée 'profiles' via un trigger Supabase
    // ou manuellement ici si le trigger n'est pas configuré :
    if (data.user) {
      await supabase.from('profiles').insert([
        {
          id: data.user.id,
          name,
          email,
          phone,
          role: 'citizen',
          verified: false,
          country,
          region,
          avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
          trust_score: 50
        }
      ]);
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'inscription :', error);
    throw error;
  }
};

/**
 * Connexion classique par e-mail et mot de passe.
 */
export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    throw error;
  }
};

/**
 * Déconnexion complète.
 */
export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Erreur lors de la déconnexion :', error);
};

/* 
================================================================================
PARTIE 2 : BASE DE DONNÉES EN TEMPS RÉEL (Petitions, Cagnottes)
================================================================================
*/

/**
 * Récupérer la liste des cagnottes de la base Supabase.
 */
export const fetchCagnottesFromDb = async (): Promise<Cagnotte[]> => {
  const { data, error } = await supabase
    .from('cagnottes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur de récupération des cagnottes :', error);
    return [];
  }
  
  // Adaptation des noms de colonnes snake_case (Postgres) vers camelCase (TypeScript)
  return data.map((item: any) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    coverImage: item.cover_image,
    category: item.category,
    amountCollected: item.amount_collected,
    amountTarget: item.amount_target,
    location: item.location,
    createdAt: item.created_at,
    status: item.status,
    organizer: item.organizer, // Objet JSON stocké dans Postgres
    isDiasporaTargeted: item.is_diaspora_targeted,
    updates: item.updates || [],
    expenses: item.expenses || [],
    donors: item.donors || [],
    documents: item.documents || [],
    gallery: item.gallery || [],
    viewedByAdmin: item.viewed_by_admin,
    rejectionFeedback: item.rejection_feedback
  }));
};

/**
 * Créer une nouvelle cagnotte dans Supabase.
 */
export const insertCagnotteToDb = async (cagnotte: Omit<Cagnotte, 'id' | 'amountCollected' | 'createdAt' | 'status' | 'organizer' | 'updates' | 'expenses' | 'donors'>, organizerUser: User) => {
  const { data, error } = await supabase
    .from('cagnottes')
    .insert([
      {
        title: cagnotte.title,
        description: cagnotte.description,
        cover_image: cagnotte.coverImage,
        category: cagnotte.category,
        amount_target: cagnotte.amountTarget,
        location: cagnotte.location,
        is_diaspora_targeted: cagnotte.isDiasporaTargeted,
        documents: cagnotte.documents || [],
        gallery: cagnotte.gallery || [],
        status: 'pending',
        amount_collected: 0,
        viewed_by_admin: false,
        organizer: {
          id: organizerUser.id,
          name: organizerUser.name,
          avatar: organizerUser.avatar,
          verified: organizerUser.verified,
          trustScore: organizerUser.trustScore
        }
      }
    ])
    .select();

  if (error) {
    console.error('Erreur d\'insertion de la cagnotte :', error);
    throw error;
  }
  return data[0].id;
};

/**
 * Mettre à jour l'état de lecture d'une campagne par l'administrateur.
 */
export const updateCampaignViewedInDb = async (id: string, type: 'petition' | 'cagnotte') => {
  const tableName = type === 'petition' ? 'petitions' : 'cagnottes';
  const { error } = await supabase
    .from(tableName)
    .update({ viewed_by_admin: true })
    .eq('id', id);

  if (error) {
    console.error(`Erreur lors du marquage comme lu sur ${tableName} :`, error);
  }
};

/**
 * Valider / Approuver une cagnotte ou pétition dans la base.
 */
export const approveCampaignInDb = async (id: string, type: 'petition' | 'cagnotte') => {
  const tableName = type === 'petition' ? 'petitions' : 'cagnottes';
  const { error } = await supabase
    .from(tableName)
    .update({ status: 'active', viewed_by_admin: true })
    .eq('id', id);

  if (error) throw error;
};

/**
 * Rejeter une cagnotte ou pétition avec justification.
 */
export const rejectCampaignInDb = async (id: string, type: 'petition' | 'cagnotte', feedback: string) => {
  const tableName = type === 'petition' ? 'petitions' : 'cagnottes';
  const { error } = await supabase
    .from(tableName)
    .update({ 
      status: 'rejected', 
      rejection_feedback: feedback,
      viewed_by_admin: true 
    })
    .eq('id', id);

  if (error) throw error;
};

/* 
================================================================================
PARTIE 3 : SYNCHRONISATION TEMPS RÉEL (REALTIME SUBSCRIPTION)
================================================================================
*/

/**
 * S'abonner aux changements de statut en temps réel.
 * Permet au créateur de voir instantanément si l'admin consulte, valide ou rejette.
 */
export const subscribeToCampaignsRealtime = (
  type: 'petition' | 'cagnotte',
  callback: (payload: any) => void
) => {
  const tableName = type === 'petition' ? 'petitions' : 'cagnottes';
  
  return supabase
    .channel(`public:${tableName}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      (payload: any) => {
        console.log('Changement détecté en temps réel :', payload);
        callback(payload);
      }
    )
    .subscribe();
};

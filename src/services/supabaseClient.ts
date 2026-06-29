import { createClient } from '@supabase/supabase-js';
import { Petition, Cagnotte, User } from '../types';

// 1. INITIALISATION DU CLIENT SUPABASE VIA VARIABLES D'ENVIRONNEMENT OU IDENTIFIANTS DE PRODUCTION EN DEFAUT
const REAL_SUPABASE_URL = 'https://otdqdmihcadeusslgrsl.supabase.co';
const REAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZHFkbWloY2FkZXVzc2xncnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODU2MjksImV4cCI6MjA5NjM2MTYyOX0.-bTJg-LlIHE5mupk2O4dqnUzxR6lJgrMlspowEAzG3k';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (rawUrl && rawUrl !== 'https://votre-projet.supabase.co') ? rawUrl : REAL_SUPABASE_URL;
const supabaseAnonKey = (rawAnonKey && rawAnonKey !== 'votre-cle-api-anon' && rawAnonKey !== 'votre-cle-api-anon-ici') ? rawAnonKey : REAL_SUPABASE_ANON_KEY;

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

/**
 * Utilitaire pour convertir une image compressée Base64 en Blob et l'uploader sur Supabase Storage.
 * Retourne l'URL publique de l'image ou la chaîne Base64 en secours si l'upload échoue.
 */
export const uploadBase64ToStorage = async (base64Str: string, bucket: string): Promise<string> => {
  if (!base64Str || !base64Str.startsWith('data:image')) {
    return base64Str; // Déjà une URL ou vide
  }

  try {
    // 1. Décoder les métadonnées et données base64
    const parts = base64Str.split(';');
    if (parts.length < 2) return base64Str;
    const contentType = parts[0].split(':')[1];
    const rawData = parts[1].split(',')[1];

    // 2. Convertir en binaire Blob
    const binaryStr = atob(rawData);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: contentType });

    // 3. Obtenir l'utilisateur courant pour nommer le fichier
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || 'anonymous';
    
    // Extension du fichier
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('gif')) extension = 'gif';

    const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;

    // 4. Uploader le fichier sur le bucket Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.warn(`⚠️ Échec de l'upload vers le bucket Storage '${bucket}' :`, error.message);
      return base64Str; // Secours Base64
    }

    // 5. Récupérer l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (publicUrlData?.publicUrl) {
      console.log(`🚀 Image téléversée avec succès dans '${bucket}' :`, publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    }

    return base64Str;
  } catch (err) {
    console.error("❌ Exception lors de l'upload vers Supabase Storage :", err);
    return base64Str; // Renvoyer Base64 en secours pour éviter de crasher
  }
};


import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { Petition, Cagnotte, User } from '../types';

// 1. CONFIGURATION FIREBASE
// Remplacez cet objet par les clés de votre projet Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKey...",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sama-cause.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sama-cause",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sama-cause.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:00000000:web:00000000"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* 
================================================================================
PARTIE 1 : AUTHENTIFICATION (Google, Email/Password, Persistance Session)
================================================================================
*/

/**
 * Connexion Google avec gestion de la persistance de session ("Se souvenir de moi").
 * @param rememberMe Si vrai, enregistre localement. Sinon, la session s'efface à la fermeture du navigateur.
 */
export const signInWithGoogle = async (rememberMe: boolean = true) => {
  try {
    const provider = new GoogleAuthProvider();
    
    // Définir le type de persistance
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceType);

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Enregistrer ou mettre à jour le profil de l'utilisateur dans Firestore
    const userRef = doc(db, 'users', user.uid);
    // Vous pouvez enregistrer les métadonnées ici.
    
    return user;
  } catch (error) {
    console.error('Erreur d\'authentification Google Firebase :', error);
    throw error;
  }
};

/**
 * Inscription par Email et Mot de passe avec persistance personnalisée.
 */
export const signUpWithEmail = async (
  name: string,
  email: string,
  phone: string,
  pass: string,
  country: string,
  region: string,
  rememberMe: boolean = true
) => {
  try {
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceType);

    const credentials = await createUserWithEmailAndPassword(auth, email, pass);
    
    // Créer la fiche utilisateur dans Firestore
    if (credentials.user) {
      const userDocRef = doc(db, 'users', credentials.user.uid);
      // Fiche profil
      await addDoc(collection(db, 'profiles'), {
        uid: credentials.user.uid,
        name,
        email,
        phone,
        country,
        region,
        role: 'citizen',
        verified: false,
        avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
        trustScore: 50,
        createdAt: new Date().toISOString()
      });
    }
    return true;
  } catch (error) {
    console.error('Erreur d\'inscription Firebase :', error);
    throw error;
  }
};

/**
 * Connexion classique Email / Mot de passe.
 */
export const loginWithEmail = async (email: string, pass: string, rememberMe: boolean = true) => {
  try {
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceType);

    const credentials = await signInWithPassword(email, pass);
    return credentials.user;
  } catch (error) {
    console.error('Erreur de connexion Firebase :', error);
    throw error;
  }
};

// Fonction utilitaire interne pour éviter le conflit de nom
const signInWithPassword = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

/**
 * Déconnexion complète de la session.
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erreur lors de la déconnexion Firebase :', error);
  }
};

/* 
================================================================================
PARTIE 2 : BASE DE DONNÉES FIRESTORE (Petitions, Cagnottes)
================================================================================
*/

/**
 * Charger toutes les cagnottes enregistrées dans Firestore.
 */
export const fetchCagnottesFromFirestore = async (): Promise<Cagnotte[]> => {
  try {
    const cagnottesRef = collection(db, 'cagnottes');
    const q = query(cagnottesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const cagnottes: Cagnotte[] = [];
    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      cagnottes.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        coverImage: data.coverImage,
        category: data.category,
        amountCollected: data.amountCollected || 0,
        amountTarget: data.amountTarget,
        location: data.location,
        createdAt: data.createdAt,
        status: data.status,
        organizer: data.organizer,
        isDiasporaTargeted: data.isDiasporaTargeted,
        updates: data.updates || [],
        expenses: data.expenses || [],
        donors: data.donors || [],
        documents: data.documents || [],
        gallery: data.gallery || [],
        viewedByAdmin: data.viewedByAdmin || false,
        rejectionFeedback: data.rejectionFeedback
      });
    });
    return cagnottes;
  } catch (error) {
    console.error('Erreur de récupération Firestore cagnottes :', error);
    return [];
  }
};

/**
 * Soumission d'une nouvelle cagnotte dans la base Firestore.
 */
export const addCagnotteToFirestore = async (cagnotte: Omit<Cagnotte, 'id' | 'amountCollected' | 'createdAt' | 'status' | 'organizer' | 'updates' | 'expenses' | 'donors'>, organizerUser: User) => {
  try {
    const docRef = await addDoc(collection(db, 'cagnottes'), {
      title: cagnotte.title,
      description: cagnotte.description,
      coverImage: cagnotte.coverImage,
      category: cagnotte.category,
      amountTarget: cagnotte.amountTarget,
      location: cagnotte.location,
      isDiasporaTargeted: cagnotte.isDiasporaTargeted,
      documents: cagnotte.documents || [],
      gallery: cagnotte.gallery || [],
      status: 'pending',
      amountCollected: 0,
      viewedByAdmin: false,
      createdAt: new Date().toISOString().split('T')[0],
      organizer: {
        id: organizerUser.id,
        name: organizerUser.name,
        avatar: organizerUser.avatar,
        verified: organizerUser.verified,
        trustScore: organizerUser.trustScore
      },
      updates: [],
      expenses: [],
      donors: []
    });
    return docRef.id;
  } catch (error) {
    console.error('Erreur de création de cagnotte Firestore :', error);
    throw error;
  }
};

/**
 * Modifier le statut "Vu par l'administrateur" d'une campagne.
 */
export const updateCampaignViewedInFirestore = async (id: string, type: 'petition' | 'cagnotte') => {
  const campaignDocRef = doc(db, type === 'petition' ? 'petitions' : 'cagnottes', id);
  await updateDoc(campaignDocRef, {
    viewedByAdmin: true
  });
};

/**
 * Approuver la publication d'une campagne.
 */
export const approveCampaignInFirestore = async (id: string, type: 'petition' | 'cagnotte') => {
  const campaignDocRef = doc(db, type === 'petition' ? 'petitions' : 'cagnottes', id);
  await updateDoc(campaignDocRef, {
    status: 'active',
    viewedByAdmin: true
  });
};

/**
 * Rejeter une campagne et stocker le motif de retour.
 */
export const rejectCampaignInFirestore = async (id: string, type: 'petition' | 'cagnotte', feedback: string) => {
  const campaignDocRef = doc(db, type === 'petition' ? 'petitions' : 'cagnottes', id);
  await updateDoc(campaignDocRef, {
    status: 'rejected',
    rejectionFeedback: feedback,
    viewedByAdmin: true
  });
};

/* 
================================================================================
PARTIE 3 : ECOUTE TEMPS REEL (REALTIME UPDATES - SNAPSHOTS)
================================================================================
*/

/**
 * Ecouteur temps réel sur un document spécifique (Pétition ou Cagnotte).
 * Permet au créateur de voir instantanément le stepper de suivi se mettre à jour en direct.
 * @param id ID du document
 * @param type Type de campagne
 * @param callback Callback recevant les nouvelles données du document
 */
export const listenToCampaignDetails = (
  id: string,
  type: 'petition' | 'cagnotte',
  callback: (data: any) => void
) => {
  const docRef = doc(db, type === 'petition' ? 'petitions' : 'cagnottes', id);
  return onSnapshot(docRef, (docSnap: any) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    }
  });
};

import React, { createContext, useContext, useState } from 'react';

export type Language = 'fr' | 'wo' | 'en';

export const translations = {
  fr: {
    // Navigation
    "nav.home": "Accueil",
    "nav.petitions": "Pétitions",
    "nav.cagnottes": "Cagnottes",
    "nav.benevolat": "Bénévolat",
    "nav.tontines": "Tontines 🪙",
    "nav.diaspora": "Diaspora",
    "nav.admin": "Admin 🛡️",
    "nav.profile": "Profil",
    "nav.login": "Se connecter",
    "nav.logout": "Déconnexion",
    "nav.explorer": "Explorer 🔍",
    "nav.create": "Lancer un projet",

    // Common Buttons / Labels
    "btn.cancel": "Annuler",
    "btn.confirm": "Confirmer",
    "btn.save": "Enregistrer",
    "btn.delete": "Supprimer",
    "btn.send": "Envoyer",
    "btn.close": "Fermer",
    "btn.back": "Retour",
    "btn.sign": "Signer",
    "btn.donate": "Faire un don",
    "btn.apply": "Participer",
    "btn.view": "Voir les détails",
    "btn.create": "Créer",
    "btn.edit": "Modifier",
    "btn.search": "Rechercher",
    
    // Status
    "status.active": "Actif",
    "status.pending": "En attente",
    "status.completed": "Complété",
    "status.rejected": "Rejeté",
    "status.verified": "Identité Certifiée",
    "status.not_verified": "Non certifié",

    // Home Page
    "home.welcome": "Bienvenue sur Sunu Yité 🇸🇳",
    "home.tagline": "La plateforme citoyenne d'entraide, de pétitions et de tontines pour le Sénégal et la diaspora.",
    "home.hero.cta1": "Découvrir toutes les causes",
    "home.hero.cta2": "Lancer une initiative",
    "home.stats.users": "Citoyens engagés",
    "home.stats.funds": "Fonds récoltés",
    "home.stats.petitions": "Pétitions actives",
    "home.stats.tontines": "Cercles d'épargne",
    "home.section.petitions": "Pétitions Populaires",
    "home.section.cagnottes": "Cagnottes de Solidarité",
    "home.section.tontines": "Tontines Citoyennes actives",
    "home.section.benevolat": "Missions de Bénévolat urgentes",
    "home.contact.title": "Contacter l'administrateur",
    "home.contact.name": "Votre prénom et nom",
    "home.contact.email": "Votre adresse e-mail",
    "home.contact.message": "Votre message",
    "home.contact.submit": "Envoyer le message",

    // KYC & Profile
    "profile.title": "Votre Profil Citoyen",
    "profile.status": "Statut de confiance",
    "profile.trust": "Score de confiance",
    "profile.badge": "Badge de fidélité",
    "profile.kyc.alert.title": "Certification d'identité requise",
    "profile.kyc.alert.desc": "Pour créer des tontines, vous devez effectuer la vérification biométrique (CNI + Selfie).",
    "profile.kyc.pending": "Votre dossier KYC est en cours d'examen par les administrateurs.",
    "profile.kyc.start": "Lancer la vérification biométrique",
    "profile.danger_zone": "Zone de Danger",
    "profile.delete_account": "Supprimer mon compte définitivement",
    
    // Explorer
    "explore.title": "Explorer les Initiatives Citoyennes",
    "explore.search_placeholder": "Rechercher une pétition, cagnotte, tontine ou mission...",
    "explore.tabs.all": "Tous",
    "explore.tabs.petitions": "Pétitions",
    "explore.tabs.cagnottes": "Cagnottes",
    "explore.tabs.tontines": "Tontines",
    "explore.tabs.benevolat": "Bénévolat",
    
    // Notifications & Messages
    "msg.chat_title": "Messagerie Citoyenne",
    "msg.chat_placeholder": "Écrivez votre message..."
  },
  wo: {
    // Navigation
    "nav.home": "Kër gi",
    "nav.petitions": "Tënk yi",
    "nav.cagnottes": "Ndaje Koppar",
    "nav.benevolat": "Waakirlu",
    "nav.tontines": "Tontine yi 🪙",
    "nav.diaspora": "Bitim reew",
    "nav.admin": "Njiit li 🛡️",
    "nav.profile": "Sama Profil",
    "nav.login": "Duggu",
    "nav.logout": "Téy jóge",
    "nav.explorer": "Seet 🔍",
    "nav.create": "Sos sa projet",

    // Common Buttons / Labels
    "btn.cancel": "Baal ko",
    "btn.confirm": "Dëggal",
    "btn.save": "Denc",
    "btn.delete": "Far",
    "btn.send": "Yonne",
    "btn.close": "Tëj",
    "btn.back": "Delu guinaw",
    "btn.sign": "Xaatim",
    "btn.donate": "Joxe ndimbal",
    "btn.apply": "Waakirlu",
    "btn.view": "Xool leen",
    "btn.create": "Sos",
    "btn.edit": "Sofi",
    "btn.search": "Wër",

    // Status
    "status.active": "Mu ngi dox",
    "status.pending": "Mu ngi xar",
    "status.completed": "Sotina",
    "status.rejected": "Dacc",
    "status.verified": "Identité Dëggal",
    "status.not_verified": "Dëggalu goñu",

    // Home Page
    "home.welcome": "Dalal ak jàmm ci Sunu Yité 🇸🇳",
    "home.tagline": "Dendaal ci solidariite, tënk yi ak tontine yi ngir Senegal ak bitim reew.",
    "home.hero.cta1": "Xool sa yëf yépp",
    "home.hero.cta2": "Sos sa jëf",
    "home.stats.users": "Citoyen yu waakirlu",
    "home.stats.funds": "Alal yu ndaje",
    "home.stats.petitions": "Tënk yi dox",
    "home.stats.tontines": "Mbooloo tontine",
    "home.section.petitions": "Tënk yi gënë rëy",
    "home.section.cagnottes": "Dimbali Ndaje Koppar",
    "home.section.tontines": "Tontine yi dox",
    "home.section.benevolat": "Liggey cofeel yu jamp",
    "home.contact.title": "Waxtaan ak Njiit li",
    "home.contact.name": "Sa tur ak sa sant",
    "home.contact.email": "Sa imel",
    "home.contact.message": "Sa bataaxal",
    "home.contact.submit": "Yonne bataaxal bi",

    // KYC & Profile
    "profile.title": "Sa Profil Citoyen",
    "profile.status": "Wolo gu am",
    "profile.trust": "Score wolo bi",
    "profile.badge": "Badge Kollaare",
    "profile.kyc.alert.title": "Dëggal sa dund bi la farata",
    "profile.kyc.alert.desc": "Ngir tontine yi, war nga dëggal sa dund ak sa carte CNI ak selfie.",
    "profile.kyc.pending": "Njiit yi ñu ngi xool sa dëggal dund.",
    "profile.kyc.start": "Dëggal sa dund",
    "profile.danger_zone": "Bërëbù danger",
    "profile.delete_account": "Far sama compte ba faww",

    // Explorer
    "explore.title": "Seet sa yëfi citoyen",
    "explore.search_placeholder": "Rechercher tënk, ndaje alal, tontine walla liggey...",
    "explore.tabs.all": "Yépp",
    "explore.tabs.petitions": "Tënk yi",
    "explore.tabs.cagnottes": "Koppar yi",
    "explore.tabs.tontines": "Tontine",
    "explore.tabs.benevolat": "Waakirlu",

    // Notifications & Messages
    "msg.chat_title": "Waxtaani Citoyen",
    "msg.chat_placeholder": "Mbind sa bataaxal..."
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.petitions": "Petitions",
    "nav.cagnottes": "Fundraising",
    "nav.benevolat": "Volunteering",
    "nav.tontines": "Tontines 🪙",
    "nav.diaspora": "Diaspora",
    "nav.admin": "Admin 🛡️",
    "nav.profile": "Profile",
    "nav.login": "Login",
    "nav.logout": "Logout",
    "nav.explorer": "Explore 🔍",
    "nav.create": "Launch Project",

    // Common Buttons / Labels
    "btn.cancel": "Cancel",
    "btn.confirm": "Confirm",
    "btn.save": "Save",
    "btn.delete": "Delete",
    "btn.send": "Send",
    "btn.close": "Close",
    "btn.back": "Back",
    "btn.sign": "Sign",
    "btn.donate": "Donate",
    "btn.apply": "Volunteer",
    "btn.view": "View Details",
    "btn.create": "Create",
    "btn.edit": "Edit",
    "btn.search": "Search",

    // Status
    "status.active": "Active",
    "status.pending": "Pending",
    "status.completed": "Completed",
    "status.rejected": "Rejected",
    "status.verified": "Verified Identity",
    "status.not_verified": "Unverified",

    // Home Page
    "home.welcome": "Welcome to Sunu Yité 🇸🇳",
    "home.tagline": "The civic mutual aid, petition, and tontine platform for Senegal and the diaspora.",
    "home.hero.cta1": "Explore all causes",
    "home.hero.cta2": "Launch an initiative",
    "home.stats.users": "Active Citizens",
    "home.stats.funds": "Funds Collected",
    "home.stats.petitions": "Active Petitions",
    "home.stats.tontines": "Savings Circles",
    "home.section.petitions": "Popular Petitions",
    "home.section.cagnottes": "Solidarity Campaigns",
    "home.section.tontines": "Active Civic Tontines",
    "home.section.benevolat": "Urgent Volunteer Missions",
    "home.contact.title": "Contact the Administrator",
    "home.contact.name": "Your full name",
    "home.contact.email": "Your email address",
    "home.contact.message": "Your message",
    "home.contact.submit": "Send Message",

    // KYC & Profile
    "profile.title": "Your Citizen Profile",
    "profile.status": "Trust Status",
    "profile.trust": "Trust Score",
    "profile.badge": "Fidelity Badge",
    "profile.kyc.alert.title": "Identity verification required",
    "profile.kyc.alert.desc": "To participate in savings circles (tontines), you must verify your identity (ID + Selfie).",
    "profile.kyc.pending": "Your KYC files are being reviewed by administrators.",
    "profile.kyc.start": "Start Biometric Verification",
    "profile.danger_zone": "Danger Zone",
    "profile.delete_account": "Permanently delete my account",

    // Explorer
    "explore.title": "Explore Civic Initiatives",
    "explore.search_placeholder": "Search a petition, campaign, tontine or mission...",
    "explore.tabs.all": "All",
    "explore.tabs.petitions": "Petitions",
    "explore.tabs.cagnottes": "Campaigns",
    "explore.tabs.tontines": "Tontines",
    "explore.tabs.benevolat": "Volunteering",

    // Notifications & Messages
    "msg.chat_title": "Citizen Messenger",
    "msg.chat_placeholder": "Write your message..."
  }
};

type TranslationKey = keyof typeof translations['fr'];

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('samacause_lang');
    return (saved as Language) || 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('samacause_lang', lang);
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations['fr'];
    return dict[key] || translations['fr'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

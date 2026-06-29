import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface WolofVoiceAssistantProps {
  onNavigate: (page: string, params?: any) => void;
}

type Step = 'welcome' | 'type' | 'title' | 'description' | 'amount' | 'confirm';

export const WolofVoiceAssistant: React.FC<WolofVoiceAssistantProps> = ({ onNavigate }) => {
  const { language: currentLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('welcome');
  const [selectedLang, setSelectedLang] = useState<'wo' | 'fr'>('wo');
  const [isMuted, setIsMuted] = useState(false);
  
  // Conversation data
  const [campaignType, setCampaignType] = useState<'cagnotte' | 'petition' | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Speech states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [keyboardInput, setKeyboardInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Content for each step (Wolof Text, French Text, and French-phonetic Wolof for TTS)
  const stepsConfig: Record<Step, {
    textWo: string;
    textFr: string;
    speakWo: string; // Phonetic Wolof for French TTS
    speakFr: string;
    suggestionsFr: string[];
    suggestionsWo: string[];
  }> = {
    welcome: {
      textWo: "Salamalékoum ! Man la Sunu Yité IA. Bëgg nga samp cagnotte wala pétition ? Waxal rek, ma ngi lay déglu...",
      textFr: "Bonjour ! Je suis l'IA de Sunu Yité. Voulez-vous créer une cagnotte ou une pétition ? Parlez, je vous écoute...",
      speakWo: "Salamalékoum ! Mane la Sounou Yité I Ah. Beugue nga sampe cagnotte wala pétissione ? Wahal rek, ma ngui laye déglou...",
      speakFr: "Bonjour ! Je suis l'assistant de Sunu Yité. Voulez-vous créer une cagnotte solidaire ou une pétition ? Dites-le moi.",
      suggestionsFr: ["Créer une cagnotte", "Créer une pétition"],
      suggestionsWo: ["Cagnotte (Caisse)", "Pétition (Doléance)"]
    },
    type: {
      textWo: "Cagnotte (caisse de solidarité) nga bëgg walla pétition (doleel) ?",
      textFr: "Souhaitez-vous lancer une cagnotte solidaire ou une pétition ?",
      speakWo: "Cagnotte wala pétissione nga beugue ?",
      speakFr: "Souhaitez-vous lancer une cagnotte solidaire ou une pétition ?",
      suggestionsFr: ["Cagnotte", "Pétition"],
      suggestionsWo: ["Cagnotte", "Pétition"]
    },
    title: {
      textWo: "Lan moy taxawayu sa projet ? (Ex: Forage Ndande, Sekk école)",
      textFr: "Quel est le titre ou l'objectif de votre projet ? (Ex: Forage pour Ndande, Réfection d'école)",
      speakWo: "Lane moye tahawayou sa projet ? Wahal ma ci lou gat.",
      speakFr: "Quel est le titre ou l'objectif principal de votre projet ? Dites-le moi.",
      suggestionsFr: ["Forage pour de l'eau", "Aide à la maternité", "Soutien scolaire"],
      suggestionsWo: ["Forage ndox", "Hopital", "Ligueyou école"]
    },
    description: {
      textWo: "Wax ma ci lu leeraŋ lane la, ndax nit ñi mën la jappale. (Détails)",
      textFr: "Donnez-moi quelques détails sur le problème et vos besoins.",
      speakWo: "Wahal ma ci lou lérane lane la, ndah nite gni mane la diapale.",
      speakFr: "Donnez-moi plus de détails sur le problème et ce que vous comptez faire.",
      suggestionsFr: ["On manque d'eau potable", "Pour acheter du matériel de santé", "Aider les enfants du village"],
      suggestionsWo: ["Dagnou amoul ndoh", "Hopital dafa manqué matériel", "Dimbali ndaw yi"]
    },
    amount: {
      textWo: "Ñaata xalis nga bëgg dajale (ci CFA) ? (Ex: 1 million, 500 000)",
      textFr: "Combien d'argent souhaitez-vous collecter en CFA ? (Ex: 1 million, 500 000)",
      speakWo: "Niata haliss nga beugue dadialé ci Cé Effe Ah ?",
      speakFr: "Combien d'argent souhaitez-vous récolter pour cette cause, en francs CFA ?",
      suggestionsFr: ["500 000 CFA", "1 000 000 CFA", "2 000 000 CFA"],
      suggestionsWo: ["500 000 CFA", "1 000 000 CFA", "2 000 000 CFA"]
    },
    confirm: {
      textWo: "Paré na ! Léegi, bind na sa projet. Xoolal sa écran te door ko.",
      textFr: "C'est prêt ! J'ai rédigé votre projet. Vous pouvez maintenant le valider et le lancer.",
      speakWo: "Paré na ! Léghi, binde na sa projet. Hoolal sa écran té dor ko.",
      speakFr: "C'est parfait ! J'ai complété votre dossier. Vous pouvez maintenant le vérifier sur l'écran et le publier.",
      suggestionsFr: ["Publier ma cause 🚀"],
      suggestionsWo: ["Wakh ko 🚀"]
    }
  };

  // Speak function
  const speakCurrentStep = (stepVal: Step, langVal: 'wo' | 'fr') => {
    if (isMuted || !synthRef.current) return;

    // Cancel any active speech
    synthRef.current.cancel();

    const config = stepsConfig[stepVal];
    const textToSpeak = langVal === 'wo' ? config.speakWo : config.speakFr;

    utteranceRef.current = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current.lang = 'fr-FR'; // French voice delivers our phonetic Wolof best!
    
    // Explicitly set a French voice to avoid default system voice (which might be English)
    const voices = synthRef.current.getVoices();
    const frenchVoice = voices.find(voice => voice.lang.toLowerCase().startsWith('fr'));
    if (frenchVoice) {
      utteranceRef.current.voice = frenchVoice;
    }
    
    utteranceRef.current.rate = 0.95;    // Slightly slower for better comprehension

    utteranceRef.current.onstart = () => setIsSpeaking(true);
    utteranceRef.current.onend = () => {
      setIsSpeaking(false);
      // Automatically start listening after speaking the question, except on the final confirmation step
      if (stepVal !== 'confirm') {
        startListening();
      }
    };
    utteranceRef.current.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utteranceRef.current);
  };

  // Warm up voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'fr-FR'; // We listen in French/Senegalese French code-switching
      
      rec.onstart = () => {
        setIsListening(true);
        setErrorMessage('');
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
        if (e.error === 'no-speech') {
          // Silent fallback or repeat
        } else {
          setErrorMessage("Impossible de capter l'audio. Essayez d'écrire ou de cliquer.");
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
        handleUserInput(resultText);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [selectedLang]);

  // Auto-scroll conversation body to bottom
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [step, transcript, isOpen]);

  // Start Voice Assistant
  const openAssistant = () => {
    setIsOpen(true);
    setStep('welcome');
    setCampaignType(null);
    setTitle('');
    setDescription('');
    setAmount('');
    setTranscript('');
    setKeyboardInput('');
    setErrorMessage('');
    
    // Speak welcome message
    setTimeout(() => {
      speakCurrentStep('welcome', selectedLang);
    }, 300);
  };

  const closeAssistant = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.abort();
    setIsOpen(false);
  };

  const startListening = () => {
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.abort();
        setTimeout(() => {
          recognitionRef.current.start();
        }, 100);
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Main logic to parse and handle user response
  const handleUserInput = (inputVal: string) => {
    if (!inputVal.trim()) return;

    setTranscript(inputVal);
    const textLower = inputVal.toLowerCase();

    if (step === 'welcome' || step === 'type') {
      // Intent parsing
      const isCagnotte = textLower.includes('cagnotte') || 
                        textLower.includes('caisse') || 
                        textLower.includes('argent') || 
                        textLower.includes('khaliss') || 
                        textLower.includes('kopar') ||
                        textLower.includes('don');
      const isPetition = textLower.includes('pétition') || 
                        textLower.includes('petition') || 
                        textLower.includes('doleel') || 
                        textLower.includes('signature') || 
                        textLower.includes('plainte') ||
                        textLower.includes('signer');

      if (isCagnotte) {
        setCampaignType('cagnotte');
        setStep('title');
        speakCurrentStep('title', selectedLang);
      } else if (isPetition) {
        setCampaignType('petition');
        setStep('title');
        speakCurrentStep('title', selectedLang);
      } else {
        // Did not understand. Repeat question
        setStep('type');
        speakCurrentStep('type', selectedLang);
      }
    } else if (step === 'title') {
      setTitle(inputVal);
      setStep('description');
      speakCurrentStep('description', selectedLang);
    } else if (step === 'description') {
      setDescription(inputVal);
      if (campaignType === 'cagnotte') {
        setStep('amount');
        speakCurrentStep('amount', selectedLang);
      } else {
        setStep('confirm');
        speakCurrentStep('confirm', selectedLang);
      }
    } else if (step === 'amount') {
      // Parse amount digits
      const digits = inputVal.replace(/\D/g, '');
      const parsedAmount = digits ? digits : '1000000'; // Default to 1M if not clear
      setAmount(parsedAmount);
      setStep('confirm');
      speakCurrentStep('confirm', selectedLang);
    }
  };

  // Trigger submission to main page
  const handleFinalize = () => {
    if (synthRef.current) synthRef.current.cancel();

    const targetPage = campaignType === 'cagnotte' ? 'cagnottes' : 'petitions';
    const finalData = {
      title: title || (campaignType === 'cagnotte' ? 'Cagnotte solidaire' : 'Pétition citoyenne'),
      description: description || 'Projet créé via l\'assistant vocal Sunu Yité.',
      amountTarget: campaignType === 'cagnotte' ? (Number(amount) || 1000000) : undefined
    };

    closeAssistant();
    
    // Navigate with pre-filled state
    onNavigate(targetPage, { 
      view: 'create',
      aiAppliedData: finalData
    });
  };

  const handleSuggestionSelect = (sug: string) => {
    handleUserInput(sug);
  };

  const handleKeyboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyboardInput.trim()) return;
    const inputToProcess = keyboardInput;
    setKeyboardInput('');
    handleUserInput(inputToProcess);
  };

  return (
    <>
      {/* 1. FLOATING AUDIO ICON */}
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px'
        }}
      >
        <button
          onClick={openAssistant}
          className="animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #00853f 0%, #fdef42 50%, #e31b23 100%)',
            border: 'none',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            boxShadow: '0 8px 32px rgba(0, 133, 63, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'transform 0.2s ease',
            color: '#1f2937'
          }}
          title="Waxal ci Wolof / Parler en Wolof"
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ fontSize: '1.8rem' }}>🎙️</span>
          <span 
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#e31b23',
              color: 'white',
              fontSize: '0.6rem',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 'bold',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            Wolof / FR
          </span>
        </button>
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1.5px solid var(--border-light)',
            color: 'var(--text-primary)',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            padding: '4px 10px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          🎙️ Waxal ci Wolof / Audio
        </div>
      </div>

      {/* 2. MODAL VOICE INTERFACE */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}
        >
          <div 
            className="glass"
            style={{
              width: '100%',
              maxWidth: '480px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
          >
            {/* Header */}
            <div 
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.5)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🎙️</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Waxal ci Wolof / Assistant IA</h4>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary-light)' }}>
                    {step === 'confirm' ? 'Création de la cause' : `Étape ${step === 'welcome' ? 1 : step === 'type' ? 1 : step === 'title' ? 2 : step === 'description' ? 3 : 4} sur 5`}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Language Switcher */}
                <button
                  onClick={() => {
                    const nextLang = selectedLang === 'wo' ? 'fr' : 'wo';
                    setSelectedLang(nextLang);
                    speakCurrentStep(step, nextLang);
                  }}
                  className="btn"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    background: 'var(--light)',
                    borderRadius: '8px',
                    minWidth: 'auto',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  🌐 {selectedLang === 'wo' ? 'Wolof 🇸🇳' : 'Français 🇫🇷'}
                </button>

                {/* Mute Button */}
                <button
                  onClick={toggleMute}
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: '1.1rem', minWidth: 'auto' }}
                  title={isMuted ? "Activer le son" : "Désactiver le son"}
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>

                {/* Close Button */}
                <button 
                  onClick={closeAssistant} 
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: '1.1rem', minWidth: 'auto' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* AI Assistant Body */}
            <div 
              ref={bodyRef}
              style={{
                flex: 1,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                overflowY: 'auto',
                minHeight: '260px'
              }}
            >
              {/* Visual Waveform Animation */}
              <div 
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: isListening 
                    ? 'rgba(239, 68, 68, 0.15)' 
                    : isSpeaking 
                      ? 'rgba(0, 133, 63, 0.15)' 
                      : 'rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                {/* Outer pulsing rings */}
                {(isListening || isSpeaking) && (
                  <>
                    <div 
                      className="absolute animate-ping"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: `2px solid ${isListening ? '#ef4444' : '#00853f'}`,
                        opacity: 0.4
                      }}
                    />
                    <div 
                      className="absolute animate-ping"
                      style={{
                        width: '120%',
                        height: '120%',
                        borderRadius: '50%',
                        border: `1px solid ${isListening ? '#ef4444' : '#00853f'}`,
                        opacity: 0.2,
                        animationDelay: '0.3s'
                      }}
                    />
                  </>
                )}

                <div 
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: isListening 
                      ? '#ef4444' 
                      : isSpeaking 
                        ? 'var(--primary)' 
                        : 'var(--text-secondary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  {isListening ? '🎙️' : '🤖'}
                </div>
              </div>

              {/* Status Message */}
              <div style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: isListening ? '#ef4444' : isSpeaking ? 'var(--primary)' : 'var(--text-secondary-light)' }}>
                {isListening ? 'Déglu la... Waxal (À l\'écoute... Parlez)' : isSpeaking ? 'Wax IA (L\'IA parle...)' : 'Cliquer sur le micro pour parler'}
              </div>

              {/* AI Question Box */}
              <div 
                style={{
                  width: '100%',
                  background: 'white',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🤖</span>
                  <span style={{ fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)' }}>Sunu Yité IA</span>
                </div>

                {/* Wolof display */}
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                  {stepsConfig[step].textWo}
                </p>
                {/* French subtext */}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', margin: 0, fontStyle: 'italic', lineHeight: 1.3 }}>
                  {stepsConfig[step].textFr}
                </p>
              </div>

              {/* User transcript (if recognized) */}
              {(transcript || errorMessage) && (
                <div 
                  style={{
                    width: '100%',
                    background: 'rgba(0, 133, 63, 0.05)',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    border: errorMessage ? '1px dashed #ef4444' : '1px solid rgba(0, 133, 63, 0.1)',
                    alignSelf: 'flex-end'
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1rem' }}>👤</span>
                      <span style={{ fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary-light)' }}>Yow (Vous)</span>
                    </div>
                    {isListening && <span className="animate-pulse" style={{ fontSize: '0.65rem', color: '#ef4444' }}>🔴 Écoute</span>}
                  </div>
                  {errorMessage ? (
                    <p style={{ fontSize: '0.8rem', color: '#ef4444', margin: 0 }}>{errorMessage}</p>
                  ) : (
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                      « {transcript} »
                    </p>
                  )}
                </div>
              )}

              {/* Suggestions shortcuts */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary-light)' }}>Suggestions / Lal ko :</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(selectedLang === 'wo' ? stepsConfig[step].suggestionsWo : stepsConfig[step].suggestionsFr).map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionSelect(sug)}
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        borderRadius: '16px',
                        background: 'white',
                        border: '1.5px solid var(--border-light)',
                        color: 'var(--primary)',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Summary (shows what has been gathered so far) */}
              {(campaignType || title || description || amount) && (
                <div 
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.02)',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px', marginBottom: '4px' }}>
                    📋 Projet rédigé :
                  </div>
                  {campaignType && (
                    <div>
                      <strong>Type :</strong> {campaignType === 'cagnotte' ? 'Cagnotte 💰' : 'Pétition ✍️'}
                    </div>
                  )}
                  {title && (
                    <div>
                      <strong>Objet :</strong> {title}
                    </div>
                  )}
                  {description && (
                    <div>
                      <strong>Description :</strong> {description}
                    </div>
                  )}
                  {campaignType === 'cagnotte' && amount && (
                    <div>
                      <strong>Montant cible :</strong> {Number(amount).toLocaleString('fr-FR')} CFA 💰
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with Manual Input and Controls */}
            <div 
              style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border-light)',
                background: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {step !== 'confirm' ? (
                // Input form to type manually
                <form onSubmit={handleKeyboardSubmit} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Tapez ici si vous préférez écrire..."
                    value={keyboardInput}
                    onChange={(e) => setKeyboardInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      border: '1.5px solid var(--border-light)',
                      borderRadius: '16px',
                      fontSize: '0.8rem',
                      outline: 'none',
                      background: 'white'
                    }}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', borderRadius: '16px', fontSize: '0.8rem', minWidth: 'auto' }}
                  >
                    Valider
                  </button>
                </form>
              ) : (
                // Final confirm / apply button
                <button
                  onClick={handleFinalize}
                  className="btn btn-primary animate-pulse"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '16px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(0, 133, 63, 0.3)'
                  }}
                >
                  🚀 {selectedLang === 'wo' ? 'Créer sa cause' : 'Lancer ma cause maintenant'}
                </button>
              )}

              {/* Repeat / mic button for accessibility */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={() => speakCurrentStep(step, selectedLang)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '8px', borderRadius: '16px', fontSize: '0.75rem', gap: '4px' }}
                >
                  🔊 Déggalaat (Réécouter)
                </button>
                {step !== 'confirm' && (
                  <button
                    onClick={startListening}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '8px', borderRadius: '16px', fontSize: '0.75rem', background: '#ef4444', borderColor: '#ef4444', color: 'white', gap: '4px' }}
                    disabled={isListening}
                  >
                    🎙️ Waxal (Parler)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

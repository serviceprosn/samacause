import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

interface SidebarIAProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData?: (data: { title: string; description: string; petitionText?: string }) => void;
}

export const SidebarIA: React.FC<SidebarIAProps> = ({ isOpen, onClose, onApplyData }) => {
  const { chatHistory, sendIAMessage, clearChat } = useApp();
  const { language, t } = useLanguage();
  const [input, setInput] = useState('');
  const [campaignType, setCampaignType] = useState<'petition' | 'cagnotte' | 'both'>('petition');
  const [tone, setTone] = useState('Mobilisateur');
  const [isGenerating, setIsGenerating] = useState(false);

  const messagesBodyRef = useRef<HTMLDivElement>(null);

  const tones = ['Mobilisateur', 'Urgent', 'Engagé'];

  const getToneLabel = (tVal: string) => {
    if (tVal === 'Mobilisateur') {
      return language === 'wo' ? 'Dooleel' : language === 'en' ? 'Mobilizing' : 'Mobilisateur';
    }
    if (tVal === 'Urgent') {
      return language === 'wo' ? 'Jamp' : language === 'en' ? 'Urgent' : 'Urgent';
    }
    return language === 'wo' ? 'Waakirlu' : language === 'en' ? 'Committed' : 'Engagé';
  };

  const scrollToBottom = () => {
    if (messagesBodyRef.current) {
      messagesBodyRef.current.scrollTop = messagesBodyRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    setIsGenerating(true);
    sendIAMessage(input, campaignType, tone);
    setInput('');

    // Turn off typing animation after 1.6s
    setTimeout(() => {
      setIsGenerating(false);
    }, 1600);
  };

  const handleSuggestionClick = (sug: string) => {
    setInput(sug);
  };

  const handleApply = (res: any) => {
    if (onApplyData && res) {
      onApplyData({
        title: res.title,
        description: res.description,
        petitionText: res.petitionText
      });
      onClose();
    }
  };

  return (
    <div className={`ai-assistant-drawer ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div 
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--dark)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🤖</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{t('sidebar.title')}</h3>
            <span style={{ fontSize: '0.65rem', color: 'var(--secondary)' }}>{t('sidebar.subtitle')}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-ghost" 
            style={{ padding: '0.2rem 0.4rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }} 
            onClick={clearChat}
          >
            {t('sidebar.clear')}
          </button>
          <button 
            className="btn btn-ghost" 
            style={{ padding: '0.2rem 0.4rem', color: 'white', fontSize: '1.1rem' }} 
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Message History */}
      <div 
        ref={messagesBodyRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1.25rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          background: 'var(--light)'
        }}
      >
        {chatHistory.map((msg) => (
          <div 
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              width: '100%'
            }}
          >
            <div 
              style={{
                maxWidth: '85%',
                padding: '0.85rem 1.1rem',
                borderRadius: '16px',
                borderBottomLeftRadius: msg.sender === 'ia' ? '2px' : '16px',
                borderBottomRightRadius: msg.sender === 'user' ? '2px' : '16px',
                background: msg.sender === 'user' ? 'var(--primary)' : 'var(--light-card)',
                color: msg.sender === 'user' ? 'white' : 'var(--text-primary-light)',
                border: msg.sender === 'ia' ? '1px solid var(--border-light)' : 'none',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '0.85rem',
                lineHeight: 1.4,
                whiteSpace: 'pre-line'
              }}
            >
              {msg.text}

              {/* Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                  {msg.suggestions.map((sug) => (
                    <button
                      key={sug}
                      className="btn"
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--light)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--primary)'
                      }}
                      onClick={() => handleSuggestionClick(sug)}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Generated blocks attachment */}
            {msg.generationResult && (
              <div 
                className="premium-card animate-fade-in" 
                style={{ 
                  marginTop: '0.75rem', 
                  width: '95%', 
                  background: 'var(--light-card)', 
                  border: '1.5px solid var(--secondary)',
                  padding: '1rem',
                  fontSize: '0.8rem'
                }}
              >
                <h5 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>📋 {t('sidebar.elements')}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)' }}>{t('sidebar.formatted')}</span>
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div>
                    <strong>{t('sidebar.camp_title')}</strong>
                    <div style={{ background: 'var(--light)', padding: '0.35rem', borderRadius: '4px', marginTop: '0.15rem' }}>{msg.generationResult.title}</div>
                  </div>
                  <div>
                    <strong>{t('sidebar.facebook')}</strong>
                    <div style={{ background: 'var(--light)', padding: '0.35rem', borderRadius: '4px', marginTop: '0.15rem', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                      {msg.generationResult.facebookPost}
                    </div>
                  </div>
                  <div>
                    <strong>{t('sidebar.whatsapp')}</strong>
                    <div style={{ background: 'var(--light)', padding: '0.35rem', borderRadius: '4px', marginTop: '0.15rem', whiteSpace: 'pre-wrap' }}>
                      {msg.generationResult.whatsappMessage}
                    </div>
                  </div>
                  {/* Digital Flyer Mock */}
                  <div>
                    <strong>{t('sidebar.flyer_preview')}</strong>
                    <div style={{ marginTop: '0.35rem', overflow: 'hidden', borderRadius: '10px' }}>
                      <div style={{ 
                        background: tone === 'Urgent' ? 'radial-gradient(circle, #7f1d1d 0%, #111827 100%)' : 'radial-gradient(circle, #064e3b 0%, #111827 100%)',
                        color: 'white',
                        padding: '1.25rem',
                        textAlign: 'center',
                        border: '2px solid var(--secondary)'
                      }}>
                        <span style={{ fontSize: '0.6rem', background: 'var(--secondary)', color: 'black', padding: '0.15rem 0.4rem', borderRadius: '9999px', fontWeight: 'bold' }}>
                          {t('sidebar.flyer_title')}
                        </span>
                        <h6 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0.5rem 0 0.25rem', color: '#fff' }}>
                          {msg.generationResult.title}
                        </h6>
                        <p style={{ fontSize: '0.65rem', opacity: 0.8, lineHeight: 1.3, margin: '0 0 0.5rem' }}>
                          {msg.generationResult.description.slice(0, 100)}...
                        </p>
                        <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid rgba(255,255,255,0.3)', padding: '0.2rem 0.5rem', display: 'inline-block' }}>
                          SunuYite.sn
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {onApplyData && (
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.75rem', fontSize: '0.8rem' }}
                    onClick={() => handleApply(msg.generationResult)}
                  >
                    {t('sidebar.apply')}
                  </button>
                )}
              </div>
            )}

            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary-light)', marginTop: '0.25rem', padding: '0 0.25rem' }}>
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isGenerating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <div className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '16px', borderBottomLeftRadius: '2px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                {t('sidebar.typing')}
                <span className="wave-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                <span className="wave-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animationDelay: '0.3s' }} />
                <span className="wave-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animationDelay: '0.6s' }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input panel & controls */}
      <div 
        style={{
          padding: '1.25rem',
          borderTop: '1px solid var(--border-light)',
          background: 'var(--light-card)'
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <select 
              className="premium-card" 
              style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)' }}
              value={campaignType}
              onChange={(e: any) => setCampaignType(e.target.value)}
            >
              <option value="petition">{t('sidebar.type_petition')}</option>
              <option value="cagnotte">{t('sidebar.type_cagnotte')}</option>
              <option value="both">{t('sidebar.type_both')}</option>
            </select>

            <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
              {tones.map((tVal) => (
                <button
                  key={tVal}
                  type="button"
                  className="btn"
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    background: tone === tVal ? 'var(--primary)' : 'var(--light)',
                    color: tone === tVal ? 'white' : 'var(--text-primary-light)',
                    border: '1px solid var(--border-light)'
                  }}
                  onClick={() => setTone(tVal)}
                >
                  {getToneLabel(tVal)}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              required
              placeholder={t('sidebar.placeholder')}
              className="premium-card"
              style={{ flex: 1, padding: '0.6rem 0.75rem', fontSize: '0.85rem', background: 'var(--light)', borderRadius: 'var(--radius-md)' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isGenerating}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)' }}
              disabled={isGenerating || !input.trim()}
            >
              {t('sidebar.generate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

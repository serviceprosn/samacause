import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from '../components/Logo';

interface AuthProps {
  onSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const { login, signup, setCurrentUser, usersList, addNotification, loginWithGoogle, useSupabase } = useApp();
  
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Sénégal');
  const [region, setRegion] = useState('Dakar');

  // Google Login & Remember me states
  const [rememberMe, setRememberMe] = useState(true);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleStep, setGoogleStep] = useState<'accounts' | 'password' | 'region'>('accounts');
  const [selectedGoogleEmail, setSelectedGoogleEmail] = useState('');
  const [selectedGoogleName, setSelectedGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogleForm, setShowCustomGoogleForm] = useState(false);
  const [googlePassword, setGooglePassword] = useState('');
  const [googleSignupPassword, setGoogleSignupPassword] = useState('');
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  const [showGoogleSignupPassword, setShowGoogleSignupPassword] = useState(false);
  
  // Local Google accounts list connected on this device
  const [localGoogleAccounts, setLocalGoogleAccounts] = useState<{ email: string; name: string }[]>(() => {
    try {
      const saved = localStorage.getItem('sc_connected_google_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setCountry('Sénégal');
    setRegion('Dakar');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    localStorage.setItem('sc_remember_me', rememberMe ? 'true' : 'false');

    try {
      if (mode === 'login') {
        const success = await login(email, password);
        if (success) {
          onSuccess();
        } else {
          setError('Adresse e-mail ou mot de passe incorrect.');
        }
      } else {
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Le mot de passe doit faire au moins 6 caractères.');
          setLoading(false);
          return;
        }
        const success = await signup(name, email, phone, password, country, country === 'Sénégal' ? region : 'Diaspora');
        if (success) {
          onSuccess();
        } else {
          setError('Inscription impossible. Cet e-mail est peut-être déjà utilisé.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'authentification.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginClick = () => {
    setGoogleStep('accounts');
    setShowGoogleModal(true);
    setShowCustomGoogleForm(false);
    setCustomGoogleEmail('');
    setCustomGoogleName('');
    setGooglePassword('');
    setGoogleSignupPassword('');
    setError('');
  };

  const handleGoogleAccountSelect = async (gEmail: string, gName: string) => {
    localStorage.setItem('sc_remember_me', rememberMe ? 'true' : 'false');
    setError('');
    setSelectedGoogleEmail(gEmail);
    setSelectedGoogleName(gName);

    const userExists = usersList.some(u => u.email.toLowerCase() === gEmail.toLowerCase());
    if (userExists) {
      setGooglePassword('');
      setGoogleStep('password');
    } else {
      setGoogleSignupPassword('');
      setGoogleStep('region');
    }
  };

  const handleGooglePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const success = await login(selectedGoogleEmail, googlePassword);
      if (success) {
        setLocalGoogleAccounts(prev => {
          if (!prev.some(a => a.email.toLowerCase() === selectedGoogleEmail.toLowerCase())) {
            const updated = [...prev, { email: selectedGoogleEmail, name: selectedGoogleName }];
            localStorage.setItem('sc_connected_google_accounts', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });

        setShowGoogleModal(false);
        onSuccess();
      } else {
        setError("Authentification échouée. Veuillez vérifier le mot de passe de votre compte.");
      }
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue lors de l'authentification.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleSignupPassword || googleSignupPassword.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const mockPhone = '';
      
      const success = await signup(
        selectedGoogleName,
        selectedGoogleEmail,
        mockPhone,
        googleSignupPassword,
        'Sénégal',
        region
      );
      
      if (success) {
        setLocalGoogleAccounts(prev => {
          if (!prev.some(a => a.email.toLowerCase() === selectedGoogleEmail.toLowerCase())) {
            const updated = [...prev, { email: selectedGoogleEmail, name: selectedGoogleName }];
            localStorage.setItem('sc_connected_google_accounts', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });

        setShowGoogleModal(false);
        onSuccess();
      } else {
        setError("Ce compte est déjà enregistré. Veuillez entrer votre mot de passe pour vous connecter.");
        setGoogleStep('password');
        setGooglePassword('');
      }
    } catch (err: any) {
      const errMsg = err?.message || "";
      if (errMsg.toLowerCase().includes("already registered") || errMsg.toLowerCase().includes("already in use") || errMsg.toLowerCase().includes("email_exists")) {
        setError("Ce compte est déjà enregistré. Veuillez entrer votre mot de passe pour vous connecter.");
        setGoogleStep('password');
        setGooglePassword('');
      } else {
        setError(errMsg || "Une erreur est survenue lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLocalGoogleAccount = (emailToRemove: string) => {
    const updated = localGoogleAccounts.filter(a => a.email.toLowerCase() !== emailToRemove.toLowerCase());
    setLocalGoogleAccounts(updated);
    localStorage.setItem('sc_connected_google_accounts', JSON.stringify(updated));
    addNotification("Compte retiré de cet appareil.");
  };

  return (
    <div 
      className="animate-fade-in animate-slide-up"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 0',
        minHeight: '70vh'
      }}
    >
      <div className="auth-split-container">
        {/* Left Side: Professional visual image panel (hidden on mobile) */}
        <div className="auth-image-panel" style={{ backgroundImage: 'url(/image_login.png)' }}>
          <div className="auth-image-overlay" />
          <div className="auth-image-content">
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.2, color: 'white', marginBottom: '1rem' }}>
              Façonnez l'avenir du Sénégal 🇸🇳
            </h1>
            <p style={{ fontSize: '0.95rem', opacity: 0.9, lineHeight: 1.5, marginBottom: '2rem' }}>
              Rejoignez des milliers de citoyens et de membres de la diaspora. Signez des pétitions d'impact, financez des projets communautaires en toute transparence et engagez-vous sur le terrain.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>✍️ Pétitions</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>💰 Cagnottes</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>🛠️ Bénévolat</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form panel */}
        <div className="auth-form-panel">
          <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            {/* Logo and Brand */}
            <div style={{ marginBottom: '1.5rem' }}>
              <Logo size={45} style={{ marginBottom: '0.5rem' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {mode === 'login' ? 'Connexion Citoyenne' : 'Inscription Citoyenne'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginTop: '0.25rem' }}>
                {mode === 'login' 
                  ? 'Connectez-vous pour continuer.' 
                  : 'Créez un compte pour participer.'}
              </p>
            </div>

            {error && (
              <div 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  color: 'var(--danger)', 
                  padding: '0.65rem', 
                  borderRadius: 'var(--radius-sm)', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  marginBottom: '1rem',
                  textAlign: 'left'
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
              {mode === 'signup' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Prénom & Nom</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : Fatou Diop"
                      className="premium-card"
                      style={{ width: '100%', padding: '0.55rem', background: 'var(--light)' }}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Téléphone Mobile</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : +221 77 123 45 67"
                      className="premium-card"
                      style={{ width: '100%', padding: '0.55rem', background: 'var(--light)' }}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Pays de résidence</label>
                      <select
                        className="premium-card"
                        style={{ width: '100%', padding: '0.55rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)' }}
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      >
                        <option value="Sénégal">Sénégal</option>
                        <option value="France">France</option>
                        <option value="États-Unis">États-Unis</option>
                        <option value="Canada">Canada</option>
                        <option value="Italie">Italie</option>
                        <option value="Espagne">Espagne</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    {country === 'Sénégal' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Région d'impact</label>
                        <select
                          className="premium-card"
                          style={{ width: '100%', padding: '0.55rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)' }}
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                        >
                          <option value="Dakar">Dakar</option>
                          <option value="Thiès">Thiès</option>
                          <option value="Saint-Louis">Saint-Louis</option>
                          <option value="Louga">Louga</option>
                          <option value="Diourbel">Diourbel</option>
                          <option value="Fatick">Fatick</option>
                          <option value="Kaolack">Kaolack</option>
                          <option value="Kaffrine">Kaffrine</option>
                          <option value="Matam">Matam</option>
                          <option value="Tambacounda">Tambacounda</option>
                          <option value="Kédougou">Kédougou</option>
                          <option value="Kolda">Kolda</option>
                          <option value="Sédhiou">Sédhiou</option>
                          <option value="Ziguinchor">Ziguinchor</option>
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Adresse E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="Ex : fatou@gmail.com"
                  className="premium-card"
                  style={{ width: '100%', padding: '0.55rem', background: 'var(--light)' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="premium-card"
                    style={{ width: '100%', padding: '0.55rem 2.5rem 0.55rem 0.55rem', background: 'var(--light)' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary-light)'
                    }}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Confirmer le mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="premium-card"
                      style={{ width: '100%', padding: '0.55rem 2.5rem 0.55rem 0.55rem', background: 'var(--light)' }}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary-light)'
                      }}
                    >
                      {showConfirmPassword ? '👁️' : '🙈'}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember me checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                <input 
                  type="checkbox" 
                  id="rememberMeCheckbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                <label htmlFor="rememberMeCheckbox" style={{ fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                  Se souvenir de moi
                </label>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.4rem' }}
                disabled={loading}
              >
                {loading 
                  ? 'Traitement en cours...' 
                  : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
              </button>
            </form>

            {/* Separator and Google Login */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>ou</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
            </div>

            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'white', color: '#444', borderColor: '#e2e8f0', marginBottom: '1rem' }}
              onClick={handleGoogleLoginClick}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '4px' }}>
                <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.8 2.71v2.24h2.91c1.7-1.56 2.69-3.86 2.69-6.58z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.03-3.7H.95v2.3C2.43 15.89 5.5 18 9 18z"/>
                <path fill="#FBBC05" d="M3.97 10.75c-.18-.54-.28-1.12-.28-1.75s.1-1.21.28-1.75V4.95H.95C.34 6.16 0 7.54 0 9s.34 2.84.95 4.05l3.02-2.3z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.99 11.42 0 9 0 5.5 0 2.43 2.11.95 5.09l3.02 2.3c.7-2.12 2.69-3.7 5.03-3.7z"/>
              </svg>
              Continuer avec Google
            </button>

            <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              {mode === 'login' ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                  Pas encore de compte ?{' '}
                  <button 
                    className="btn btn-ghost" 
                    style={{ display: 'inline', padding: 0, fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'underline' }}
                    onClick={() => handleModeSwitch('signup')}
                  >
                    S'inscrire
                  </button>
                </p>
              ) : (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                  Déjà inscrit ?{' '}
                  <button 
                    className="btn btn-ghost" 
                    style={{ display: 'inline', padding: 0, fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'underline' }}
                    onClick={() => handleModeSwitch('login')}
                  >
                    Se connecter
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GOOGLE SIGN IN MODAL */}
      {showGoogleModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            className="glass animate-fade-in" 
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'var(--light-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🌐</span>
                <strong style={{ fontSize: '0.9rem' }}>Se connecter avec Google</strong>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost" 
                style={{ padding: '0.2rem 0.4rem', minWidth: 'auto' }} 
                onClick={() => setShowGoogleModal(false)}
              >
                ✕
              </button>
            </div>

            {error && (
              <div 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  color: 'var(--danger)', 
                  padding: '0.65rem', 
                  borderRadius: 'var(--radius-sm)', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  marginBottom: '1rem',
                  textAlign: 'left'
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {googleStep === 'accounts' && (
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '1.25rem' }}>
                  Choisissez un compte Google pour continuer sur **Sama Cause**.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                  {localGoogleAccounts.length > 0 ? (
                    localGoogleAccounts.map((account) => {
                      const initials = account.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                      return (
                        <div 
                          key={account.email}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}
                        >
                          <button
                            type="button"
                            className="premium-card hover-glow"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', cursor: 'pointer', textAlign: 'left', flex: 1, background: 'var(--light)' }}
                            onClick={() => handleGoogleAccountSelect(account.email, account.name)}
                          >
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>{initials}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.name}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.email}</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            title="Retirer ce compte de cet appareil"
                            style={{ padding: '0.5rem', minWidth: 'auto', height: '38px', width: '38px', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}
                            onClick={() => handleRemoveLocalGoogleAccount(account.email)}
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '1rem 0', color: 'var(--text-secondary-light)', fontSize: '0.75rem', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                      Aucun compte Google enregistré sur cet appareil.
                    </div>
                  )}
                </div>

                {!showCustomGoogleForm ? (
                  <button 
                    type="button"
                    className="btn btn-ghost" 
                    style={{ fontSize: '0.8rem', padding: '0.5rem', width: '100%' }}
                    onClick={() => setShowCustomGoogleForm(true)}
                  >
                    🔑 Associer / Utiliser un autre compte Google
                  </button>
                ) : (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (customGoogleEmail && customGoogleName) {
                        handleGoogleAccountSelect(customGoogleEmail, customGoogleName);
                      }
                    }} 
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', textAlign: 'left' }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Nom complet Google</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex : Cheikh Diallo"
                        className="premium-card" 
                        style={{ width: '100%', padding: '0.5rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>E-mail Google</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="Ex : cheikh@gmail.com"
                        className="premium-card" 
                        style={{ width: '100%', padding: '0.5rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-ghost" style={{ flex: 1, padding: '0.4rem' }} onClick={() => setShowCustomGoogleForm(false)}>
                        Annuler
                      </button>
                      <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.4rem' }}>
                        Continuer
                      </button>
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.25rem 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', fontWeight: 'bold' }}>OU</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#4285F4', color: 'white', border: 'none', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.8rem' }}
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    try {
                      await loginWithGoogle();
                    } catch (err: any) {
                      setError(err.message || "Erreur de connexion OAuth Google.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '4px' }}>
                    <path fill="#ffffff" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.8 2.71v2.24h2.91c1.7-1.56 2.69-3.86 2.69-6.58z"/>
                    <path fill="#ffffff" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.03-3.7H.95v2.3C2.43 15.89 5.5 18 9 18z" opacity="0.8"/>
                    <path fill="#ffffff" d="M3.97 10.75c-.18-.54-.28-1.12-.28-1.75s.1-1.21.28-1.75V4.95H.95C.34 6.16 0 7.54 0 9s.34 2.84.95 4.05l3.02-2.3z" opacity="0.8"/>
                    <path fill="#ffffff" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.99 11.42 0 9 0 5.5 0 2.43 2.11.95 5.09l3.02 2.3c.7-2.12 2.69-3.7 5.03-3.7z" opacity="0.8"/>
                  </svg>
                  Connexion Google Directe (OAuth)
                </button>
                
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary-light)', marginTop: '0.65rem', textAlign: 'left', fontStyle: 'italic', lineHeight: 1.3 }}>
                  ⚠️ <strong>Configuration requise :</strong> Pour utiliser l'authentification Google réelle (OAuth), vous devez d'abord activer le fournisseur Google et configurer les clés correspondantes dans votre console Supabase. La simulation locale permet de tester sans configuration préalable.
                </p>
              </div>
            )}

            {googleStep === 'password' && (
              <form onSubmit={handleGooglePasswordSubmit} style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '1.25rem' }}>
                  Ce compte Google est déjà associé à un profil. Veuillez saisir votre mot de passe citoyen pour vous connecter en toute sécurité.
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Adresse E-mail</label>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', padding: '0.55rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    {selectedGoogleEmail}
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showGooglePassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="premium-card"
                      style={{ width: '100%', padding: '0.55rem 2.5rem 0.55rem 0.55rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                      value={googlePassword}
                      onChange={(e) => setGooglePassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowGooglePassword(!showGooglePassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary-light)'
                      }}
                    >
                      {showGooglePassword ? '👁' : '🙈'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setGoogleStep('accounts')}>
                    Retour
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                    {loading ? 'Connexion...' : "S'authentifier ➔"}
                  </button>
                </div>
              </form>
            )}

            {googleStep === 'region' && (
              <form onSubmit={handleGoogleFinalize} style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '1.25rem' }}>
                  C'est votre première connexion ! Complétez vos informations et définissez un mot de passe sécurisé pour finaliser votre inscription.
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Adresse E-mail Google</label>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', padding: '0.55rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    {selectedGoogleEmail}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Région d'impact</label>
                  <select
                    className="premium-card"
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary-light)' }}
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    <option value="Dakar">Dakar</option>
                    <option value="Thiès">Thiès</option>
                    <option value="Saint-Louis">Saint-Louis</option>
                    <option value="Louga">Louga</option>
                    <option value="Diourbel">Diourbel</option>
                    <option value="Fatick">Fatick</option>
                    <option value="Kaolack">Kaolack</option>
                    <option value="Kaffrine">Kaffrine</option>
                    <option value="Matam">Matam</option>
                    <option value="Tambacounda">Tambacounda</option>
                    <option value="Kédougou">Kédougou</option>
                    <option value="Kolda">Kolda</option>
                    <option value="Sédhiou">Sédhiou</option>
                    <option value="Ziguinchor">Ziguinchor</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Définir un mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showGoogleSignupPassword ? 'text' : 'password'}
                      required
                      placeholder="Min. 6 caractères"
                      className="premium-card"
                      style={{ width: '100%', padding: '0.55rem 2.5rem 0.55rem 0.55rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                      value={googleSignupPassword}
                      onChange={(e) => setGoogleSignupPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowGoogleSignupPassword(!showGoogleSignupPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary-light)'
                      }}
                    >
                      {showGoogleSignupPassword ? '👁' : '🙈'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setGoogleStep('accounts')}>
                    Retour
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                    {loading ? 'Inscription...' : "Créer le compte ➔"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;

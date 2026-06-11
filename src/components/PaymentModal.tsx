import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Cagnotte } from '../types';

interface PaymentModalProps {
  cagnotte: Cagnotte;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ cagnotte, onClose }) => {
  const { donateToCagnotte, currentUser } = useApp();
  
  const [step, setStep] = useState<'amount' | 'method' | 'details' | 'success'>('amount');
  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [method, setMethod] = useState<'wave' | 'om' | 'free' | 'card'>('wave');
  const [comment, setComment] = useState('');
  const [donorName, setDonorName] = useState(currentUser?.name || '');
  const [isDiaspora, setIsDiaspora] = useState(cagnotte.isDiasporaTargeted);
  
  // Method specific states
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [cardName, setCardName] = useState(currentUser?.name || '');

  React.useEffect(() => {
    if (currentUser) {
      setDonorName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setCardName(currentUser.name || '');
    }
  }, [currentUser]);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFocused, setCardFocused] = useState(false);
  const [ussdCode, setUssdCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Transaction Reference
  const [txRef, setTxRef] = useState('');

  const quickAmounts = [2000, 5000, 10000, 25000, 50000];

  const handleAmountNext = () => {
    const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    setStep('method');
  };

  const handleMethodSelect = (m: 'wave' | 'om' | 'free' | 'card') => {
    setMethod(m);
    setStep('details');
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API network latency
    setTimeout(async () => {
      const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;
      const ref = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
      setTxRef(ref);

      let methodLabel = '';
      if (method === 'wave') methodLabel = 'Wave';
      else if (method === 'om') methodLabel = 'Orange Money';
      else if (method === 'free') methodLabel = 'Free Money';
      else methodLabel = 'Visa/Mastercard';

      await donateToCagnotte(cagnotte.id, finalAmount, donorName, comment, isDiaspora, methodLabel);
      
      setLoading(false);
      setStep('success');
    }, 2000);
  };

  const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;
  // EUR conversion rate: 1 EUR ~ 655 FCFA
  const eurAmount = (finalAmount / 655).toFixed(2);

  const downloadReceipt = () => {
    // Simulate download by converting text to printable data URI or triggering browser printing
    const receiptContent = `
=========================================
          REÇU DE DON - SAMA CAUSE
=========================================
Référence : ${txRef}
Date : ${new Date().toLocaleDateString('fr-FR')}
Bénéficiaire : ${cagnotte.title}
Organisateur : ${cagnotte.organizer.name}
-----------------------------------------
Donateur : ${donorName}
Montant : ${finalAmount.toLocaleString('fr-FR')} FCFA (${eurAmount} EUR)
Mode de Paiement : ${method.toUpperCase()}
Statut : PAYÉ (Sécurisé par Sama Cause)
-----------------------------------------
Merci pour votre action citoyenne !
Transformons ensemble le Sénégal.
=========================================
    `;
    const element = document.createElement("a");
    const file = new Blob([receiptContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `recu_samacause_${txRef}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
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
          maxWidth: '480px',
          background: 'var(--light-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--primary)',
            color: 'white'
          }}
        >
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>
            Contribuer à la Cause
          </h3>
          <button 
            className="btn btn-ghost" 
            style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', color: 'white' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {step === 'amount' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', marginBottom: '1rem' }}>
                Sélectionnez un montant de don ou écrivez le montant de votre choix en FCFA.
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    className="btn"
                    style={{
                      flex: '1 0 30%',
                      background: amount === q && !customAmount ? 'var(--primary)' : 'var(--light)',
                      color: amount === q && !customAmount ? 'white' : 'var(--text-primary-light)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.85rem',
                      padding: '0.6rem'
                    }}
                    onClick={() => {
                      setAmount(q);
                      setCustomAmount('');
                    }}
                  >
                    {q.toLocaleString('fr-FR')} F
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                  Autre Montant (FCFA)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    className="premium-card"
                    placeholder="Entrez le montant"
                    style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', background: 'var(--light)', borderRadius: 'var(--radius-md)' }}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                  <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>FCFA</span>
                </div>
                {finalAmount > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginTop: '0.5rem' }}>
                    Équivalent diaspora : <strong>~ {eurAmount} EUR</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '1rem 0', background: 'rgba(0,133,63,0.05)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <input 
                  type="checkbox" 
                  id="diasporaCheck" 
                  checked={isDiaspora} 
                  onChange={(e) => setIsDiaspora(e.target.checked)} 
                />
                <label htmlFor="diasporaCheck" style={{ fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                  Je fais ce don depuis la Diaspora (Frais de change offerts)
                </label>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} onClick={handleAmountNext}>
                Continuer
              </button>
            </div>
          )}

          {step === 'method' && (
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                Moyen de paiement
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '1.25rem' }}>
                Montant sélectionné : <strong>{finalAmount.toLocaleString('fr-FR')} FCFA</strong> (~ {eurAmount} EUR).
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  className="premium-card" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#00D1FF' + '11', cursor: 'pointer', borderColor: '#00D1FF' }}
                  onClick={() => handleMethodSelect('wave')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🌊</span>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ color: '#0055ff' }}>Wave</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>Gratuit, instantané via QR Code ou push</div>
                    </div>
                  </div>
                  <span>➔</span>
                </button>

                <button 
                  className="premium-card" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#FF6600' + '11', cursor: 'pointer', borderColor: '#FF6600' }}
                  onClick={() => handleMethodSelect('om')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🍊</span>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ color: '#FF6600' }}>Orange Money</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>Sécurisé par code USSD temporaire</div>
                    </div>
                  </div>
                  <span>➔</span>
                </button>

                <button 
                  className="premium-card" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#e11d48' + '11', cursor: 'pointer', borderColor: '#e11d48' }}
                  onClick={() => handleMethodSelect('free')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🔴</span>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ color: '#e11d48' }}>Free Money</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>Paiement mobile instantané</div>
                    </div>
                  </div>
                  <span>➔</span>
                </button>

                <button 
                  className="premium-card" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#3b82f6' + '11', cursor: 'pointer', borderColor: '#3b82f6' }}
                  onClick={() => handleMethodSelect('card')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>💳</span>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ color: '#1e3a8a' }}>Carte Bancaire (Stripe)</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>Visa, Mastercard (Recommandé Diaspora)</div>
                    </div>
                  </div>
                  <span>➔</span>
                </button>
              </div>

              <button 
                className="btn btn-ghost" 
                style={{ width: '100%', marginTop: '1rem' }} 
                onClick={() => setStep('amount')}
              >
                Retour
              </button>
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handlePay}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'capitalize' }}>
                Détails du paiement - {method === 'card' ? 'Carte Bancaire' : method.toUpperCase()}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                    Votre Nom (public ou anonyme)
                  </label>
                  <input
                    type="text"
                    required
                    className="premium-card"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                    Laissez un message de soutien (optionnel)
                  </label>
                  <textarea
                    rows={2}
                    className="premium-card"
                    placeholder="Dieuredieuf ! Force à vous."
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)', resize: 'none' }}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                {/* WAVE SIMULATION */}
                {method === 'wave' && (
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ background: 'white', padding: '0.5rem', width: '130px', height: '130px', margin: '0 auto 0.75rem', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)' }}>
                      {/* Simulating Wave QR code with a colored canvas design */}
                      <div 
                        className="wave-pulse"
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(45deg, #0055ff 25%, #00d1ff 25%, #00d1ff 50%, #0055ff 50%, #0055ff 75%, #00d1ff 75%)',
                          backgroundSize: '20px 20px',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Scannez ce QR Code avec votre application Wave pour payer
                    </p>
                    <div style={{ fontSize: '0.7rem', color: '#0369a1' }}>
                      Ou saisissez votre numéro Wave ci-dessous pour recevoir une notification push :
                    </div>
                    <input
                      type="text"
                      className="premium-card"
                      placeholder="+221 77..."
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', textAlign: 'center', background: 'white' }}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                )}

                {/* ORANGE MONEY / FREE MONEY */}
                {(method === 'om' || method === 'free') && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.75rem', color: '#b45309', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                      🔑 Pour valider le paiement : <br />
                      1. Composez <strong>#144#391#</strong> (Orange) ou <strong>#150#</strong> (Free) sur votre mobile.<br />
                      2. Saisissez votre code secret de paiement.<br />
                      3. Saisissez le <strong>Code d'autorisation temporaire</strong> généré ci-dessous.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        required
                        placeholder="Numéro de téléphone"
                        className="premium-card"
                        style={{ flex: 2, padding: '0.5rem', background: 'white' }}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <input
                        type="text"
                        required
                        placeholder="Code d'autorisation (OTP)"
                        className="premium-card"
                        style={{ flex: 1, padding: '0.5rem', background: 'white', textAlign: 'center' }}
                        value={ussdCode}
                        onChange={(e) => setUssdCode(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* STRIPE CARD FLIP */}
                {method === 'card' && (
                  <div>
                    {/* Card container */}
                    <div className={`payment-card-wrap ${cardFocused ? 'flipped' : ''}`}>
                      <div className="payment-card-inner">
                        {/* Front */}
                        <div className="payment-card-front">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', fontStyle: 'italic' }}>VISA</span>
                            <span style={{ fontSize: '1.5rem' }}>🌐</span>
                          </div>
                          <div style={{ fontSize: '1.25rem', letterSpacing: '2px', wordSpacing: '4px', margin: '1rem 0' }}>
                            {cardNumber || '•••• •••• •••• ••••'}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <div>
                              <div style={{ opacity: 0.7, fontSize: '0.6rem' }}>CARDHOLDER</div>
                              <div>{cardName.toUpperCase() || 'FATOU DIOP'}</div>
                            </div>
                            <div>
                              <div style={{ opacity: 0.7, fontSize: '0.6rem' }}>EXPIRES</div>
                              <div>{cardExpiry || 'MM/YY'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Back */}
                        <div className="payment-card-back">
                          <div style={{ width: '100%', height: '35px', background: 'black', margin: '0.5rem 0' }} />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', background: 'white', color: 'black', padding: '0.25rem 0.5rem', fontSize: '0.9rem', borderRadius: '4px', textAlign: 'right' }}>
                            <span style={{ fontStyle: 'italic', letterSpacing: '1px', opacity: 0.5 }}>CCV </span>
                            <strong> {cardCvv || '•••'}</strong>
                          </div>
                          <div style={{ fontSize: '0.5rem', opacity: 0.5, marginTop: '0.5rem' }}>
                            Ce paiement est chiffré de bout en bout via Stripe. Sama Cause ne stocke aucune coordonnée bancaire.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input
                        type="text"
                        required
                        placeholder="Numéro de carte Visa / Mastercard"
                        className="premium-card"
                        style={{ width: '100%', padding: '0.5rem', background: 'var(--light)' }}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                        maxLength={19}
                        onFocus={() => setCardFocused(false)}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          required
                          placeholder="Expiration (MM/YY)"
                          className="premium-card"
                          style={{ flex: 1, padding: '0.5rem', background: 'var(--light)' }}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          maxLength={5}
                          onFocus={() => setCardFocused(false)}
                        />
                        <input
                          type="password"
                          required
                          placeholder="CVV"
                          className="premium-card"
                          style={{ flex: 1, padding: '0.5rem', background: 'var(--light)' }}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          maxLength={3}
                          onFocus={() => setCardFocused(true)}
                          onBlur={() => setCardFocused(false)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  style={{ flex: 1 }} 
                  onClick={() => setStep('method')}
                  disabled={loading}
                >
                  Retour
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 2 }} 
                  disabled={loading}
                >
                  {loading ? 'Traitement...' : `Payer ${finalAmount.toLocaleString('fr-FR')} FCFA`}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: 'var(--success)' + '22', 
                  color: 'var(--success)', 
                  fontSize: '2rem', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '1rem' 
                }}
              >
                ✓
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                Paiement Réussi !
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', marginBottom: '1.5rem' }}>
                Votre contribution citoyenne a bien été reçue. Un grand merci pour votre générosité.
              </p>

              {/* Receipt detail box */}
              <div 
                style={{ 
                  background: 'var(--light)', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '1rem', 
                  textAlign: 'left', 
                  fontSize: '0.8rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.4rem', 
                  marginBottom: '1.5rem' 
                }}
              >
                <div>Référence : <strong>{txRef}</strong></div>
                <div>Bénéficiaire : <strong>{cagnotte.title}</strong></div>
                <div>Donateur : <strong>{donorName}</strong></div>
                <div>Montant : <strong>{finalAmount.toLocaleString('fr-FR')} FCFA (~{eurAmount} EUR)</strong></div>
                <div>Frais Plateforme (3%) : <strong>Offerts 🕊️</strong></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ width: '100%' }} onClick={downloadReceipt}>
                  🖨️ Télécharger le Reçu PDF
                </button>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

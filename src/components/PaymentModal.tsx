import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Cagnotte } from '../types';
import { jsPDF } from 'jspdf';
import { initializePayTechPayment } from '../services/paytech';

interface PaymentModalProps {
  cagnotte: Cagnotte;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ cagnotte, onClose }) => {
  const { donateToCagnotte, currentUser } = useApp();
  const { t } = useLanguage();
  
  const [step, setStep] = useState<'amount' | 'method' | 'details' | 'success'>('amount');
  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [method, setMethod] = useState<'wave' | 'om' | 'free' | 'card'>('wave');
  const [comment, setComment] = useState('');
  const [donorName, setDonorName] = useState(currentUser?.name || '');
  const [donorEmail, setDonorEmail] = useState(currentUser?.email || '');
  const [isDiaspora, setIsDiaspora] = useState(cagnotte.isDiasporaTargeted);
  
  // Method specific states
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [cardName, setCardName] = useState(currentUser?.name || '');

  React.useEffect(() => {
    if (currentUser) {
      setDonorName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setCardName(currentUser.name || '');
      setDonorEmail(currentUser.email || '');
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
    
    if (!donorEmail) {
      alert("L'adresse e-mail est obligatoire pour procéder au paiement.");
      return;
    }

    setLoading(true);
    const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;
    const refCommand = `cagnotte_${cagnotte.id}_${Date.now()}`;

    // Store pending payment in localStorage so we can parse it at redirection return
    localStorage.setItem('pending_payment', JSON.stringify({
      type: 'cagnotte',
      cagnotteId: cagnotte.id,
      amount: finalAmount,
      donorName,
      comment,
      isDiaspora,
      refCommand
    }));

    const success = await initializePayTechPayment({
      amount: finalAmount,
      itemName: `Contribution - ${cagnotte.title}`,
      refCommand
    });

    if (!success) {
      localStorage.removeItem('pending_payment');
      setLoading(false);
    }
  };

  const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;
  // EUR conversion rate: 1 EUR ~ 655 FCFA
  const eurAmount = (finalAmount / 655).toFixed(2);

  const printReceipt = () => {
    const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;
    const eurAmount = (finalAmount / 655).toFixed(2);
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres surgissantes (popups) pour télécharger le reçu.");
      return;
    }

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu de Don - Sunu Yité - ${txRef}</title>
        <meta charset="utf-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
          
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 40px;
            display: flex;
            justify-content: center;
          }
          
          .receipt-container {
            width: 100%;
            max-width: 650px;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            position: relative;
            background: #ffffff;
            box-sizing: border-box;
          }

          /* Top green accent strip */
          .receipt-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #00853f 0%, #fdef42 50%, #e31b23 100%);
            border-top-left-radius: 15px;
            border-top-right-radius: 15px;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 24px;
            margin-bottom: 28px;
          }
          
          .logo-area {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .logo-img {
            height: 50px;
            width: 50px;
            object-fit: contain;
          }
          
          .brand-name {
            font-size: 22px;
            font-weight: 800;
            color: #0b4a7a;
            margin: 0;
            letter-spacing: -0.5px;
          }
          
          .brand-tagline {
            font-size: 11px;
            color: #64748b;
            margin: 2px 0 0 0;
            font-weight: 500;
          }

          .title-area {
            text-align: right;
          }
          
          .receipt-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .receipt-ref {
            font-size: 12px;
            color: #64748b;
            margin: 4px 0 0 0;
            font-family: monospace;
            font-weight: 600;
          }
          
          .details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
            margin-bottom: 32px;
          }
          
          .info-block label {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
            margin-bottom: 6px;
            letter-spacing: 0.5px;
          }
          
          .info-block span {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }

          .amount-box {
            background: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin-bottom: 32px;
          }
          
          .amount-label {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }
          
          .amount-val {
            font-size: 32px;
            font-weight: 800;
            color: #00853f;
            margin: 0;
          }
          
          .amount-sub {
            font-size: 13px;
            color: #64748b;
            margin-top: 6px;
            font-weight: 500;
          }
          
          .footer {
            text-align: center;
            border-top: 1px dashed #e2e8f0;
            padding-top: 24px;
            color: #64748b;
            font-size: 12px;
            line-height: 1.6;
          }

          .seal {
            display: inline-block;
            border: 2px solid #00853f;
            color: #00853f;
            border-radius: 50%;
            width: 80px;
            height: 80px;
            font-size: 9px;
            font-weight: 800;
            line-height: 80px;
            text-align: center;
            text-transform: uppercase;
            position: absolute;
            right: 40px;
            bottom: 110px;
            transform: rotate(-15deg);
            opacity: 0.15;
            letter-spacing: 1px;
            pointer-events: none;
          }
          
          @media print {
            body {
              padding: 0;
              background: none;
            }
            .receipt-container {
              border: none;
              box-shadow: none;
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="logo-area">
              <img class="logo-img" src="${window.location.origin}/logo.png" onerror="this.src='https://sunuyite.vercel.app/logo.png'" />
              <div>
                <h1 class="brand-name">SUNU YITÉ</h1>
                <p class="brand-tagline">L'Engagement Citoyen pour le Sénégal</p>
              </div>
            </div>
            <div class="title-area">
              <h2 class="receipt-title">Reçu de Don</h2>
              <p class="receipt-ref">Ref: ${txRef}</p>
            </div>
          </div>
          
          <div class="details-grid">
            <div class="info-block">
              <label>Donateur</label>
              <span>${donorName || 'Citoyen Anonyme'}</span>
            </div>
            <div class="info-block">
              <label>Date & Heure</label>
              <span>${dateStr}</span>
            </div>
            <div class="info-block" style="grid-column: span 2;">
              <label>Bénéficiaire (Cause Solidaire)</label>
              <span>${cagnotte.title}</span>
            </div>
            <div class="info-block">
              <label>Organisateur</label>
              <span>${cagnotte.organizer.name}</span>
            </div>
            <div class="info-block">
              <label>Mode de Paiement</label>
              <span style="text-transform: uppercase;">${method}</span>
            </div>
            ${comment ? `
            <div class="info-block" style="grid-column: span 2;">
              <label>Message de Soutien</label>
              <span style="font-style: italic; font-weight: normal; color: #475569;">"${comment}"</span>
            </div>
            ` : ''}
          </div>
          
          <div class="amount-box">
            <div class="amount-label">Montant de la Contribution</div>
            <h3 class="amount-val">${finalAmount.toLocaleString('fr-FR')} FCFA</h3>
            <div class="amount-sub">Équivalent diaspora : ~ ${eurAmount} EUR</div>
          </div>
          
          <div class="seal">Sécurisé</div>
          
          <div class="footer">
            <p><strong>Sunu Yité</strong> - Plateforme d'initiatives citoyennes et de cagnottes solidaires.</p>
            <p>Ce reçu atteste de votre contribution volontaire. Merci pour votre engagement citoyen !</p>
            <p style="font-size: 10px; color: #94a3b8; margin-top: 12px;">Généré électroniquement le ${new Date().toLocaleDateString('fr-FR')}. Aucun cachet requis.</p>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const downloadReceipt = () => {
    const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;
    const eurAmount = (finalAmount / 655).toFixed(2);
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    // Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 148, 210, 'F');

    // Draw tricolor band at the top
    doc.setFillColor(0, 133, 63); // Green
    doc.rect(0, 0, 49.3, 4, 'F');
    doc.setFillColor(253, 185, 19); // Yellow
    doc.rect(49.3, 0, 49.3, 4, 'F');
    doc.setFillColor(227, 27, 35); // Red
    doc.rect(98.6, 0, 49.4, 4, 'F');

    // Header Brand
    doc.setTextColor(11, 74, 122); // #0B4A7A
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text("SUNU YITÉ", 15, 20);

    doc.setTextColor(100, 116, 139); // #64748B
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text("L'Engagement Citoyen pour le Sénégal", 15, 24);

    // Title
    doc.setTextColor(15, 23, 42); // #0F172A
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text("REÇU DE DON", 133, 20, { align: 'right' });

    // Ref
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Ref: ${txRef}`, 133, 24, { align: 'right' });

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 28, 133, 28);

    // Details Grid
    let y = 38;
    const drawField = (label: string, value: string, isFullWidth = false, nextY = 12) => {
      doc.setTextColor(100, 116, 139); // Label color
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(label.toUpperCase(), 15, y);

      doc.setTextColor(30, 41, 59); // Value color
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const lines = doc.splitTextToSize(value, isFullWidth ? 118 : 118);
      doc.text(lines, 15, y + 5);
      y += nextY + (lines.length - 1) * 4;
    };

    drawField("Donateur", donorName || "Citoyen Anonyme", false, 12);
    drawField("Date & Heure", dateStr, false, 12);
    drawField("Bénéficiaire (Cause Solidaire)", cagnotte.title, true, 12);
    drawField("Organisateur", cagnotte.organizer.name, false, 12);
    
    let methodLabel = '';
    if (method === 'wave') methodLabel = 'Wave';
    else if (method === 'om') methodLabel = 'Orange Money';
    else if (method === 'free') methodLabel = 'Free Money';
    else methodLabel = 'Visa/Mastercard';
    drawField("Mode de Paiement", methodLabel.toUpperCase(), false, 12);

    if (comment) {
      drawField("Message de Soutien", `"${comment}"`, true, 12);
    }

    // Amount Box
    y += 4;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, y, 118, 26, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text("MONTANT DE LA CONTRIBUTION", 74, y + 6, { align: 'center' });

    doc.setTextColor(0, 133, 63); // Green
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`${finalAmount.toLocaleString('fr-FR')} FCFA`, 74, y + 14, { align: 'center' });

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Équivalent diaspora : ~ ${eurAmount} EUR`, 74, y + 21, { align: 'center' });

    // Seal watermark
    doc.setTextColor(0, 133, 63);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("SÉCURISÉ", 108, y + 42, { angle: 345 }); // 345 degrees = -15 degrees

    // Footer
    y += 36;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, y, 133, y);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text("Sunu Yité - Plateforme d'initiatives citoyennes et de cagnottes solidaires.", 74, y + 5, { align: 'center' });
    doc.text("Ce reçu atteste de votre contribution volontaire. Merci pour votre engagement !", 74, y + 9, { align: 'center' });
    doc.text(`Généré électroniquement le ${new Date().toLocaleDateString('fr-FR')}. Aucun cachet requis.`, 74, y + 13, { align: 'center' });

    doc.save(`recu-don-${txRef}.pdf`);
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>{t('payment.free_desc')}</div>
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>{t('payment.om_desc')}</div>
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>{t('payment.wave_desc')}</div>
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>{t('payment.stripe_desc')}</div>
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
                    Adresse E-mail (obligatoire)
                  </label>
                  <input
                    type="email"
                    required
                    className="premium-card"
                    placeholder="citoyen@sunuyite.com"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                    Laissez un message de soutien (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    className="premium-card"
                    placeholder={t('payment.comment_placeholder')}
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)', resize: 'none' }}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div style={{ background: 'rgba(0,133,63,0.03)', border: '1px dashed var(--primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔒</span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', lineHeight: 1.3 }}>
                    Paiement sécurisé crypté de bout en bout géré par <strong>PayTech</strong>. Vos coordonnées de mobile money ou bancaires ne transitent jamais sur nos serveurs.
                  </div>
                </div>
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
                  {loading ? 'Chargement...' : `Payer ${finalAmount.toLocaleString('fr-FR')} FCFA`}
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
                <div>{t('payment.receipt_ref')} <strong>{txRef}</strong></div>
                <div>{t('payment.receipt_beneficiary')} <strong>{cagnotte.title}</strong></div>
                <div>Donateur : <strong>{donorName}</strong></div>
                <div>{t('payment.receipt_amount')} <strong>{finalAmount.toLocaleString('fr-FR')} FCFA (~{eurAmount} EUR)</strong></div>
                <div>Frais Plateforme (3%) : <strong>Offerts 🕊️</strong></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={downloadReceipt}>
                  📥 Télécharger le Reçu PDF
                </button>
                <button className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={printReceipt}>
                  🖨️ Imprimer le Reçu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

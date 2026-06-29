import nodemailer from 'nodemailer';

// Helper to escape HTML and prevent XSS/HTML Injection in emails
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Simple email regex validation
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export default async function handler(req, res) {
  // CORS origin restrictions
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://sunuyite.vercel.app',
    'https://samacause.vercel.app'
  ];
  
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.startsWith('http://localhost:'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://sunuyite.vercel.app');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { name, email, phone, subject, message, turnstileToken } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required parameters (name, email, message)' });
  }

  // 1. Verify Cloudflare Turnstile token
  const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000UI';
  if (!turnstileToken) {
    return res.status(400).json({ error: 'Missing Captcha token (Turnstile)' });
  }

  try {
    const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: turnstileToken,
        remoteip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
      })
    });

    const verifyData = await verifyResponse.json();
    if (!verifyData.success) {
      console.error('Turnstile verification failed:', verifyData);
      return res.status(400).json({ error: 'Captcha verification failed. Please try again.' });
    }
  } catch (verifyErr) {
    console.error('Error verifying Turnstile token:', verifyErr);
    return res.status(500).json({ error: 'Internal error verifying Captcha' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }

  // Escape user inputs to prevent XSS / HTML Injection in recipient mail clients
  const cleanName = escapeHtml(name);
  const cleanEmail = escapeHtml(email);
  const cleanPhone = escapeHtml(phone || '');
  const cleanSubject = escapeHtml(subject || 'Sans sujet');
  const cleanMessage = escapeHtml(message);

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');

  if (!smtpUser || !smtpPass) {
    console.warn("SMTP credentials (SMTP_USER/SMTP_PASS) are not configured. E-mail not sent.");
    return res.status(200).json({ 
      success: true, 
      warning: 'SMTP_NOT_CONFIGURED',
      message: 'Message enregistré en base de données, mais la notification par e-mail n\'a pas pu être envoyée (non configurée).' 
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"${cleanName} (Sunu Yité)" <${smtpUser}>`,
      to: process.env.ADMIN_EMAIL || 'admin@sunuyite.com', // Admin email address
      replyTo: cleanEmail,
      subject: `[Sunu Yité Contact] ${cleanSubject} - de ${cleanName}`,
      text: `Nouveau message reçu depuis le formulaire de contact de Sunu Yité :

Nom : ${cleanName}
E-mail : ${cleanEmail}
Téléphone : ${cleanPhone || 'Non renseigné'}
Sujet : ${cleanSubject}

Message :
--------------------------------------------------
${cleanMessage}
--------------------------------------------------
`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #00853F; border-bottom: 2px solid #00853F; padding-bottom: 10px; margin-top: 0;">Nouveau Message Citoyen — Sunu Yité</h2>
          <p><strong>Nom :</strong> ${cleanName}</p>
          <p><strong>E-mail :</strong> <a href="mailto:${cleanEmail}">${cleanEmail}</a></p>
          <p><strong>Téléphone :</strong> ${cleanPhone || 'Non renseigné'}</p>
          <p><strong>Sujet :</strong> ${cleanSubject}</p>
          <div style="background-color: #f7fafc; border-left: 4px solid #0A3A60; padding: 15px; margin-top: 15px; border-radius: 4px;">
            <p style="margin: 0; white-space: pre-wrap;">${cleanMessage}</p>
          </div>
          <p style="font-size: 0.8rem; color: #718096; margin-top: 25px; border-top: 1px solid #edf2f7; padding-top: 10px;">
            Cet e-mail a été généré automatiquement suite à la soumission du formulaire de contact de la plateforme Sunu Yité.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'E-mail sent successfully via SMTP' });
  } catch (err) {
    console.error('SMTP sending error:', err);
    return res.status(500).json({ error: 'Failed to send e-mail via SMTP', details: err.message });
  }
}

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to base64url encode a JSON object or buffer
function base64url(source) {
  let encoded = typeof source === 'string' 
    ? Buffer.from(source).toString('base64') 
    : Buffer.from(JSON.stringify(source)).toString('base64');
  return encoded.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Helper function to sign the JWT using the private key
function signJwt(payload, privateKey) {
  const header = { alg: "RS256", typ: "JWT" };
  const unsignedJwt = `${base64url(header)}.${base64url(payload)}`;
  
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  const signature = signer.sign(privateKey, 'base64url');
  
  return `${unsignedJwt}.${signature}`;
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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  // 1. Authenticate with Supabase JWT token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const userToken = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
  
  if (authError || !user) {
    console.error('Push auth validation error:', authError);
    return res.status(401).json({ error: 'Unauthorized: Session is invalid or has expired' });
  }

  const { token, title, body } = req.body;
  if (!token || !title || !body) {
    return res.status(400).json({ error: 'Missing token, title, or body parameter' });
  }

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountEnv) {
    return res.status(500).json({ 
      error: 'Firebase Service Account JSON environment variable (FIREBASE_SERVICE_ACCOUNT_JSON) is not configured.' 
    });
  }

  try {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountEnv);
    } catch (parseErr) {
      console.error('Failed to parse service account JSON:', parseErr);
      return res.status(500).json({ error: 'Invalid Service Account JSON format' });
    }

    const { project_id, client_email, private_key } = serviceAccount;
    if (!project_id || !client_email || !private_key) {
      return res.status(500).json({ 
        error: 'Service account JSON is missing project_id, client_email, or private_key.' 
      });
    }

    // 2. Generate JWT for Google OAuth2
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600; // 1 hour expiration
    const payload = {
      iss: client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat,
      exp
    };

    // Replace literal "\\n" with actual newlines in private key
    const formattedPrivateKey = private_key.replace(/\\n/g, '\n');
    const jwt = signJwt(payload, formattedPrivateKey);

    // 3. Exchange JWT for OAuth2 Access Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to exchange JWT for token:', errorText);
      return res.status(500).json({ error: 'OAuth token exchange failed', details: errorText });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 4. Send notification via FCM HTTP v1 API
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${project_id}/messages:send`;
    const fcmPayload = {
      message: {
        token: token,
        notification: {
          title,
          body
        },
        webpush: {
          notification: {
            title,
            body,
            icon: '/logo.png',
            click_action: '/'
          }
        }
      }
    };

    const fcmResponse = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fcmPayload)
    });

    if (!fcmResponse.ok) {
      const errorText = await fcmResponse.text();
      console.error('FCM HTTP v1 API Error:', errorText);
      return res.status(500).json({ error: 'FCM delivery failed', details: errorText });
    }

    const fcmData = await fcmResponse.json();
    return res.status(200).json({ success: true, messageId: fcmData.name });

  } catch (err) {
    console.error('Push send handler error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

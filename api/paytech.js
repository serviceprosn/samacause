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

  const { amount, itemName, refCommand, successUrl, cancelUrl } = req.body;

  if (!amount || !itemName || !refCommand || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'Missing required parameters (amount, itemName, refCommand, successUrl, cancelUrl)' });
  }

  const apiKey = process.env.PAYTECH_API_KEY || 'dummy_paytech_api_key';
  const apiSecret = process.env.PAYTECH_API_SECRET || 'dummy_paytech_api_secret';
  const rawEnv = (process.env.PAYTECH_ENV || 'test').trim().toLowerCase();
  const paytechEnv = (rawEnv === 'live' || rawEnv === 'prod') ? 'prod' : 'test';
  console.log('PAYTECH_ENV mapped to:', paytechEnv);

  try {
    const response = await fetch('https://paytech.sn/api/payment/request-payment', {
      method: 'POST',
      headers: {
        'API_KEY': apiKey,
        'API_SECRET': apiSecret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        item_name: itemName,
        item_price: String(amount),
        currency: 'XOF',
        ref_command: refCommand,
        command_name: 'Paiement Sunu Yité',
        env: paytechEnv,
        success_url: successUrl,
        cancel_url: cancelUrl,
        ipn_url: successUrl.split('?')[0]
      })
    });

    const data = await response.json();

    if (data.success === 1) {
      return res.status(200).json({
        success: true,
        redirect_url: data.redirect_url,
        token: data.token,
        debugEnv: paytechEnv
      });
    } else {
      console.error('PayTech API response failed:', data);
      return res.status(400).json({
        success: false,
        error: data.errors && data.errors.length > 0 ? data.errors[0] : (data.message || 'PayTech initialization failed'),
        debugEnv: paytechEnv
      });
    }
  } catch (error) {
    console.error('PayTech API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

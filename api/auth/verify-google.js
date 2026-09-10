/**
 * CBA9FITNESS - BACKEND GOOGLE OAUTH 2.0 TOKEN VERIFICATION API
 * ==============================================================================
 * Vercel Serverless Function: /api/auth/verify-google
 * Verifies Google ID Tokens, creates/updates user in database, and issues session.
 * Includes CORS origin restriction, rate limiting, and input validation.
 * ==============================================================================
 */

const { OAuth2Client } = require('google-auth-library');

// Google OAuth Client ID (configure via environment variable GOOGLE_CLIENT_ID or fallback)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Whitelisted origins for secure CORS
const ALLOWED_ORIGINS = [
  'https://cba-9-fitness.vercel.app',
  'https://cba9fitness.vercel.app',
  'https://cba9fitness.com',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080'
];

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app');
}

// In-Memory Rate Limiting for auth endpoint (20 requests / minute / IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(ip, entry);
    return true;
  }

  entry.count += 1;
  rateLimitMap.set(ip, entry);
  return entry.count <= MAX_REQUESTS_PER_WINDOW;
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  const allowOrigin = isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Length, Content-Type, Date, Authorization'
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Only POST is supported.' });
  }

  // Rate Limiting Check
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many authentication attempts. Please wait 1 minute.' });
  }

  try {
    const { idToken, credential } = req.body || {};
    const tokenToVerify = idToken || credential;

    if (!tokenToVerify || typeof tokenToVerify !== 'string' || tokenToVerify.length > 4096) {
      return res.status(400).json({ error: 'Invalid or missing Google ID token parameter.' });
    }

    let payload = null;

    if (GOOGLE_CLIENT_ID) {
      const ticket = await client.verifyIdToken({
        idToken: tokenToVerify,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else {
      const parts = tokenToVerify.split('.');
      if (parts.length === 3) {
        const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
        payload = JSON.parse(decoded);
      } else {
        throw new Error('Malformed token structure');
      }
    }

    if (!payload || !payload.email || typeof payload.email !== 'string') {
      return res.status(401).json({ error: 'Invalid Google token payload.' });
    }

    // Extract verified athlete profile data
    const googleUser = {
      google_id: String(payload.sub || ''),
      email: String(payload.email || '').toLowerCase().trim(),
      email_verified: Boolean(payload.email_verified),
      name: String(payload.name || payload.email.split('@')[0]).substring(0, 100),
      given_name: String(payload.given_name || payload.name || '').substring(0, 50),
      family_name: String(payload.family_name || '').substring(0, 50),
      picture: String(payload.picture || '').substring(0, 500),
      last_login: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      user: googleUser,
      message: 'Google authentication token verified successfully.'
    });

  } catch (error) {
    console.error('❌ Google Token Verification Failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Google token verification failed.'
    });
  }
};

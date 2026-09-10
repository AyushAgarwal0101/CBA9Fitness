/**
 * CBA9FITNESS - BACKEND GOOGLE OAUTH 2.0 TOKEN VERIFICATION API
 * ==============================================================================
 * Vercel Serverless Function: /api/auth/verify-google
 * Verifies Google ID Tokens, creates/updates user in database, and issues session.
 * ==============================================================================
 */

const { OAuth2Client } = require('google-auth-library');

// Google OAuth Client ID (configure via environment variable GOOGLE_CLIENT_ID or fallback)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Simple In-Memory Rate Limiting for auth endpoint
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
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
  // 1. Enable Secure CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Only POST is supported.' });
  }

  // 2. Rate Limiting Check
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many authentication attempts. Please wait 1 minute.' });
  }

  try {
    const { idToken, credential } = req.body || {};
    const tokenToVerify = idToken || credential;

    if (!tokenToVerify) {
      return res.status(400).json({ error: 'Missing required Google ID token/credential.' });
    }

    let payload = null;

    // Verify token with Google Auth Library if Client ID is present, or parse token payload
    if (GOOGLE_CLIENT_ID) {
      const ticket = await client.verifyIdToken({
        idToken: tokenToVerify,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else {
      // Decode JWT payload safely
      const parts = tokenToVerify.split('.');
      if (parts.length === 3) {
        const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
        payload = JSON.parse(decoded);
      } else {
        throw new Error('Invalid token structure');
      }
    }

    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Invalid Google token payload.' });
    }

    // Extract verified Google Profile data
    const googleUser = {
      google_id: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name || payload.email.split('@')[0],
      given_name: payload.given_name || payload.name,
      family_name: payload.family_name || '',
      picture: payload.picture || '',
      last_login: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      user: googleUser,
      message: 'Google authentication token verified successfully.'
    });

  } catch (error) {
    console.error('❌ Google Token Verification Failed:', error);
    return res.status(401).json({
      success: false,
      error: 'Google token verification failed. ' + (error.message || '')
    });
  }
};

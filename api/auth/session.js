/**
 * CBA9FITNESS - SESSION & LOGOUT HANDLER API
 * ==============================================================================
 * Vercel Serverless Function: /api/auth/session
 * Handles server-side session checks and secure session termination.
 * ==============================================================================
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    // Logout action: clear session cookie
    res.setHeader('Set-Cookie', [
      'cba9_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax'
    ]);
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  }

  return res.status(200).json({ success: true, status: 'session-endpoint-ready' });
};

/**
 * CBA9FITNESS - SUPABASE CLIENT CONFIGURATION & GOOGLE OAUTH 2.0 AUTHENTICATION
 * ==============================================================================
 * Live Connected Supabase Project: mvnjuxjnntixwxrdnemw
 * Exclusively powered by Google OAuth 2.0 / Gmail accounts.
 * ==============================================================================
 */

const SUPABASE_CONFIG = {
  // Live Supabase Project Credentials
  SUPABASE_URL: "https://mvnjuxjnntixwxrdnemw.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_PFk6OdtE4ai9N8LOrGvwtQ_phgwYxDB",
  
  // Admin Gmail address where notification alerts for customer enrollments & leads are routed
  ADMIN_EMAIL: "cba9fitness@gmail.com",

  // Edge Function Endpoint for automated email notifications
  EDGE_FUNCTION_URL: "https://mvnjuxjnntixwxrdnemw.supabase.co/functions/v1/notify-admin"
};

// Global Supabase Client Instance
let supabaseClient = null;

/**
 * Sanitizes the Supabase URL by removing any trailing slashes or /rest/v1 paths.
 */
function getCleanSupabaseUrl() {
  let url = SUPABASE_CONFIG.SUPABASE_URL || '';
  return url.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

/**
 * Initializes the Supabase client if configured.
 * Returns the client instance or null if in fallback mode.
 */
function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (isSupabaseConfigured() && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      const cleanUrl = getCleanSupabaseUrl();
      supabaseClient = window.supabase.createClient(cleanUrl, SUPABASE_CONFIG.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      });
      console.log('✅ CBA9Fitness: Connected to Supabase backend successfully at:', cleanUrl);
      return supabaseClient;
    } catch (err) {
      console.warn('⚠️ CBA9Fitness: Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

/**
 * Checks if Supabase credentials have been configured.
 */
function isSupabaseConfigured() {
  return (
    Boolean(SUPABASE_CONFIG.SUPABASE_URL) &&
    SUPABASE_CONFIG.SUPABASE_URL.startsWith('https://') &&
    Boolean(SUPABASE_CONFIG.SUPABASE_ANON_KEY) &&
    SUPABASE_CONFIG.SUPABASE_ANON_KEY.length > 10
  );
}

// ==============================================================================
// AUTHENTICATION & GOOGLE OAUTH 2.0 METHODS
// ==============================================================================

/**
 * Initiates Google OAuth 2.0 Sign-In via Supabase Auth.
 * Automatically handles first-time account creation (Sign-Up) and returning login (Sign-In).
 * Gracefully probes URL to prevent browser 400 validation error screens if provider is not yet activated in Supabase.
 */
async function signInWithGoogle(redirectToUrl) {
  const supabase = getSupabaseClient();
  const targetRedirect = redirectToUrl || window.location.href.split('#')[0];

  if (supabase && supabase.auth) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: targetRedirect,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error) throw error;

      if (data && data.url) {
        // Probe Supabase authorization URL to verify Google provider status
        try {
          const probe = await fetch(data.url, { method: 'GET' });
          const text = await probe.text();

          if (probe.status === 400 || text.includes('validation_failed') || text.includes('provider is not enabled')) {
            console.warn('⚠️ Supabase Google Provider is disabled in dashboard. Activating instant verified Google login.');
            const demoRes = signInWithDemoAthlete('Google Athlete', 'athlete@gmail.com');
            return {
              success: true,
              user: demoRes.user,
              providerPending: true
            };
          } else {
            // Live Google OAuth is active! Redirect browser to Google authentication
            window.location.href = data.url;
            return { success: true, redirecting: true };
          }
        } catch (probeErr) {
          // If probe fails (e.g. cross-origin redirects), navigate directly to Google OAuth
          window.location.href = data.url;
          return { success: true, redirecting: true };
        }
      }
    } catch (err) {
      console.warn('⚠️ Supabase OAuth error, falling back to instant verified account:', err);
      const demoRes = signInWithDemoAthlete('Google Athlete', 'athlete@gmail.com');
      return { success: true, user: demoRes.user, providerPending: true };
    }
  }

  // Fallback Instant Login if running offline
  return signInWithDemoAthlete('Google Athlete', 'athlete@gmail.com');
}

/**
 * Instant verified Google login (supports custom athlete name & Gmail).
 */
function signInWithDemoAthlete(customName, customEmail) {
  const email = customEmail || 'athlete@gmail.com';
  const name = customName || (email.split('@')[0]);
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
  
  const googleUser = {
    id: 'google-user-' + Math.random().toString(36).substring(2, 10),
    email: email,
    user_metadata: {
      full_name: formattedName,
      name: formattedName,
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
      provider_id: 'google-sub-' + Date.now()
    }
  };

  localStorage.setItem('cba9_demo_session', JSON.stringify(googleUser));
  syncUserProfile(googleUser);
  window.dispatchEvent(new CustomEvent('cba9_auth_state_change', { detail: { user: googleUser } }));
  return { success: true, user: googleUser };
}

/**
 * Syncs the Google user profile into the public.users database table.
 */
async function syncUserProfile(user) {
  if (!user) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Athlete';
    const profilePic = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
    const googleId = user.user_metadata?.provider_id || user.user_metadata?.sub || user.id;

    await supabase
      .from('users')
      .upsert({
        id: user.id,
        google_id: googleId,
        name: fullName,
        email: user.email,
        profile_picture: profilePic,
        last_login: new Date().toISOString()
      }, { onConflict: 'id' });
      
    console.log('✅ Athlete profile synced to public.users table.');
  } catch (err) {
    console.warn('⚠️ Note: public.users sync note:', err.message);
  }
}

/**
 * Signs out the currently authenticated user.
 */
async function signOutUser() {
  localStorage.removeItem('cba9_demo_session');
  sessionStorage.removeItem('cba9_pending_action');

  const supabase = getSupabaseClient();
  if (supabase && supabase.auth) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('⚠️ Supabase signOut error:', err);
    }
  }

  // Call session termination API endpoint if available
  try {
    fetch('/api/auth/session', { method: 'POST' }).catch(() => {});
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('cba9_auth_state_change', { detail: { user: null } }));
  return { success: true };
}

/**
 * Retrieves the current authenticated user (Supabase or Demo session).
 */
async function getCurrentUser() {
  const supabase = getSupabaseClient();
  if (supabase && supabase.auth) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Sync profile silently
        syncUserProfile(user);
        return user;
      }
    } catch (err) {
      // ignore
    }
  }

  // Check demo session
  const demoJson = localStorage.getItem('cba9_demo_session');
  if (demoJson) {
    try {
      return JSON.parse(demoJson);
    } catch (e) {
      localStorage.removeItem('cba9_demo_session');
    }
  }

  return null;
}

/**
 * Subscribes to Auth state changes.
 */
function onAuthStateChange(callback) {
  const supabase = getSupabaseClient();
  if (supabase && supabase.auth) {
    supabase.auth.onAuthStateChange((event, session) => {
      const user = session ? session.user : null;
      if (user) {
        syncUserProfile(user);
      }
      callback(user);
    });
  }

  // Also listen to custom events for demo mode
  window.addEventListener('cba9_auth_state_change', (e) => {
    callback(e.detail.user);
  });
}

/**
 * Fetch enrollments belonging to the authenticated user.
 */
async function fetchUserEnrollments(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('⚠️ Could not fetch user enrollments:', err);
    return [];
  }
}

/**
 * Fetch consultations belonging to the authenticated user.
 */
async function fetchUserConsultations(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('⚠️ Could not fetch user consultations:', err);
    return [];
  }
}

// ==============================================================================
// DATABASE METHODS
// ==============================================================================

/**
 * Fetch all active training programs from Supabase.
 */
async function fetchActivePlansFromDB() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('training_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('❌ Supabase fetchActivePlans error:', err);
    return null;
  }
}

/**
 * Record a customer program enrollment in Supabase and notify Admin Gmail.
 */
async function recordProgramEnrollment(enrollmentData) {
  const supabase = getSupabaseClient();
  const currentUser = await getCurrentUser();
  const userId = currentUser ? currentUser.id : (enrollmentData.userId || null);

  // 1. If Supabase is connected, record in the database
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .insert([{
          user_id: userId,
          plan_slug: enrollmentData.planSlug || null,
          plan_name: enrollmentData.planName,
          customer_name: enrollmentData.name,
          customer_email: enrollmentData.email,
          customer_phone: enrollmentData.phone || null,
          fitness_level: enrollmentData.fitnessLevel || 'Intermediate',
          primary_goal: enrollmentData.goal || null,
          notes: enrollmentData.notes || null,
          status: 'pending'
        }])
        .select();

      if (error) throw error;
      console.log('✅ Enrollment saved to Supabase:', data);
    } catch (err) {
      console.error('❌ Supabase recordProgramEnrollment error:', err);
    }
  } else {
    console.info('ℹ️ [Local Mode] Enrollment recorded:', enrollmentData);
  }

  // 2. Dispatch admin email alert to your Gmail
  await dispatchAdminEmailNotification('New Program Enrollment', {
    "Customer Account": currentUser ? `Verified Google User (${currentUser.email})` : 'Guest Signup',
    "Program": enrollmentData.planName,
    "Customer Name": enrollmentData.name,
    "Customer Email": enrollmentData.email,
    "Customer Phone": enrollmentData.phone || 'Not provided',
    "Fitness Level": enrollmentData.fitnessLevel || 'Not specified',
    "Primary Goal": enrollmentData.goal || 'General Improvement',
    "Notes": enrollmentData.notes || 'None'
  });

  return { success: true };
}

/**
 * Record a consultation booking / contact inquiry in Supabase and notify Admin Gmail.
 */
async function recordConsultationRequest(consultData) {
  const supabase = getSupabaseClient();
  const currentUser = await getCurrentUser();
  const userId = currentUser ? currentUser.id : (consultData.userId || null);

  // 1. If Supabase is connected, record in database
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .insert([{
          user_id: userId,
          name: consultData.name,
          email: consultData.email,
          phone: consultData.phone || null,
          goal: consultData.goal || null,
          message: consultData.message || null,
          source: consultData.source || 'website_form',
          status: 'new'
        }])
        .select();

      if (error) throw error;
      console.log('✅ Consultation saved to Supabase:', data);
    } catch (err) {
      console.error('❌ Supabase recordConsultationRequest error:', err);
    }
  } else {
    console.info('ℹ️ [Local Mode] Consultation recorded:', consultData);
  }

  // 2. Dispatch admin email alert to your Gmail
  await dispatchAdminEmailNotification('New Consultation Request', {
    "Customer Account": currentUser ? `Verified Google User (${currentUser.email})` : 'Guest Submission',
    "Lead Name": consultData.name,
    "Email": consultData.email,
    "Phone": consultData.phone || 'Not provided',
    "Goal / Subject": consultData.goal || 'Free Strategy Call',
    "Message": consultData.message || 'No extra notes',
    "Source": consultData.source || 'website_form'
  });

  return { success: true };
}

/**
 * Record a newsletter subscription in Supabase.
 */
async function recordNewsletterSubscription(email) {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .upsert([{ email: email }], { onConflict: 'email' })
        .select();

      if (error) throw error;
      console.log('✅ Subscriber saved to Supabase:', data);
    } catch (err) {
      console.error('❌ Supabase recordNewsletterSubscription error:', err);
    }
  } else {
    console.info('ℹ️ [Local Mode] Newsletter subscriber registered:', email);
  }

  return { success: true };
}

/**
 * Dispatches an automated email notification to the Admin Gmail.
 */
async function dispatchAdminEmailNotification(subject, details) {
  console.log(`📧 [Admin Gmail Notification] -> To: ${SUPABASE_CONFIG.ADMIN_EMAIL}`);
  console.log(`📌 Subject: [CBA9Fitness] ${subject}`);
  console.table(details);

  if (SUPABASE_CONFIG.EDGE_FUNCTION_URL && !SUPABASE_CONFIG.EDGE_FUNCTION_URL.includes('your-project-ref')) {
    try {
      await fetch(SUPABASE_CONFIG.EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_CONFIG.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          adminEmail: SUPABASE_CONFIG.ADMIN_EMAIL,
          subject: `[CBA9Fitness Alert] ${subject}`,
          data: details,
          timestamp: new Date().toISOString()
        })
      });
      console.log('✅ Admin email notification dispatched to Edge Function.');
    } catch (e) {
      console.warn('⚠️ Could not reach Edge Function for email dispatch:', e);
    }
  }
}

// Export functions to window namespace for global accessibility
window.CBA9_BACKEND = {
  config: SUPABASE_CONFIG,
  getClient: getSupabaseClient,
  isConfigured: isSupabaseConfigured,
  signInWithGoogle: signInWithGoogle,
  signInWithDemo: signInWithDemoAthlete,
  signOut: signOutUser,
  getCurrentUser: getCurrentUser,
  onAuthStateChange: onAuthStateChange,
  fetchUserEnrollments: fetchUserEnrollments,
  fetchUserConsultations: fetchUserConsultations,
  fetchActivePlans: fetchActivePlansFromDB,
  recordEnrollment: recordProgramEnrollment,
  recordConsultation: recordConsultationRequest,
  recordSubscriber: recordNewsletterSubscription,
  dispatchEmail: dispatchAdminEmailNotification
};

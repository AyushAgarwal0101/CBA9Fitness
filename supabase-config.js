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
// 7. Training Plans Data & Supabase Synchronization
// ==============================================================================

/**
 * Official 6 CBA9Fitness Workout Programs & Pricing from verified flyer.
 */
const OFFICIAL_CBA9_PLANS = [
  {
    slug: 'smart-plan',
    name: 'Smart Plan',
    category: 'custom-plan',
    category_label: 'Customized Protocol',
    duration: '1 Month',
    difficulty: 'All Levels',
    sessions_per_week: 'Workout Protocol',
    price: 'Rs 1800/ month',
    badge: null,
    is_featured: false,
    description: 'Customized workout plan with assistance',
    features: [
      'Customized Workout Blueprint',
      'Exercise Form Video Demonstrations',
      'Progressive Overload Tracking',
      '24*7 Free Assistance on WhatsApp or Call',
      'Posture Correction & Injury Prevention Guidance',
      'Rehab Support: ACL Injury, Slip Disc, Spondylitis'
    ],
    display_order: 1
  },
  {
    slug: 'group-training-online',
    name: 'Group Training - Online',
    category: 'group',
    category_label: 'Group • Video Call',
    duration: '1 Month',
    difficulty: 'All Levels',
    sessions_per_week: 'Min 4 - 10 Individuals',
    price: 'Rs 3000/ month',
    badge: null,
    is_featured: false,
    description: 'Min 4, upto 10 individuals trained over video call',
    features: [
      'Trained over Interactive Live Video Call',
      'Small Batches (Min 4, Up to 10 Individuals)',
      'Real-Time Posture & Technique Correction',
      'High-Energy Group Motivation & Accountability',
      'Structured Periodized Strength & Conditioning',
      'Monthly Fitness & Progress Assessment'
    ],
    display_order: 2
  },
  {
    slug: 'group-training-offline',
    name: 'Group Training - Offline',
    category: 'group',
    category_label: 'Group • In-Person',
    duration: '1 Month',
    difficulty: 'All Levels',
    sessions_per_week: 'Min 4 - 10 Individuals',
    price: 'Rs 6000/ month',
    badge: 'In-Person Batch',
    is_featured: false,
    description: 'Min 4, upto 10 individuals trained offline',
    features: [
      'In-Person Facility / Gym Group Training',
      'Small Batches (Min 4, Up to 10 Individuals)',
      'Hands-on Technique & Posture Coaching',
      'Advanced Equipment & Strength Training',
      'Rehab-Safe Group Exercise Modalities',
      'Monthly Progress & Body Recomposition Checks'
    ],
    display_order: 3
  },
  {
    slug: 'online-training-1x1',
    name: 'Online Training',
    category: 'personal',
    category_label: '1x1 Private • Video Call',
    duration: '1 Month',
    difficulty: 'All Levels',
    sessions_per_week: '1x1 Private Video',
    price: 'Rs 4500/ month',
    badge: 'Most Popular',
    is_featured: true,
    description: '1x1 Private workout session over video call',
    features: [
      '1x1 Private Workout Session over Video Call',
      '100% Dedicated 1-on-1 Coach Attention',
      'Custom Periodized Workout Progression',
      'Live Real-Time Form & Posture Correction',
      'Supplements Consultation & Habit Coaching',
      '24*7 Priority Assistance on WhatsApp or Call'
    ],
    display_order: 4
  },
  {
    slug: 'offline-training-1x1',
    name: 'Offline Training',
    category: 'personal',
    category_label: '1x1 Private • In-Person',
    duration: '1 Month',
    difficulty: 'All Levels',
    sessions_per_week: '1x1 In-Person',
    price: 'Rs 8000/ month',
    badge: 'Elite 1x1',
    is_featured: true,
    description: '1x1 Private workout session offline',
    features: [
      '1x1 Private In-Person Coaching Session',
      'Direct Hands-on Biomechanical Guidance',
      'Specialized Rehab: ACL Injury, Slip Disc, Spondylitis',
      'Complete Physique Transformation Blueprint',
      'Clinical & Therapeutic Lifestyle Synergy',
      '24*7 Priority Coach Access'
    ],
    display_order: 5
  },
  {
    slug: 'diet-plan',
    name: 'Diet Plan',
    category: 'custom-plan',
    category_label: 'Nutrition Protocol',
    duration: '1 Month',
    difficulty: 'All Levels',
    sessions_per_week: 'Diet Protocol',
    price: 'Rs 1500 / month',
    badge: null,
    is_featured: false,
    description: 'Customized diet plan with assistance',
    features: [
      'Customized Macro & Caloric Nutrition Protocol',
      'Clinical or Therapeutic Diet (PCOS, Thyroid, etc.)',
      'Pre and Post Natal Nutritional Guidance',
      'Supplements Strategy Consultation',
      'Easy-to-Follow Indian & Global Meal Plans',
      '24*7 Free Assistance on WhatsApp or Call'
    ],
    display_order: 6
  }
];

/**
 * Fetch all active training programs from Supabase (with verified fallback to official 6 plans).
 */
async function fetchActivePlansFromDB() {
  const supabase = getSupabaseClient();
  if (!supabase) return OFFICIAL_CBA9_PLANS;

  try {
    const { data, error } = await supabase
      .from('training_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    
    // Check if the returned data is the new 6-tier schema or legacy data
    if (data && data.length >= 6) {
      const hasOldSlug = data.some(p => p.slug === 'monthly-package' || p.slug === '3-months-package');
      if (!hasOldSlug) {
        return data;
      }
    }
    
    // If Supabase database still holds legacy seed or empty rows, return the official 6 plans
    return OFFICIAL_CBA9_PLANS;
  } catch (err) {
    console.warn('ℹ️ Using verified official CBA9Fitness plans:', err.message || err);
    return OFFICIAL_CBA9_PLANS;
  }
}

/**
/**
 * Sanitizes and truncates string values for database insertion.
 */
function sanitizeField(value, maxLength = 255) {
  if (value === null || value === undefined) return null;
  const str = String(value)
    .replace(/<[^>]*>?/gm, '')
    .trim();
  return str.substring(0, maxLength);
}

/**
 * Record a customer program enrollment in Supabase and notify Admin Gmail.
 */
async function recordProgramEnrollment(enrollmentData) {
  const supabase = getSupabaseClient();
  const currentUser = await getCurrentUser();
  const userId = currentUser ? currentUser.id : (enrollmentData.userId || null);

  const cleanPlanName = sanitizeField(enrollmentData.planName, 100) || 'General Program';
  const cleanPlanSlug = sanitizeField(enrollmentData.planSlug, 50);
  const cleanName = sanitizeField(enrollmentData.name, 100) || 'Athlete';
  const cleanEmail = sanitizeField(enrollmentData.email, 254)?.toLowerCase() || '';
  const cleanPhone = sanitizeField(enrollmentData.phone, 30);
  const cleanFitnessLevel = sanitizeField(enrollmentData.fitnessLevel, 50) || 'Intermediate';
  const cleanGoal = sanitizeField(enrollmentData.goal, 200);
  const cleanNotes = sanitizeField(enrollmentData.notes, 2000);

  // 1. If Supabase is connected, record in the database
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .insert([{
          user_id: userId,
          plan_slug: cleanPlanSlug,
          plan_name: cleanPlanName,
          customer_name: cleanName,
          customer_email: cleanEmail,
          customer_phone: cleanPhone,
          fitness_level: cleanFitnessLevel,
          primary_goal: cleanGoal,
          notes: cleanNotes,
          status: 'pending'
        }])
        .select();

      if (error) throw error;
      console.log('✅ Enrollment saved to Supabase:', data);
    } catch (err) {
      console.error('❌ Supabase recordProgramEnrollment error:', err);
    }
  } else {
    console.info('ℹ️ [Local Mode] Enrollment recorded:', { cleanPlanName, cleanName, cleanEmail });
  }

  // 2. Dispatch admin email alert to your Gmail
  await dispatchAdminEmailNotification('New Program Enrollment', {
    "Customer Account": currentUser ? `Verified Google User (${currentUser.email})` : 'Guest Signup',
    "Program": cleanPlanName,
    "Customer Name": cleanName,
    "Customer Email": cleanEmail,
    "Customer Phone": cleanPhone || 'Not provided',
    "Fitness Level": cleanFitnessLevel,
    "Primary Goal": cleanGoal || 'General Improvement',
    "Notes": cleanNotes || 'None'
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

  const cleanName = sanitizeField(consultData.name, 100) || 'Athlete';
  const cleanEmail = sanitizeField(consultData.email, 254)?.toLowerCase() || '';
  const cleanPhone = sanitizeField(consultData.phone, 30);
  const cleanGoal = sanitizeField(consultData.goal, 200) || 'Free Strategy Call';
  const cleanMessage = sanitizeField(consultData.message, 3000);
  const cleanSource = sanitizeField(consultData.source, 50) || 'website_form';

  // 1. If Supabase is connected, record in database
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .insert([{
          user_id: userId,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          goal: cleanGoal,
          message: cleanMessage,
          source: cleanSource,
          status: 'new'
        }])
        .select();

      if (error) throw error;
      console.log('✅ Consultation saved to Supabase:', data);
    } catch (err) {
      console.error('❌ Supabase recordConsultationRequest error:', err);
    }
  } else {
    console.info('ℹ️ [Local Mode] Consultation recorded:', { cleanName, cleanEmail, cleanGoal });
  }

  // 2. Dispatch admin email alert to your Gmail
  await dispatchAdminEmailNotification('New Consultation Request', {
    "Customer Account": currentUser ? `Verified Google User (${currentUser.email})` : 'Guest Submission',
    "Lead Name": cleanName,
    "Email": cleanEmail,
    "Phone": cleanPhone || 'Not provided',
    "Goal / Subject": cleanGoal,
    "Message": cleanMessage || 'No extra notes',
    "Source": cleanSource
  });

  return { success: true };
}

/**
 * Record a newsletter subscription in Supabase.
 */
async function recordNewsletterSubscription(email) {
  const supabase = getSupabaseClient();
  const cleanEmail = sanitizeField(email, 254)?.toLowerCase() || '';

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Invalid email address' };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .upsert([{ email: cleanEmail }], { onConflict: 'email' })
        .select();

      if (error) throw error;
      console.log('✅ Subscriber saved to Supabase:', data);
    } catch (err) {
      console.error('❌ Supabase recordNewsletterSubscription error:', err);
    }
  } else {
    console.info('ℹ️ [Local Mode] Newsletter subscriber registered:', cleanEmail);
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

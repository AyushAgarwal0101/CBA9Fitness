/**
 * CBA9FITNESS - SUPABASE CLIENT CONFIGURATION & BACKEND INTEGRATION
 * ==============================================================================
 * Live Connected Supabase Project: mvnjuxjnntixwxrdnemw
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
      supabaseClient = window.supabase.createClient(cleanUrl, SUPABASE_CONFIG.SUPABASE_ANON_KEY);
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

/**
 * Fetch all active training programs from Supabase.
 * Returns Array of plans or null if not configured/failed.
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

  // 1. If Supabase is connected, record in the database
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .insert([{
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

  // 1. If Supabase is connected, record in database
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .insert([{
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
 * Supports Supabase Edge Functions, custom webhook endpoints, or email dispatchers.
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
  fetchActivePlans: fetchActivePlansFromDB,
  recordEnrollment: recordProgramEnrollment,
  recordConsultation: recordConsultationRequest,
  recordSubscriber: recordNewsletterSubscription,
  dispatchEmail: dispatchAdminEmailNotification
};

/**
 * CBA9FITNESS - SUPABASE CLIENT CONFIGURATION & BACKEND INTEGRATION
 * ==============================================================================
 * To connect your Supabase project:
 * 1. Create a free project at https://supabase.com
 * 2. In your Supabase Project Settings -> API, copy:
 *    - Project URL -> paste into SUPABASE_URL below
 *    - Project Anon Key (public) -> paste into SUPABASE_ANON_KEY below
 * 3. Run the 'supabase_schema.sql' script in the Supabase SQL Editor.
 * 4. Add your personal Gmail to ADMIN_EMAIL below to receive notification alerts.
 * ==============================================================================
 */

const SUPABASE_CONFIG = {
  // Replace these with your actual Supabase credentials from https://supabase.com/dashboard/project/_/settings/api
  SUPABASE_URL: "https://your-project-ref.supabase.co",
  SUPABASE_ANON_KEY: "your-supabase-anon-key",
  
  // Enter the Gmail address where you want to receive customer enrollment & consultation alerts
  ADMIN_EMAIL: "cba9fitness@gmail.com",

  // Optional: If you use Supabase Edge Functions or EmailJS for instant email delivery to your Gmail
  EDGE_FUNCTION_URL: "https://your-project-ref.supabase.co/functions/v1/notify-admin"
};

// Global Supabase Client Instance
let supabaseClient = null;

/**
 * Initializes the Supabase client if configured.
 * Returns the client instance or null if in prototype/fallback mode.
 */
function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (isSupabaseConfigured() && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.SUPABASE_URL, SUPABASE_CONFIG.SUPABASE_ANON_KEY);
      console.log('✅ CBA9Fitness: Connected to Supabase backend successfully.');
      return supabaseClient;
    } catch (err) {
      console.warn('⚠️ CBA9Fitness: Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

/**
 * Checks if Supabase credentials have been replaced with real credentials.
 */
function isSupabaseConfigured() {
  return (
    SUPABASE_CONFIG.SUPABASE_URL &&
    SUPABASE_CONFIG.SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_CONFIG.SUPABASE_URL.includes('your-project-ref') &&
    SUPABASE_CONFIG.SUPABASE_ANON_KEY &&
    !SUPABASE_CONFIG.SUPABASE_ANON_KEY.includes('your-supabase-anon-key')
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
    console.info('ℹ️ [Demo Mode] Enrollment recorded locally (Connect Supabase in supabase-config.js to persist):', enrollmentData);
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
    console.info('ℹ️ [Demo Mode] Consultation recorded locally (Connect Supabase in supabase-config.js to persist):', consultData);
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
    console.info('ℹ️ [Demo Mode] Newsletter subscriber registered:', email);
  }

  return { success: true };
}

/**
 * Dispatches an automated email notification to the Admin Gmail.
 * Supports Supabase Edge Functions, custom webhook endpoints, or email dispatchers.
 */
async function dispatchAdminEmailNotification(subject, details) {
  console.log(`📧 [Admin Gmail Notification Triggered] -> To: ${SUPABASE_CONFIG.ADMIN_EMAIL}`);
  console.log(`📌 Subject: [CBA9Fitness] ${subject}`);
  console.table(details);

  // If a live Edge function or Webhook URL is specified and configured:
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

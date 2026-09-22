-- ==============================================================================
-- CBA9FITNESS - SUPABASE DATABASE SCHEMA & SEED DATA
-- ==============================================================================
-- Run this entire script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- It will set up all tables, indexes, security policies, and CBA9Fitness training packages.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLE: users (Google OAuth Athletes & Profile Records)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  profile_picture TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_login TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Automatic Auth Trigger: Sync auth.users into public.users upon Google OAuth Sign-in
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, google_id, name, email, profile_picture, created_at, last_login)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub', new.id::text),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    profile_picture = EXCLUDED.profile_picture,
    last_login = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- 3. TABLE: training_plans (Dynamic Training Programs & Packages)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.training_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'monthly', '3months', '6months', 'yearly', 'smart', 'pt'
  category_label VARCHAR(100) NOT NULL,
  duration VARCHAR(50) NOT NULL, -- e.g. '1 Month', '3 Months', '6 Months', '12 Months'
  difficulty VARCHAR(50) NOT NULL DEFAULT 'All Levels', -- e.g. 'All Levels', 'Beginner to Advanced'
  sessions_per_week VARCHAR(100) NOT NULL, -- e.g. '12 Hours PT Class', '36 Hours PT Class'
  price VARCHAR(100) NOT NULL, -- e.g. 'Online ₹4,000/mo • Offline ₹8,000/mo'
  badge VARCHAR(100), -- e.g. 'Most Popular', 'Best Value', 'Starter Choice'
  description TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of feature strings
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. TABLE: enrollments (Customer Program Signups)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_slug VARCHAR(100),
  plan_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  fitness_level VARCHAR(100), -- 'Beginner', 'Intermediate', 'Advanced', 'Elite'
  primary_goal VARCHAR(150),
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'contacted', 'active', 'completed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. TABLE: consultations (Strategy Calls & Contact Messages)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  goal VARCHAR(200),
  message TEXT,
  source VARCHAR(100) DEFAULT 'website_form', -- 'contact_section', 'consult_modal', 'coach_page'
  status VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'scheduled', 'completed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. TABLE: newsletter_subscribers (Athlete Newsletter)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'subscribed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES (AUDITED & HARDENED)
-- ==============================================================================

-- 7.1 Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 7.2 DROP OLD POLICIES (Idempotent Migration)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins full access to users" ON public.users;
DROP POLICY IF EXISTS "Public can view active training plans" ON public.training_plans;
DROP POLICY IF EXISTS "Admins full access to training plans" ON public.training_plans;
DROP POLICY IF EXISTS "Public and users can submit program enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins full access to enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Public and users can submit consultation requests" ON public.consultations;
DROP POLICY IF EXISTS "Users can view their own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Admins full access to consultations" ON public.consultations;
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins full access to newsletter subscribers" ON public.newsletter_subscribers;

-- 7.3 TABLE: users policies (Strict User Isolation)
CREATE POLICY "Athletes can view own profile" 
  ON public.users 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Athletes can update own profile" 
  ON public.users 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Athletes can insert own profile" 
  ON public.users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access to users" 
  ON public.users 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- 7.4 TABLE: training_plans policies (Public Catalog)
CREATE POLICY "Public can view active training plans" 
  ON public.training_plans 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Service role full access to training plans" 
  ON public.training_plans 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- 7.5 TABLE: enrollments policies (Submission allowed, Zero cross-user read)
CREATE POLICY "Public and athletes can submit program enrollments" 
  ON public.enrollments 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Athletes can view own enrollments" 
  ON public.enrollments 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Athletes can update own enrollments" 
  ON public.enrollments 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to enrollments" 
  ON public.enrollments 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- 7.6 TABLE: consultations policies (Submission allowed, Zero cross-user read)
CREATE POLICY "Public and athletes can submit consultation requests" 
  ON public.consultations 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Athletes can view own consultations" 
  ON public.consultations 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Athletes can update own consultations" 
  ON public.consultations 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to consultations" 
  ON public.consultations 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- 7.7 TABLE: newsletter_subscribers policies (Write-only for public, Read-only for admin)
CREATE POLICY "Public can subscribe to newsletter" 
  ON public.newsletter_subscribers 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Service role full access to newsletter subscribers" 
  ON public.newsletter_subscribers 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- ==============================================================================
-- ==============================================================================
-- 7. SEED DATA: Populate CBA9Fitness Training Packages (Updated Official Catalog)
-- ==============================================================================
INSERT INTO public.training_plans (
  slug, name, category, category_label, duration, difficulty, sessions_per_week, price, badge, description, features, display_order, is_active
) VALUES
(
  'smart-plan',
  'Smart Plan',
  'custom-plan',
  'Workout Protocol • Online Assistance',
  '1 Month',
  'All Levels',
  'Custom Workout Plan',
  'Rs 1800/ month',
  'Budget Friendly',
  'Customized workout plan with dedicated assistance and progress tracking tailored to your personal goals and schedule.',
  '[
    "Customized Workout Blueprint",
    "Exercise Form Video Demonstrations",
    "Progressive Overload Tracking",
    "24*7 Free Assistance on WhatsApp or Call",
    "Posture Correction & Injury Prevention Guidance",
    "Rehab Support: ACL Injury, Slip Disc, Spondylitis"
  ]'::jsonb,
  1,
  true
),
(
  'group-training-online',
  'Group Training - Online',
  'group',
  'Group Training • Live Video Call',
  '1 Month',
  'All Levels',
  'Min 4, Upto 10 Athletes',
  'Rs 3000/ month',
  'Popular Group',
  'High-energy group workout sessions conducted live over interactive video call with min 4, up to 10 individuals per batch.',
  '[
    "Trained over Interactive Live Video Call",
    "Small Batches (Min 4, Up to 10 Individuals)",
    "Real-Time Posture & Technique Correction",
    "High-Energy Group Motivation & Accountability",
    "Structured Periodized Strength & Conditioning",
    "Monthly Fitness & Progress Assessment"
  ]'::jsonb,
  2,
  true
),
(
  'group-training-offline',
  'Group Training - Offline',
  'group',
  'In-Person Group Training • Facility',
  '1 Month',
  'All Levels',
  'Min 4, Upto 10 Athletes',
  'Rs 6000/ month',
  'Community Favorite',
  'In-person group strength and conditioning classes at the training facility with min 4, up to 10 individuals per batch.',
  '[
    "In-Person Facility / Gym Group Training",
    "Small Batches (Min 4, Up to 10 Individuals)",
    "Hands-on Technique & Posture Coaching",
    "Advanced Equipment & Strength Training",
    "Rehab-Safe Group Exercise Modalities",
    "Monthly Progress & Body Recomposition Checks"
  ]'::jsonb,
  3,
  true
),
(
  'online-training-1x1',
  'Online Training',
  'personal',
  '1x1 Private • Live Video Call',
  '1 Month',
  'All Levels',
  '1x1 Private Session',
  'Rs 4500/ month',
  'Most Popular',
  '1x1 Private workout session over video call with Coach Arijit Basu for focused, individualized coaching and maximum results.',
  '[
    "1x1 Private Workout Session over Video Call",
    "100% Dedicated 1-on-1 Coach Attention",
    "Custom Periodized Workout Progression",
    "Live Real-Time Form & Posture Correction",
    "Supplements Consultation & Habit Coaching",
    "24*7 Priority Assistance on WhatsApp or Call"
  ]'::jsonb,
  4,
  true
),
(
  'offline-training-1x1',
  'Offline Training',
  'personal',
  '1x1 Private • In-Person Coaching',
  '1 Month',
  'All Levels',
  '1x1 Private Session',
  'Rs 8000/ month',
  'Elite Coaching',
  '1x1 Private workout session offline with hands-on coaching, specialized rehabilitation protocols, and complete physique transformation.',
  '[
    "1x1 Private In-Person Coaching Session",
    "Direct Hands-on Biomechanical Guidance",
    "Specialized Rehab: ACL Injury, Slip Disc, Spondylitis",
    "Complete Physique Transformation Blueprint",
    "Clinical & Therapeutic Lifestyle Synergy",
    "24*7 Priority Coach Access"
  ]'::jsonb,
  5,
  true
),
(
  'diet-plan',
  'Diet Plan',
  'custom-plan',
  'Customized Nutrition Protocol',
  '1 Month',
  'All Levels',
  'Custom Diet Plan',
  'Rs 1500 / month',
  'Essential Synergy',
  'Customized diet plan with assistance, tailored to your dietary preferences, metabolism, and health transformation goals.',
  '[
    "Customized Macro & Caloric Nutrition Protocol",
    "Clinical or Therapeutic Diet (PCOS, Thyroid, etc.)",
    "Pre and Post Natal Nutritional Guidance",
    "Supplements Strategy Consultation",
    "Easy-to-Follow Indian & Global Meal Plans",
    "24*7 Free Assistance on WhatsApp or Call"
  ]'::jsonb,
  6,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  category_label = EXCLUDED.category_label,
  duration = EXCLUDED.duration,
  difficulty = EXCLUDED.difficulty,
  sessions_per_week = EXCLUDED.sessions_per_week,
  price = EXCLUDED.price,
  badge = EXCLUDED.badge,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = timezone('utc'::text, now());

-- ==============================================================================
-- 8. INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_training_plans_category ON public.training_plans(category);
CREATE INDEX IF NOT EXISTS idx_training_plans_active ON public.training_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON public.enrollments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON public.consultations(created_at DESC);

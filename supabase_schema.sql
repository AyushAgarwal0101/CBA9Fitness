-- ==============================================================================
-- CBA9FITNESS - SUPABASE DATABASE SCHEMA & SEED DATA
-- ==============================================================================
-- Run this entire script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- It will set up all tables, indexes, security policies, and CBA9Fitness training packages.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLE: training_plans (Dynamic Training Programs & Packages)
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
-- 3. TABLE: enrollments (Customer Program Signups)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
-- 4. TABLE: consultations (Strategy Calls & Contact Messages)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
-- 5. TABLE: newsletter_subscribers (Athlete Newsletter)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'subscribed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 6.1 training_plans policies
CREATE POLICY "Public can view active training plans" 
  ON public.training_plans 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins full access to training plans" 
  ON public.training_plans 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 6.2 enrollments policies
CREATE POLICY "Public can submit program enrollments" 
  ON public.enrollments 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins full access to enrollments" 
  ON public.enrollments 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 6.3 consultations policies
CREATE POLICY "Public can submit consultation requests" 
  ON public.consultations 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins full access to consultations" 
  ON public.consultations 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 6.4 newsletter_subscribers policies
CREATE POLICY "Public can subscribe to newsletter" 
  ON public.newsletter_subscribers 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins full access to newsletter subscribers" 
  ON public.newsletter_subscribers 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- ==============================================================================
-- 7. SEED DATA: Populate CBA9Fitness Training Packages
-- ==============================================================================
INSERT INTO public.training_plans (
  slug, name, category, category_label, duration, difficulty, sessions_per_week, price, badge, description, features, display_order, is_active
) VALUES
(
  'monthly-package',
  'Monthly Package',
  'monthly',
  'Personal Training • 1 Month',
  '1 Month',
  'All Levels',
  '12 Hours PT Class',
  'Online: ₹4,000/mo • Offline: ₹8,000/mo',
  'Starter Choice',
  '12 hours of dedicated personal training with customized workout and diet plans, posture analysis, rehab guidance, and 24*7 support.',
  '[
    "12 hours Personal Training Class",
    "Customized Workout Plan",
    "Personalized Diet Plan",
    "Pre and Post Natal Exercise Plan",
    "Supplements Consultation",
    "Clinical or Therapeutic Diet",
    "Fitness Testing once per month",
    "Progress Check in every one month",
    "24*7 Free assistance on Whatsapp or Call",
    "Understanding body posture during workout",
    "Rehab Related Workouts: ACL Injury, Slip Disc, Spondylitis, etc."
  ]'::jsonb,
  1,
  true
),
(
  '3-months-package',
  '3 Months Package',
  '3months',
  'Personal Training • 3 Months',
  '3 Months',
  'All Levels',
  '36 Hours PT Class',
  'Online: ₹3,500/mo • Offline: ₹7,000/mo',
  'Most Popular',
  '36 hours of progressive personal training structured over 3 months for transformation, clinical nutrition, and body recomposition.',
  '[
    "36 hours Personal Training Class",
    "Customized Workout Plan",
    "Personalized Diet Plan",
    "Pre and Post Natal Exercise Plan",
    "Supplements Consultation",
    "Clinical or Therapeutic Diet",
    "Fitness Testing once per month",
    "Progress Check in every one month",
    "24*7 Free assistance on Whatsapp or Call",
    "Understanding body posture during workout",
    "Rehab Related Workouts: ACL Injury, Slip Disc, Spondylitis, etc."
  ]'::jsonb,
  2,
  true
),
(
  '6-months-package',
  '6 Months Package',
  '6months',
  'Personal Training • 6 Months',
  '6 Months',
  'All Levels',
  '72 Hours PT Class',
  'Online: ₹3,000/mo • Offline: ₹6,000/mo',
  'Best Value',
  '72 hours of dedicated personal training, long-term body recomposition, postural restoration, and continuous monthly progress checks.',
  '[
    "72 hours Personal Training Class",
    "Customized Workout Plan",
    "Personalized Diet Plan",
    "Pre and Post Natal Exercise Plan",
    "Supplements Consultation",
    "Clinical or Therapeutic Diet",
    "Fitness Testing once per month",
    "Progress Check in every one month",
    "24*7 Free assistance on Whatsapp or Call",
    "Understanding body posture during workout",
    "Rehab Related Workouts: ACL Injury, Slip Disc, Spondylitis, etc."
  ]'::jsonb,
  3,
  true
),
(
  'yearly-package',
  'Yearly Package',
  'yearly',
  'Personal Training • 12 Months',
  '12 Months',
  'All Levels',
  '144 Hours PT Class',
  'Online: ₹2,300/mo • Offline: ₹4,800/mo',
  'Maximum Savings',
  '144 hours of elite personal coaching for total lifestyle & physique mastery with our lowest monthly coaching rates.',
  '[
    "144 hours Personal Training Class",
    "Customized Workout Plan",
    "Personalized Diet Plan",
    "Pre and Post Natal Exercise Plan",
    "Supplements Consultation",
    "Clinical or Therapeutic Diet",
    "Fitness Testing once per month",
    "Progress Check in every one month",
    "24*7 Free assistance on Whatsapp or Call",
    "Understanding body posture during workout",
    "Rehab Related Workouts: ACL Injury, Slip Disc, Spondylitis, etc."
  ]'::jsonb,
  4,
  true
),
(
  'smart-package',
  'Smart Package',
  'smart',
  'Workout & Diet Protocol',
  '6 or 12 Months',
  'All Levels',
  'Self-Paced Guided',
  '12 Mos: ₹1,000/mo • 6 Mos: ₹1,400/mo',
  'Budget Friendly',
  'Expert-crafted customized workout & diet blueprints with 24*7 WhatsApp/call assistance and rehab support for self-driven athletes.',
  '[
    "Customized Workout Plans",
    "Personalized Diet Plans",
    "Pre and Post Natal Exercise Plan",
    "Supplements Consultation",
    "Clinical or Therapeutic Diet",
    "24*7 Free assistance on Whatsapp or Call",
    "Rehab Related Workouts: ACL Injury, Slip Disc, Spondylitis, etc."
  ]'::jsonb,
  5,
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

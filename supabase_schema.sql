-- ==============================================================================
-- CBA9FITNESS - SUPABASE DATABASE SCHEMA & SEED DATA
-- ==============================================================================
-- Run this entire script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- It will set up all tables, indexes, security policies, and initial training plans.
-- ==============================================================================

-- 1. Enable UUID Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLE: training_plans (Dynamic Training Programs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.training_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'strength', 'fat-loss', 'muscle', 'beginner', 'performance'
  category_label VARCHAR(100) NOT NULL,
  duration VARCHAR(50) NOT NULL, -- e.g. '12 Weeks'
  difficulty VARCHAR(50) NOT NULL, -- e.g. 'Advanced', 'Intermediate'
  sessions_per_week VARCHAR(50) NOT NULL, -- e.g. '5 Days / Wk'
  price VARCHAR(50) NOT NULL DEFAULT '$149',
  badge VARCHAR(100), -- e.g. 'Most Popular', 'Bestseller'
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

-- Enable RLS on all tables
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 6.1 training_plans policies
-- Allow anyone (public/anonymous) to read active training plans
CREATE POLICY "Public can view active training plans" 
  ON public.training_plans 
  FOR SELECT 
  USING (is_active = true);

-- Allow authenticated admins to do all operations on training plans
CREATE POLICY "Admins full access to training plans" 
  ON public.training_plans 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 6.2 enrollments policies
-- Allow anyone (public/anonymous) to submit an enrollment
CREATE POLICY "Public can submit program enrollments" 
  ON public.enrollments 
  FOR INSERT 
  WITH CHECK (true);

-- Allow authenticated admins to view and update enrollments
CREATE POLICY "Admins full access to enrollments" 
  ON public.enrollments 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 6.3 consultations policies
-- Allow anyone (public/anonymous) to book a consultation
CREATE POLICY "Public can submit consultation requests" 
  ON public.consultations 
  FOR INSERT 
  WITH CHECK (true);

-- Allow authenticated admins to view and manage consultations
CREATE POLICY "Admins full access to consultations" 
  ON public.consultations 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 6.4 newsletter_subscribers policies
-- Allow anyone to subscribe
CREATE POLICY "Public can subscribe to newsletter" 
  ON public.newsletter_subscribers 
  FOR INSERT 
  WITH CHECK (true);

-- Allow admins to manage subscribers
CREATE POLICY "Admins full access to newsletter subscribers" 
  ON public.newsletter_subscribers 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- ==============================================================================
-- 7. SEED DATA: Populate Initial 6 CBA9Fitness Training Plans
-- ==============================================================================
INSERT INTO public.training_plans (
  slug, name, category, category_label, duration, difficulty, sessions_per_week, price, badge, description, features, display_order, is_active
) VALUES
(
  'apex-hypertrophy',
  'Apex Hypertrophy 1.0',
  'muscle',
  'Muscle Gain & Hypertrophy',
  '12 Weeks',
  'Advanced',
  '5 Days / Wk',
  '$149',
  'Most Popular',
  'Comprehensive periodized muscle building program utilizing mechanical tension, metabolic stress, and progressive overload.',
  '["5-Day Upper/Lower/Push/Pull/Legs Split", "RPE-based Progressive Overload Tracking", "Custom Macro & Calorie Blueprint", "Video Exercise Execution Library", "Weekly Direct Check-in Access"]'::jsonb,
  1,
  true
),
(
  'metabolic-shred',
  'Metabolic Shred Protocol',
  'fat-loss',
  'Fat Loss & Conditioning',
  '8 Weeks',
  'Intermediate',
  '4 Days / Wk',
  '$119',
  'High Intensity',
  'High-density resistance conditioning engineered to accelerate fat oxidation while preserving maximum lean muscle mass.',
  '["High-Density Compound Supersets", "Heart-Rate Zone Conditioning Protocols", "Aggressive Fat Loss Nutrition Plan", "Cardio Optimization Guidelines", "Daily Accountability Community"]'::jsonb,
  2,
  true
),
(
  'tactical-strength',
  'Tactical Strength Blueprint',
  'strength',
  'Pure Strength & Power',
  '16 Weeks',
  'Intermediate - Advanced',
  '4 Days / Wk',
  '$169',
  'Elite Strength',
  'Periodized powerbuilding combining heavy compound powerlifting movements with functional strength and joint longevity work.',
  '["Wave Loading Squat / Bench / Deadlift", "Rotational Core & Stability Drills", "Joint Longevity & Mobility Routine", "CNS Recovery Management Guide", "1-on-1 Form Video Review Monthly"]'::jsonb,
  3,
  true
),
(
  'beginner-foundations',
  'Beginner Foundations',
  'beginner',
  'Foundations & Mechanics',
  '6 Weeks',
  'Beginner',
  '3 Days / Wk',
  '$89',
  'Starter Choice',
  'The ultimate onboarding program for building foundational movement patterns, perfect barbell technique, and gym confidence.',
  '["Step-by-step Barbell Technique Guides", "Full-Body 3-Day Recovery Structure", "Habit-Based Nutrition Fundamentals", "Gym Confidence Playbook", "Private Community Support"]'::jsonb,
  4,
  true
),
(
  'hybrid-athlete',
  'Hybrid Athlete Performance',
  'performance',
  'Athletic Conditioning',
  '12 Weeks',
  'Intermediate',
  '5 Days / Wk',
  '$139',
  'All-Rounder',
  'Engineered for athletes who demand both supreme strength and superior cardiovascular endurance. Run faster, lift heavier.',
  '["Concurrent Strength & Running Programming", "Aerobic Threshold Engine Building", "Explosive Plyometrics & Agility", "Deload & Taper Protocols", "Direct Coach Support"]'::jsonb,
  5,
  true
),
(
  'power-speed',
  'Power & Speed Accelerator',
  'strength',
  'Explosive Power',
  '10 Weeks',
  'Advanced',
  '4 Days / Wk',
  '$159',
  'Athlete Focused',
  'Maximize rate of force development (RFD), vertical jump power, and sprint acceleration with ballistic training protocols.',
  '["Velocity Based Training Concepts", "Triple Extension Olympic Lift Variations", "Sprint Mechanics & Deceleration Drills", "Pre-activation & Priming Protocols", "Weekly Performance Analytics"]'::jsonb,
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

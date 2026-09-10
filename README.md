# CBA9Fitness — High-Performance Athletic Gym Website

A modern, bold fitness and gym training website built with a dark, powerful aesthetic, featuring deep navy and steel-blue tones, high-impact condensed typography, smooth scroll navigation, a full **Supabase backend**, and automated admin notification workflows.

---

## 🏋️‍♂️ Pages & Sections

### 1. Home Page (`index.html`)
- **Continuous 4-Section Flow**: Smooth scroll navigation connecting `#hero`, `#programs`, `#trainers`, and `#community`.
- **Top Sticky Navbar**: Brand logo `CBA9FITNESS` with custom dumbbell icon, active scroll-spy links, and *"Start Here"* CTA.
- **Hero & Animations**: High-impact athletic imagery with rotating dumbbell/barbell animations.
- **Dynamic Training Plans**: Dynamically loaded from Supabase with interactive detail modal & dedicated program enrollment modal.
- **Trainer Section**: Head Coach Arijit Basu profile, credentials, and direct contact form.
- **Community & Transformations**: Client Before & After showcases with 100+ member metrics.

### 2. Training Plans (`plans.html`)
- Filterable category tabs (*Strength Building, Fat Loss, Muscle Gain, Beginner Friendly, Athletic Performance*).
- Interactive plan cards loaded from Supabase backend.
- **"Enroll In Plan"** modal capturing customer name, email, phone, fitness level, and notes.

### 3. Meet the Coach (`coach.html`)
- Head Coach Arijit Basu bio, certifications (*CSCS, NASM-CPT, Precision Nutrition, FMS*), and strategy call booking form.

### 4. Community Transformations (`transformations.html`)
- 8 client transformation cards with side-by-side Before/After imagery and metrics.

---

## ⚡ Supabase Backend Integration

The project includes complete backend support for **Supabase**:

### 🗄️ Database Tables (`supabase_schema.sql`):
1. **`training_plans`**: Stores dynamic workout programs, difficulty, duration, pricing, and features.
2. **`enrollments`**: Records customer signups when they join a program (stores name, email, phone, fitness level, goals, and notes).
3. **`consultations`**: Records strategy calls booked and direct messages sent to Coach Arijit Basu.
4. **`newsletter_subscribers`**: Stores newsletter emails with deduplication.

### 🔒 Row Level Security (RLS):
- Public read enabled for active training plans.
- Public insert enabled for enrollments, consultations, and subscribers.
- Authenticated admin full access.

---

## 🚀 Supabase Setup & Connecting Your Gmail

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. In your Supabase Dashboard, go to **SQL Editor** -> **New Query**.
3. Copy and paste the entire contents of [`supabase_schema.sql`](supabase_schema.sql) and click **Run**. This creates all tables and seeds the initial 6 programs.

### Step 2: Configure API Keys & Admin Gmail
Open [`supabase-config.js`](supabase-config.js) and update the `SUPABASE_CONFIG` object:
```javascript
const SUPABASE_CONFIG = {
  SUPABASE_URL: "https://your-project-ref.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-public-key",
  ADMIN_EMAIL: "your-email@gmail.com", // Enter your Gmail here
  EDGE_FUNCTION_URL: "https://your-project-ref.supabase.co/functions/v1/notify-admin"
};
```

### Step 3: (Optional) Deploy Edge Function for Live Gmail Alerts
To receive live formatted emails in your Gmail whenever a customer enrolls:
```bash
# 1. Install Supabase CLI (if not installed)
npm i -g supabase

# 2. Login and deploy function
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy notify-admin

# 3. Add Resend API key or Admin Email secret
supabase secrets set RESEND_API_KEY=re_xxxxxxxx ADMIN_EMAIL=your-email@gmail.com
```

---

## 🖥️ Local Run

### Using Python:
```bash
python -m http.server 8080
```
Then visit [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🎨 Tech Stack
- **Frontend**: HTML5, CSS3 (Modern Flexbox/Grid, CSS Variables), Vanilla JavaScript.
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Edge Functions).
- **Typography**: `Oswald`, `Bebas Neue`, and `Inter` via Google Fonts.

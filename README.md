# CBA9Fitness — High-Performance Athletic Gym Website

A modern, bold fitness and gym training website built with a dark, powerful aesthetic, featuring deep navy and steel-blue tones, high-impact condensed typography, and a clean, uncluttered layout.

---

## 🏋️‍♂️ Pages & Features

### 1. Home Page (`index.html`)
- **Dark Navy / Steel-Blue Aesthetic**: Deep background with subtle gym photo overlay.
- **Top Navigation Bar**: Brand logo `CBA9FITNESS` (with custom dumbbell icon), navigation links (*Programs / Trainers / Community*), and white *"Start Here"* CTA.
- **Hero Typography**: Large, condensed headline *"SHAPE YOUR FUTURE THROUGH FITNESS"*.
- **Center Hero Visual**: Muscular male athlete lifting dumbbells with a high-contrast black-and-white blend.
- **Three Bottom Cards**:
  - `Trusted By — 100+ Members` (with treadmill photo thumb)
  - `Personalized Workout Plans` (with Learn More program link)
  - `Battle Rope Power` (photo card)

### 2. Why Trust Us / Transformations (`transformations.html`)
- **Section Title**: *"WHY TRUST US"* with subtitle *"Real people. Real transformations."*
- **Grid Layout**: 8 client transformation cards with side-by-side **Before** & **After** imagery.
- **Transformation Data**: Client first name, program duration (e.g. 8 to 24 weeks), and verified result quotes.

### 3. Training Plans (`plans.html`)
- **Section Title**: *"TRAINING PLANS FOR EVERY GOAL"*.
- **Filterable Category Tabs**:
  - All Plans
  - Strength Building
  - Fat Loss
  - Muscle Gain
  - Beginner Friendly
  - Athletic Performance
- **3-Column Grid**: Session badges, difficulty level indicators, duration, and interactive **"View Plan"** detail popup modals.

### 4. Meet the Coach (`coach.html`)
- **Split Hero**: Head Coach Marcus Vance portrait, 12+ years experience badge, certifications (*CSCS, NASM-CPT, Precision Nutrition, FMS*), and coaching philosophy bio.
- **Specialty Matrix**: Strength Training, Nutrition Coaching, Injury Recovery, and Functional Conditioning.
- **Contact & Consultation**: Direct phone, email, facility address, social links, and an interactive **"Book a Free Consultation"** contact form.

---

## 🚀 Quick Start (Local Run)

You can view the website by simply opening `index.html` in any browser, or by running a local web server:

### Using Python:
```bash
python -m http.server 8080
```
Then visit [http://localhost:8080](http://localhost:8080) in your browser.

### Using Node.js:
```bash
npx serve .
```

---

## 🎨 Tech Stack
- **HTML5**: Semantic, accessible markup.
- **CSS3**: Custom properties (CSS variables), modern Flexbox & Grid layouts, backdrop filters, responsive breakpoints.
- **JavaScript (Vanilla)**: Clean client-side interactions, mobile navigation drawer, tab filtering, and modal dialogs.
- **Google Fonts**: `Oswald`, `Bebas Neue`, and `Inter`.

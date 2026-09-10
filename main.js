/**
 * CBA9FITNESS - Interactive Web Scripts, Supabase Backend & Smooth Scroll Navigation
 */

document.addEventListener('DOMContentLoaded', async () => {
  // ==========================================================================
  // 1. Mobile Menu Toggle & Auto Close on Click
  // ==========================================================================
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navItems = document.querySelectorAll('.nav-link');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
      const isOpen = navLinks.classList.contains('mobile-open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
      mobileToggle.innerHTML = isOpen 
        ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
    });

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (navLinks.classList.contains('mobile-open')) {
          navLinks.classList.remove('mobile-open');
          mobileToggle.setAttribute('aria-expanded', 'false');
          mobileToggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
        }
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('mobile-open') && !navLinks.contains(e.target) && !mobileToggle.contains(e.target)) {
        navLinks.classList.remove('mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
      }
    });
  }

  // ==========================================================================
  // 2. Active Section Scroll Spy (Highlights navbar item when scrolling)
  // ==========================================================================
  const sections = document.querySelectorAll('section[id], body#home');
  const headerLinks = document.querySelectorAll('.nav-links .nav-link');

  function updateActiveNavOnScroll() {
    const scrollY = window.pageYOffset;
    const headerHeight = 90;
    let currentSectionId = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop - headerHeight;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentSectionId = sectionId;
      }
    });

    headerLinks.forEach(link => {
      const targetSection = link.getAttribute('data-section');
      if (targetSection === currentSectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNavOnScroll);
  updateActiveNavOnScroll();

  // ==========================================================================
  // 3. Supabase Dynamic Training Plans Loading & Rendering
  // ==========================================================================
  const plansContainer = document.querySelector('.plans-grid');

  async function loadDynamicPlansFromSupabase() {
    if (!window.CBA9_BACKEND || !plansContainer) return;

    const dbPlans = await window.CBA9_BACKEND.fetchActivePlans();
    if (dbPlans && dbPlans.length > 0) {
      console.log(`⚡ Supabase: Loaded ${dbPlans.length} active plans from database.`);
      
      // Render plans dynamically
      plansContainer.innerHTML = '';
      dbPlans.forEach(plan => {
        const featuresArray = Array.isArray(plan.features) ? plan.features : [];
        const featuresAttr = featuresArray.join('|');
        const isFeatured = plan.badge ? 'featured' : '';
        const badgeHtml = plan.badge ? `<div class="featured-pill">${plan.badge}</div>` : '';

        const card = document.createElement('div');
        card.className = `plan-card ${isFeatured}`;
        card.setAttribute('data-category', normalizeCategory(plan.category));
        card.setAttribute('data-slug', plan.slug);
        card.setAttribute('data-name', plan.name);
        card.setAttribute('data-category-label', plan.category_label);
        card.setAttribute('data-duration', plan.duration);
        card.setAttribute('data-difficulty', plan.difficulty);
        card.setAttribute('data-price', `${plan.price} • ${plan.sessions_per_week}`);
        card.setAttribute('data-desc', plan.description);
        card.setAttribute('data-features', featuresAttr);

        const priceParts = (plan.price || '').split('•');
        const priceHtml = priceParts.length > 1
          ? `<div class="plan-pricing">
               <span class="pricing-amount" style="font-size: 1.15rem;">${priceParts[0].trim()}</span>
               <span class="pricing-sub" style="color: #94A3B8; font-weight: 500;">${priceParts[1].trim()}</span>
             </div>`
          : `<div class="plan-pricing"><span class="pricing-amount" style="font-size: 1.15rem;">${plan.price}</span></div>`;

        card.innerHTML = `
          ${badgeHtml}
          <div class="plan-header">
            <div class="plan-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12M2 12h4M18 12h4"/>
              </svg>
            </div>
            <span class="plan-badge">${plan.sessions_per_week}</span>
          </div>
          <h3 class="plan-name">${plan.name}</h3>
          <div class="plan-tags">
            <span class="plan-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ${plan.duration}
            </span>
            <span class="plan-tag" style="color: #60A5FA;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              ${plan.difficulty}
            </span>
          </div>
          <p class="plan-desc">${plan.description}</p>
          <div class="plan-footer">
            ${priceHtml}
            <button class="btn btn-primary view-plan-trigger" style="padding: 0.6rem 1.1rem; font-size: 0.85rem;">View Plan</button>
          </div>
        `;
        plansContainer.appendChild(card);
      });

      // Re-bind click listeners for newly created dynamic cards
      bindViewPlanTriggers();
    }
  }

  function normalizeCategory(cat) {
    if (!cat) return 'all';
    const c = cat.toLowerCase();
    if (c.includes('month') && !c.includes('3') && !c.includes('6') && !c.includes('12')) return 'monthly';
    if (c.includes('3') || c.includes('quarter')) return '3months';
    if (c.includes('6')) return '6months';
    if (c.includes('year') || c.includes('12')) return 'yearly';
    if (c.includes('smart')) return 'smart';
    return c;
  }

  // Run dynamic loader if Supabase is connected
  await loadDynamicPlansFromSupabase();

  // ==========================================================================
  // 4. Training Plans Category Filtering
  // ==========================================================================
  const filterBtns = document.querySelectorAll('.filter-btn');

  function initCategoryFilter() {
    const cards = document.querySelectorAll('.plan-card');
    if (filterBtns.length > 0 && cards.length > 0) {
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const category = btn.getAttribute('data-category');

          cards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            if (category === 'all' || cardCategory === category) {
              card.style.display = 'flex';
            } else {
              card.style.display = 'none';
            }
          });
        });
      });
    }
  }
  initCategoryFilter();

  // ==========================================================================
  // 5. Plan Details Modal & Enrollment Flow
  // ==========================================================================
  const planModal = document.getElementById('planModal');
  const planModalTitle = document.getElementById('planModalTitle');
  const planModalCategory = document.getElementById('planModalCategory');
  const planModalDuration = document.getElementById('planModalDuration');
  const planModalDifficulty = document.getElementById('planModalDifficulty');
  const planModalPricing = document.getElementById('planModalPricing');
  const planModalDesc = document.getElementById('planModalDesc');
  const planModalFeatures = document.getElementById('planModalFeatures');
  const planModalEnrollBtn = document.getElementById('planModalEnrollBtn');

  const enrollModal = document.getElementById('enrollModal');
  const enrollModalTitle = document.getElementById('enrollModalTitle');
  const enrollPlanNameInput = document.getElementById('enrollPlanName');
  const enrollPlanSlugInput = document.getElementById('enrollPlanSlug');

  let currentSelectedPlan = { name: 'CBA9 Protocol', slug: 'general' };

  function bindViewPlanTriggers() {
    const viewPlanBtns = document.querySelectorAll('.view-plan-trigger');
    if (viewPlanBtns.length > 0 && planModal) {
      viewPlanBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const card = btn.closest('.plan-card');
          if (!card) return;

          const title = card.getAttribute('data-name') || card.querySelector('.plan-name')?.innerText;
          const slug = card.getAttribute('data-slug') || 'custom-plan';
          const category = card.getAttribute('data-category-label') || 'Training Program';
          const duration = card.getAttribute('data-duration') || '12 Weeks';
          const difficulty = card.getAttribute('data-difficulty') || 'Intermediate';
          const price = card.getAttribute('data-price') || '$149';
          const desc = card.getAttribute('data-desc') || card.querySelector('.plan-desc')?.innerText;
          const features = (card.getAttribute('data-features') || '').split('|');

          currentSelectedPlan = { name: title, slug: slug };

          if (planModalTitle) planModalTitle.innerText = title;
          if (planModalCategory) planModalCategory.innerText = category;
          if (planModalDuration) planModalDuration.innerText = duration;
          if (planModalDifficulty) planModalDifficulty.innerText = difficulty;
          if (planModalPricing) planModalPricing.innerText = price;
          if (planModalDesc) planModalDesc.innerText = desc;

          if (planModalFeatures) {
            planModalFeatures.innerHTML = '';
            features.forEach(feat => {
              if (feat.trim()) {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.alignItems = 'center';
                li.style.gap = '0.5rem';
                li.style.marginBottom = '0.5rem';
                li.style.color = '#CBD5E1';
                li.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>${feat.trim()}</span>`;
                planModalFeatures.appendChild(li);
              }
            });
          }

          openModal(planModal);
        });
      });
    }
  }
  bindViewPlanTriggers();

  // Handle "Enroll In Plan" button inside Plan Details Modal
  if (planModalEnrollBtn) {
    planModalEnrollBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeAllModals();

      if (enrollModal) {
        if (enrollModalTitle) enrollModalTitle.innerText = `JOIN ${currentSelectedPlan.name.toUpperCase()}`;
        if (enrollPlanNameInput) enrollPlanNameInput.value = currentSelectedPlan.name;
        if (enrollPlanSlugInput) enrollPlanSlugInput.value = currentSelectedPlan.slug;
        openModal(enrollModal);
      }
    });
  }

  // ==========================================================================
  // 6. Consultation Booking Modal Triggers
  // ==========================================================================
  const consultModal = document.getElementById('consultModal');
  const consultTriggers = document.querySelectorAll('.consult-modal-trigger');

  if (consultTriggers.length > 0 && consultModal) {
    consultTriggers.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(consultModal);
      });
    });
  }

  // ==========================================================================
  // 7. Modal Open / Close Logic
  // ==========================================================================
  const modalCloseBtns = document.querySelectorAll('.modal-close-trigger');
  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeAllModals();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }

  // ==========================================================================
  // 8. Toast Notification System
  // ==========================================================================
  function showToast(message) {
    let toast = document.getElementById('siteToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'siteToast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> <span>${message}</span>`;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }

  // ==========================================================================
  // 9. Form Submission Handlers & Supabase Recording
  // ==========================================================================

  // 9.1 Program Enrollment Form Handler
  const enrollForm = document.getElementById('enrollForm');
  if (enrollForm) {
    enrollForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = enrollForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';

      const planName = enrollPlanNameInput ? enrollPlanNameInput.value : currentSelectedPlan.name;
      const planSlug = enrollPlanSlugInput ? enrollPlanSlugInput.value : currentSelectedPlan.slug;
      const name = document.getElementById('enrollName')?.value || '';
      const email = document.getElementById('enrollEmail')?.value || '';
      const phone = document.getElementById('enrollPhone')?.value || '';
      const fitnessLevel = document.getElementById('enrollFitnessLevel')?.value || '';
      const goal = document.getElementById('enrollGoal')?.value || '';
      const notes = document.getElementById('enrollNotes')?.value || '';

      if (submitBtn) {
        submitBtn.innerHTML = 'Securing Your Spot...';
        submitBtn.disabled = true;
      }

      // Record in Supabase Backend & Trigger Gmail notification
      if (window.CBA9_BACKEND) {
        await window.CBA9_BACKEND.recordEnrollment({
          planName,
          planSlug,
          name,
          email,
          phone,
          fitnessLevel,
          goal,
          notes
        });
      }

      enrollForm.reset();
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
      closeAllModals();
      showToast(`Enrollment confirmed for ${planName}! Check your email for details.`);
    });
  }

  // 9.2 Contact / Coach Consultation Form Handler
  const coachForm = document.getElementById('coachContactForm');
  if (coachForm) {
    coachForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = coachForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';

      const name = document.getElementById('contactName')?.value || '';
      const email = document.getElementById('contactEmail')?.value || '';
      const goal = document.getElementById('contactGoal')?.value || '';
      const message = document.getElementById('contactMessage')?.value || '';

      if (submitBtn) {
        submitBtn.innerHTML = 'Sending Request...';
        submitBtn.disabled = true;
      }

      // Record in Supabase Backend & Trigger Gmail notification
      if (window.CBA9_BACKEND) {
        await window.CBA9_BACKEND.recordConsultation({
          name,
          email,
          goal,
          message,
          source: 'coach_contact_form'
        });
      }

      coachForm.reset();
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
      showToast('Consultation request sent! Coach Arijit Basu will contact you within 24 hours.');
    });
  }

  // 9.3 Modal Consultation Form Handler
  const consultModalForm = document.getElementById('modalConsultForm');
  if (consultModalForm) {
    consultModalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = consultModalForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';

      const name = consultModalForm.querySelector('input[type="text"]')?.value || '';
      const email = consultModalForm.querySelector('input[type="email"]')?.value || '';
      const goal = consultModalForm.querySelector('select')?.value || 'Free Strategy Call';

      if (submitBtn) {
        submitBtn.innerHTML = 'Booking Session...';
        submitBtn.disabled = true;
      }

      // Record in Supabase Backend & Trigger Gmail notification
      if (window.CBA9_BACKEND) {
        await window.CBA9_BACKEND.recordConsultation({
          name,
          email,
          goal,
          source: 'modal_consult_form'
        });
      }

      consultModalForm.reset();
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
      closeAllModals();
      showToast('Free consultation scheduled! Check your inbox for confirmation details.');
    });
  }

  // 9.4 Newsletter Form Handler
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value : '';

      if (window.CBA9_BACKEND && email) {
        await window.CBA9_BACKEND.recordSubscriber(email);
      }

      newsletterForm.reset();
      showToast('Subscribed! Welcome to the CBA9Fitness athlete network.');
    });
  }
});

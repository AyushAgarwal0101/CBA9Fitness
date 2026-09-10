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

      // Re-apply active category filter for newly populated cards
      const activeFilterBtn = document.querySelector('.filter-btn.active');
      const activeCategory = activeFilterBtn ? activeFilterBtn.getAttribute('data-category') : 'all';
      applyPlansFilter(activeCategory || 'all');
    }
  }

  function normalizeCategory(cat) {
    if (!cat) return 'all';
    const c = String(cat).toLowerCase().trim();
    if (c === 'all') return 'all';
    if (c === 'monthly' || (c.includes('month') && !c.includes('3') && !c.includes('6') && !c.includes('12')) || c === '1 month') return 'monthly';
    if (c === '3months' || c.includes('3') || c.includes('quarter')) return '3months';
    if (c === '6months' || c.includes('6')) return '6months';
    if (c === 'yearly' || c.includes('year') || c.includes('12')) return 'yearly';
    if (c === 'smart' || c.includes('smart') || c.includes('diet')) return 'smart';
    return c;
  }

  // ==========================================================================
  // 4. Training Plans Category Filtering & Matching Engine
  // ==========================================================================
  function isPlanCategoryMatch(card, selectedCategory) {
    if (!selectedCategory || selectedCategory === 'all') return true;

    const cardCat = (card.getAttribute('data-category') || '').toLowerCase().trim();
    const cardSlug = (card.getAttribute('data-slug') || '').toLowerCase().trim();
    const cardName = (card.getAttribute('data-name') || '').toLowerCase().trim();
    const cardLabel = (card.getAttribute('data-category-label') || '').toLowerCase().trim();
    const cardDuration = (card.getAttribute('data-duration') || '').toLowerCase().trim();

    if (selectedCategory === 'monthly') {
      return (
        cardCat === 'monthly' ||
        cardSlug.includes('monthly') ||
        cardName.includes('monthly') ||
        (cardDuration.includes('1 month') && !cardDuration.includes('12')) ||
        (cardLabel.includes('1 month') && !cardLabel.includes('12'))
      );
    }

    if (selectedCategory === '3months') {
      return (
        cardCat === '3months' ||
        cardCat === '3-months' ||
        cardSlug.includes('3') ||
        cardName.includes('3 month') ||
        cardDuration.includes('3 month') ||
        cardLabel.includes('3 month')
      );
    }

    if (selectedCategory === '6months') {
      return (
        cardCat === '6months' ||
        cardCat === '6-months' ||
        cardSlug.includes('6') ||
        cardName.includes('6 month') ||
        cardDuration.includes('6 month') ||
        cardLabel.includes('6 month')
      );
    }

    if (selectedCategory === 'yearly') {
      return (
        cardCat === 'yearly' ||
        cardCat === '12months' ||
        cardCat === '12-months' ||
        cardSlug.includes('year') ||
        cardSlug.includes('12') ||
        cardName.includes('year') ||
        cardDuration.includes('12 month') ||
        cardLabel.includes('12 month')
      );
    }

    if (selectedCategory === 'smart') {
      return (
        cardCat === 'smart' ||
        cardSlug.includes('smart') ||
        cardName.includes('smart') ||
        cardLabel.includes('diet') ||
        cardLabel.includes('smart') ||
        cardDuration.includes('self-paced')
      );
    }

    return cardCat === selectedCategory || cardSlug.includes(selectedCategory);
  }

  function applyPlansFilter(selectedCategory) {
    const currentCards = document.querySelectorAll('.plan-card');
    currentCards.forEach(card => {
      const match = isPlanCategoryMatch(card, selectedCategory);
      if (match) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Global Event Delegation for Filter Buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    const filterBar = btn.closest('.plans-filter-bar');
    if (filterBar) {
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    } else {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    }
    btn.classList.add('active');

    const category = (btn.getAttribute('data-category') || 'all').trim().toLowerCase();
    applyPlansFilter(category);
  });

  // Run dynamic loader if Supabase is connected
  await loadDynamicPlansFromSupabase();

  // Apply initial active filter
  const initialActiveBtn = document.querySelector('.filter-btn.active');
  if (initialActiveBtn) {
    const initialCategory = initialActiveBtn.getAttribute('data-category') || 'all';
    applyPlansFilter(initialCategory);
  }

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

  const authModal = document.getElementById('authModal');
  const authGatingBanner = document.getElementById('authGatingBanner');
  const authGatingMsg = document.getElementById('authGatingMsg');
  const googleSignInBtn = document.getElementById('googleSignInBtn');

  let currentSelectedPlan = { name: 'CBA9 Protocol', slug: 'general' };

  // Global Event Delegation for View Plan buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-plan-trigger');
    if (!btn) return;

    e.preventDefault();
    const card = btn.closest('.plan-card');
    if (!card || !planModal) return;

    const title = card.getAttribute('data-name') || card.querySelector('.plan-name')?.innerText || 'Training Plan';
    const slug = card.getAttribute('data-slug') || 'custom-plan';
    const category = card.getAttribute('data-category-label') || 'Training Program';
    const duration = card.getAttribute('data-duration') || '12 Weeks';
    const difficulty = card.getAttribute('data-difficulty') || 'Intermediate';
    const price = card.getAttribute('data-price') || '';
    const desc = card.getAttribute('data-desc') || card.querySelector('.plan-desc')?.innerText || '';
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

  // Handle "Enroll In Plan" button inside Plan Details Modal (GATED BY GOOGLE AUTH)
  if (planModalEnrollBtn) {
    planModalEnrollBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const currentUser = window.CBA9_BACKEND ? await window.CBA9_BACKEND.getCurrentUser() : null;

      if (!currentUser) {
        // Gated: User must sign in with Google first
        sessionStorage.setItem('cba9_pending_action', JSON.stringify({
          type: 'enrollment',
          plan: currentSelectedPlan
        }));

        if (authGatingMsg) {
          authGatingMsg.innerText = `Please sign in with Google to enroll in ${currentSelectedPlan.name}.`;
        }
        if (authGatingBanner) authGatingBanner.classList.remove('hidden');

        closeAllModals();
        openModal(authModal);
        return;
      }

      // User is authenticated: Open Enrollment Form with prefilled Google account data
      closeAllModals();
      if (enrollModal) {
        if (enrollModalTitle) enrollModalTitle.innerText = `JOIN ${currentSelectedPlan.name.toUpperCase()}`;
        if (enrollPlanNameInput) enrollPlanNameInput.value = currentSelectedPlan.name;
        if (enrollPlanSlugInput) enrollPlanSlugInput.value = currentSelectedPlan.slug;

        const nameInput = document.getElementById('enrollName');
        const emailInput = document.getElementById('enrollEmail');
        if (nameInput && !nameInput.value) {
          nameInput.value = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '';
        }
        if (emailInput && !emailInput.value) {
          emailInput.value = currentUser.email || '';
        }

        openModal(enrollModal);
      }
    });
  }

  // ==========================================================================
  // 6. Consultation Booking Modal Triggers (GATED BY GOOGLE AUTH)
  // ==========================================================================
  const consultModal = document.getElementById('consultModal');

  document.addEventListener('click', async (e) => {
    const trigger = e.target.closest('.consult-modal-trigger');
    if (!trigger) return;

    e.preventDefault();
    const currentUser = window.CBA9_BACKEND ? await window.CBA9_BACKEND.getCurrentUser() : null;

    if (!currentUser) {
      // Gated: User must sign in with Google first
      sessionStorage.setItem('cba9_pending_action', JSON.stringify({
        type: 'consultation'
      }));

      if (authGatingMsg) {
        authGatingMsg.innerText = 'Please sign in with Google to book your free strategy consultation.';
      }
      if (authGatingBanner) authGatingBanner.classList.remove('hidden');

      closeAllModals();
      openModal(authModal);
      return;
    }

    // User is authenticated: Pre-fill and open consultation modal
    if (consultModal) {
      const nameInput = consultModal.querySelector('input[type="text"]');
      const emailInput = consultModal.querySelector('input[type="email"]');
      if (nameInput) {
        nameInput.value = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '';
      }
      if (emailInput) {
        emailInput.value = currentUser.email || '';
      }
      openModal(consultModal);
    }
  });

  // Trigger Auth Modal directly from "SignUp" buttons
  document.addEventListener('click', (e) => {
    const authBtn = e.target.closest('.auth-modal-trigger');
    if (!authBtn) return;

    e.preventDefault();
    const authErrorBanner = document.getElementById('authErrorBanner');
    if (authErrorBanner) authErrorBanner.classList.add('hidden');
    if (authGatingBanner) authGatingBanner.classList.add('hidden');
    openModal(authModal);
  });

  // Handle Google OAuth 2.0 Sign-In / Sign-Up Button Click (GIS Spec)
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
      const originalHtml = googleSignInBtn.innerHTML;
      const authErrorBanner = document.getElementById('authErrorBanner');
      if (authErrorBanner) authErrorBanner.classList.add('hidden');

      googleSignInBtn.innerHTML = `
        <span class="auth-spinner"></span>
        <span>Connecting to Google...</span>
      `;
      googleSignInBtn.disabled = true;

      if (window.CBA9_BACKEND) {
        const result = await window.CBA9_BACKEND.signInWithGoogle();
        
        if (result && result.error) {
          googleSignInBtn.innerHTML = originalHtml;
          googleSignInBtn.disabled = false;
          if (authErrorBanner) {
            authErrorBanner.innerText = typeof result.error === 'string' ? result.error : 'Google sign-in encountered an error. Please try again.';
            authErrorBanner.classList.remove('hidden');
          }
          return;
        }

        // If simulated/instant demo login
        if (result && result.user) {
          closeAllModals();
          handleAuthSuccessWelcome(result.user);
          checkAndResumePendingAction(result.user);
        }
      }

      googleSignInBtn.innerHTML = originalHtml;
      googleSignInBtn.disabled = false;
    });
  }

  // Welcome Toast Notification helper
  function handleAuthSuccessWelcome(user) {
    if (!user) return;
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Athlete';
    const firstName = fullName.split(' ')[0];
    const userKey = 'cba9_athlete_visited_' + (user.id || user.email);

    if (!localStorage.getItem(userKey)) {
      localStorage.setItem(userKey, 'true');
      showToast(`Welcome to CBA9Fitness, ${firstName}! 🎉 Your athlete account is now active.`);
    } else {
      showToast(`Welcome back, ${firstName}! Ready to train.`);
    }
  }

  // Handle Sign Out
  document.addEventListener('click', async (e) => {
    const signOutBtn = e.target.closest('.signout-btn');
    if (!signOutBtn) return;

    e.preventDefault();
    if (window.CBA9_BACKEND) {
      await window.CBA9_BACKEND.signOut();
      closeAllModals();
      showToast('You have been signed out safely.');
    }
  });

  // Handle Athlete Profile Modal Trigger
  document.addEventListener('click', async (e) => {
    const profileBtn = e.target.closest('.profile-modal-trigger');
    if (!profileBtn) return;

    e.preventDefault();
    const currentUser = window.CBA9_BACKEND ? await window.CBA9_BACKEND.getCurrentUser() : null;
    if (!currentUser) {
      openModal(authModal);
      return;
    }

    const profileModal = document.getElementById('profileModal');
    const profileModalAvatar = document.getElementById('profileModalAvatar');
    const profileModalName = document.getElementById('profileModalName');
    const profileModalEmail = document.getElementById('profileModalEmail');
    const profileModalGoogleId = document.getElementById('profileModalGoogleId');

    const fullName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Athlete';
    const avatarUrl = currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture;
    const googleId = currentUser.user_metadata?.provider_id || currentUser.user_metadata?.sub || currentUser.id;

    if (profileModalName) profileModalName.innerText = fullName;
    if (profileModalEmail) profileModalEmail.innerText = currentUser.email || '';
    if (profileModalGoogleId) profileModalGoogleId.innerText = googleId;
    if (profileModalAvatar) {
      if (avatarUrl) {
        profileModalAvatar.innerHTML = `<img src="${avatarUrl}" alt="${fullName}">`;
      } else {
        profileModalAvatar.innerHTML = `<span>${fullName.charAt(0).toUpperCase()}</span>`;
      }
    }

    closeAllModals();
    openModal(profileModal);
  });

  // Handle User Plans & Consultations Modal Trigger
  document.addEventListener('click', async (e) => {
    const plansBtn = e.target.closest('.user-plans-trigger');
    if (!plansBtn) return;

    e.preventDefault();
    const currentUser = window.CBA9_BACKEND ? await window.CBA9_BACKEND.getCurrentUser() : null;
    if (!currentUser) {
      openModal(authModal);
      return;
    }

    const userPlansModal = document.getElementById('userPlansModal');
    const container = document.getElementById('userPlansListContainer');
    
    closeAllModals();
    openModal(userPlansModal);

    if (container && window.CBA9_BACKEND) {
      container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #94A3B8;"><span class="auth-spinner" style="margin-bottom: 0.5rem;"></span><p>Loading your athlete records...</p></div>`;
      
      const enrollments = await window.CBA9_BACKEND.fetchUserEnrollments(currentUser.id);
      const consultations = await window.CBA9_BACKEND.fetchUserConsultations(currentUser.id);

      if ((!enrollments || enrollments.length === 0) && (!consultations || consultations.length === 0)) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem; color: #94A3B8;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="1.5" style="margin: 0 auto 1rem; display: block;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <h4 style="color: #FFFFFF; font-size: 1.1rem; margin-bottom: 0.35rem;">No Active Enrollments Yet</h4>
            <p style="font-size: 0.88rem; max-width: 320px; margin: 0 auto;">You have not enrolled in any programs or booked a strategy session yet. Get started with our personalized training packages.</p>
          </div>
        `;
      } else {
        let html = '';

        if (enrollments && enrollments.length > 0) {
          enrollments.forEach(en => {
            const dateStr = en.created_at ? new Date(en.created_at).toLocaleDateString() : 'Active';
            html += `
              <div class="user-plan-item">
                <div class="user-plan-info">
                  <h4>${en.plan_name}</h4>
                  <p>Enrolled: ${dateStr} • Goal: ${en.primary_goal || 'Fitness Transformation'}</p>
                </div>
                <span class="status-badge ${en.status || 'pending'}">${en.status || 'Pending'}</span>
              </div>
            `;
          });
        }

        if (consultations && consultations.length > 0) {
          consultations.forEach(c => {
            const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Scheduled';
            html += `
              <div class="user-plan-item">
                <div class="user-plan-info">
                  <h4>Strategy Consultation Call</h4>
                  <p>Requested: ${dateStr} • Topic: ${c.goal || 'General Fitness'}</p>
                </div>
                <span class="status-badge scheduled">${c.status || 'Scheduled'}</span>
              </div>
            `;
          });
        }

        container.innerHTML = html;
      }
    }
  });

  // Toggle user avatar dropdown menu
  document.addEventListener('click', (e) => {
    const avatarBtn = e.target.closest('.user-avatar-btn');
    const userMenu = document.querySelector('.user-profile-menu');

    if (avatarBtn && userMenu) {
      e.stopPropagation();
      userMenu.classList.toggle('open');
      return;
    }

    if (userMenu && !userMenu.contains(e.target)) {
      userMenu.classList.remove('open');
    }
  });

  // ==========================================================================
  // 7. Customer Auth State UI Renderer
  // ==========================================================================
  const navAuthContainer = document.getElementById('navAuthContainer');

  function renderNavAuth(user) {
    if (!navAuthContainer) return;

    if (!user) {
      // Logged Out State: Clean Text-Only "SignUp" Button
      navAuthContainer.innerHTML = `
        <button id="navSignInBtn" class="nav-signin-btn auth-modal-trigger" aria-label="Sign Up">SignUp</button>
      `;
    } else {
      // Logged In State: Profile Avatar & Interactive Dropdown Menu
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Athlete';
      const firstName = fullName.split(' ')[0];
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      const initial = firstName.charAt(0).toUpperCase();

      const avatarHtml = avatarUrl
        ? `<img src="${avatarUrl}" alt="${fullName}" class="user-avatar-img">`
        : `<div class="user-avatar-fallback">${initial}</div>`;

      navAuthContainer.innerHTML = `
        <div class="user-profile-menu">
          <button class="user-avatar-btn" aria-label="Customer Profile Menu">
            ${avatarHtml}
            <span class="user-name-label">${firstName}</span>
            <svg class="user-chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          
          <div class="user-dropdown-menu">
            <div class="user-dropdown-header">
              <span class="user-dropdown-name">${fullName}</span>
              <span class="user-dropdown-email">${user.email}</span>
              <span class="user-dropdown-status">
                <span class="user-dropdown-status-dot"></span> Verified Google Account
              </span>
            </div>
            
            <button type="button" class="user-dropdown-item profile-modal-trigger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>My Profile</span>
            </button>

            <button type="button" class="user-dropdown-item user-plans-trigger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12M2 12h4M18 12h4"/></svg>
              <span>My Plans</span>
            </button>

            <a href="#consultModal" class="user-dropdown-item consult-modal-trigger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>Book Strategy Call</span>
            </a>

            <div class="user-dropdown-divider"></div>

            <button type="button" class="user-dropdown-item signout-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      `;
    }
  }

  // Resume Pending Action (e.g. user clicked Enroll, was gated by Google login, and just returned authenticated)
  function checkAndResumePendingAction(user) {
    if (!user) return;

    const pendingRaw = sessionStorage.getItem('cba9_pending_action');
    if (!pendingRaw) return;

    try {
      const pending = JSON.parse(pendingRaw);
      sessionStorage.removeItem('cba9_pending_action');

      if (pending.type === 'consultation' && consultModal) {
        const nameInput = consultModal.querySelector('input[type="text"]');
        const emailInput = consultModal.querySelector('input[type="email"]');
        if (nameInput) nameInput.value = user.user_metadata?.full_name || user.user_metadata?.name || '';
        if (emailInput) emailInput.value = user.email || '';

        setTimeout(() => {
          openModal(consultModal);
        }, 300);
      } else if (pending.type === 'enrollment' && enrollModal) {
        if (pending.plan) currentSelectedPlan = pending.plan;
        if (enrollModalTitle) enrollModalTitle.innerText = `JOIN ${currentSelectedPlan.name.toUpperCase()}`;
        if (enrollPlanNameInput) enrollPlanNameInput.value = currentSelectedPlan.name;
        if (enrollPlanSlugInput) enrollPlanSlugInput.value = currentSelectedPlan.slug;

        const nameInput = document.getElementById('enrollName');
        const emailInput = document.getElementById('enrollEmail');
        if (nameInput) nameInput.value = user.user_metadata?.full_name || user.user_metadata?.name || '';
        if (emailInput) emailInput.value = user.email || '';

        setTimeout(() => {
          openModal(enrollModal);
        }, 300);
      }
    } catch (e) {
      sessionStorage.removeItem('cba9_pending_action');
    }
  }

  // Initialize Auth Listener & Initial State
  if (window.CBA9_BACKEND) {
    const initialUser = await window.CBA9_BACKEND.getCurrentUser();
    renderNavAuth(initialUser);
    checkAndResumePendingAction(initialUser);

    window.CBA9_BACKEND.onAuthStateChange((user) => {
      renderNavAuth(user);
      if (user) {
        handleAuthSuccessWelcome(user);
      }
      checkAndResumePendingAction(user);
    });
  }

  // ==========================================================================
  // 8. Modal Open / Close Logic
  // ==========================================================================
  document.querySelectorAll('.modal-close-trigger').forEach(btn => {
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
  // 9. Toast Notification System
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
  // 10. Form Submission Handlers & Supabase Recording
  // ==========================================================================

  // 10.1 Program Enrollment Form Handler
  const enrollForm = document.getElementById('enrollForm');
  if (enrollForm) {
    enrollForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check Authentication Before Submission
      const currentUser = window.CBA9_BACKEND ? await window.CBA9_BACKEND.getCurrentUser() : null;
      if (!currentUser) {
        closeAllModals();
        if (authGatingMsg) authGatingMsg.innerText = 'Please sign in with Google to complete your program enrollment.';
        if (authGatingBanner) authGatingBanner.classList.remove('hidden');
        openModal(authModal);
        return;
      }

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
          notes,
          userId: currentUser.id
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

  // 10.2 Contact / Coach Consultation Form Handler
  const coachForm = document.getElementById('coachContactForm');
  if (coachForm) {
    coachForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check Authentication Before Submission
      const currentUser = window.CBA9_BACKEND ? await window.CBA9_BACKEND.getCurrentUser() : null;
      if (!currentUser) {
        if (authGatingMsg) authGatingMsg.innerText = 'Please sign in with Google to message Coach Arijit Basu.';
        if (authGatingBanner) authGatingBanner.classList.remove('hidden');
        openModal(authModal);
        return;
      }

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
          source: 'coach_contact_form',
          userId: currentUser.id
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

  // 10.3 Modal Consultation Form Handler
  const consultModalForm = document.getElementById('modalConsultForm');
  if (consultModalForm) {
    consultModalForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check Authentication Before Submission
      const currentUser = window.CBA9_BACKEND ? await window.CBA9_BACKEND.getCurrentUser() : null;
      if (!currentUser) {
        closeAllModals();
        if (authGatingMsg) authGatingMsg.innerText = 'Please sign in with Google to confirm your strategy call.';
        if (authGatingBanner) authGatingBanner.classList.remove('hidden');
        openModal(authModal);
        return;
      }

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
          source: 'modal_consult_form',
          userId: currentUser.id
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

  // 10.4 Newsletter Form Handler
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

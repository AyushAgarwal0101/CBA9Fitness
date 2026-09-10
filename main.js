/**
 * CBA9FITNESS - Interactive Web Scripts & Smooth Scroll Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle & Auto Close on Click
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

    // Close mobile nav when clicking any nav link
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (navLinks.classList.contains('mobile-open')) {
          navLinks.classList.remove('mobile-open');
          mobileToggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
        }
      });
    });
  }

  // 2. Active Section Scroll Spy (Highlights navbar item when scrolling)
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

  // 3. Training Plans Category Filtering
  const filterBtns = document.querySelectorAll('.filter-btn');
  const planCards = document.querySelectorAll('.plan-card');

  if (filterBtns.length > 0 && planCards.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.getAttribute('data-category');

        planCards.forEach(card => {
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

  // 4. Plan Details Modal Logic
  const planModal = document.getElementById('planModal');
  const planModalTitle = document.getElementById('planModalTitle');
  const planModalCategory = document.getElementById('planModalCategory');
  const planModalDuration = document.getElementById('planModalDuration');
  const planModalDifficulty = document.getElementById('planModalDifficulty');
  const planModalPricing = document.getElementById('planModalPricing');
  const planModalDesc = document.getElementById('planModalDesc');
  const planModalFeatures = document.getElementById('planModalFeatures');
  const modalCloseBtns = document.querySelectorAll('.modal-close-trigger');

  const viewPlanBtns = document.querySelectorAll('.view-plan-trigger');
  if (viewPlanBtns.length > 0 && planModal) {
    viewPlanBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = btn.closest('.plan-card');
        if (!card) return;

        const title = card.getAttribute('data-name') || card.querySelector('.plan-name')?.innerText;
        const category = card.getAttribute('data-category-label') || 'Training Program';
        const duration = card.getAttribute('data-duration') || '12 Weeks';
        const difficulty = card.getAttribute('data-difficulty') || 'Intermediate';
        const price = card.getAttribute('data-price') || '$149';
        const desc = card.getAttribute('data-desc') || card.querySelector('.plan-desc')?.innerText;
        const features = (card.getAttribute('data-features') || '').split('|');

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

  // 5. Consultation Booking Modal Logic (for Start Here buttons)
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

  // Close Modals
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

  // 6. Toast Notification System
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
    }, 4000);
  }

  // 7. Form Submission Handlers
  const coachForm = document.getElementById('coachContactForm');
  if (coachForm) {
    coachForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = coachForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Sending Request...';
        submitBtn.disabled = true;

        setTimeout(() => {
          coachForm.reset();
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          showToast('Consultation request sent! Coach Marcus will contact you within 24 hours.');
        }, 800);
      }
    });
  }

  const consultModalForm = document.getElementById('modalConsultForm');
  if (consultModalForm) {
    consultModalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = consultModalForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.innerHTML = 'Booking Session...';
        submitBtn.disabled = true;

        setTimeout(() => {
          consultModalForm.reset();
          submitBtn.innerHTML = 'Confirm Booking';
          submitBtn.disabled = false;
          closeAllModals();
          showToast('Free consultation scheduled! Check your inbox for confirmation details.');
        }, 800);
      }
    });
  }

  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      newsletterForm.reset();
      showToast('Subscribed! Welcome to the CBA9Fitness athlete network.');
    });
  }
});

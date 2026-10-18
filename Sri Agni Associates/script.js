/* ============================================================
   SHREE AGNI ASSOCIATES — script.js
   Handles: Navbar, Mobile Menu, Scroll Reveal, Counter, 
            Gallery Lightbox, Form Submit, Active Nav Links
   ============================================================ */

(function () {
  'use strict';

  /* ──── NAVBAR SCROLL ──── */
  const navbar = document.getElementById('navbar');

  function updateNavbar() {
    const scrolled = window.scrollY > 60;
    navbar.classList.toggle('scrolled', scrolled);
    navbar.classList.toggle('hero-nav', !scrolled);
  }
  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();

  /* ──── MOBILE MENU ──── */
  const hamburger   = document.getElementById('hamburger-btn');
  const mobileMenu  = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-cta');

  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ──── ACTIVE NAV LINK ON SCROLL ──── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === '#' + entry.target.id
          );
        });
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });

  sections.forEach(s => sectionObserver.observe(s));

  /* ──── SCROLL REVEAL ──── */
  const revealElements = document.querySelectorAll(
    '.feature-card, .project-card, .review-card, .gallery-item, .stat-item, .founder-card'
  );

  revealElements.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ──── COUNTER ANIMATION ──── */
  function animateCounter(el) {
    const target   = parseInt(el.getAttribute('data-target'), 10);
    const duration = 2000;
    const step     = 16;
    const steps    = Math.ceil(duration / step);
    let current    = 0;
    const increment = target / steps;

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        el.textContent = target.toLocaleString();
        clearInterval(interval);
      } else {
        el.textContent = Math.floor(current).toLocaleString();
      }
    }, step);
  }

  const counters = document.querySelectorAll('.stat-number');
  let countersStarted = false;

  const statsStrip = document.querySelector('.stats-strip');
  const statsObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !countersStarted) {
      countersStarted = true;
      counters.forEach(animateCounter);
      statsObserver.disconnect();
    }
  }, { threshold: 0.4 });

  if (statsStrip) statsObserver.observe(statsStrip);

  /* ──── GALLERY LIGHTBOX ──── */
  const galleryItems = document.querySelectorAll('.gallery-item');

  function openLightbox(imgSrc, alt) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.id = 'lightbox-overlay';

    const inner = document.createElement('div');
    inner.className = 'lightbox-inner';

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = alt || 'Gallery image';

    const close = document.createElement('button');
    close.className = 'lightbox-close';
    close.innerHTML = '✕';
    close.setAttribute('aria-label', 'Close lightbox');

    close.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeLightbox();
    });
    document.addEventListener('keydown', onEscape);

    inner.appendChild(img);
    inner.appendChild(close);
    overlay.appendChild(inner);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Load extra CSS for lightbox if not yet loaded
    if (!document.getElementById('extra-css')) {
      const link = document.createElement('link');
      link.id   = 'extra-css';
      link.rel  = 'stylesheet';
      link.href = 'extra.css';
      document.head.appendChild(link);
    }
  }

  function closeLightbox() {
    const overlay = document.getElementById('lightbox-overlay');
    if (overlay) { overlay.remove(); }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onEscape);
  }

  function onEscape(e) {
    if (e.key === 'Escape') closeLightbox();
  }

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img) openLightbox(img.src, img.alt);
    });
    item.style.cursor = 'pointer';
  });

  /* ──── CONTACT FORM ──── */
  window.handleFormSubmit = function (e) {
    e.preventDefault();
    const btn = document.getElementById('form-submit-btn');
    const msg = document.getElementById('form-success-msg');
    btn.textContent = 'Sending…';
    btn.disabled = true;

    // Collect form data
    const entry = {
      id:       Date.now(),
      date:     new Date().toISOString(),
      name:     document.getElementById('form-name').value.trim(),
      phone:    document.getElementById('form-phone').value.trim(),
      email:    document.getElementById('form-email').value.trim(),
      interest: document.getElementById('form-interest').value,
      message:  document.getElementById('form-message').value.trim()
    };

    // Save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('sriagni_enquiries') || '[]');
      existing.push(entry);
      localStorage.setItem('sriagni_enquiries', JSON.stringify(existing));
    } catch (err) { /* silent */ }

    setTimeout(() => {
      btn.textContent = 'Message Sent ✓';
      btn.style.background = '#3a8c5a';
      msg.style.display = 'block';
      e.target.reset();
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.style.background = '';
        btn.disabled = false;
        msg.style.display = 'none';
      }, 5000);
    }, 1200);
  };

  /* ──── NEWSLETTER ──── */
  window.handleNewsletter = function (e) {
    e.preventDefault();
    const thanks = document.getElementById('newsletter-thanks');
    const btn    = document.getElementById('newsletter-submit');
    const email  = document.getElementById('newsletter-email').value.trim();

    // Save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('sriagni_newsletter') || '[]');
      const alreadyExists = existing.some(sub => sub.email === email);
      if (!alreadyExists) {
        existing.push({ id: Date.now(), date: new Date().toISOString(), email });
        localStorage.setItem('sriagni_newsletter', JSON.stringify(existing));
      }
    } catch (err) { /* silent */ }

    btn.textContent = '✓';
    thanks.style.display = 'block';
    e.target.reset();
    setTimeout(() => {
      btn.textContent = '→';
      thanks.style.display = 'none';
    }, 4000);
  };

  /* ──── SMOOTH SCROLL POLYFILL for anchor links ──── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

})();

/* ============================================
   AI ACCELERATION PAGE — SCRIPT
   Extends base script.js functionality
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- Scroll Reveal for Acceleration Page Elements ---
    const initAccelReveal = () => {
        const selectors = [
            '.accel-value-card',
            '.comp-card',
            '.accel-timeline-item',
            '.benefit-card',
            '.gateway-panel',
            '.accel-cta-inner'
        ];

        document.querySelectorAll(selectors.join(', ')).forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${(i % 4) * 0.1}s`;
        });
    };

    const revealAccelElements = () => {
        const selectors = [
            '.accel-value-card',
            '.comp-card',
            '.accel-timeline-item',
            '.benefit-card',
            '.gateway-panel',
            '.accel-cta-inner'
        ];

        document.querySelectorAll(selectors.join(', ')).forEach(el => {
            const rect = el.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight - 80;

            if (isVisible && !el.classList.contains('revealed')) {
                el.classList.add('revealed');
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    };

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
        initAccelReveal();
        window.addEventListener('scroll', revealAccelElements, { passive: true });
        setTimeout(revealAccelElements, 100);
    }

    // --- Navbar always scrolled on this page ---
    const navbar = document.getElementById('navbar');
    if (navbar) {
        navbar.classList.add('scrolled');
    }

    // Override the page title update for this page
    const originalTitle = {
        en: 'AI Acceleration Programme — Transfong',
        zh: 'AI加速计划 — 创士锋'
    };

    // Listen for language changes and update title
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            const lang = document.documentElement.getAttribute('data-lang');
            document.title = originalTitle[lang] || originalTitle.en;
        });
    }
});

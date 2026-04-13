/* ============================================
   AI IMMERSION TRIP PAGE — SCRIPT
   Extends base script.js functionality
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- Scroll Reveal for Immersion Page Elements ---
    const initImmersionReveal = () => {
        const selectors = [
            '.immersion-value-card',
            '.objective-group',
            '.city-itinerary-card',
            '.visits-track',
            '.visit-card',
            '.culture-card',
            '.pricing-panel',
            '.about-strip-inner',
            '.immersion-cta-inner'
        ];

        document.querySelectorAll(selectors.join(', ')).forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${(i % 4) * 0.1}s`;
        });
    };

    const revealImmersionElements = () => {
        const selectors = [
            '.immersion-value-card',
            '.objective-group',
            '.city-itinerary-card',
            '.visits-track',
            '.visit-card',
            '.culture-card',
            '.pricing-panel',
            '.about-strip-inner',
            '.immersion-cta-inner'
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
        initImmersionReveal();
        window.addEventListener('scroll', revealImmersionElements, { passive: true });
        setTimeout(revealImmersionElements, 100);
    }

    // --- Navbar always scrolled on this page ---
    const navbar = document.getElementById('navbar');
    if (navbar) {
        navbar.classList.add('scrolled');
    }

    // Override the page title update for this page
    const originalTitle = {
        en: 'AI Immersion Trip — Transfong',
        zh: 'AI沉浸之旅 — 创士锋'
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

/* ============================================
   TRANSFONG CORPORATE WEBSITE — SCRIPT
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- Language Toggle ---
    const langToggle = document.getElementById('langToggle');
    const langOptions = langToggle.querySelectorAll('.lang-option');
    let currentLang = localStorage.getItem('transfong-lang') || 'en';

    // Function to apply language to the page
    function applyLanguage(lang) {
        currentLang = lang;
        document.documentElement.setAttribute('data-lang', lang);
        localStorage.setItem('transfong-lang', lang);

        // Update toggle button state
        langOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === lang);
        });

        // Update all translatable elements
        document.querySelectorAll('[data-en][data-zh]').forEach(el => {
            const text = el.getAttribute(`data-${lang}`);
            if (!text) return;
            // Preserve child elements like .title-red-dot spans
            const preserved = el.querySelector('.title-red-dot');
            if (preserved) {
                // Clear text nodes only, keep child elements
                el.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) node.remove();
                });
                el.insertBefore(document.createTextNode(text), preserved);
            } else {
                el.textContent = text;
            }
        });

        // Re-set hero badge with dot
        const heroBadge = document.querySelector('.hero-badge');
        if (heroBadge) {
            const dot = heroBadge.querySelector('.hero-badge-dot');
            const badgeText = heroBadge.getAttribute(`data-${lang}`);
            heroBadge.textContent = '';
            if (dot) heroBadge.appendChild(dot);
            heroBadge.append(` ${badgeText}`);
        }
    }

    // Apply saved language on page load
    if (currentLang !== 'en') {
        applyLanguage(currentLang);
    }

    langToggle.addEventListener('click', (e) => {
        const option = e.target.closest('.lang-option');
        if (!option || option.dataset.lang === currentLang) return;
        applyLanguage(option.dataset.lang);
    });


    // --- Navbar Scroll Effect ---
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    const handleScroll = () => {
        const scrollY = window.scrollY;
        
        if (scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();


    // --- Mobile Menu ---
    const navBurger = document.getElementById('navBurger');
    const navLinks = document.getElementById('navLinks');

    navBurger.addEventListener('click', () => {
        navBurger.classList.toggle('active');
        navLinks.classList.toggle('open');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navBurger.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        });
    });


    // --- Pillar Tabs ---
    const pillarTabs = document.querySelectorAll('.pillar-tab');
    const pillarPanels = document.querySelectorAll('.pillar-panel');

    pillarTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const pillarId = tab.dataset.pillar;
            
            pillarTabs.forEach(t => t.classList.remove('active'));
            pillarPanels.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`pillar-${pillarId}`).classList.add('active');
        });
    });


    // --- Scroll Reveal ---
    const revealElements = () => {
        const elements = document.querySelectorAll(
            '.section-header, .about-narrative, .about-timeline, ' +
            '.pillar-panel.active, .city-card, .accel-card, .training-card, ' +
            '.team-card, .stat-card, .contact-card'
        );
        
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight - 80;
            
            if (isVisible && !el.classList.contains('revealed')) {
                el.classList.add('revealed');
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    };

    // Set initial states for reveal elements
    const initRevealElements = () => {
        document.querySelectorAll(
            '.section-header, .about-narrative, .about-timeline, ' +
            '.city-card, .accel-card, .training-card, ' +
            '.team-card, .stat-card, .contact-card'
        ).forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i % 4 * 0.1}s`;
        });
    };

    initRevealElements();
    
    window.addEventListener('scroll', revealElements, { passive: true });
    setTimeout(revealElements, 100);


    // --- Stats Counter Animation ---
    const counters = document.querySelectorAll('.stat-value[data-count]');
    let statsAnimated = false;

    const animateCounters = () => {
        if (statsAnimated) return;
        
        const statsSection = document.querySelector('.section-stats');
        if (!statsSection) return;
        
        const rect = statsSection.getBoundingClientRect();
        if (rect.top > window.innerHeight - 100) return;
        
        statsAnimated = true;
        
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.count);
            const duration = 2000;
            const startTime = performance.now();
            
            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out cubic
                const ease = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(target * ease);
                
                counter.textContent = current;
                
                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                }
            };
            
            requestAnimationFrame(updateCounter);
        });
    };

    window.addEventListener('scroll', animateCounters, { passive: true });


    // --- Smooth Scroll for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });


    // --- Active Nav Link Highlight ---
    const sections = document.querySelectorAll('section[id]');
    
    const highlightNav = () => {
        const scrollY = window.scrollY + 120;
        
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            
            if (scrollY >= top && scrollY < top + height) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', highlightNav, { passive: true });

});

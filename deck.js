/* ============================================================
   Presentation mode ("deck view") — one click turns the page
   into a full-screen HTML slide deck; ESC returns to the site.

   A page opts in by defining, before this script:
     window.deckSlides = [
       { sel: '#hero', fit: '.hero-content' },
       { sel: '#big-section', hideFrom: '.part-2' },   // slide shows content BEFORE .part-2
       { sel: '#big-section', hideUntil: '.part-2' },  // slide shows .part-2 and after
       ...
     ];
   hideFrom / hideUntil split one section across slides by hiding
   sibling blocks (the .section-header is always kept visible).
   Content is auto-scaled to fit the screen, PowerPoint-style.
   ============================================================ */

(function () {
    'use strict';

    var slides = window.deckSlides;
    if (!slides || !slides.length) return;

    var current = 0;
    var active = false;
    var savedScroll = 0;
    var wentFullscreen = false;
    var touched = []; // elements given inline styles, to restore on exit

    /* ---------- Present button in the navbar ---------- */
    var navActions = document.querySelector('.nav-actions');
    if (navActions) {
        var btn = document.createElement('button');
        btn.className = 'deck-present-btn';
        btn.id = 'deckPresent';
        btn.setAttribute('aria-label', 'Presentation view');
        btn.innerHTML =
            '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M1.5 0.8 L11 6 L1.5 11.2 Z"/></svg>' +
            '<span data-en="Present" data-zh="演示">Present</span>';
        btn.addEventListener('click', enter);
        navActions.insertBefore(btn, navActions.firstChild);
        // Match the language the page is currently in
        var zh = document.documentElement.getAttribute('lang') === 'zh' ||
                 localStorage.getItem('transfong-lang') === 'zh';
        if (zh) btn.querySelector('span[data-en]').textContent = '演示';
    }

    /* ---------- HUD ---------- */
    var hud = document.createElement('div');
    hud.className = 'deck-hud';
    hud.innerHTML =
        '<button class="deck-arrow" data-deck-prev aria-label="Previous slide">‹</button>' +
        '<span class="deck-count">1 / ' + slides.length + '</span>' +
        '<button class="deck-arrow" data-deck-next aria-label="Next slide">›</button>' +
        '<span class="deck-sep"></span>' +
        '<button class="deck-lang" data-deck-lang aria-label="Toggle language">EN / 中文</button>' +
        '<span class="deck-sep"></span>' +
        '<button class="deck-exit" data-deck-exit aria-label="Exit presentation">✕</button>';
    document.body.appendChild(hud);

    hud.querySelector('[data-deck-prev]').addEventListener('click', function () { go(current - 1); });
    hud.querySelector('[data-deck-next]').addEventListener('click', function () { go(current + 1); });
    hud.querySelector('[data-deck-exit]').addEventListener('click', exit);
    hud.querySelector('[data-deck-lang]').addEventListener('click', function () {
        var inactive = document.querySelector('.lang-option:not(.active)');
        if (inactive) inactive.click();
        setTimeout(fit, 80); // re-fit after the text swap
    });

    /* ---------- Mode switching ---------- */
    function enter() {
        if (active) return;
        active = true;
        savedScroll = window.scrollY;
        document.documentElement.classList.add('deck-on');
        document.documentElement.requestFullscreen &&
            document.documentElement.requestFullscreen().then(function () {
                wentFullscreen = true;
            }).catch(function () {});
        go(0);
    }

    function exit() {
        if (!active) return;
        active = false;
        document.documentElement.classList.remove('deck-on');
        clearSlideStyles();
        document.querySelectorAll('section.deck-active').forEach(function (s) {
            s.classList.remove('deck-active');
            s.style.paddingTop = '';
        });
        if (wentFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(function () {});
        }
        wentFullscreen = false;
        window.scrollTo(0, savedScroll);
    }

    function go(n) {
        if (n < 0 || n >= slides.length) return;
        current = n;
        clearSlideStyles();
        document.querySelectorAll('section.deck-active').forEach(function (s) {
            s.classList.remove('deck-active');
            s.style.paddingTop = '';
        });

        var cfg = slides[n];
        var section = document.querySelector(cfg.sel);
        if (!section) return;
        section.classList.add('deck-active');
        applySplit(section, cfg);
        hud.querySelector('.deck-count').textContent = (n + 1) + ' / ' + slides.length;
        fit();
    }

    /* ---------- Section splitting (hideFrom / hideUntil) ---------- */
    function applySplit(section, cfg) {
        var boundarySel = cfg.hideFrom || cfg.hideUntil;
        if (!boundarySel) return;
        var boundary = section.querySelector(boundarySel);
        if (!boundary) return;

        var sibs = Array.prototype.slice.call(boundary.parentElement.children);
        var cut = sibs.indexOf(boundary);
        sibs.forEach(function (el, i) {
            if (el.classList.contains('section-header')) return; // keep titles
            var hide = cfg.hideFrom ? i >= cut : i < cut;
            if (hide) {
                el.style.display = 'none';
                touched.push(el);
            }
        });
    }

    function clearSlideStyles() {
        touched.forEach(function (el) {
            el.style.display = '';
            el.style.transform = '';
            el.style.transformOrigin = '';
            el.style.marginBottom = '';
        });
        touched = [];
    }

    /* ---------- Fit-to-screen scaling ---------- */
    function fit() {
        var section = document.querySelector('section.deck-active');
        if (!section) return;
        var cfg = slides[current];

        // Elements to scale: the configured fit target, or all in-flow children
        var targets;
        if (cfg.fit) {
            targets = Array.prototype.slice.call(section.querySelectorAll(cfg.fit));
        } else {
            targets = Array.prototype.slice.call(section.children).filter(function (el) {
                var cs = getComputedStyle(el);
                return cs.display !== 'none' && cs.position !== 'absolute' && cs.position !== 'fixed';
            });
        }
        if (!targets.length) return;

        // Reset before measuring
        targets.forEach(function (el) {
            el.style.transform = '';
            el.style.transformOrigin = '';
            el.style.marginBottom = '';
            if (touched.indexOf(el) === -1) touched.push(el);
        });

        var availH = window.innerHeight - 48 - 84; // section padding top/bottom
        var availW = window.innerWidth - 96;
        var total = 0;
        var maxW = 0;
        var heights = targets.map(function (el) {
            var r = el.getBoundingClientRect();
            total += r.height;
            if (r.width > maxW) maxW = r.width;
            return r.height;
        });

        var s = Math.min(1, availH / total, availW / maxW);
        if (s < 0.999) {
            targets.forEach(function (el, i) {
                el.style.transform = 'scale(' + s + ')';
                el.style.transformOrigin = 'top center';
                // collapse the layout space freed by scaling
                el.style.marginBottom = (-(heights[i] * (1 - s))) + 'px';
            });
        }

        // Vertically center the scaled stack
        var scaledH = total * s;
        var pad = Math.max(32, 48 + (availH - scaledH) / 2);
        section.style.paddingTop = pad + 'px';
    }

    /* ---------- Keyboard & lifecycle ---------- */
    document.addEventListener('keydown', function (e) {
        if (!active) return;
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case 'PageDown':
            case ' ':
                e.preventDefault(); go(current + 1); break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault(); go(current - 1); break;
            case 'Home':
                e.preventDefault(); go(0); break;
            case 'End':
                e.preventDefault(); go(slides.length - 1); break;
            case 'Escape':
                exit(); break;
        }
    });

    // Leaving browser fullscreen (e.g. via ESC swallowed by the browser) exits the deck
    document.addEventListener('fullscreenchange', function () {
        if (active && wentFullscreen && !document.fullscreenElement) exit();
    });

    window.addEventListener('resize', function () { if (active) fit(); });

    // Shareable link: page#present opens straight into the deck
    if (location.hash === '#present') {
        window.addEventListener('load', function () { setTimeout(enter, 300); });
    }
})();

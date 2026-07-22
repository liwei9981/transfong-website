/* ============================================================
   Presentation mode ("deck view") — one click turns the page
   into a full-screen HTML slide deck; ESC returns to the site.

   Implements the Transfong slide design guideline: slides are
   dedicated 1280×720 layouts authored in a
   <template id="deckSlides"> on the page (.tf-slide each),
   scaled to fit the viewport — never reflowed.
   Bilingual: slide elements carry data-en/data-zh and are kept
   in sync with the site's language toggle.
   ============================================================ */

(function () {
    'use strict';

    var tpl = document.getElementById('deckSlides');
    if (!tpl) return;

    var overlay = null;
    var stage = null;
    var slides = [];
    var current = 0;
    var active = false;
    var savedScroll = 0;
    var wentFullscreen = false;

    function currentLang() {
        var opt = document.querySelector('.lang-option.active');
        return (opt && opt.dataset.lang) || localStorage.getItem('transfong-lang') || 'en';
    }

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
        if (currentLang() === 'zh') btn.querySelector('span[data-en]').textContent = '演示';
    }

    /* ---------- HUD ---------- */
    var hud = document.createElement('div');
    hud.className = 'deck-hud';
    hud.innerHTML =
        '<button class="deck-arrow" data-deck-prev aria-label="Previous slide">‹</button>' +
        '<span class="deck-count">1 / 1</span>' +
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
        if (inactive) inactive.click(); // script.js swaps every [data-en][data-zh], slides included
    });

    /* ---------- Build the stage (once) ---------- */
    function build() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.className = 'deck-overlay';
        stage = document.createElement('div');
        stage.className = 'deck-stage';
        stage.appendChild(tpl.content.cloneNode(true));
        overlay.appendChild(stage);
        document.body.appendChild(overlay);
        slides = Array.prototype.slice.call(stage.querySelectorAll('.tf-slide'));
        bindTouch();

        // Slides are authored in English — sync if the site is in Chinese
        if (currentLang() === 'zh') {
            stage.querySelectorAll('[data-en][data-zh]').forEach(function (el) {
                var text = el.getAttribute('data-zh');
                var preserved = el.querySelector('.title-red-dot');
                if (preserved) {
                    el.childNodes.forEach(function (node) {
                        if (node.nodeType === Node.TEXT_NODE) node.remove();
                    });
                    el.insertBefore(document.createTextNode(text), preserved);
                } else {
                    el.textContent = text;
                }
            });
        }
    }

    /* ---------- Scale-to-fit (never reflow) ----------
       On a portrait phone the slide would shrink to an unreadable strip, so the
       stage is rotated a quarter turn to use the long edge of the screen. */
    function fit() {
        if (!stage) return;
        var vw = window.innerWidth, vh = window.innerHeight;
        var rotate = vh > vw && vw < 900;
        if (rotate) {
            var sr = Math.min(vh / 1280, vw / 720);
            stage.style.transform = 'translate(-50%, -50%) rotate(90deg) scale(' + sr + ')';
        } else {
            var s = Math.min(vw / 1280, vh / 720);
            stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
        }
    }

    /* ---------- Mode switching ---------- */
    function enter(startAt) {
        if (active) return;
        active = true;
        savedScroll = window.scrollY;
        build();
        document.documentElement.classList.add('deck-on');
        overlay.style.display = 'flex';
        fit();
        document.documentElement.requestFullscreen &&
            document.documentElement.requestFullscreen().then(function () {
                wentFullscreen = true;
            }).catch(function () {});
        go(typeof startAt === 'number' ? startAt : 0);
    }

    function exit() {
        if (!active) return;
        active = false;
        document.documentElement.classList.remove('deck-on');
        if (overlay) overlay.style.display = 'none';
        if (wentFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(function () {});
        }
        wentFullscreen = false;
        if (location.hash.indexOf('#slide-') === 0 || location.hash === '#present') {
            history.replaceState(null, '', location.pathname + location.search);
        }
        window.scrollTo(0, savedScroll);
    }

    function go(n) {
        if (n < 0 || n >= slides.length) return;
        current = n;
        // Cards tapped open on the previous slide reset to their front
        stage.querySelectorAll('.flipped').forEach(function (el) { el.classList.remove('flipped'); });
        slides.forEach(function (s, i) { s.classList.toggle('active', i === n); });
        hud.querySelector('.deck-count').textContent = (n + 1) + ' / ' + slides.length;
        // Persist position so refresh keeps the slide
        history.replaceState(null, '', '#slide-' + (n + 1));
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

    document.addEventListener('fullscreenchange', function () {
        if (active && wentFullscreen && !document.fullscreenElement) exit();
    });

    window.addEventListener('resize', function () { if (active) fit(); });
    window.addEventListener('orientationchange', function () {
        if (active) setTimeout(fit, 120);
    });

    /* ---------- Touch: tap a card to flip it, swipe to change slide ---------- */
    function bindTouch() {
        // Hover cannot happen on a touch screen, so tapping toggles the flip.
        overlay.addEventListener('click', function (e) {
            var card = e.target.closest && e.target.closest('.tf-flip, .tf-logo-card');
            if (card) card.classList.toggle('flipped');
        });

        var x0 = null, y0 = null;
        overlay.addEventListener('touchstart', function (e) {
            if (e.touches.length !== 1) return;
            x0 = e.touches[0].clientX;
            y0 = e.touches[0].clientY;
        }, { passive: true });

        overlay.addEventListener('touchend', function (e) {
            if (x0 === null) return;
            var t = e.changedTouches[0];
            var dx = t.clientX - x0, dy = t.clientY - y0;
            x0 = null;
            // The stage is rotated in portrait, so a vertical swipe reads as
            // "next" there and a horizontal one does in landscape.
            var portrait = window.innerHeight > window.innerWidth && window.innerWidth < 900;
            var d = portrait ? dy : dx;
            var off = portrait ? dx : dy;
            if (Math.abs(d) > 60 && Math.abs(d) > Math.abs(off)) {
                go(d < 0 ? current + 1 : current - 1);
            }
        }, { passive: true });
    }

    // Deep links: #present opens the deck; #slide-N opens at slide N
    var m = location.hash.match(/^#slide-(\d+)$/);
    if (m || location.hash === '#present') {
        var startAt = m ? Math.max(0, parseInt(m[1], 10) - 1) : 0;
        window.addEventListener('load', function () {
            setTimeout(function () { enter(startAt); }, 300);
        });
    }
})();

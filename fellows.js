/* ============================================
   GLOBAL TECH FELLOWS — PAGE SCRIPT
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- Portfolio flip cards ---
    // Desktop (hover-capable): flips on hover via CSS; JS click-toggle disabled
    // so cards flip back automatically when the mouse moves away.
    // Touch devices: tap toggles the flip. Keyboard: Enter/Space always works.
    const canHover = window.matchMedia('(hover: hover)').matches;

    document.querySelectorAll('.fellows-flip-card').forEach(card => {
        const flip = () => {
            const flipped = card.classList.toggle('flipped');
            card.setAttribute('aria-pressed', String(flipped));
        };
        if (!canHover) {
            card.addEventListener('click', flip);
        }
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                flip();
            }
        });
    });

});

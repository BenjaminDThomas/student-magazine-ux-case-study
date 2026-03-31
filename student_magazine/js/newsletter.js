/*
----------------------
Newsletter Subscription Section
----------------------

AI provenance:
- This module was generated and iteratively refined with Claude (Anthropic).

Prompt-engineering summary:
1. position:fixed panel — immune to overflow-x:hidden on body.
2. Panel always visible, clipped to section bounds using clip-path.
3. Cards start spread below and travel upward to stack on scroll.
*/

(function () {
    "use strict";

    var section    = document.getElementById("newsletter-section");
    if (!section) return;

    var isMobile   = function () { return window.innerWidth <= 768; };
    var panel      = section.querySelector(".newsletter-sticky");
    var cards      = Array.from(section.querySelectorAll(".nl-card"));
    var submitBtn  = document.getElementById("nl-submit-btn");
    var emailInput = section.querySelector(".nl-email-input");

    if (!panel || cards.length < 3) return;

    /* Subscribe */
    if (submitBtn && emailInput) {
        // Create a fixed popup for notifications
        var popup = document.createElement('div');
        popup.className = 'nl-subscribe-popup';
        popup.style.display = 'none';
        popup.style.position = 'fixed';
        popup.style.left = '50%';
        popup.style.bottom = '40px';
        popup.style.transform = 'translateX(-50%)';
        popup.style.minWidth = '240px';
        popup.style.maxWidth = '90vw';
        popup.style.textAlign = 'center';
        popup.style.fontSize = '16px';
        popup.style.fontWeight = '600';
        popup.style.color = '#fff';
        popup.style.background = 'rgba(22,163,74,0.98)';
        popup.style.borderRadius = '12px';
        popup.style.padding = '16px 22px';
        popup.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
        popup.style.zIndex = '9999';
        popup.style.transition = 'opacity 0.3s';
        popup.style.opacity = '0';
        document.body.appendChild(popup);

        function showPopup(msg, color) {
            popup.textContent = msg;
            popup.style.background = color || 'rgba(22,163,74,0.98)';
            popup.style.display = 'block';
            setTimeout(function () { popup.style.opacity = '1'; }, 10);
            setTimeout(function () {
                popup.style.opacity = '0';
                setTimeout(function () { popup.style.display = 'none'; }, 400);
            }, 2500);
        }

        submitBtn.addEventListener("click", function () {
            if (submitBtn.disabled) return;
            var email = emailInput.value.trim();
            var valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
            if (!valid) {
                emailInput.classList.add("nl-input-error");
                emailInput.focus();
                showPopup("Please enter a valid email address.", 'rgba(220,38,38,0.98)');
                setTimeout(function () { emailInput.classList.remove("nl-input-error"); }, 2000);
                return;
            }
            submitBtn.classList.add("nl-submit-success");
            submitBtn.disabled = true;
            submitBtn.textContent = "Subscribed";
            emailInput.disabled = true;
            emailInput.classList.add("nl-input-done");
            showPopup("\u2713 Subscribed successfully with " + email, 'rgba(22,163,74,0.98)');
            setTimeout(function () {
                // Reset
                submitBtn.classList.remove("nl-submit-success");
                submitBtn.disabled = false;
                submitBtn.textContent = "Subscribe";
                emailInput.disabled = false;
                emailInput.classList.remove("nl-input-done");
                emailInput.value = '';
            }, 2600);
        });
    }

    /*  Custom cursor */
    var siteCursor = document.getElementById("site-cursor");
    if (siteCursor) siteCursor.style.pointerEvents = "none";
    if (submitBtn && siteCursor) {
        submitBtn.addEventListener("mouseenter", function () {
            if (submitBtn.disabled) return;
            siteCursor.textContent = "Subscribe \u2192";
            siteCursor.classList.add("visible");
        });
        submitBtn.addEventListener("mouseleave", function () { siteCursor.classList.remove("visible"); });
        submitBtn.addEventListener("mousemove", function (e) {
            siteCursor.style.left = e.clientX + "px";
            siteCursor.style.top  = e.clientY + "px";
        });
    }
    let TRAVEL = 0;

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
    function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

    var REST = [
        { x: -8, y: 8,  r: -1.8 },
        { x:  6, y: 4,  r:  1.4 },
        { x:  0, y: 0,  r:  0   }
    ];

    var CARD_HEIGHT = 420;
    var CARD_GAP = 24; // visual gap between stacked cards
    var STACK_HEIGHT = CARD_HEIGHT + 2 * CARD_GAP; // height when all cards stacked

    function setSection() {
        // Set section height
        var footer = document.querySelector('.site-footer');
        var sectionRect = section.getBoundingClientRect();
        var docRect = document.documentElement.getBoundingClientRect();
        var windowHeight = window.innerHeight;
        var footerTop = footer ? (footer.getBoundingClientRect().top - docRect.top) : (sectionRect.top + windowHeight * 2);
        var sectionTop = sectionRect.top - docRect.top;
        // Stop before footer
        var maxSectionHeight = footerTop - sectionTop - 340;
        var minSectionHeight;
        if (isMobile()) {
            // Section ends shortly after cards finish stacking
            minSectionHeight = windowHeight + TRAVEL + 40;
        } else {
            minSectionHeight = windowHeight + (windowHeight * 0.7) * 1.4;
        }
        section.style.height = Math.max(minSectionHeight, Math.min(maxSectionHeight, minSectionHeight)) + 'px';
    }

    function getProgress() {
        var r     = section.getBoundingClientRect();
        var total = section.offsetHeight - window.innerHeight;
        if (total <= 0) return 0;
        return clamp(-r.top / total, 0, 1);
    }

    function setCard(card, x, y, r) {
        card.style.transform =
            "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + r.toFixed(2) + "deg)";
    }

    function update() {
        var r  = section.getBoundingClientRect();
        var vh = window.innerHeight;

        // Show panel only when section is in view
        var sectionInView = r.bottom > 80 && r.top < vh - 80;
        if (sectionInView) {
            panel.classList.add("is-visible");
        } else {
            panel.classList.remove("is-visible");
        }

        // Stick panel to section, but never overlap footer
        var panelH = panel.offsetHeight;
        var footer = document.querySelector(".site-footer");
        var footerTop = footer ? footer.getBoundingClientRect().top : vh * 2;
        var sectionBottom = r.top + r.height;
        var maxPanelTop = Math.min(sectionBottom - panelH, footerTop - panelH - 40);
        var panelTop;
        if (isMobile()) {
            // Position panel in the upper portion of the viewport on mobile
            panelTop = Math.max((vh - panelH) * 0.2, r.top);
        } else {
            panelTop = Math.max(r.top, 0);
        }
        panelTop = Math.min(panelTop, maxPanelTop);
        panel.style.top = panelTop + "px";

        // Animate cards through section scroll
        var p = getProgress();

        setCard(cards[0], REST[0].x, REST[0].y, REST[0].r);

        var p1 = easeInOut(clamp(p / 0.5, 0, 1));
        setCard(cards[1],
            REST[1].x * p1,
            REST[1].y + TRAVEL * (1 - p1),
            REST[1].r * p1 + 3 * (1 - p1)
        );

        var p2 = easeInOut(clamp((p - 0.5) / 0.5, 0, 1));
        setCard(cards[2],
            0,
            REST[2].y + TRAVEL * (1 - p2),
            -2.2 * (1 - p2)
        );
    }

    function init() {
        // On mobile, cards start further apart so they don't overlap initially
        TRAVEL = isMobile() ? window.innerHeight * 0.55 : window.innerHeight * 0.70;
        setSection();
        cards.forEach(function (c) { c.style.transition = "none"; });
        setCard(cards[0], REST[0].x, REST[0].y, REST[0].r);
        setCard(cards[1], 0, REST[1].y + TRAVEL, 3);
        setCard(cards[2], 0, REST[2].y + TRAVEL, -2.2);
    }

    var ticking = false;
    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(function () { ticking = false; update(); });
        }
    }, { passive: true });

    window.addEventListener("resize", function () {
        init();
        update();
    }, { passive: true });


    setTimeout(function () { init(); update(); }, 100);

    window.addEventListener('load', function() {
        init();
        update();
    });

}());
/*
----------------------
Newsletter Subscription Section
----------------------

AI provenance:
- This module was generated and iteratively refined with Claude (Anthropic).

Prompt-engineering summary:
1. Create a scroll-driven newsletter section where a fixed panel stays centred on screen while the user scrolls through the section height.
2. Stack three cards that travel upward from below and land on top of each other as scroll progress moves from 0 to 1, using easeInOut.
3. Add a subscribe button with email validation, a success state, and a fixed toast popup that fades in and out on submission.
4. Make the animation work on mobile with tighter travel distance and section height so the sequence completes without excessive scrolling.
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

    /* subscription form handler */
    if (submitBtn && emailInput) {
        /* toast popup shown on success or validation failure */
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
                /* reset the form so users can subscribe again if needed */
                submitBtn.classList.remove("nl-submit-success");
                submitBtn.disabled = false;
                submitBtn.textContent = "Subscribe";
                emailInput.disabled = false;
                emailInput.classList.remove("nl-input-done");
                emailInput.value = '';
            }, 2600);
        });
    }

    /* custom cursor label on the subscribe button, desktop only */
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

    /* card travel distance set during init based on viewport and device */
    let TRAVEL = 0;

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
    function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

    /* resting positions for each card in the final stacked state */
    var REST = [
        { x: -8, y: 8,  r: -1.8 },
        { x:  6, y: 4,  r:  1.4 },
        { x:  0, y: 0,  r:  0   }
    ];

    var CARD_HEIGHT  = 420;
    var CARD_GAP     = 24;
    var STACK_HEIGHT = CARD_HEIGHT + 2 * CARD_GAP;

    function setSection() {
        /* section height controls how much scroll distance the animation gets */
        var footer       = document.querySelector('.site-footer');
        var sectionRect  = section.getBoundingClientRect();
        var docRect      = document.documentElement.getBoundingClientRect();
        var windowHeight = window.innerHeight;
        var footerTop    = footer
            ? (footer.getBoundingClientRect().top - docRect.top)
            : (sectionRect.top + windowHeight * 2);
        var sectionTop       = sectionRect.top - docRect.top;
        var maxSectionHeight = footerTop - sectionTop - 340;
        var minSectionHeight;
        if (isMobile()) {
            minSectionHeight = windowHeight + TRAVEL + 40;
        } else {
            minSectionHeight = windowHeight + (windowHeight * 0.7) * 1.4;
        }
        section.style.height = Math.min(minSectionHeight, maxSectionHeight) + 'px';
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

        /* show the panel only while the section is within the viewport */
        var sectionInView = r.bottom > 80 && r.top < vh - 80;
        if (sectionInView) {
            panel.classList.add("is-visible");
        } else {
            panel.classList.remove("is-visible");
        }

        /* keep the panel within the section bounds and clear of the footer */
        var panelH        = panel.offsetHeight;
        var footer        = document.querySelector(".site-footer");
        var footerTop     = footer ? footer.getBoundingClientRect().top : vh * 2;
        var sectionBottom = r.top + r.height;
        var maxPanelTop   = Math.min(sectionBottom - panelH, footerTop - panelH - 40);
        var panelTop;
        if (isMobile()) {
            panelTop = Math.max((vh - panelH) * 0.2, r.top);
        } else {
            panelTop = Math.max(r.top, 0);
        }
        panelTop = Math.min(panelTop, maxPanelTop);
        panel.style.top = panelTop + "px";

        /* drive card positions from scroll progress */
        var p = getProgress();

        /* card 0 stays fixed in its resting position throughout */
        setCard(cards[0], REST[0].x, REST[0].y, REST[0].r);

        /* card 1 rises into place over the first half of the scroll range */
        var p1 = easeInOut(clamp(p / 0.5, 0, 1));
        setCard(cards[1],
            REST[1].x * p1,
            REST[1].y + TRAVEL * (1 - p1),
            REST[1].r * p1 + 3 * (1 - p1)
        );

        /* card 2 rises into place over the second half */
        var p2 = easeInOut(clamp((p - 0.5) / 0.5, 0, 1));
        setCard(cards[2],
            0,
            REST[2].y + TRAVEL * (1 - p2),
            -2.2 * (1 - p2)
        );
    }

    function init() {
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

    /* recalculate after all assets have loaded to account for any layout shifts */
    window.addEventListener('load', function() {
        init();
        update();
    });

}());
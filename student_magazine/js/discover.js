/*
----------------------
Browse Section Scroll Animation
----------------------

AI provenance:
- This module was generated and iteratively refined with Claude (Anthropic).

Prompt-engineering summary:
1. Animate category words sliding in from left and right toward a shared centre axis on scroll down, reversing back out on scroll up.
2. Tie progress directly to scroll position so movement is continuous rather than a one-shot trigger.
3. Stagger each word's entry with a delay so they cascade in sequence rather than all moving at once.
*/

(function () {
    "use strict";
    var section = document.getElementById("articles-browse");
    if (!section) return;
    var heading = section.querySelector(".browse-heading");
    var cta     = section.querySelector(".browse-cta");
    var words = [
        { el: section.querySelector(".tag-campus"),    dir: -1, delay: 0.00 },
        { el: section.querySelector(".tag-careers"),   dir:  1, delay: 0.12 },
        { el: section.querySelector(".tag-societies"), dir: -1, delay: 0.22 },
        { el: section.querySelector(".tag-support"),   dir:  1, delay: 0.32 },
        { el: section.querySelector(".tag-offers"),    dir:  0, delay: 0.42 }
    ];
    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function getProgress() {
        var r      = section.getBoundingClientRect();
        var vh     = window.innerHeight;
        var enterY = vh * 0.95;   /* animation begins when section nears the bottom of screen */
        var exitY  = vh * -0.20;  /* animation completes when section top is 20% above viewport */
        return clamp((enterY - r.top) / (enterY - exitY), 0, 1);
    }
    function update() {
        var p      = getProgress();
        var vw     = window.innerWidth;
        var OFFSET = vw * 0.6;
        if (heading) {
            var hp = easeOut(clamp(p / 0.25, 0, 1));
            heading.style.opacity   = hp;
            heading.style.transform = "translateY(" + ((1 - hp) * 14) + "px)";
        }
        words.forEach(function (w) {
            if (!w.el) return;
            var wp = easeOut(clamp((p - w.delay) / (1 - w.delay), 0, 1));
            w.el.style.opacity = wp;

            if (w.dir !== 0) {
                /* words with a direction slide in horizontally from left or right */
                w.el.style.transform = "translateX(calc(-50% + " + (w.dir * OFFSET * (1 - wp)) + "px))";
            } else {
                /* centre word rises vertically */
                w.el.style.transform = "translateX(-50%) translateY(" + (44 * (1 - wp)) + "px)";
            }
        });
        if (cta) {
            var cp = easeOut(clamp((p - 0.55) / 0.45, 0, 1));
            cta.style.opacity   = cp;
            cta.style.transform = "translateY(" + ((1 - cp) * 16) + "px)";
        }
    }
    section.querySelectorAll(".browse-heading, .browse-tag, .browse-cta")
        .forEach(function (el) {
            el.style.transition = "none";
            el.style.opacity    = "0";
        });
    var ticking = false;
    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(function () { ticking = false; update(); });
        }
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    setTimeout(update, 50);
}());
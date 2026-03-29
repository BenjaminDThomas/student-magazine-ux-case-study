/*
  AI-Generated with GitHub Copilot
  ──────────────────────────────────
  Infinite heading scroller for the About Us section.

  Prompts used:
  1. "Create a scroll-driven horizontal label strip where one bold ABOUT US
      starts at the left edge and moves linearly to the right as the user
      scrolls through the section, reaching the right edge at the end."
  2. "Clone outlined SVG labels to fill the strip so that as the bold label
      moves right, outlined copies continuously feed in from the left to
      occupy the vacated space — and reverse smoothly on scroll up."
  3. "Add smoothed scroll progress, lazy caching, and
      progressive text-chunk highlighting that reveals paragraph content
      in sync with the heading motion."
*/
(function () {
    "use strict";

    var section = document.getElementById("about-us");
    if (!section) return;

    var headingRow = section.querySelector(".about-us-heading-row");
    var headingTrack = headingRow
        ? headingRow.querySelector(".about-us-heading-track")
        : null;
    var allLabels = section.querySelectorAll(".au-label");
    var blocks = section.querySelectorAll(".about-us-block");
    if (!headingRow || !allLabels.length || !blocks.length) return;

    if (!headingTrack) {
        headingTrack = document.createElement("div");
        headingTrack.className = "about-us-heading-track";
        while (headingRow.firstChild) headingTrack.appendChild(headingRow.firstChild);
        headingRow.appendChild(headingTrack);
    }
    allLabels = headingTrack.querySelectorAll(".au-label");

    var isMobile = function () {
        return window.matchMedia("(max-width: 900px)").matches;
    };

    var clamp = function (v, lo, hi) {
        return v < lo ? lo : v > hi ? hi : v;
    };

    /* ── cached geometry ── */
    var boldIndex = 0;
    var slotWidth = 0;
    var labelWidth = 0;
    var poolReady = false;

    function measure() {
        allLabels = headingTrack.querySelectorAll(".au-label");
        if (allLabels.length < 2) return;
        labelWidth = allLabels[0].getBoundingClientRect().width;
        slotWidth = allLabels[1].getBoundingClientRect().left
                  - allLabels[0].getBoundingClientRect().left;
        if (slotWidth <= 0) slotWidth = labelWidth + 24;
        if (labelWidth <= 0) labelWidth = 160;
    }

    function buildPool() {
        var tpl = headingTrack.querySelector(".au-label");
        if (!tpl) return;
        var count = isMobile() ? 20 : 30;
        while (headingTrack.children.length < count) {
            var c = tpl.cloneNode(true);
            c.classList.remove("au-active");
            headingTrack.appendChild(c);
        }
        allLabels = headingTrack.querySelectorAll(".au-label");
        measure();
        var vw = headingRow.clientWidth || window.innerWidth;
        boldIndex = Math.min(Math.ceil(vw / slotWidth) + 1, allLabels.length - 2);
        poolReady = slotWidth > 0 && labelWidth > 0;
    }

    /* ── word chunks ── */
    var chunks = [];
    for (var b = 0; b < blocks.length; b++) {
        var words = blocks[b].textContent.trim().split(/\s+/);
        blocks[b].innerHTML = "";
        for (var w = 0; w < words.length; w += 8) {
            var span = document.createElement("span");
            span.className = "au-chunk";
            span.textContent = words.slice(w, w + 8).join(" ") + " ";
            blocks[b].appendChild(span);
            chunks.push(span);
        }
    }

    /* ── scroll progress ── */
    var smoothP = 0;
    var targetP = 0;

    function rawProgress() {
        var r = section.getBoundingClientRect();
        var vh = window.innerHeight;
        var mobile = isMobile();

        /* p = 0  →  section top at enterY (visible on screen)
           p = 1  →  section bottom at viewport bottom
           On scroll up, p stays at 1 until bottom lifts off viewport edge */
        var enterY = mobile ? vh * 0.4 : vh * 0.7;
        var range = r.height - (vh - enterY);
        if (range <= 0) range = 1;
        return clamp((enterY - r.top) / range, 0, 1);
    }

    function remap(p) {
        return Math.pow(clamp(p, 0, 1), 1.08);
    }

    /* ── entrance rise (desktop only) ── */
    function updateEntrance(p) {
        if (isMobile()) { section.style.transform = ""; return; }
        var t = clamp(p / 0.16, 0, 1);
        section.style.transform = "translateY(" + ((1 - t) * 72) + "px)";
    }

    /* ── heading: bold slides left → right linearly ── */
    function updateLabels(p) {
        if (!poolReady) return;
        var vw = headingRow.clientWidth || window.innerWidth;
        var color = getComputedStyle(section).getPropertyValue("--text-color").trim() || "#111";
        var tx = p * (vw - labelWidth) - boldIndex * slotWidth;

        headingTrack.style.transform = "translateX(" + tx + "px)";

        for (var i = 0; i < allLabels.length; i++) {
            var stroke = allLabels[i].querySelector(".au-text-stroke");
            var knock = allLabels[i].querySelector(".au-text-knock");
            if (i === boldIndex) {
                allLabels[i].classList.add("au-active");
                allLabels[i].style.opacity = "1";
                if (stroke) { stroke.style.fill = color; stroke.style.stroke = "none"; }
                if (knock) knock.style.display = "none";
            } else {
                allLabels[i].classList.remove("au-active");
                allLabels[i].style.opacity = "";
                if (stroke) { stroke.style.fill = ""; stroke.style.stroke = ""; }
                if (knock) knock.style.display = "";
            }
        }
    }

    /* ── text highlight (continuous smooth) ── */
    function updateText(p) {
        var focus = p * (chunks.length - 1);
        for (var i = 0; i < chunks.length; i++) {
            var dist = i - focus;
            var op, fw;
            if (dist >= -1.5 && dist <= 2.5) {
                op = "1";
                fw = "700";
            } else if (dist < -1.5) {
                var fadeBehind = Math.min(1, (-1.5 - dist) / 3);
                op = String(Math.max(0.18, 1 - fadeBehind * 0.82));
                fw = "400";
            } else {
                var fadeAhead = Math.min(1, (dist - 2.5) / 4);
                op = String(Math.max(0.08, 0.28 - fadeAhead * 0.2));
                fw = "400";
            }
            chunks[i].style.opacity = op;
            chunks[i].style.fontWeight = fw;
        }
    }

    /* ── animation loop ── */
    function tick() {
        if (!poolReady) {
            buildPool();
            if (!poolReady) { requestAnimationFrame(tick); return; }
        }

        var mobile = isMobile();
        var lerp = mobile ? 0.07 : 0.1;
        var diff = targetP - smoothP;

        if (Math.abs(diff) > 0.0005) { smoothP += diff * lerp; }
        else { smoothP = targetP; }

        var hP = clamp(smoothP, 0, 1);
        var tP = mobile
            ? Math.pow(smoothP, 1.15)
            : clamp(smoothP, 0, 1);

        updateEntrance(smoothP);
        updateLabels(hP);
        updateText(tP);
        requestAnimationFrame(tick);
    }

    window.addEventListener("scroll", function () {
        targetP = remap(rawProgress());
    }, { passive: true });

    window.addEventListener("resize", function () {
        poolReady = false;
        targetP = remap(rawProgress());
    });

    updateText(0);
    requestAnimationFrame(tick);
}());
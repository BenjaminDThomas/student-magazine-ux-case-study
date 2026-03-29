/*
----------------------
Scroll To Top Button
----------------------
*/

const btn = document.querySelector("#scrollTopBtn");

if (btn) {
    window.addEventListener("scroll", () => {
        btn.classList.toggle("visible", window.scrollY > 500);
    });

    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

/*
----------------------
Global Custom Cursor Labels
----------------------
*/

const siteCursor = document.createElement("div");
siteCursor.id = "site-cursor";
document.body.appendChild(siteCursor);

function showSiteCursor(text) {
    if (!text) {
        siteCursor.classList.remove("visible");
        return;
    }
    siteCursor.textContent = text;
    siteCursor.classList.add("visible");
}

function hideSiteCursor() {
    siteCursor.classList.remove("visible");
}

function inferCursorLabel(target) {
    if (!target) return "";
    if (target.dataset.cursorLabel) return target.dataset.cursorLabel;

    if (target.closest(".theme-toggle")) {
        return document.documentElement.classList.contains("dark-mode")
            ? "Switch to light mode"
            : "Switch to dark mode";
    }
    if (target.closest(".logo"))                                           return "Go to home";
    if (target.id === "scrollTopBtn")                                      return "Scroll to top";
    if (target.closest(".article-card") ||
        target.classList.contains("card-read-more") ||
        target.classList.contains("carousel-read-more"))                   return "Explore article";
    if (target.classList.contains("return-btn"))                           return "Back to articles";
    if (target.classList.contains("icon-btn"))                             return target.getAttribute("title") || "Open";
    if (target.tagName === "A") {
        const text = (target.textContent || "").trim();
        return text ? `Open ${text}` : "Open link";
    }
    if (target.tagName === "BUTTON") {
        const text = (target.textContent || "").trim();
        return text || "Click";
    }
    return "";
}

document.addEventListener("mousemove", (e) => {
    siteCursor.style.left = e.clientX + "px";
    siteCursor.style.top  = e.clientY + "px";

    if (e.target.closest("#featured-carousel")) {
        hideSiteCursor();
        return;
    }
    const interactive = e.target.closest("[data-cursor-label], a, button, .logo, [role='button']");
    showSiteCursor(inferCursorLabel(interactive));
});

document.addEventListener("mouseleave", hideSiteCursor);

const toggleButton = document.querySelector(".theme-toggle");
if (toggleButton) {
    toggleButton.addEventListener("click", () => {
        if (toggleButton.matches(":hover")) {
            showSiteCursor(inferCursorLabel(toggleButton));
        }
    });
}

document.querySelectorAll(".logo").forEach((logo) => {
    if (logo.tagName === "A") return;
    logo.classList.add("logo-clickable");
    logo.setAttribute("role", "link");
    logo.setAttribute("tabindex", "0");
    logo.setAttribute("aria-label", "Go to home page");
    logo.addEventListener("click", () => { window.location.href = "index.html"; });
    logo.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            window.location.href = "index.html";
        }
    });
});

/*
----------------------
Mobile Hamburger Drawer
----------------------
*/

const mobileMenuBtn     = document.getElementById("mobile-menu-btn");
const mobileNavDrawer   = document.getElementById("mobile-nav-drawer");
const mobileDrawerOverlay = document.getElementById("mobile-drawer-overlay");

if (mobileMenuBtn && mobileNavDrawer) {
    function openDrawer() {
        mobileMenuBtn.classList.add("is-open");
        mobileMenuBtn.setAttribute("aria-expanded", "true");
        mobileNavDrawer.classList.add("is-open");
        mobileNavDrawer.setAttribute("aria-hidden", "false");
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.add("is-open");
        document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
        mobileMenuBtn.classList.remove("is-open");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
        mobileNavDrawer.classList.remove("is-open");
        mobileNavDrawer.setAttribute("aria-hidden", "true");
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.remove("is-open");
        document.body.style.overflow = "";
    }

    mobileMenuBtn.addEventListener("click", () => {
        mobileMenuBtn.classList.contains("is-open") ? closeDrawer() : openDrawer();
    });

    if (mobileDrawerOverlay) mobileDrawerOverlay.addEventListener("click", closeDrawer);
    mobileNavDrawer.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeDrawer));
}

/*
----------------------
Footer Contact Typewriter
----------------------
*/

(function initFooterTypewriter() {
    const textEl   = document.getElementById("footer-tw-text");
    const cursorEl = document.querySelector(".footer-cursor");
    if (!textEl) return;

    const CONTACT = "Phone number: +44 1234 567890\nEmail: adminAccount@gmail.com";
    let triggered = false;

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    async function untype() {
        while (textEl.textContent.length > 0) {
            textEl.textContent = textEl.textContent.slice(0, -1);
            await sleep(55);
        }
    }

    async function type(text) {
        for (const char of text) {
            textEl.textContent += char;
            await sleep(38);
        }
    }

    async function runSequence() {
        if (triggered) return;
        triggered = true;
        await sleep(350);
        await untype();
        await sleep(180);
        await type(CONTACT);
        if (cursorEl) cursorEl.classList.add("footer-cursor--done");
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) { runSequence(); observer.disconnect(); }
        });
    }, { threshold: 0.05 });

    const area = document.getElementById("footer-contact-area");
    if (area) observer.observe(area);
}());

/*
----------------------
Bottom Blur — adaptive colour + footer fade
Runs on all pages that include .page-bottom-blur
----------------------
*/
(function () {
    var blurEl = document.querySelector(".page-bottom-blur");
    if (!blurEl) return;

    function isBgDark(el) {
        if (!el) return false;
        var bg = window.getComputedStyle(el).backgroundColor;
        var m  = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return false;
        if (bg.indexOf("0)") !== -1 && +m[1] === 0 && +m[2] === 0 && +m[3] === 0) return false;
        return (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) < 100;
    }

    function bgElAtPoint(x, y) {
        var els = document.elementsFromPoint(x, y);
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (el === blurEl || el.classList.contains("page-bottom-blur")) continue;
            var bg = window.getComputedStyle(el).backgroundColor;
            if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return el;
        }
        return document.body;
    }

    var footer = document.querySelector(".site-footer");

    function update() {
        /* Adaptive colour — match blur to whatever bg colour sits beneath it */
        blurEl.classList.toggle("over-dark",
            isBgDark(bgElAtPoint(window.innerWidth / 2, window.innerHeight - 8)));

        /* Fade out as footer scrolls into view so it never overlaps footer content */
        if (footer) {
            var footerTop = footer.getBoundingClientRect().top;
            var vh        = window.innerHeight;
            var opacity   = Math.min(1, Math.max(0, (footerTop - vh * 0.80) / (vh * 0.20)));
            blurEl.style.opacity = opacity;
        }
    }

    var ticking = false;
    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(function () { ticking = false; update(); });
        }
    }, { passive: true });

    setTimeout(update, 120);
}());
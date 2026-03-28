/*
----------------------
Scroll To Top Button
----------------------
*/

const btn = document.querySelector("#scrollTopBtn");                    // selects 'scrollTopBtn' class

if (btn) {                                                              // only runs if slider exists on the page
    window.addEventListener("scroll", () => {                           // checks for scrolling interaction
    btn.classList.toggle("visible", window.scrollY > 500);                   // button only appears after 500+ y position
    });

    btn.addEventListener("click", () => {                               // on scroll to top button click event
    window.scrollTo({ top: 0, behavior: "smooth" });                    // scrolls to top of page
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
    if (!target) {
        return "";
    }

    if (target.dataset.cursorLabel) {
        return target.dataset.cursorLabel;
    }

    if (target.closest(".theme-toggle")) {
        return document.documentElement.classList.contains("dark-mode")
            ? "Switch to light mode"
            : "Switch to dark mode";
    }

    if (target.closest(".logo")) {
        return "Go to home";
    }

    if (target.id === "scrollTopBtn") {
        return "Scroll to top";
    }

    if (target.closest(".article-card") || target.classList.contains("card-read-more") || target.classList.contains("carousel-read-more")) {
        return "Explore article";
    }

    if (target.classList.contains("return-btn")) {
        return "Back to articles";
    }

    if (target.classList.contains("icon-btn")) {
        return target.getAttribute("title") || "Open";
    }

    if (target.tagName === "A") {
        const text = (target.textContent || "").trim();
        return text ? `Open ${text}` : "Open link";
    }

    if (target.tagName === "BUTTON") {
        const text = (target.textContent || "").trim();
        return text ? text : "Click";
    }

    return "";
}

document.addEventListener("mousemove", (e) => {
    siteCursor.style.left = e.clientX + "px";
    siteCursor.style.top = e.clientY + "px";

    // Allow the carousel-specific cursor to take over inside the carousel area.
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
        // Keep cursor label in sync immediately after mode toggle while still hovering the button.
        if (toggleButton.matches(":hover")) {
            showSiteCursor(inferCursorLabel(toggleButton));
        }
    });
}

// Make the logo behave like a home link across pages where it is not an anchor.
document.querySelectorAll(".logo").forEach((logo) => {
    if (logo.tagName === "A") {
        return;
    }

    logo.classList.add("logo-clickable");
    logo.setAttribute("role", "link");
    logo.setAttribute("tabindex", "0");
    logo.setAttribute("aria-label", "Go to home page");

    logo.addEventListener("click", () => {
        window.location.href = "index.html";
    });

    logo.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            window.location.href = "index.html";
        }
    });
});

/*
----------------------
Mobile Hamburger Drawer (Homepage)
----------------------

Generated with GitHub Copilot (Claude Sonnet 4.5).
Prompt: "Replace the mobile navbar with a hamburger menu in the bottom-right corner for thumb accessibility. 
The menu should open as a bottom-sheet drawer with a backdrop overlay, animate to a close
icon when active, and lock body scroll while open."
*/

const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileNavDrawer = document.getElementById("mobile-nav-drawer");
const mobileDrawerOverlay = document.getElementById("mobile-drawer-overlay");

if (mobileMenuBtn && mobileNavDrawer) {
    function openDrawer() {
        mobileMenuBtn.classList.add("is-open");
        mobileMenuBtn.setAttribute("aria-expanded", "true");
        mobileNavDrawer.classList.add("is-open");
        mobileNavDrawer.setAttribute("aria-hidden", "false");
        if (mobileDrawerOverlay) {
            mobileDrawerOverlay.classList.add("is-open");
        }
        document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
        mobileMenuBtn.classList.remove("is-open");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
        mobileNavDrawer.classList.remove("is-open");
        mobileNavDrawer.setAttribute("aria-hidden", "true");
        if (mobileDrawerOverlay) {
            mobileDrawerOverlay.classList.remove("is-open");
        }
        document.body.style.overflow = "";
    }

    mobileMenuBtn.addEventListener("click", () => {
        mobileMenuBtn.classList.contains("is-open") ? closeDrawer() : openDrawer();
    });

    if (mobileDrawerOverlay) {
        mobileDrawerOverlay.addEventListener("click", closeDrawer);
    }

    // Close drawer when a nav link is tapped.
    mobileNavDrawer.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeDrawer);
    });
}

/*
----------------------
Footer Contact Typewriter
----------------------
*/

(function initFooterTypewriter() {
    const textEl = document.getElementById("footer-tw-text");
    const cursorEl = document.querySelector(".footer-cursor");
    if (!textEl) return;

    const CONTACT = "Phone number: +44 1234 567890\nEmail: adminAccount@gmail.com";
    let triggered = false;

    function sleep(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

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

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                runSequence();
                observer.disconnect();
            }
        });
    }, { threshold: 0.05 });

    const area = document.getElementById("footer-contact-area");
    if (area) observer.observe(area);
}());

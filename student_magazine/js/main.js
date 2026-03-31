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
Desktop Scroll-triggered Hamburger
----------------------
*/

(function () {
    // only applies on non-homepage, non-auth desktop
    if (document.body.classList.contains("home-page")) {
        // homepage — hamburger appears when the hero navbar scrolls out of view
        var menuBtn = document.getElementById("mobile-menu-btn");
        var navbar  = document.querySelector(".hero .navbar");
        if (!menuBtn || !navbar) return;

        function updateHomeHamburger() {
            if (window.innerWidth < 769) return;
            var navBottom = navbar.getBoundingClientRect().bottom;
            if (navBottom <= 0) {
                menuBtn.classList.add("desktop-visible");
            } else {
                menuBtn.classList.remove("desktop-visible");
            }
        }

        window.addEventListener("scroll", updateHomeHamburger, { passive: true });
        window.addEventListener("resize", updateHomeHamburger, { passive: true });
        updateHomeHamburger();
        return;
    }
    if (document.body.classList.contains("auth")) return;

    var menuBtn = document.getElementById("mobile-menu-btn");
    var navbar  = document.querySelector(".navbar");
    if (!menuBtn || !navbar) return;

    function updateHamburger() {
        if (window.innerWidth < 769) return;                        // mobile handles its own display
        var navBottom = navbar.getBoundingClientRect().bottom;
        if (navBottom <= 0) {
            menuBtn.classList.add("desktop-visible");
        } else {
            menuBtn.classList.remove("desktop-visible");
        }
    }

    window.addEventListener("scroll", updateHamburger, { passive: true });
    window.addEventListener("resize", updateHamburger, { passive: true });
    updateHamburger();
}());

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

const mobileMenuBtn       = document.getElementById("mobile-menu-btn");
const mobileNavDrawer     = document.getElementById("mobile-nav-drawer");
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
        // reset to main nav view when closing — safe because window.showDrawerMain is set below
        if (typeof window.showDrawerMain === "function") window.showDrawerMain();
    }

    mobileMenuBtn.addEventListener("click", () => {
        mobileMenuBtn.classList.contains("is-open") ? closeDrawer() : openDrawer();
    });

    if (mobileDrawerOverlay) mobileDrawerOverlay.addEventListener("click", closeDrawer);

    // only add closeDrawer to nav links, not icon buttons (icons handle their own clicks)
    mobileNavDrawer.querySelectorAll("ul a").forEach((link) => {
        link.addEventListener("click", closeDrawer);
    });
}

/*
----------------------
Mobile Drawer — Profile Panel
----------------------
*/

(function () {
    var drawer = document.getElementById("mobile-nav-drawer");
    if (!drawer) return;

    var user = null;
    try { user = JSON.parse(localStorage.getItem("currentUser")); } catch {}

    /* ── profile panel element ── */
    var profilePanel = document.createElement("div");
    profilePanel.id = "mobile-profile-panel";
    profilePanel.setAttribute("aria-hidden", "true");
    profilePanel.style.display = "none";
    drawer.appendChild(profilePanel);

    function getDisplayName() {
        if (!user) return "";
        var stored = null;
        try { stored = localStorage.getItem("userName_" + user.email); } catch {}
        if (stored) return stored;
        var n = user.email.split("@")[0];
        return n.charAt(0).toUpperCase() + n.slice(1);
    }

    function getAvatar() {
        if (!user) return null;
        try { return localStorage.getItem("userAvatar_" + user.email) || null; } catch { return null; }
    }

    /* ── show/hide helpers — exposed globally so closeDrawer can call showDrawerMain ── */
    window.showDrawerMain = function () {
        var mainContent = drawer.querySelector("ul");
        var drawerIcons = drawer.querySelector(".mobile-drawer-icons");
        if (mainContent) mainContent.style.display = "";
        if (drawerIcons) drawerIcons.style.display = "";
        profilePanel.style.display = "none";
        profilePanel.setAttribute("aria-hidden", "true");
    };

    function showProfilePanel() {
        var mainContent = drawer.querySelector("ul");
        var drawerIcons = drawer.querySelector(".mobile-drawer-icons");
        if (mainContent) mainContent.style.display = "none";
        if (drawerIcons) drawerIcons.style.display = "none";
        profilePanel.style.display = "block";
        profilePanel.setAttribute("aria-hidden", "false");
    }

    function renderProfilePanel() {
        if (!user) return;
        var name   = getDisplayName();
        var avatar = getAvatar();

        profilePanel.innerHTML =
            '<button type="button" class="mpanel-back" id="mpanel-back">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" style="width:18px;height:18px"><polyline points="15 18 9 12 15 6"/></svg>' +
                ' Back' +
            '</button>' +
            '<div class="mpanel-header">' +
                (avatar
                    ? '<img class="mpanel-avatar" src="' + avatar + '" alt="Profile photo">'
                    : '<div class="mpanel-avatar"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg></div>') +
                '<div>' +
                    '<p class="mpanel-name">' + name + '</p>' +
                    '<p class="mpanel-email">' + user.email + '</p>' +
                '</div>' +
            '</div>' +
            '<a href="saved.html" class="mpanel-item">Saved Articles</a>' +
            '<button type="button" class="mpanel-item" id="mpanel-change-name">Change Profile Name</button>' +
            '<label class="mpanel-item" style="cursor:pointer">' +
                'Upload Profile Photo' +
                '<input type="file" id="mpanel-photo-input" accept="image/*" style="display:none">' +
            '</label>' +
            '<button type="button" class="mpanel-item" id="mpanel-logout">Sign Out</button>' +
            '<button type="button" class="mpanel-item mpanel-item--delete" id="mpanel-delete">Delete Account</button>';

        document.getElementById("mpanel-back").addEventListener("click", function () {
            window.showDrawerMain();
        });

        document.getElementById("mpanel-change-name").addEventListener("click", function () {
            var newName = window.prompt("Enter your new display name:", getDisplayName());
            if (newName && newName.trim()) {
                localStorage.setItem("userName_" + user.email, newName.trim());
                renderProfilePanel();
            }
        });

        document.getElementById("mpanel-photo-input").addEventListener("change", function (e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (ev) {
                localStorage.setItem("userAvatar_" + user.email, ev.target.result);
                renderProfilePanel();
            };
            reader.readAsDataURL(file);
        });

        document.getElementById("mpanel-logout").addEventListener("click", function () {
            localStorage.removeItem("currentUser");
            localStorage.removeItem("staySignedIn");
            window.location.href = "index.html";
        });

        document.getElementById("mpanel-delete").addEventListener("click", function () {
            if (!window.confirm("Delete your account? This cannot be undone.")) return;
            try {
                var users = JSON.parse(localStorage.getItem("users")) || [];
                users = users.filter(function (u) { return u.email !== user.email; });
                localStorage.setItem("users", JSON.stringify(users));
            } catch {}
            localStorage.removeItem("currentUser");
            localStorage.removeItem("staySignedIn");
            localStorage.removeItem("userName_" + user.email);
            localStorage.removeItem("userAvatar_" + user.email);
            localStorage.removeItem("saved_" + user.email);
            window.location.href = "index.html";
        });
    }

    /* ── wire up drawer icons when logged in ── */
    if (user) {
        renderProfilePanel();

        var drawerIcons = drawer.querySelector(".mobile-drawer-icons");
        if (drawerIcons) {
            /* profile icon → open profile panel */
            var profileBtn = drawerIcons.querySelector('a[title="Profile"]');
            if (profileBtn) {
                profileBtn.removeAttribute("href");
                profileBtn.addEventListener("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    showProfilePanel();
                });

                var avatar = getAvatar();
                if (avatar) {
                    var img = profileBtn.querySelector(".profile-icon");
                    if (img) {
                        img.src = avatar;
                        img.style.filter = "none";
                        img.style.borderRadius = "50%";
                    }
                }
            }

            /* saved articles icon → always goes straight to saved.html */
            var savedBtn = drawerIcons.querySelector('a[title="Saved articles"]');
            if (savedBtn) savedBtn.href = "saved.html";
        }
    }
}());

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
        /* adaptive colour — match blur to whatever bg colour sits beneath it */
        blurEl.classList.toggle("over-dark",
            isBgDark(bgElAtPoint(window.innerWidth / 2, window.innerHeight - 8)));

        /* fade out as footer scrolls into view so it never overlaps footer content */
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

/*
----------------------
Profile Dropdown (desktop navbar only)
----------------------
*/

(function () {
    var user = null;
    try { user = JSON.parse(localStorage.getItem("currentUser")); } catch {}

    /* desktop navbar profile icon only — mobile drawer handles its own */
    var profileBtns = document.querySelectorAll('.navbar-icons a.icon-btn[title="Profile"]');
    if (!profileBtns.length) return;

    if (!user) {
        profileBtns.forEach(function (btn) { btn.href = "login.html"; });
        return;
    }

    function getDisplayName() {
        var stored = null;
        try { stored = localStorage.getItem("userName_" + user.email); } catch {}
        if (stored) return stored;
        var n = user.email.split("@")[0];
        return n.charAt(0).toUpperCase() + n.slice(1);
    }

    function getAvatar() {
        try { return localStorage.getItem("userAvatar_" + user.email) || null; } catch { return null; }
    }

    function refreshNavAvatar() {
        var avatar = getAvatar();
        profileBtns.forEach(function (btn) {
            var img = btn.querySelector(".profile-icon");
            if (!img || !avatar) return;
            img.src = avatar;
            img.style.filter = "none";
            img.style.borderRadius = "50%";
        });
    }
    refreshNavAvatar();

    var dropdown = document.createElement("div");
    dropdown.id = "profile-dropdown";
    dropdown.setAttribute("aria-label", "Profile menu");
    document.body.appendChild(dropdown);

    function renderDropdown() {
        var name   = getDisplayName();
        var avatar = getAvatar();

        dropdown.innerHTML =
            '<div class="pd-header">' +
                (avatar
                    ? '<img class="pd-avatar" src="' + avatar + '" alt="Profile photo">'
                    : '<div class="pd-avatar"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg></div>') +
                '<div class="pd-header-text">' +
                    '<p class="pd-name">' + name + '</p>' +
                    '<p class="pd-email">' + user.email + '</p>' +
                '</div>' +
            '</div>' +
            '<hr class="pd-divider">' +
            '<a href="saved.html" class="pd-item">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
                'Saved Articles' +
            '</a>' +
            '<button type="button" class="pd-item" id="pd-change-name">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                'Change Profile Name' +
            '</button>' +
            '<label class="pd-item" style="cursor:pointer">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
                'Upload Profile Photo' +
                '<input type="file" id="pd-photo-input" accept="image/*" style="display:none">' +
            '</label>' +
            '<hr class="pd-divider">' +
            '<button type="button" class="pd-item pd-item--logout" id="pd-logout">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
                'Sign Out' +
            '</button>' +
            '<button type="button" class="pd-item pd-item--delete" id="pd-delete">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>' +
                'Delete Account' +
            '</button>';

        document.getElementById("pd-change-name").addEventListener("click", function () {
            var newName = window.prompt("Enter your new display name:", getDisplayName());
            if (newName && newName.trim()) {
                localStorage.setItem("userName_" + user.email, newName.trim());
                renderDropdown();
            }
        });

        document.getElementById("pd-photo-input").addEventListener("change", function (e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (ev) {
                localStorage.setItem("userAvatar_" + user.email, ev.target.result);
                refreshNavAvatar();
                renderDropdown();
            };
            reader.readAsDataURL(file);
        });

        document.getElementById("pd-logout").addEventListener("click", function () {
            localStorage.removeItem("currentUser");
            localStorage.removeItem("staySignedIn");
            window.location.href = "index.html";
        });

        document.getElementById("pd-delete").addEventListener("click", function () {
            if (!window.confirm("Delete your account? This cannot be undone.")) return;
            try {
                var users = JSON.parse(localStorage.getItem("users")) || [];
                users = users.filter(function (u) { return u.email !== user.email; });
                localStorage.setItem("users", JSON.stringify(users));
            } catch {}
            localStorage.removeItem("currentUser");
            localStorage.removeItem("staySignedIn");
            localStorage.removeItem("userName_" + user.email);
            localStorage.removeItem("userAvatar_" + user.email);
            localStorage.removeItem("saved_" + user.email);
            window.location.href = "index.html";
        });
    }

    renderDropdown();

    profileBtns.forEach(function (btn) {
        btn.removeAttribute("href");
        btn.style.cursor = "pointer";
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var rect = btn.getBoundingClientRect();
            dropdown.style.top  = (rect.bottom + 8) + "px";
            dropdown.style.left = Math.min(rect.left, window.innerWidth - 240) + "px";
            dropdown.classList.toggle("is-open");
        });
    });

    document.addEventListener("click", function () {
        dropdown.classList.remove("is-open");
    });

    dropdown.addEventListener("click", function (e) { e.stopPropagation(); });

}());
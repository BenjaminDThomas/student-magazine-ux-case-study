/*
----------------------
Save Article System
----------------------
*/

/* ── helpers ── */

// returns the current logged-in user object, or null
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUser")) || null;
    } catch {
        return null;
    }
}

// returns array of saved article ids for the current user
function getSavedIds() {
    const user = getCurrentUser();
    if (!user) return [];
    try {
        return JSON.parse(localStorage.getItem("saved_" + user.email)) || [];
    } catch {
        return [];
    }
}

// saves the updated id list back to localStorage
function setSavedIds(ids) {
    const user = getCurrentUser();
    if (!user) return;
    localStorage.setItem("saved_" + user.email, JSON.stringify(ids));
}

// toggles saved state for an article id, returns new saved state
function toggleSaved(id) {
    const ids = getSavedIds();
    const index = ids.indexOf(id);
    if (index === -1) {
        ids.push(id);
        setSavedIds(ids);
        return true;
    } else {
        ids.splice(index, 1);
        setSavedIds(ids);
        return false;
    }
}

// returns true if the given article id is saved
function isArticleSaved(id) {
    return getSavedIds().includes(id);
}

/* ── build a save button element ── */

function buildSaveBtn(articleId) {
    const btn = document.createElement("button");
    btn.className = "save-btn";
    btn.setAttribute("type", "button");
    btn.setAttribute("aria-label", "Save article");
    btn.setAttribute("title", "Save article");
    btn.dataset.cursorLabel = "Save article";
    btn.dataset.articleId = String(articleId);

    const saved = isArticleSaved(articleId);
    applySaveState(btn, saved);

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // redirect to login if not signed in
        if (!getCurrentUser()) {
            window.location.href = "login.html?returnTo=" + encodeURIComponent(window.location.href);
            return;
        }

        const nowSaved = toggleSaved(articleId);
        applySaveState(btn, nowSaved);
        btn.dataset.cursorLabel = nowSaved ? "Unsave article" : "Save article";
    });

    return btn;
}

// applies the visual saved/unsaved state to a button
function applySaveState(btn, saved) {
    const signedIn = !!getCurrentUser();
    const isArticleButton = btn.classList.contains("save-btn--article");

    btn.classList.toggle("is-saved", saved);
    btn.classList.toggle("is-signed-in", signedIn);
    btn.setAttribute("aria-pressed", String(saved));
    btn.setAttribute("aria-label", saved ? "Unsave article" : "Save article");
    btn.innerHTML = saved
        ? `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

    if (!signedIn) {
        btn.style.color = "";
        btn.style.background = "";
        btn.style.borderColor = "";
        btn.style.boxShadow = "";
        return;
    }

    if (saved) {
        if (isArticleButton) {
            btn.style.background = "rgba(224, 123, 0, 0.12)";
            btn.style.borderColor = "rgba(224, 123, 0, 0.46)";
            btn.style.boxShadow = "0 8px 20px rgba(224, 123, 0, 0.16)";
        } else {
            btn.style.background = "#fff";
            btn.style.boxShadow = "0 6px 18px rgba(224, 123, 0, 0.24)";
        }
        return;
    }

    btn.style.color = "#c86500";
    if (isArticleButton) {
        btn.style.background = "rgba(224, 123, 0, 0.08)";
        btn.style.borderColor = "rgba(224, 123, 0, 0.45)";
        btn.style.boxShadow = "0 6px 16px rgba(224, 123, 0, 0.14)";
    } else {
        btn.style.background = "#fff";
        btn.style.boxShadow = "0 6px 18px rgba(224, 123, 0, 0.22)";
    }
}

/* ── attach save buttons to all rendered cards ── */

function attachSaveBtnsToCards() {
    document.querySelectorAll(".article-card").forEach((card) => {
        // skip if already has a save button
        if (card.querySelector(".save-btn")) return;

        const link = card.querySelector(".card-link");
        if (!link) return;

        const href = link.getAttribute("href") || "";
        const match = href.match(/id=(\d+)/);
        if (!match) return;

        const articleId = Number(match[1]);
        const btn = buildSaveBtn(articleId);
        btn.classList.add("save-btn--card");
        card.appendChild(btn);
    });
}

/* ── attach save button to article page ── */

function attachSaveBtnToArticle() {
    const content = document.getElementById("article-content");
    if (!content) return;
    // avoid duplicates
    if (document.querySelector(".save-btn--article")) return;

    const params = new URLSearchParams(window.location.search);
    const articleId = Number(params.get("id"));
    if (!articleId) return;

    const btn = buildSaveBtn(articleId);
    btn.classList.add("save-btn--article");
    applySaveState(btn, isArticleSaved(articleId));

    // Place save button inside the article header actions group
    const actions = document.querySelector(".article-header-actions");
    if (actions) {
        actions.insertBefore(btn, actions.firstChild);
    } else {
        // fallback: floating wrap before content
        const wrap = document.createElement("div");
        wrap.className = "article-save-wrap";
        wrap.appendChild(btn);
        content.parentNode.insertBefore(wrap, content);
    }
}

/* ── expose a hook so viewall.js can call after render ── */
window.attachSaveBtnsToCards = attachSaveBtnsToCards;

/* ── init on article page ── */
if (document.getElementById("article-content")) {
    // If article.js already populated the title (e.g. from cache), run immediately
    const existingTitle = document.getElementById("article-title");
    if (existingTitle && existingTitle.textContent.trim()) {
        attachSaveBtnToArticle();
    } else {
        const obs = new MutationObserver((_, observer) => {
            const title = document.getElementById("article-title");
            if (title && title.textContent.trim()) {
                observer.disconnect();
                attachSaveBtnToArticle();
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }
}
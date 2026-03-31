/*
----------------------
Saved Articles Page
----------------------
*/

const listRoot   = document.getElementById("articles-list");
const emptyEl    = document.getElementById("saved-empty");
const loginEl    = document.getElementById("saved-login");

// reuse article loading helpers from viewall.js pattern
async function loadArticles() {
    const candidates = [
        "data/articles.json",
        "/data/articles.json",
        "../data/articles.json"
    ];
    for (const url of candidates) {
        try {
            const res = await fetch(url, { cache: "no-cache" });
            if (!res.ok) continue;
            const ct = res.headers.get("content-type") || "";
            if (!ct.includes("application/json")) continue;
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch { /* try next */ }
    }
    return [];
}

function normalizeAssetPath(path) {
    if (!path) return "";
    return path
        .replace(/^\/?student_magazine\//, "")
        .replace(/^(\.\.\/)+student_magazine\//, "")
        .replace(/^(\.\.\/)+/, "");
}

function getArticleImage(article) {
    const s = Array.isArray(article.sections)
        ? article.sections.find((s) => s.type === "image") : null;
    return s ? normalizeAssetPath(s.src) : "";
}

function getArticleExcerpt(article) {
    const p = Array.isArray(article.sections)
        ? article.sections.find((s) => s.type === "paragraph") : null;
    if (!p || !p.text) return "";
    const t = p.text.trim();
    return t.length > 150 ? t.slice(0, 147) + "..." : t;
}

function renderSaved(articles, savedIds) {
    const saved = articles.filter((a) => savedIds.includes(a.id));

    if (!saved.length) {
        emptyEl.removeAttribute("hidden");
        return;
    }

    saved.forEach((article) => {
        const card = document.createElement("article");
        card.className = "article-card";

        const link = document.createElement("a");
        link.href = `article.html?id=${article.id}`;
        link.className = "card-link";
        link.dataset.cursorLabel = "Explore article";

        const img = document.createElement("img");
        img.src = getArticleImage(article);
        img.alt = article.title;

        const title = document.createElement("h3");
        title.className = "card-title";
        title.textContent = article.title;

        const excerpt = document.createElement("p");
        excerpt.className = "card-excerpt";
        excerpt.textContent = getArticleExcerpt(article);

        const readMore = document.createElement("span");
        readMore.className = "card-read-more";
        readMore.textContent = "Read More →";

        link.append(img, title, excerpt, readMore);
        card.appendChild(link);

        // save button — already unsaves since it's on the saved page
        const btn = buildSaveBtn(article.id);
        btn.classList.add("save-btn--card");
        // when unsaved on this page, remove the card
        btn.addEventListener("click", () => {
            setTimeout(() => {
                if (!isArticleSaved(article.id)) card.remove();
                if (!listRoot.querySelector(".article-card")) emptyEl.removeAttribute("hidden");
            }, 50);
        });
        card.appendChild(btn);

        listRoot.appendChild(card);
    });
}

// main init
(async () => {
    const user = getCurrentUser();

    if (!user) {
        loginEl.removeAttribute("hidden");
        return;
    }

    const savedIds = getSavedIds();
    if (!savedIds.length) {
        emptyEl.removeAttribute("hidden");
        return;
    }

    const articles = await loadArticles();
    renderSaved(articles, savedIds);
})();
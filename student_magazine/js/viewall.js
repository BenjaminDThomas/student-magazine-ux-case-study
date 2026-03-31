/*
----------------------
View All Articles
----------------------

AI provenance:
- This module was generated and iteratively refined with GitHub Copilot.

Prompt-engineering summary:
1. Build a full "View All" browsing experience rather than a simple static list.
2. Add category filtering to quickly narrow article discovery by topic.
3. Add keyword search with suggestions for titles, authors, and categories.
4. Keep card interactions clear and UX-focused, including readable excerpts and explicit "Read More".
5. Support global custom cursor labels (for example, "Explore article") on cards.
6. Maintain clean structure and semantics while preserving theme compatibility.
7. Store ordered article IDs in sessionStorage so article pages can navigate prev/next.
*/

const listRoot = document.querySelector("#articles-list");
const searchInput = document.querySelector("#article-search");
const categoryFilter = document.querySelector("#category-filter");
const suggestionList = document.querySelector("#article-suggestions");

let allArticles = [];

async function loadArticles() {
    const candidates = [
        "data/articles.json",
        "/data/articles.json",
        "../data/articles.json",
        "../student_magazine/data/articles.json",
        "student_magazine/data/articles.json"
    ];

    for (const url of candidates) {
        try {
            const res = await fetch(url, { cache: "no-cache" });
            if (!res.ok) {
                continue;
            }

            const contentType = res.headers.get("content-type") || "";
            if (!contentType.toLowerCase().includes("application/json")) {
                continue;
            }

            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch {
        }
    }

    return [];
}

function normalizeAssetPath(path) {
    if (!path) {
        return "";
    }

    return path
        .replace(/^\/?student_magazine\//, "")
        .replace(/^(\.\.\/)+student_magazine\//, "")
        .replace(/^(\.\.\/)+/, "");
}

function getArticleImage(article) {
    const imageSection = Array.isArray(article.sections)
        ? article.sections.find((s) => s.type === "image")
        : null;
    return imageSection ? normalizeAssetPath(imageSection.src) : "";
}

function getArticleExcerpt(article) {
    const paragraph = Array.isArray(article.sections)
        ? article.sections.find((s) => s.type === "paragraph")
        : null;
    if (!paragraph || !paragraph.text) {
        return "";
    }

    const text = paragraph.text.trim();
    return text.length > 150 ? `${text.slice(0, 147)}...` : text;
}

function populateCategories(articles) {
    if (!categoryFilter) {
        return;
    }

    const categories = [...new Set(articles.map((a) => a.category || "Other"))].sort();
    categoryFilter.innerHTML = '<option value="all">All categories</option>';

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function populateSuggestions(articles) {
    if (!suggestionList) {
        return;
    }

    suggestionList.innerHTML = "";
    const values = new Set();

    articles.forEach((article) => {
        values.add(article.title);
        values.add(article.author);
        values.add(article.category || "Other");
    });

    [...values].filter(Boolean).slice(0, 40).forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        suggestionList.appendChild(option);
    });
}

function renderArticles() {
    if (!listRoot) {
        return;
    }

    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const selectedCategory = categoryFilter ? categoryFilter.value : "all";

    const filtered = allArticles.filter((article) => {
        const category = article.category || "Other";
        if (selectedCategory !== "all" && category !== selectedCategory) {
            return false;
        }

        if (!query) {
            return true;
        }

        const searchableText = [
            article.title,
            article.author,
            category,
            getArticleExcerpt(article)
        ].join(" ").toLowerCase();

        return searchableText.includes(query);
    });

    const groups = filtered.reduce((acc, article) => {
        const key = article.category || "Other";
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(article);
        return acc;
    }, {});

    listRoot.innerHTML = "";

    const entries = Object.entries(groups);
    if (!entries.length) {
        listRoot.innerHTML = '<p class="viewall-empty">No articles match your search.</p>';
        return;
    }

    entries.forEach(([category, items]) => {
        const heading = document.createElement("h2");
        heading.className = "category-title";
        heading.textContent = category;
        listRoot.appendChild(heading);

        items.forEach((article) => {
            const card = document.createElement("article");
            card.className = "article-card";

            const link = document.createElement("a");
            link.href = `article.html?id=${article.id}`;
            link.className = "card-link";
            link.dataset.cursorLabel = "Explore article";

            const image = document.createElement("img");
            image.src = getArticleImage(article);
            image.alt = article.title;

            const title = document.createElement("h3");
            title.className = "card-title";
            title.textContent = article.title;

            const excerpt = document.createElement("p");
            excerpt.className = "card-excerpt";
            excerpt.textContent = getArticleExcerpt(article);

            const readMore = document.createElement("span");
            readMore.className = "card-read-more";
            readMore.textContent = "Read More \u2192";

            link.appendChild(image);
            link.appendChild(title);
            link.appendChild(excerpt);
            link.appendChild(readMore);
            card.appendChild(link);

            listRoot.appendChild(card);
        });
    });

    // store ordered article IDs for prev/next navigation on article pages
    sessionStorage.setItem("articleIds", JSON.stringify(filtered.map((a) => a.id)));

    // attach save buttons if save.js is loaded
    if (typeof window.attachSaveBtnsToCards === "function") {
        window.attachSaveBtnsToCards();
    }
}

loadArticles().then((articles) => {
    allArticles = articles;
    populateCategories(allArticles);
    populateSuggestions(allArticles);
    renderArticles();
});

if (searchInput) {
    searchInput.addEventListener("input", renderArticles);
}

if (categoryFilter) {
    categoryFilter.addEventListener("change", renderArticles);
}
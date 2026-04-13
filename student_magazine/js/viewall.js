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
const filterForm = document.querySelector("#viewall-filters-form");
const clearFiltersBtn = document.querySelector("#viewall-clear");
const suggestionsRoot = document.querySelector("#article-search-suggestions");
const resultsSummary = document.querySelector("#articles-results-summary");
const searchHint = document.querySelector("#article-search-hint");
const toolsPanel = document.querySelector(".viewall-tools");

let allArticles = [];
let appliedFilters = {
    query: "",
    category: "all"
};

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
            const res = await fetch(url);
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

function getArticleKeywords(article) {
    if (!Array.isArray(article.sections)) {
        return "";
    }

    return article.sections
        .filter((section) => section.type === "paragraph" || section.type === "subheading")
        .map((section) => section.text || "")
        .join(" ");
}

function matchesArticle(article, rawQuery) {
    const query = rawQuery.trim().toLowerCase();
    if (!query) {
        return true;
    }

    const category = article.category || "Other";
    const searchableText = [
        article.title,
        article.author,
        category,
        getArticleExcerpt(article),
        getArticleKeywords(article)
    ].join(" ").toLowerCase();

    return searchableText.includes(query);
}

function getPendingFilters() {
    return {
        query: searchInput ? searchInput.value.trim() : "",
        category: categoryFilter ? categoryFilter.value : "all"
    };
}

function hasPendingChanges() {
    const pending = getPendingFilters();
    return pending.query !== appliedFilters.query || pending.category !== appliedFilters.category;
}

function updateFilterStatus() {
    const pending = hasPendingChanges();

    if (toolsPanel) {
        toolsPanel.classList.toggle("has-pending-changes", pending);
    }

    if (!searchHint) {
        return;
    }

    searchHint.textContent = pending
        ? "Your changes are ready. Click Apply filters to update the list."
        : "Search by title, author, category, or a keyword from the article. Click Apply filters to update the list.";
}

function updateResultsSummary(filteredCount) {
    if (!resultsSummary) {
        return;
    }

    const queryPart = appliedFilters.query
        ? ` for \"${appliedFilters.query}\"`
        : "";
    const categoryPart = appliedFilters.category !== "all"
        ? ` in ${appliedFilters.category}`
        : " across all categories";

    resultsSummary.textContent = `Showing ${filteredCount} article${filteredCount === 1 ? "" : "s"}${queryPart}${categoryPart}.`;
}

function hideSuggestions() {
    if (suggestionsRoot) {
        suggestionsRoot.hidden = true;
    }
}

function renderSuggestions() {
    if (!suggestionsRoot || !searchInput) {
        return;
    }

    const query = searchInput.value.trim();
    suggestionsRoot.innerHTML = "";
    suggestionsRoot.hidden = false;

    if (!query) {
        hideSuggestions();
        return;
    }

    if (query.length < 2) {
        suggestionsRoot.innerHTML = '<p class="viewall-suggestions-empty">Type at least 2 characters to preview matching articles.</p>';
        return;
    }

    const matches = allArticles.filter((article) => matchesArticle(article, query)).slice(0, 4);

    if (!matches.length) {
        suggestionsRoot.innerHTML = '<p class="viewall-suggestions-empty">No article previews match that search yet.</p>';
        return;
    }

    matches.forEach((article) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "viewall-suggestion-card";
        button.dataset.suggestionValue = article.title;
        button.setAttribute("aria-label", `Use ${article.title} as the search term`);

        const image = document.createElement("img");
        image.className = "viewall-suggestion-image";
        image.src = getArticleImage(article);
        image.alt = article.title;
        image.loading = "lazy";
        image.decoding = "async";
        image.width = 72;
        image.height = 72;

        const content = document.createElement("span");
        content.className = "viewall-suggestion-copy";

        const meta = document.createElement("span");
        meta.className = "viewall-suggestion-meta";
        meta.textContent = `${article.author} • ${article.category || "Other"}`;

        const title = document.createElement("span");
        title.className = "viewall-suggestion-title";
        title.textContent = article.title;

        const excerpt = document.createElement("span");
        excerpt.className = "viewall-suggestion-excerpt";
        excerpt.textContent = getArticleExcerpt(article);

        content.appendChild(meta);
        content.appendChild(title);
        content.appendChild(excerpt);
        button.appendChild(image);
        button.appendChild(content);
        suggestionsRoot.appendChild(button);
    });
}

function applyFilters() {
    appliedFilters = getPendingFilters();
    renderArticles();
    updateFilterStatus();
    hideSuggestions();
}

function clearFilters() {
    if (searchInput) {
        searchInput.value = "";
    }

    if (categoryFilter) {
        categoryFilter.value = "all";
    }

    appliedFilters = {
        query: "",
        category: "all"
    };

    renderArticles();
    updateFilterStatus();
    hideSuggestions();
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

function renderArticles() {
    if (!listRoot) {
        return;
    }

    const query = appliedFilters.query;
    const selectedCategory = appliedFilters.category;

    const filtered = allArticles.filter((article) => {
        const category = article.category || "Other";
        if (selectedCategory !== "all" && category !== selectedCategory) {
            return false;
        }

        return matchesArticle(article, query);
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
        updateResultsSummary(0);
        return;
    }

    let firstImage = true;

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
            image.loading = firstImage ? "eager" : "lazy";
            image.decoding = "async";
            image.sizes = "(max-width: 768px) 92vw, 44vw";
            if (firstImage) {
                image.fetchPriority = "high";
                firstImage = false;
            } else {
                image.fetchPriority = "low";
            }

            const title = document.createElement("h3");
            title.className = "card-title";
            title.textContent = article.title;

            const meta = document.createElement("p");
            meta.className = "card-meta";
            meta.textContent = `${article.author} • ${article.category || "Other"}`;

            const excerpt = document.createElement("p");
            excerpt.className = "card-excerpt";
            excerpt.textContent = getArticleExcerpt(article);

            const readMore = document.createElement("span");
            readMore.className = "card-read-more";
            readMore.textContent = "Read More \u2192";

            link.appendChild(image);
            link.appendChild(title);
            link.appendChild(meta);
            link.appendChild(excerpt);
            link.appendChild(readMore);
            card.appendChild(link);

            listRoot.appendChild(card);
        });
    });

    // store ordered article IDs for prev/next navigation on article pages
    sessionStorage.setItem("articleIds", JSON.stringify(filtered.map((a) => a.id)));
    updateResultsSummary(filtered.length);

    // attach save buttons if save.js is loaded
    if (typeof window.attachSaveBtnsToCards === "function") {
        window.attachSaveBtnsToCards();
    }
}

loadArticles().then((articles) => {
    allArticles = articles;
    populateCategories(allArticles);
    updateFilterStatus();
    renderArticles();
});

if (filterForm) {
    filterForm.addEventListener("submit", (event) => {
        event.preventDefault();
        applyFilters();
    });
}

if (searchInput) {
    searchInput.addEventListener("focus", renderSuggestions);
    searchInput.addEventListener("input", () => {
        renderSuggestions();
        updateFilterStatus();
    });
    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            hideSuggestions();
        }
    });
}

if (categoryFilter) {
    categoryFilter.addEventListener("change", updateFilterStatus);
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearFilters);
}

if (suggestionsRoot) {
    suggestionsRoot.addEventListener("click", (event) => {
        const suggestion = event.target.closest("[data-suggestion-value]");
        if (!suggestion || !searchInput) {
            return;
        }

        searchInput.value = suggestion.dataset.suggestionValue || "";
        updateFilterStatus();
        hideSuggestions();
        searchInput.focus();
    });
}

document.addEventListener("pointerdown", (event) => {
    if (!suggestionsRoot || suggestionsRoot.hidden) {
        return;
    }

    if (event.target.closest(".viewall-search-shell")) {
        return;
    }

    hideSuggestions();
});

document.addEventListener("click", (event) => {
    if (!filterForm || !filterForm.contains(event.target)) {
        hideSuggestions();
    }
});

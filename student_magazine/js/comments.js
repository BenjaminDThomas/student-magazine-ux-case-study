/*
----------------------
Article Comments & Navigation
----------------------
*/

/* ── helpers ── */

// returns current article id from URL
function getArticleId() {
    return Number(new URLSearchParams(window.location.search).get("id")) || null;
}

// returns current user or null
function getUser() {
    try { return JSON.parse(localStorage.getItem("currentUser")) || null; } catch { return null; }
}

// loads all article ids — from sessionStorage if available, else fetches JSON
async function getAllArticleIds() {
    try {
        const cached = JSON.parse(sessionStorage.getItem("articleIds"));
        if (cached && cached.length) return cached;
    } catch { /* fall through */ }

    // fallback — fetch articles directly
    const candidates = ["data/articles.json", "/data/articles.json", "../data/articles.json"];
    for (const url of candidates) {
        try {
            const res = await fetch(url, { cache: "no-cache" });
            if (!res.ok) continue;
            const data = await res.json();
            if (Array.isArray(data)) return data.map((a) => a.id);
        } catch { /* try next */ }
    }
    return [];
}

/* ── preloaded comments per article ── */

const PRELOADED = {
    1: [
        { name: "Steve",  rating: 4, text: "Really useful, this helped a lot." },
        { name: "Scott",  rating: 3, text: "This article was interesting however not relevant for me." },
        { name: "Rachel", rating: 5, text: "Exactly what I needed to read, very well written." }
    ],
    2: [
        { name: "Jamie",  rating: 5, text: "Great overview of the support available on campus." },
        { name: "Priya",  rating: 4, text: "Helpful — wish I had found this earlier in the year." }
    ],
    3: [
        { name: "Marcus", rating: 5, text: "Welcome Weekend was honestly the highlight of my first week." },
        { name: "Chloe",  rating: 4, text: "Good tips, the map of campus was a lifesaver!" }
    ],
    4: [
        { name: "Tom",    rating: 3, text: "Loads of events but hard to know which ones are worth going to." },
        { name: "Yusra",  rating: 5, text: "The societies section was super helpful, joined two already." }
    ],
    5: [
        { name: "Dev",    rating: 5, text: "Computing society is brilliant — met some great people there." },
        { name: "Amara",  rating: 4, text: "Would love more detail on the workshops but overall a good read." }
    ],
    6: [
        { name: "Liam",   rating: 4, text: "Didn't know about UNiDAYS until this, saving money already!" },
        { name: "Naomi",  rating: 5, text: "Great article, student offers have made a real difference." }
    ],
    7: [
        { name: "Ellie",  rating: 5, text: "The jobs fair was so much better than I expected." },
        { name: "Owen",   rating: 3, text: "Useful but could do with more specific career pathway advice." }
    ]
};

/* ── star SVG builder ── */

function buildStars(rating) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
        html += `<span class="comment-star${i <= rating ? " filled" : ""}" aria-hidden="true">★</span>`;
    }
    return html;
}

/* ── render a single comment card ── */

function buildCommentCard(comment, editable, articleId, index) {
    const card = document.createElement("div");
    card.className = "comment-card";

    // use stored avatar if the comment belongs to current user
    let avatarHtml = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>`;
    if (editable) {
        const user = getUser();
        const av = user ? (localStorage.getItem("userAvatar_" + user.email) || null) : null;
        if (av) avatarHtml = `<img src="${av}" alt="Your photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }

    card.innerHTML = `
        <div class="comment-meta">
            <div class="comment-avatar" aria-hidden="true">${avatarHtml}</div>
            <div class="comment-identity">
                <span class="comment-name">${comment.name}</span>
                <span class="comment-stars" aria-label="${comment.rating} out of 5 stars">${buildStars(comment.rating)}</span>
            </div>
        </div>
        <div class="comment-divider" aria-hidden="true"></div>
        <div class="comment-body-wrap">
            <p class="comment-text">${comment.text}</p>
            ${editable ? `<div class="comment-actions">
                <button type="button" class="comment-action-btn" data-action="edit">Edit</button>
                <button type="button" class="comment-action-btn comment-action-btn--delete" data-action="delete">Delete</button>
            </div>` : ""}
        </div>
    `;

    if (editable) {
        card.querySelector('[data-action="edit"]').addEventListener("click", () => {
            const newText = window.prompt("Edit your comment:", comment.text);
            if (!newText || !newText.trim()) return;
            const comments = getUserComments(articleId);
            if (comments[index]) {
                comments[index].text = newText.trim();
                localStorage.setItem("comments_" + articleId, JSON.stringify(comments));
                card.querySelector(".comment-text").textContent = newText.trim();
            }
        });

        card.querySelector('[data-action="delete"]').addEventListener("click", () => {
            if (!window.confirm("Delete your comment?")) return;
            const comments = getUserComments(articleId);
            comments.splice(index, 1);
            localStorage.setItem("comments_" + articleId, JSON.stringify(comments));
            card.remove();
        });
    }

    return card;
}

/* ── load user-added comments from localStorage ── */

function getUserComments(articleId) {
    try { return JSON.parse(localStorage.getItem("comments_" + articleId)) || []; } catch { return []; }
}

function saveUserComment(articleId, comment) {
    const existing = getUserComments(articleId);
    existing.push(comment);
    localStorage.setItem("comments_" + articleId, JSON.stringify(existing));
}

/* ── interactive star rating picker ── */

function buildRatingPicker(onSelect) {
    const wrap = document.createElement("div");
    wrap.className = "rating-picker";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Rate this article");

    let selected = 0;

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("button");
        star.type = "button";
        star.className = "rating-star";
        star.textContent = "★";
        star.setAttribute("aria-label", `${i} star${i > 1 ? "s" : ""}`);
        star.dataset.value = i;

        star.addEventListener("mouseenter", () => {
            wrap.querySelectorAll(".rating-star").forEach((s, idx) => {
                s.classList.toggle("hovered", idx < i);
            });
        });
        star.addEventListener("mouseleave", () => {
            wrap.querySelectorAll(".rating-star").forEach((s, idx) => {
                s.classList.toggle("hovered", false);
                s.classList.toggle("selected", idx < selected);
            });
        });
        star.addEventListener("click", () => {
            selected = i;
            wrap.querySelectorAll(".rating-star").forEach((s, idx) => {
                s.classList.toggle("selected", idx < selected);
            });
            onSelect(selected);
        });

        wrap.appendChild(star);
    }
    return wrap;
}

/* ── build the add comment form ── */

function buildCommentForm(articleId, listEl) {
    const user = getUser();

    const wrap = document.createElement("div");
    wrap.className = "comment-add-wrap";

    if (!user) {
        // prompt to sign in
        const prompt = document.createElement("p");
        prompt.className = "comment-login-prompt";
        prompt.innerHTML = `<a href="login.html?returnTo=${encodeURIComponent(window.location.href)}" data-cursor-label="Sign in">Sign in</a> to leave a comment.`;
        wrap.appendChild(prompt);
        return wrap;
    }

    let chosenRating = 0;

    const heading = document.createElement("h3");
    heading.className = "comment-form-heading";
    heading.textContent = "Leave a comment";

    const ratingLabel = document.createElement("p");
    ratingLabel.className = "comment-form-label";
    ratingLabel.textContent = "Your rating";

    const ratingPicker = buildRatingPicker((r) => { chosenRating = r; });

    const textLabel = document.createElement("p");
    textLabel.className = "comment-form-label";
    textLabel.textContent = "Your comment";

    const textarea = document.createElement("textarea");
    textarea.className = "comment-textarea";
    textarea.placeholder = "Share your thoughts on this article...";
    textarea.rows = 3;
    textarea.setAttribute("aria-label", "Comment text");

    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "comment-submit-btn";
    submitBtn.textContent = "Post comment";
    submitBtn.dataset.cursorLabel = "Post comment";

    const error = document.createElement("p");
    error.className = "comment-error";
    error.hidden = true;

    submitBtn.addEventListener("click", () => {
        const text = textarea.value.trim();
        if (!text) { error.textContent = "Please write a comment."; error.hidden = false; return; }
        if (!chosenRating) { error.textContent = "Please select a star rating."; error.hidden = false; return; }
        error.hidden = true;

        const comment = { name: user.email.split("@")[0], rating: chosenRating, text };
        saveUserComment(articleId, comment);

        // find new index and render as editable
        const newIndex = getUserComments(articleId).length - 1;
        const card = buildCommentCard(comment, true, articleId, newIndex);
        listEl.appendChild(card);

        textarea.value = "";
        chosenRating = 0;
        ratingPicker.querySelectorAll(".rating-star").forEach((s) => s.classList.remove("selected"));

        submitBtn.textContent = "Comment posted ✓";
        submitBtn.disabled = true;
        setTimeout(() => { submitBtn.textContent = "Post comment"; submitBtn.disabled = false; }, 2500);
    });

    wrap.append(heading, ratingLabel, ratingPicker, textLabel, textarea, error, submitBtn);
    return wrap;
}

/* ── build the full comments section ── */

function buildCommentsSection(articleId) {
    const section = document.createElement("section");
    section.className = "comments-section";
    section.setAttribute("aria-label", "Comments");

    const heading = document.createElement("h2");
    heading.className = "comments-heading";
    heading.textContent = "Comments";

    const list = document.createElement("div");
    list.className = "comments-list";

    // preloaded comments — not editable
    const preloaded = PRELOADED[articleId] || [];
    preloaded.forEach((c) => list.appendChild(buildCommentCard(c, false)));

    // user-added comments — editable by the author
    getUserComments(articleId).forEach((c, i) => list.appendChild(buildCommentCard(c, true, articleId, i)));

    const form = buildCommentForm(articleId, list);

    section.append(heading, list, form);
    return section;
}

/* ── article navigation (prev / next / back to all) ── */

function buildArticleNav(articleId, allIds) {
    const nav = document.createElement("nav");
    nav.className = "article-nav";
    nav.setAttribute("aria-label", "Article navigation");

    const idx = allIds.indexOf(articleId);

    const prevId = idx > 0 ? allIds[idx - 1] : null;
    const nextId = idx < allIds.length - 1 ? allIds[idx + 1] : null;

    const prevBtn = document.createElement("a");
    prevBtn.className = "article-nav-btn" + (prevId ? "" : " disabled");
    prevBtn.textContent = "← Previous";
    prevBtn.href = prevId ? `article.html?id=${prevId}` : "#";
    prevBtn.setAttribute("aria-disabled", String(!prevId));
    if (prevId) prevBtn.dataset.cursorLabel = "Previous article";

    const backBtn = document.createElement("a");
    backBtn.className = "article-nav-btn article-nav-btn--back";
    backBtn.href = "viewall.html";
    backBtn.textContent = "All Articles";
    backBtn.dataset.cursorLabel = "Browse all articles";

    const nextBtn = document.createElement("a");
    nextBtn.className = "article-nav-btn" + (nextId ? "" : " disabled");
    nextBtn.textContent = "Next →";
    nextBtn.href = nextId ? `article.html?id=${nextId}` : "#";
    nextBtn.setAttribute("aria-disabled", String(!nextId));
    if (nextId) nextBtn.dataset.cursorLabel = "Next article";

    nav.append(prevBtn, backBtn, nextBtn);
    nav.style.marginBottom = "60px";
    return nav;
}

/* ── inject into the article page ── */

async function injectArticleExtras() {
    const articleId = getArticleId();
    if (!articleId) return;

    const content = document.getElementById("article-content");
    const bottomLine = document.querySelector(".article-bottom-line");
    if (!content || !bottomLine) return;

    // comments
    const commentsSection = buildCommentsSection(articleId);
    bottomLine.after(commentsSection);

    // article navigation — async because may need to fetch articles.json
    const allIds = await getAllArticleIds();
    if (allIds.length > 1) {
        const navEl = buildArticleNav(articleId, allIds);
        commentsSection.after(navEl);
    }

    // rename scroll-to-top button to viewall return
    const scrollBtn = document.getElementById("scrollTopBtn");
    if (scrollBtn) {
        scrollBtn.textContent = "← Back to all articles";
        scrollBtn.dataset.cursorLabel = "Back to all articles";
        scrollBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "viewall.html";
        }, { once: true });
        scrollBtn.classList.remove("visible");
    }
}

/* ── wait for article.js to finish rendering then inject ── */

const obs = new MutationObserver((_, observer) => {
    const title = document.getElementById("article-title");
    if (title && title.textContent.trim()) {
        observer.disconnect();
        // small delay to let article.js finish building all sections
        setTimeout(injectArticleExtras, 80);
    }
});

if (document.getElementById("article-content")) {
    obs.observe(document.body, { childList: true, subtree: true });
}
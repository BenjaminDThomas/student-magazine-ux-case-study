/*
----------------------
Homepage Featured Carousel
----------------------

AI provenance:
- This module was generated and iteratively refined with GitHub Copilot.

Prompt-engineering summary:
1. Implement smooth, non-jarring slide transitions so cards glide between stories instead of visually swapping.
2. Ensure continuous looping behaviour with no flash/flicker at first/last boundaries.
3. Autoplay only when the carousel is in view, with a visible progress indicator.
4. Preserve interactive affordances including contextual cursor labels and touch swipes.
5. Keep adjacent cards partially visible on desktop, with a clearly centered active card.
6. Improve mobile readability and spacing, including non-overlapping actions.
7. Add article preview text from source JSON and pair with a clear Read More cue.
8. Handle edge cases from pre-rounded source images so card clipping remains visually clean.
9. Extract carousel-specific behavior into a dedicated script for maintainability.
*/

(() => {
    // Guard: only initialise on pages that include the featured carousel section.
    const carouselRoot = document.querySelector("#featured-carousel");

    if (!carouselRoot) {
        return;
    }

    // Core carousel elements and timing configuration.
    const track = carouselRoot.querySelector(".carousel-track");
    const progressBar = carouselRoot.querySelector("#carousel-progress");
    const dotsContainer = carouselRoot.querySelector("#carousel-dots");
    const visibilityThreshold = 0.2;
    const cycleDuration = 7000;
    const TRANSITION_MS = 550;

    // Touch coordinates for swipe gesture detection.
    let touchStartX = 0;
    let touchStartY = 0;

    // Contextual cursor chip that follows pointer over the carousel.
    const cursorLabel = document.createElement("div");
    cursorLabel.id = "carousel-cursor";
    document.body.appendChild(cursorLabel);

    carouselRoot.addEventListener("mousemove", (e) => {
        cursorLabel.style.left = e.clientX + "px";
        cursorLabel.style.top = e.clientY + "px";
    });

    function showCursorLabel(text) {
        cursorLabel.textContent = text;
        cursorLabel.classList.add("visible");
    }

    function hideCursorLabel() {
        cursorLabel.classList.remove("visible");
    }

    let articles = [];
    let slides = [];
    // Track index starts at 2 because we prepend two clone slides for seamless looping.
    let trackIndex = 2;
    let cycleStart = 0;
    let elapsedBeforePause = 0;
    let rafId = null;
    let isTransitioning = false;
    let pendingDirection = 0;
    let isCarouselVisible = false;

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
                const response = await fetch(url);
                if (!response.ok) {
                    continue;
                }

                const contentType = response.headers.get("content-type") || "";
                if (!contentType.toLowerCase().includes("application/json")) {
                    continue;
                }

                const data = await response.json();
                return Array.isArray(data) ? data : [];
            } catch {
                // Try the next candidate path.
            }
        }

        return [];
    }

    function getRealIndex() {
        // Map current track index (with clones) to the real article index.
        return ((trackIndex - 2) + articles.length) % articles.length;
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
        // Prefer first image section; use a fallback if article data is incomplete.
        const sections = Array.isArray(article.sections) ? article.sections : [];
        const imageSection = sections.find((section) => section.type === "image");
        return imageSection ? normalizeAssetPath(imageSection.src) : "images/light_mode_background.webp";
    }

    function getArticleImageSm(article) {
        // Return the 400-wide WebP variant for use in srcset on mobile.
        return getArticleImage(article).replace(/\.webp$/, "_sm.webp");
    }

    function getArticleExcerpt(article, maxLen) {
        // Use first paragraph as preview text and trim to a safe word boundary.
        const sections = Array.isArray(article.sections) ? article.sections : [];
        const para = sections.find((s) => s.type === "paragraph");
        if (!para || !para.text) {
            return "";
        }

        const text = para.text.trim();
        if (text.length <= maxLen) {
            return text;
        }

        const cutAt = text.lastIndexOf(" ", maxLen);
        const safeCut = cutAt > 0 ? cutAt : maxLen;
        return text.slice(0, safeCut) + "\u2026";
    }

    function getSlideRole(slideIndex) {
        // Only adjacent slides are marked as near; everything else is far.
        if (slideIndex === trackIndex) {
            return "active";
        }

        if (slideIndex === trackIndex - 1) {
            return "prev";
        }

        if (slideIndex === trackIndex + 1) {
            return "next";
        }

        return "far";
    }

    function createSlideElement(article, articleIndex) {
        // Each slide is fully clickable, with a separate View All call-to-action.
        const li = document.createElement("li");
        li.className = "carousel-slide";
        li.dataset.articleIndex = String(articleIndex);

        const destination = `article.html?id=${article.id}`;
        const excerpt = getArticleExcerpt(article, 120);
        li.innerHTML = `
            <a class="slide-card-link" href="${destination}">
                <img src="${getArticleImage(article)}"
                     srcset="${getArticleImageSm(article)} 400w, ${getArticleImage(article)} 828w"
                     sizes="(max-width: 768px) 400px, 828px"
                     width="828" height="627"
                     alt="${article.title}" loading="lazy" decoding="async">
                <span class="slide-overlay">
                    <span class="slide-title">${article.title}</span>
                    ${excerpt ? `<span class="slide-excerpt">${excerpt}</span>` : ""}
                    <span class="carousel-read-more">Read More &rarr;</span>
                </span>
            </a>
            <a class="overlay-view-all" href="viewall.html">View All &rarr;</a>
        `;

        li.addEventListener("click", (event) => {
            // Clicking side cards navigates carousel instead of opening the article.
            const link = event.target.closest(".slide-card-link");
            if (!link) {
                return;
            }

            const role = getSlideRole(slides.indexOf(li));
            if (role === "prev") {
                event.preventDefault();
                goTo(-1);
            } else if (role === "next") {
                event.preventDefault();
                goTo(1);
            }
        });

        li.addEventListener("mouseenter", () => {
            // Cursor labels communicate available action based on slide position.
            const role = getSlideRole(slides.indexOf(li));
            if (role === "active") {
                showCursorLabel("Explore article");
            } else if (role === "prev") {
                showCursorLabel("\u2190 Previous article");
            } else if (role === "next") {
                showCursorLabel("Next article \u2192");
            }
        });

        li.addEventListener("mouseleave", hideCursorLabel);

        li.addEventListener("mouseover", (event) => {
            if (event.target.closest(".overlay-view-all")) {
                showCursorLabel("View all articles \u2192");
            }
        });

        li.addEventListener("mouseout", (event) => {
            if (!event.target.closest(".overlay-view-all")) {
                return;
            }

            const role = getSlideRole(slides.indexOf(li));
            if (role === "active") {
                showCursorLabel("Explore article");
            } else {
                hideCursorLabel();
            }
        });

        return li;
    }

    function buildTrack() {
        // Build infinite track: [clone(n-2), clone(n-1), real..., clone(0), clone(1)].
        track.innerHTML = "";
        slides = [];
        const n = articles.length;

        [n - 2, n - 1].forEach((idx) => {
            // Leading clones support smooth previous transition from first real slide.
            const clone = createSlideElement(articles[(idx + n) % n], (idx + n) % n);
            clone.classList.add("is-clone");
            slides.push(clone);
            track.appendChild(clone);
        });

        articles.forEach((article, i) => {
            const li = createSlideElement(article, i);
            slides.push(li);
            track.appendChild(li);
        });

        [0, 1].forEach((idx) => {
            // Trailing clones support smooth next transition from last real slide.
            const clone = createSlideElement(articles[idx % n], idx % n);
            clone.classList.add("is-clone");
            slides.push(clone);
            track.appendChild(clone);
        });

        trackIndex = 2;
        centerOnSlide(trackIndex, false);
        updateActiveStates();
        renderDots();
    }

    function centerOnSlide(idx, animate) {
        // Translate track so selected slide's centre aligns with shell centre.
        const shell = track.parentElement;
        if (!shell || !slides.length) {
            return;
        }

        const containerW = shell.offsetWidth;
        const gap = parseFloat(getComputedStyle(track).gap) || 24;
        const slideW = slides[idx].offsetWidth;
        const offset = slides.slice(0, idx).reduce((sum, s) => sum + s.offsetWidth + gap, 0);
        const x = (containerW / 2) - (slideW / 2) - offset;

        track.style.transition = animate
            ? `transform ${TRANSITION_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
            : "none";
        track.style.transform = `translateX(${x}px)`;

        if (!animate) {
            // Force layout flush so transition state changes apply immediately.
            void track.offsetWidth;
        }
    }

    function updateActiveStates() {
        // Update semantic slide state classes and image loading priority.
        slides.forEach((li, i) => {
            const role = getSlideRole(i);
            li.classList.remove("active", "near");

            if (role === "active") {
                li.classList.add("active");
            } else if (role === "prev" || role === "next") {
                li.classList.add("near");
            }

            const img = li.querySelector("img");
            if (img) {
                // Favour active image for perceived performance.
                img.loading = role === "active" ? "eager" : "lazy";
                img.fetchPriority = role === "active" ? "high" : "low";
            }
        });
    }

    function goTo(direction) {
        // Ignore empty requests and queue input while a transition is running.
        if (!direction) {
            return;
        }

        if (isTransitioning) {
            pendingDirection = direction;
            return;
        }

        isTransitioning = true;
        trackIndex += direction;
        centerOnSlide(trackIndex, true);
        updateActiveStates();
        restartCycle();

        setTimeout(() => {
            const n = articles.length;
            // If we landed on boundary clones, jump back to equivalent real slide.
            const needsReset = trackIndex <= 1 || trackIndex >= n + 2;

            if (needsReset) {
                // Disable transitions during reset to avoid visible flash/flicker.
                slides.forEach((s) => {
                    s.style.transition = "none";
                });
                track.style.transition = "none";
                void track.offsetWidth;

                trackIndex = trackIndex <= 1 ? trackIndex + n : trackIndex - n;
                centerOnSlide(trackIndex, false);
                updateActiveStates();

                void track.offsetWidth;

                slides.forEach((s) => {
                    s.style.transition = "";
                });
                track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
            }

            isTransitioning = false;
            renderDots();

            if (pendingDirection) {
                // Replay one queued input after transition settles.
                const queued = pendingDirection;
                pendingDirection = 0;
                goTo(queued);
            }
        }, TRANSITION_MS + 30);
    }

    function renderDots() {
        // Recreate dots each update to reflect active index and keep bindings simple.
        if (!dotsContainer || !articles.length) {
            return;
        }

        const realIdx = getRealIndex();
        dotsContainer.innerHTML = "";
        articles.forEach((_, i) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "carousel-dot" + (i === realIdx ? " active" : "");
            dot.title = `Story ${i + 1} of ${articles.length}`;
            dot.setAttribute("aria-label", `Go to story ${i + 1}`);
            dot.style.minWidth = "28px";
            dot.style.minHeight = "28px";
            dot.style.margin = "2px";
            dot.addEventListener("click", () => {
                // Jump directly to selected real slide index (+2 offset for leading clones).
                if (i === realIdx || isTransitioning) {
                    return;
                }

                trackIndex = i + 2;
                centerOnSlide(trackIndex, true);
                updateActiveStates();
                restartCycle();

                setTimeout(() => {
                    renderDots();
                }, TRANSITION_MS + 30);
            });
            dotsContainer.appendChild(dot);
        });
    }

    function tick(now) {
        // RAF-driven autoplay timer; pauses itself when carousel is not eligible.
        if (!progressBar || !isCarouselVisible || document.hidden) {
            rafId = null;
            return;
        }

        const elapsed = elapsedBeforePause + (now - cycleStart);
        const progress = Math.min((elapsed / cycleDuration) * 100, 100);
        progressBar.value = progress;

        if (elapsed >= cycleDuration) {
            elapsedBeforePause = 0;
            goTo(1);
            return;
        }

        rafId = window.requestAnimationFrame(tick);
    }

    function startCycle() {
        // Start timer only when there are slides and carousel is visible.
        if (rafId || !articles.length || !isCarouselVisible || document.hidden) {
            return;
        }

        cycleStart = performance.now();
        rafId = window.requestAnimationFrame(tick);
    }

    function pauseCycle() {
        // Preserve elapsed time so autoplay resumes smoothly.
        if (!rafId) {
            return;
        }

        window.cancelAnimationFrame(rafId);
        rafId = null;
        elapsedBeforePause = Math.min(elapsedBeforePause + (performance.now() - cycleStart), cycleDuration);
    }

    function restartCycle() {
        // Reset progress after any manual or automatic navigation.
        elapsedBeforePause = 0;
        if (progressBar) {
            progressBar.value = 0;
        }

        if (rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
        }

        startCycle();
    }

    function setupVisibilityObserver() {
        // Fallback visibility check for environments without IntersectionObserver.
        const setVisibilityFromViewport = () => {
            const rect = carouselRoot.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            const visiblePixels = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
            const visibleRatio = visiblePixels / Math.max(rect.height, 1);
            isCarouselVisible = visibleRatio >= visibilityThreshold;
        };

        setVisibilityFromViewport();

        if (!("IntersectionObserver" in window)) {
            setVisibilityFromViewport();
            startCycle();
            return;
        }

        const sectionObserver = new IntersectionObserver((entries) => {
            const [entry] = entries;
            // Carousel animates only while meaningfully visible.
            isCarouselVisible = entry.isIntersecting && entry.intersectionRatio >= visibilityThreshold;

            if (isCarouselVisible) {
                startCycle();
            } else {
                pauseCycle();
            }
        }, {
            root: null,
            threshold: [0, visibilityThreshold, 0.5, 0.75]
        });

        sectionObserver.observe(carouselRoot);
    }

    carouselRoot.addEventListener("touchstart", (e) => {
        // Capture starting touch point for horizontal swipe detection.
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    carouselRoot.addEventListener("touchend", (e) => {
        // Trigger slide movement on strong horizontal swipe.
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) {
            goTo(dx < 0 ? 1 : -1);
        }
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
        // Suspend animation work in background tabs.
        if (document.hidden) {
            pauseCycle();
            return;
        }

        startCycle();
    });

    loadArticles()
        .then((data) => {
            // Require at least 3 stories so side previews remain meaningful.
            articles = Array.isArray(data) ? data.slice(0, Math.max(data.length, 3)) : [];

            if (!articles.length) {
                return;
            }

            buildTrack();
            setupVisibilityObserver();

            if (isCarouselVisible) {
                restartCycle();
            }

            window.addEventListener("resize", () => {
                // Keep active card centred after layout changes.
                centerOnSlide(trackIndex, false);
            });
        })
        .catch(() => {
            if (track) {
                track.innerHTML = "";
            }
        });
})();

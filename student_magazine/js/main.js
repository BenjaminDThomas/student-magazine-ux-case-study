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
    })
};

/*
----------------------
Homepage Featured Carousel
----------------------
*/

const carouselRoot = document.querySelector("#featured-carousel");

if (carouselRoot) {
    const track = carouselRoot.querySelector(".carousel-track");
    const progressBar = carouselRoot.querySelector("#carousel-progress");
    const cycleDuration = 7000;
    let touchStartX = 0;
    let touchStartY = 0;

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
    let currentIndex = 0;
    let cycleStart = performance.now();
    let rafId = null;

    function getWrapIndex(index) {
        if (!articles.length) {
            return 0;
        }

        return (index + articles.length) % articles.length;
    }

    function getArticleImage(article) {
        const imageSection = article.sections.find((section) => section.type === "image");
        return imageSection ? imageSection.src : "images/light_mode_background.png";
    }

    function createSlide(article, roleClass) {
        const li = document.createElement("li");
        li.className = `carousel-slide ${roleClass}`;

        const destination = `article.html?id=${article.id}`;
        li.dataset.articleId = String(article.id);

        li.innerHTML = `
            <a class="slide-card-link" href="${destination}">
                <img src="${getArticleImage(article)}" alt="${article.title}">
                <span class="slide-overlay">
                    <span class="slide-title">${article.title}</span>
                    <span class="carousel-read-more">Read More</span>
                </span>
            </a>
            ${roleClass === "current" ? '<a class="overlay-view-all" href="viewall.html">View All</a>' : ""}
        `;

        const cardLink = li.querySelector(".slide-card-link");
        cardLink.addEventListener("click", (event) => {
            if (!li.classList.contains("current")) {
                event.preventDefault();
                currentIndex = getWrapIndex(articles.findIndex((item) => String(item.id) === li.dataset.articleId));
                renderSlides();
                restartCycle();
            }
        });

        const cursorText = roleClass === "before"
            ? "\u2190 Previous article"
            : roleClass === "after"
                ? "Next article \u2192"
                : "Explore article";

        li.addEventListener("mouseenter", () => showCursorLabel(cursorText));
        li.addEventListener("mouseleave", hideCursorLabel);

        if (roleClass === "current") {
            const viewAllLink = li.querySelector(".overlay-view-all");
            if (viewAllLink) {
                viewAllLink.addEventListener("mouseenter", () => showCursorLabel("View all articles \u2192"));
                viewAllLink.addEventListener("mouseleave", () => showCursorLabel("Explore article"));
            }
        }

        return li;
    }

    function renderDots() {
        const dotsContainer = document.querySelector("#carousel-dots");
        if (!dotsContainer || !articles.length) {
            return;
        }

        dotsContainer.innerHTML = "";
        articles.forEach((_, i) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "carousel-dot" + (i === currentIndex ? " active" : "");
            dot.title = `Story ${i + 1} of ${articles.length}`;
            dot.addEventListener("click", () => {
                currentIndex = i;
                renderSlides();
                restartCycle();
            });
            dotsContainer.appendChild(dot);
        });
    }

    function swapSlides() {
        const prevArticle = articles[getWrapIndex(currentIndex - 1)];
        const currentArticle = articles[getWrapIndex(currentIndex)];
        const nextArticle = articles[getWrapIndex(currentIndex + 1)];

        track.innerHTML = "";
        track.appendChild(createSlide(prevArticle, "before"));
        track.appendChild(createSlide(currentArticle, "current"));
        track.appendChild(createSlide(nextArticle, "after"));
        renderDots();
    }

    function renderSlides(instant = false) {
        if (!track || !articles.length) {
            return;
        }

        if (instant) {
            swapSlides();
            return;
        }

        track.classList.add("is-transitioning");
        setTimeout(() => {
            swapSlides();
            track.offsetHeight;
            track.classList.remove("is-transitioning");
        }, 260);
    }

    function goTo(direction) {
        currentIndex = getWrapIndex(currentIndex + direction);
        renderSlides();
        restartCycle();
    }

    function tick(now) {
        if (!progressBar) {
            return;
        }

        const elapsed = now - cycleStart;
        const progress = Math.min((elapsed / cycleDuration) * 100, 100);
        progressBar.value = progress;

        if (elapsed >= cycleDuration) {
            goTo(1);
            return;
        }

        rafId = window.requestAnimationFrame(tick);
    }

    function restartCycle() {
        cycleStart = performance.now();
        if (progressBar) {
            progressBar.value = 0;
        }

        if (rafId) {
            window.cancelAnimationFrame(rafId);
        }

        rafId = window.requestAnimationFrame(tick);
    }

    carouselRoot.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    carouselRoot.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) {
            goTo(dx < 0 ? 1 : -1);
        }
    }, { passive: true });

    fetch("data/articles.json")
    .then((response) => response.json())
    .then((data) => {
        articles = data.slice(0, Math.max(data.length, 3));

        if (!articles.length) {
            return;
        }

        renderSlides(true);

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        restartCycle();
    })
    .catch(() => {
        if (track) {
            track.innerHTML = "";
        }
    });
}

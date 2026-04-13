/*
----------------------
Read URL ID
----------------------
*/

const paramater = new URLSearchParams(window.location.search);                  // read id from url
const articleId = paramater.get("id");                                          // extract id value from search

function normalizeAssetPath(path) {
  if (!path) {
    return "";
  }

  return path
    .replace(/^\/?student_magazine\//, "")
    .replace(/^(\.\.\/)+student_magazine\//, "")
    .replace(/^(\.\.\/)+/, "");
}

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

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function setupReadingProgress() {
  const bar = document.querySelector("#article-progress-bar");
  const content = document.querySelector("#article-content");
  const progressTrack = document.querySelector(".article-reading-progress");
  if (!bar || !content || !progressTrack) {
    return;
  }

  progressTrack.setAttribute("role", "slider");
  progressTrack.setAttribute("tabindex", "0");
  progressTrack.setAttribute("aria-label", "Article reading progress");
  progressTrack.setAttribute("aria-valuemin", "0");
  progressTrack.setAttribute("aria-valuemax", "100");
  progressTrack.setAttribute("title", "Click to jump to that point in the article");
  progressTrack.dataset.cursorLabel = "Jump to reading point";

  function getScrollTargetForRatio(ratio) {
    const rect = content.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const contentHeight = content.offsetHeight;
    const contentStart = window.scrollY + rect.top;
    const unclampedTarget = contentStart - viewport + ratio * (contentHeight + viewport);
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewport);
    return Math.max(0, Math.min(maxScroll, unclampedTarget));
  }

  function scrollToRatio(ratio) {
    const target = getScrollTargetForRatio(Math.max(0, Math.min(1, ratio)));
    window.scrollTo({ top: target, behavior: "smooth" });
  }

  function getRatioFromPointer(clientX, clientY) {
    const rect = progressTrack.getBoundingClientRect();
    const isHorizontal = rect.width > rect.height;

    if (isHorizontal) {
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      return rect.width ? x / rect.width : 0;
    }

    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return rect.height ? y / rect.height : 0;
  }

  const updateProgress = () => {
    const rect = content.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const total = rect.height + viewport;
    const traversed = viewport - rect.top;
    const ratio = Math.max(0, Math.min(1, traversed / Math.max(1, total)));
    bar.style.setProperty("--prog", ratio);
    progressTrack.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
    progressTrack.setAttribute("aria-valuetext", `${Math.round(ratio * 100)}% read`);
  };

  progressTrack.addEventListener("click", (event) => {
    scrollToRatio(getRatioFromPointer(event.clientX, event.clientY));
  });

  progressTrack.addEventListener("keydown", (event) => {
    const current = Number(progressTrack.getAttribute("aria-valuenow") || "0") / 100;
    let nextRatio = null;

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextRatio = current - 0.05;
    } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextRatio = current + 0.05;
    } else if (event.key === "Home") {
      nextRatio = 0;
    } else if (event.key === "End") {
      nextRatio = 1;
    }

    if (nextRatio === null) {
      return;
    }

    event.preventDefault();
    scrollToRatio(nextRatio);
  });

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
}

function buildSectionNav(contentSection) {
  const toc = document.querySelector("#article-toc");
  const tocList = document.querySelector("#article-toc-list");
  if (!toc || !tocList || !contentSection) {
    return;
  }

  const headings = contentSection.querySelectorAll("h3");
  tocList.innerHTML = "";

  if (!headings.length) {
    toc.hidden = true;
    return;
  }

  headings.forEach((heading, index) => {
    const sectionId = heading.id || `section-${index + 1}-${slugify(heading.textContent)}`;
    heading.id = sectionId;

    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${sectionId}`;
    link.textContent = heading.textContent;
    item.appendChild(link);
    tocList.appendChild(item);
  });

  toc.hidden = false;
}

/*
----------------------
Retrieve Article File
----------------------
*/

loadArticles().then(articles => {
    let article = articles.find(a => a.id == articleId);                        // loops through articles so article id matches
    if(!article){
        article = articles[0];                                                  // if no matches found, shows first article
    }

  if (!article) {
    return;
  }

    document.querySelector("#article-title").textContent = article.title;       // returns first matching element for 'article-title'
    document.querySelector("#article-author").textContent = article.author;     // returns first matching element for 'article-author'
    
    const contentSection = document.querySelector("#article-content");          // returns first matching element for 'article-content'
    contentSection.innerHTML = "";

    let imageCount = 0;                                                         // article image counter
    let firstParaDone = false;                                                  // first paragraph section end value
    
    for (let i = 0; i < article.sections.length; i++) {                         // for loop to go through the amount of sections stored
  const section = article.sections[i];

  if (section.type === "paragraph") {                                           // checks each stored article if the section has the type 'paragraph'
    const p = document.createElement("p");                                      // creates paragraph
    p.innerHTML = section.text;                                                 // lets html link tags work from json

    if (!firstParaDone) {
      firstParaDone = true;                                                     // first paragraph end of section

      const box = document.createElement("div");
      box.classList.add("intro-box");

      const inner = document.createElement("div");
      inner.classList.add("intro-box-inner");

      inner.appendChild(p);                                                     // appends content to paragraph
      box.appendChild(inner);

      box.insertAdjacentHTML(
        "beforeend",
        `<span class="corner tr">+</span><span class="corner bl">+</span>`
      );

      contentSection.appendChild(box);                                          // appends to first paragraph
    } else {
      contentSection.appendChild(p);                                            // appends to paragraph
    }
  }

  else if (section.type === "heading") {                                        // checks each stored article if the section has the type 'heading'
    const h2 = document.createElement("h2");                                    // creates heading
    h2.className = "article-category-heading";                                  // styled as an eyebrow label
    h2.textContent = section.text;
    contentSection.appendChild(h2);                                             // appends content to heading
  }

  else if (section.type === "subheading") {                                     // checks each stored article if the section has the type 'subheading'
    const h3 = document.createElement("h3");                                    // creates subheading
    h3.textContent = section.text;
    contentSection.appendChild(h3);                                             
  }

  else if (section.type === "image") {                                          // checks each stored article if the section has the type 'image'
    imageCount++;

    if (imageCount === 1) {
      const img = document.createElement("img");                                // creates image element
      img.src = normalizeAssetPath(section.src);
      img.alt = article.title;                                                  // alt text for accessibility/SEO
      img.fetchPriority = "high";                                               // LCP priority hint
      img.loading = "eager";
      img.decoding = "async";
      img.sizes = "(max-width: 768px) 94vw, 82vw";
      img.width = 1100;                                                         // intrinsic size hint prevents layout shift
      img.height = 628;
      img.classList.add("article-banner");                                      
      contentSection.appendChild(img);                                          // appends content to image
    } else {
      const row = document.createElement("figure");                             // semantic figure: image paired with its text
      row.classList.add("media-row");
      row.classList.add((imageCount - 2) % 2 === 0 ? "left" : "right");         // keeps track of imageCount to set image either left or right

      const img = document.createElement("img");                                // creates image element
      img.src = normalizeAssetPath(section.src);
      img.alt = section.alt || "";                                              // alt text for accessibility/SEO
      img.loading = "lazy";
      img.decoding = "async";
      img.fetchPriority = "low";
      img.sizes = "(max-width: 768px) 94vw, 47vw";
      img.width = 654;                                                          // intrinsic size hints prevent layout shift
      img.height = 374;
      img.classList.add("media-img");                                           // assigns class 'media-img' to the image element

      const text = document.createElement("figcaption");
      text.classList.add("media-text");                                         // groups descriptive text alongside the image

      let consumed = 0;                                                         // tracks paragraphs consumed
      while (consumed < 2) {                                                    // loops till it has consumed 2 paragraphs or runs out
        const next = article.sections[i + 1];                                   // looks at next section
        if (!next || next.type !== "paragraph") break;                          // stops if no more sections or next isn't a paragraph

        const p2 = document.createElement("p");                                 // creates element 'p'
        p2.innerHTML = next.text;                                               // appends to 'text' element
        text.appendChild(p2);

        i++;                                                                    // increments to skip this section in main loop
        consumed++;                                                             // increments consumed counter
      }

      row.appendChild(img);                                                     // appends image to row  
      row.appendChild(text);                                                    // appends text to row
      contentSection.appendChild(row);                                          // appends row to content section
    }
    }
    buildSectionNav(contentSection);
    setupReadingProgress();
    console.log(article);                                                       // articles outputs the array of article objects (connection test)
}});
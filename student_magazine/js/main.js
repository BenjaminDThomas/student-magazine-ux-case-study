/*
----------------------
Scroll To Top Button
----------------------
*/

const btn = document.querySelector("#scrollTopBtn");                    // selects 'scrollTopBtn' class

if (btn) {                                                              // only runs if slider exists on the page
    window.addEventListener("scroll", () => {                           // checks for scrolling interaction
    btn.style.display = window.scrollY > 500 ? "block" : "none";        // button only appears after 500+ y position
    });

    btn.addEventListener("click", () => {                               // on scroll to top button click event
    window.scrollTo({ top: 0, behavior: "smooth" });                    // scrolls to top of page
    })
};

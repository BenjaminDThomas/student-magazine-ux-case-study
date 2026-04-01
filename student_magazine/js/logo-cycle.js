/*
----------------------
Logo Word Cycle
----------------------
*/

/* keeps the first letter visible at all times and rotates the full word every 3 seconds */
(() => {
    const WORDS = ["NEWS", "DISCOVER", "SOCIALISE"];
    const STEP_MS = 3000;
    const REVEAL_MS = 550;
    const HOLD_OPEN_MS = 1400;
    const COLLAPSE_MS = 550;
    const LETTER_SWITCH_PROGRESS = 0.45;

    function attachCycle(container) {
        if (!container) {
            return;
        }

        const display = document.createElement("span");
        display.className = "logo-word-display";

        const first = document.createElement("span");
        first.className = "logo-word-first";

        const rest = document.createElement("span");
        rest.className = "logo-word-rest";

        display.appendChild(first);
        display.appendChild(rest);
        container.replaceChildren(display);

        let index = 0;
        const timers = [];

        function schedule(callback, delayMs) {
            const timerId = window.setTimeout(callback, delayMs);
            timers.push(timerId);
            return timerId;
        }

        function setWord(word) {
            /* hard reset clears any residual transform from the previous word */
            rest.classList.add("is-reset");
            first.textContent = word.charAt(0);
            rest.textContent = word.slice(1);
            rest.classList.remove("is-open");
            /* force a layout flush so the reset state commits before the next animation */
            void rest.getBoundingClientRect();
            rest.classList.remove("is-reset");
        }

        function runCycle() {
            const word = WORDS[index];
            const nextIndex = (index + 1) % WORDS.length;
            const nextWord = WORDS[nextIndex];
            const collapseStartMs = REVEAL_MS + HOLD_OPEN_MS;
            /* swap the lead letter partway through the collapse for a cleaner crossfade */
            const switchDuringCollapseMs = collapseStartMs + Math.round(COLLAPSE_MS * LETTER_SWITCH_PROGRESS);

            setWord(word);

            /* wait one frame before triggering the expand so the collapsed state is painted first */
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    rest.classList.add("is-open");
                });
            });

            schedule(() => {
                rest.classList.remove("is-open");
            }, collapseStartMs);

            schedule(() => {
                first.textContent = nextWord.charAt(0);
            }, switchDuringCollapseMs);

            schedule(() => {
                index = nextIndex;
                runCycle();
            }, STEP_MS);
        }

        runCycle();
    }

    document.querySelectorAll(".logo-word-cycle, .footer-word-cycle").forEach(attachCycle);
})();
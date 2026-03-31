/*
----------------------
Early Theme Bootstrap
----------------------

Generated with GitHub Copilot.
Prompt: "Replace the inline dark-mode bootstrap with an external head-loaded
script that applies the saved theme early enough to prevent a flash of light
mode on page load."

Applies the saved theme before styles render to prevent a flash of light mode.
*/

(() => {
    try {
        if (localStorage.getItem("theme") === "dark") {
            document.documentElement.classList.add("dark-mode");
        }
    } catch {
        // Ignore storage access failures and fall back to default theme.
    }
})();
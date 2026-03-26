/*
----------------------
Dark/Light Mode Toggle
----------------------
*/

const themeToggle = document.querySelector('.theme-toggle');                // selects light/dark mode toggle
const body = document.body;                                                 // references main body

const currentTheme = localStorage.getItem('theme') || 'light';              // checks for theme 'light' and 'dark'
if (currentTheme === 'dark') {
  body.classList.add('dark-mode');                                          // changes to dark mode
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', 'true');
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {                             // user input for light/dark mode toggle
    body.classList.toggle('dark-mode');                                     // changes to dark mode
    const isDark = body.classList.contains('dark-mode');
    themeToggle.setAttribute('aria-pressed', isDark);                       // turns button into toggle
    
    const theme = isDark ? 'dark' : 'light';                                // checks if light or dark mode
    localStorage.setItem('theme', theme);                                   // saves current theme
  });
}
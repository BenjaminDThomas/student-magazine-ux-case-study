/*
----------------------
Dark/Light Mode Toggle
----------------------
*/

const themeToggle = document.querySelector('.theme-toggle');                // selects light/dark mode toggle
const root = document.documentElement;                                      // references root html element

const currentTheme = localStorage.getItem('theme') || 'light';              // checks for theme 'light' and 'dark'
if (currentTheme === 'dark') {
  root.classList.add('dark-mode');                                          // changes to dark mode
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {                             // user input for light/dark mode toggle
    root.classList.toggle('dark-mode');                                     // changes to dark mode
    const isDark = root.classList.contains('dark-mode');
    
    const theme = isDark ? 'dark' : 'light';                                // checks if light or dark mode
    localStorage.setItem('theme', theme);                                   // saves current theme
  });
}
const body = document.body;
const darkModeToggle = document.getElementById('dark-mode-toggle');
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

const stored = localStorage.getItem('colorscheme');
if (stored) {
  setTheme(stored);
} else if (body.classList.contains('colorscheme-light') || body.classList.contains('colorscheme-dark')) {
  setTheme(body.classList.contains('colorscheme-dark') ? 'dark' : 'light');
} else {
  setTheme(darkModeMediaQuery.matches ? 'dark' : 'light');
}

darkModeToggle?.addEventListener('click', () => {
  const theme = body.classList.contains('colorscheme-dark') ? 'light' : 'dark';
  setTheme(theme);
  localStorage.setItem('colorscheme', theme);
});

// only react when no stored preference:
darkModeMediaQuery.addEventListener('change', (event) => {
  if (!localStorage.getItem('colorscheme')) {
    setTheme(event.matches ? 'dark' : 'light');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.preload-transitions')?.classList.remove('preload-transitions');
});

function setTheme(theme) {
  const inverse = theme === 'dark' ? 'light' : 'dark';
  body.classList.remove('colorscheme-auto', `colorscheme-${inverse}`);
  body.classList.add(`colorscheme-${theme}`);
  document.documentElement.style.colorScheme = theme;

  document.dispatchEvent(new Event('themeChanged'));
}

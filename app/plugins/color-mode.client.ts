export default defineNuxtPlugin(() => {
  const storageKey = 'theme';
  const saved = localStorage.getItem(storageKey) as 'light' | 'dark' | null;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved ?? (prefersDark ? 'dark' : 'light');
  const root = document.documentElement;
  
  // Explicitly set the class based on theme
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  if (!saved) {
    // Keep in sync with system only if user hasn't chosen explicitly
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(storageKey)) {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    mql.addEventListener('change', onChange);
  }
});


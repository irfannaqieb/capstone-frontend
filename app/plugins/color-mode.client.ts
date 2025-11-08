export default defineNuxtPlugin(() => {
  const storageKey = 'theme';
  const saved = localStorage.getItem(storageKey) as 'light' | 'dark' | null;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved ?? (prefersDark ? 'dark' : 'light');
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');

  if (!saved) {
    // Keep in sync with system only if user hasn't chosen explicitly
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(storageKey)) {
        root.classList.toggle('dark', e.matches);
      }
    };
    mql.addEventListener('change', onChange);
  }
});


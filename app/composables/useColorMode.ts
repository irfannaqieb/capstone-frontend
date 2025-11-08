export type Theme = 'light' | 'dark';

export function useColorMode() {
  const storageKey = 'theme';
  const theme = useState<Theme>('theme', () => {
    const saved = process.client ? (localStorage.getItem(storageKey) as Theme | null) : null;
    if (saved) return saved;
    if (process.client && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  function apply(themeValue: Theme) {
    if (!process.client) return;
    const root = document.documentElement;
    root.classList.toggle('dark', themeValue === 'dark');
  }

  function setTheme(next: Theme) {
    theme.value = next;
    if (process.client) localStorage.setItem(storageKey, next);
    apply(next);
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark');
  }

  onMounted(() => apply(theme.value));

  return { theme, setTheme, toggleTheme };
}


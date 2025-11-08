export type Theme = 'light' | 'dark';

export function useColorMode() {
  const storageKey = 'theme';
  const theme = useState<Theme>('theme', () => 'light'); // Default, will be synced on mount

  function apply(themeValue: Theme) {
    if (!process.client) return;
    const root = document.documentElement;
    if (themeValue === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  function setTheme(next: Theme) {
    theme.value = next;
    if (process.client) {
      localStorage.setItem(storageKey, next);
      apply(next);
    }
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark');
  }

  // Sync with localStorage and DOM on mount
  onMounted(() => {
    const saved = localStorage.getItem(storageKey) as Theme | null;
    if (saved) {
      // User has explicitly set a preference - sync state and ensure DOM matches
      theme.value = saved;
      const root = document.documentElement;
      if (saved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      // Read from DOM (set by plugin) or system preference
      const isDark = document.documentElement.classList.contains('dark');
      theme.value = isDark ? 'dark' : 'light';
      // DOM is already set by plugin, just sync state
    }
  });

  return { theme, setTheme, toggleTheme };
}


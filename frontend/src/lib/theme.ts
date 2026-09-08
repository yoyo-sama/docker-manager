import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

function initialIsDark(): boolean {
  if (typeof document === 'undefined') return true;
  return document.documentElement.classList.contains('dark');
}

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(initialIsDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((d) => !d) };
}

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { THEME_STORAGE_KEY, ThemeContext, type Theme, type ThemePreference } from '../../hooks/useTheme'

const media = () => window.matchMedia('(prefers-color-scheme: dark)')

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage unavailable (private mode) — fall back to system */
  }
  return 'system'
}

/**
 * Light/dark theme. The choice is saved in localStorage; with no saved choice we follow the OS.
 * The inline script in index.html applies the same logic before React loads (prevents a flash).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference)
  const [systemDark, setSystemDark] = useState(() => media().matches)

  useEffect(() => {
    const mq = media()
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const theme: Theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p)
    try {
      if (p === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, p)
    } catch {
      /* ignore */
    }
  }, [])

  const api = useMemo(
    () => ({ theme, preference, setPreference, toggle: () => setPreference(theme === 'dark' ? 'light' : 'dark') }),
    [theme, preference, setPreference],
  )

  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>
}

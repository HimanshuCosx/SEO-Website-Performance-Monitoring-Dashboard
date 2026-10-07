import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'
/** 'system' = no explicit choice saved; follow the OS setting. */
export type ThemePreference = Theme | 'system'

export interface ThemeApi {
  /** The theme actually applied right now. */
  theme: Theme
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
  toggle: () => void
}

export const THEME_STORAGE_KEY = 'seo-dashboard-theme'

export const ThemeContext = createContext<ThemeApi | null>(null)

export function useTheme(): ThemeApi {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}

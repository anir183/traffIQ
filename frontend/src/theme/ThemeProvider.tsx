import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext, type Theme, type ThemeContextValue } from './context'

const STORAGE_KEY = 'traffiq-theme'

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage unavailable — fall through to system preference
  }
  return null
}

function getSystemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme())

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
    document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute('content', resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    if (getStoredTheme() !== null) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setResolvedTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = useCallback((theme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // localStorage unavailable — still apply for this session
    }
    setResolvedTheme(theme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: resolvedTheme, resolvedTheme, toggleTheme, setTheme }),
    [resolvedTheme, toggleTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
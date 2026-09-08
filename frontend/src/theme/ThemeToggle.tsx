import { Moon, Sun } from 'lucide-react'
import { useTheme } from './useTheme'

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="cursor-pointer text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
    >
      <span className="relative block h-6 w-6">
        <Sun
          size={24}
          className={`absolute inset-0 text-amber-500 transition-all duration-200 ${
            isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0'
          }`}
        />
        <Moon
          size={24}
          className={`absolute inset-0 transition-all duration-200 ${
            isDark ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
          }`}
        />
      </span>
    </button>
  )
}
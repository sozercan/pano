import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'pano:theme',
    }
  )
)

// Apply theme to document
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && systemDark)

  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// Store reference to the media query listener for cleanup
let mediaQueryCleanup: (() => void) | null = null

// Initialize theme on load
export function initializeTheme(): () => void {
  const theme = useThemeStore.getState().theme
  applyTheme(theme)

  // Clean up any existing listener
  if (mediaQueryCleanup) {
    mediaQueryCleanup()
  }

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleChange = () => {
    const currentTheme = useThemeStore.getState().theme
    if (currentTheme === 'system') {
      applyTheme('system')
    }
  }

  mediaQuery.addEventListener('change', handleChange)

  // Store cleanup function
  mediaQueryCleanup = () => {
    mediaQuery.removeEventListener('change', handleChange)
  }

  // Return cleanup function for use in useEffect
  return mediaQueryCleanup
}

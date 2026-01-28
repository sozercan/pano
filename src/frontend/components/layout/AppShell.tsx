import { useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useUIStore } from '@frontend/stores/uiStore'
import { initializeTheme } from '@frontend/stores/themeStore'
import { cn } from '@frontend/lib/cn'

export function AppShell() {
  const { sidebarCollapsed, setSearchOpen } = useUIStore()

  // Initialize theme on mount
  useEffect(() => {
    const cleanup = initializeTheme()
    return cleanup
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setSearchOpen])

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Header />
      <div className="flex">
        <Sidebar />
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 transition-all duration-300 outline-none overflow-hidden',
            sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-0'
          )}
          role="main"
          aria-label="Main content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

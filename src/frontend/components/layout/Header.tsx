import { Link } from '@tanstack/react-router'
import { Menu, Search, Moon, Sun, Monitor } from 'lucide-react'
import { useUIStore } from '@frontend/stores/uiStore'
import { useThemeStore, applyTheme, type Theme } from '@frontend/stores/themeStore'
import { cn } from '@frontend/lib/cn'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export function Header() {
  const { toggleSidebar, setSearchOpen } = useUIStore()
  const { theme, setTheme } = useThemeStore()

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4">
      <button
        onClick={toggleSidebar}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[hsl(var(--accent))] lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Link to="/" className="flex items-center gap-2 hover:opacity-80">
        <span className="text-lg font-semibold">Pano</span>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">TestGrid Viewer</span>
      </Link>

      <div className="flex-1" />

      <button
        onClick={() => setSearchOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-1.5 font-mono text-xs font-medium sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <ThemeDropdown theme={theme} onChange={handleThemeChange} />
    </header>
  )
}

function ThemeDropdown({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[hsl(var(--accent))]"
          aria-label="Toggle theme"
        >
          {theme === 'light' && <Sun className="h-5 w-5" />}
          {theme === 'dark' && <Moon className="h-5 w-5" />}
          {theme === 'system' && <Monitor className="h-5 w-5" />}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-32 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--popover))] p-1 shadow-md"
          sideOffset={5}
          align="end"
        >
          <ThemeItem icon={<Sun className="h-4 w-4" />} label="Light" selected={theme === 'light'} onClick={() => onChange('light')} />
          <ThemeItem icon={<Moon className="h-4 w-4" />} label="Dark" selected={theme === 'dark'} onClick={() => onChange('dark')} />
          <ThemeItem icon={<Monitor className="h-4 w-4" />} label="System" selected={theme === 'system'} onClick={() => onChange('system')} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function ThemeItem({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <DropdownMenu.Item
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
        'hover:bg-[hsl(var(--accent))]',
        selected && 'bg-[hsl(var(--accent))]'
      )}
      onClick={onClick}
    >
      {icon}
      {label}
    </DropdownMenu.Item>
  )
}

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@frontend/stores/uiStore'
import { useDashboardGroups, queryKeys } from '@frontend/hooks/useTestGridApi'
import { fuzzyMatch, highlightMatches } from '@frontend/hooks/useSearch'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, Folder, LayoutDashboard, FileText, X, Loader2 } from 'lucide-react'
import { cn } from '@frontend/lib/cn'

type SearchResultType = 'group' | 'dashboard' | 'tab'

interface SearchResult {
  type: SearchResultType
  name: string
  group?: string
  dashboard?: string
  score: number
  matches: Array<{ start: number; end: number }>
}

export function SearchModal() {
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery, expandGroup, expandDashboard, setFocusTarget } =
    useUIStore()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch dashboard groups
  const { data: groupsData, isLoading: groupsLoading } = useDashboardGroups()
  const groups = groupsData?.dashboard_groups ?? []

  // Build search results
  const results = useMemo(() => {
    if (!searchQuery.trim()) return []

    const matches: SearchResult[] = []
    const query = searchQuery.trim()

    // Search groups
    for (const group of groups) {
      const match = fuzzyMatch(group.name, query)
      if (match) {
        matches.push({
          type: 'group',
          name: group.name,
          score: match.score,
          matches: match.matches,
        })
      }
    }

    // Search dashboards from cache (if available)
    for (const groupName of groups.map((g) => g.name)) {
      const cachedData = queryClient.getQueryData<{
        dashboard_summaries?: Array<{ dashboard_name: string }>
      }>(queryKeys.dashboardSummariesInGroup(groupName))

      if (cachedData?.dashboard_summaries) {
        for (const dashboard of cachedData.dashboard_summaries) {
          const match = fuzzyMatch(dashboard.dashboard_name, query)
          if (match) {
            matches.push({
              type: 'dashboard',
              name: dashboard.dashboard_name,
              group: groupName,
              score: match.score,
              matches: match.matches,
            })
          }

          // Search tabs from cache for this dashboard
          const tabCachedData = queryClient.getQueryData<{
            tab_summaries?: Array<{ dashboard_tab_name: string }>
          }>(queryKeys.tabSummaries(dashboard.dashboard_name))

          if (tabCachedData?.tab_summaries) {
            for (const tab of tabCachedData.tab_summaries) {
              const tabMatch = fuzzyMatch(tab.dashboard_tab_name, query)
              if (tabMatch) {
                matches.push({
                  type: 'tab',
                  name: tab.dashboard_tab_name,
                  group: groupName,
                  dashboard: dashboard.dashboard_name,
                  score: tabMatch.score,
                  matches: tabMatch.matches,
                })
              }
            }
          }
        }
      }
    }

    // Sort by score (highest first) and limit
    return matches.sort((a, b) => b.score - a.score).slice(0, 30)
  }, [searchQuery, groups, queryClient])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Keyboard navigation
  useEffect(() => {
    if (!searchOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex])
          }
          break
        case 'Escape':
          setSearchOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, results, selectedIndex])


  const handleSelect = useCallback(
    (result: SearchResult) => {
      setSearchOpen(false)
      setSearchQuery('')

      switch (result.type) {
        case 'group':
          // Expand the group in sidebar
          expandGroup(result.name)
          setFocusTarget({ type: 'group', group: result.name })
          break
        case 'dashboard':
          // Navigate to dashboard and expand in sidebar
          if (result.group) {
            expandGroup(result.group)
          }
          setFocusTarget({ type: 'dashboard', group: result.group, dashboard: result.name })
          navigate({ to: '/dashboard/$dashboard', params: { dashboard: result.name } })
          break
        case 'tab':
          // Navigate to tab and expand in sidebar
          if (result.group) {
            expandGroup(result.group)
          }
          if (result.dashboard) {
            expandDashboard(result.dashboard)
            setFocusTarget({ type: 'tab', group: result.group, dashboard: result.dashboard, tab: result.name })
            navigate({
              to: '/dashboard/$dashboard/tab/$tab',
              params: { dashboard: result.dashboard, tab: result.name },
            })
          }
          break
      }
    },
    [setSearchOpen, setSearchQuery, expandGroup, expandDashboard, setFocusTarget, navigate]
  )

  const getIcon = (type: SearchResultType) => {
    switch (type) {
      case 'group':
        return <Folder className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
      case 'dashboard':
        return <LayoutDashboard className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
      case 'tab':
        return <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
    }
  }

  const getSubtitle = (result: SearchResult) => {
    if (result.type === 'dashboard' && result.group) {
      return `in ${result.group}`
    }
    if (result.type === 'tab' && result.dashboard) {
      return `${result.dashboard}`
    }
    return null
  }

  return (
    <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-full max-w-lg rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-lg overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))]">
            <Search className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search groups, dashboards, tabs..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded hover:bg-[hsl(var(--muted))]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Screen reader announcement for search results */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {searchQuery && !groupsLoading && (
              results.length === 0
                ? `No results found for ${searchQuery}`
                : `${results.length} result${results.length !== 1 ? 's' : ''} found`
            )}
          </div>

          <div className="max-h-80 overflow-auto">
            {groupsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--muted-foreground))]" />
              </div>
            ) : !searchQuery ? (
              <div className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                <p>Start typing to search...</p>
                <p className="mt-2 text-xs">
                  Tip: Navigate the sidebar to load more dashboards and tabs for search
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="p-2">
                {results.map((result, index) => {
                  const highlighted = highlightMatches(result.name, result.matches)

                  return (
                    <button
                      key={`${result.type}-${result.name}-${result.dashboard ?? ''}`}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors',
                        index === selectedIndex
                          ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                          : 'hover:bg-[hsl(var(--muted))]'
                      )}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {getIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">
                          {highlighted.map((part, i) => (
                            <span
                              key={i}
                              className={part.highlighted ? 'text-[hsl(var(--primary))] font-semibold' : ''}
                            >
                              {part.text}
                            </span>
                          ))}
                        </div>
                        {getSubtitle(result) && (
                          <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                            {getSubtitle(result)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] capitalize">
                        {result.type}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 px-4 py-2 border-t border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] font-mono">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] font-mono">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] font-mono">esc</kbd>
              close
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

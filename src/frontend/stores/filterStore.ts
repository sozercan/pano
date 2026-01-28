import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Filter status options
export type StatusFilter = 'all' | 'pass' | 'fail' | 'skip' | 'flaky' | 'empty'

interface FilterState {
  // Per-tab filter state (key is `${dashboard}/${tab}`)
  filters: Record<
    string,
    {
      statusFilter: StatusFilter
      textFilter: string
      showOnlyFailures: boolean
    }
  >

  // Actions
  getFilterKey: (dashboard: string, tab: string) => string
  getFilters: (dashboard: string, tab: string) => {
    statusFilter: StatusFilter
    textFilter: string
    showOnlyFailures: boolean
  }
  setStatusFilter: (dashboard: string, tab: string, status: StatusFilter) => void
  setTextFilter: (dashboard: string, tab: string, text: string) => void
  setShowOnlyFailures: (dashboard: string, tab: string, show: boolean) => void
  clearFilters: (dashboard: string, tab: string) => void
  clearAllFilters: () => void
}

const DEFAULT_FILTERS = {
  statusFilter: 'all' as StatusFilter,
  textFilter: '',
  showOnlyFailures: false,
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      filters: {},

      getFilterKey: (dashboard, tab) => `${dashboard}/${tab}`,

      getFilters: (dashboard, tab) => {
        const key = get().getFilterKey(dashboard, tab)
        return get().filters[key] ?? DEFAULT_FILTERS
      },

      setStatusFilter: (dashboard, tab, status) => {
        const key = get().getFilterKey(dashboard, tab)
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: {
              ...DEFAULT_FILTERS,
              ...state.filters[key],
              statusFilter: status,
            },
          },
        }))
      },

      setTextFilter: (dashboard, tab, text) => {
        const key = get().getFilterKey(dashboard, tab)
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: {
              ...DEFAULT_FILTERS,
              ...state.filters[key],
              textFilter: text,
            },
          },
        }))
      },

      setShowOnlyFailures: (dashboard, tab, show) => {
        const key = get().getFilterKey(dashboard, tab)
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: {
              ...DEFAULT_FILTERS,
              ...state.filters[key],
              showOnlyFailures: show,
            },
          },
        }))
      },

      clearFilters: (dashboard, tab) => {
        const key = get().getFilterKey(dashboard, tab)
        set((state) => {
          const { [key]: _, ...rest } = state.filters
          return { filters: rest }
        })
      },

      clearAllFilters: () => {
        set({ filters: {} })
      },
    }),
    {
      name: 'pano:filters',
    }
  )
)

// Selector hooks for optimized re-renders
export const useGridFilters = (dashboard: string, tab: string) =>
  useFilterStore((state) => state.getFilters(dashboard, tab))

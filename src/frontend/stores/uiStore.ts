import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FocusTarget {
  type: 'group' | 'dashboard' | 'tab'
  group?: string
  dashboard?: string
  tab?: string
}

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // Expanded groups in accordion
  expandedGroups: string[]
  toggleGroup: (groupName: string) => void
  expandGroup: (groupName: string) => void
  collapseGroup: (groupName: string) => void

  // Expanded dashboards within groups
  expandedDashboards: string[]
  toggleDashboard: (dashboardName: string) => void
  expandDashboard: (dashboardName: string) => void
  collapseDashboard: (dashboardName: string) => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void

  // Focus target for scroll-into-view after search
  focusTarget: FocusTarget | null
  setFocusTarget: (target: FocusTarget | null) => void
  clearFocusTarget: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Expanded groups
      expandedGroups: [],
      toggleGroup: (groupName) =>
        set((state) => ({
          expandedGroups: state.expandedGroups.includes(groupName)
            ? state.expandedGroups.filter((g) => g !== groupName)
            : [...state.expandedGroups, groupName],
        })),
      expandGroup: (groupName) =>
        set((state) => ({
          expandedGroups: state.expandedGroups.includes(groupName)
            ? state.expandedGroups
            : [...state.expandedGroups, groupName],
        })),
      collapseGroup: (groupName) =>
        set((state) => ({
          expandedGroups: state.expandedGroups.filter((g) => g !== groupName),
        })),

      // Expanded dashboards
      expandedDashboards: [],
      toggleDashboard: (dashboardName) =>
        set((state) => ({
          expandedDashboards: state.expandedDashboards.includes(dashboardName)
            ? state.expandedDashboards.filter((d) => d !== dashboardName)
            : [...state.expandedDashboards, dashboardName],
        })),
      expandDashboard: (dashboardName) =>
        set((state) => ({
          expandedDashboards: state.expandedDashboards.includes(dashboardName)
            ? state.expandedDashboards
            : [...state.expandedDashboards, dashboardName],
        })),
      collapseDashboard: (dashboardName) =>
        set((state) => ({
          expandedDashboards: state.expandedDashboards.filter((d) => d !== dashboardName),
        })),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),

      // Focus target
      focusTarget: null,
      setFocusTarget: (target) => set({ focusTarget: target }),
      clearFocusTarget: () => set({ focusTarget: null }),
    }),
    {
      name: 'pano:ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        expandedGroups: state.expandedGroups,
        expandedDashboards: state.expandedDashboards,
      }),
    }
  )
)

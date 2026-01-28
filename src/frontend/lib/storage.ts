import {
  SubscriptionsStorageSchema,
  NotificationSettingsSchema,
  defaultNotificationSettings,
  type SubscriptionsStorage,
  type Subscription,
  type NotificationSettings,
} from '@shared/schemas'

const STORAGE_KEYS = {
  subscriptions: 'pano:subscriptions',
  notificationSettings: 'pano:notification-settings',
  theme: 'pano:theme',
  sidebarState: 'pano:sidebar-state',
} as const

// Safe JSON parse
function safeJsonParse<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue
  try {
    return JSON.parse(value)
  } catch {
    return defaultValue
  }
}

// Subscriptions storage
export function loadSubscriptions(): Subscription[] {
  const raw = localStorage.getItem(STORAGE_KEYS.subscriptions)
  const parsed = safeJsonParse(raw, { version: 1, subscriptions: [] })
  const result = SubscriptionsStorageSchema.safeParse(parsed)
  return result.success ? result.data.subscriptions : []
}

export function saveSubscriptions(subscriptions: Subscription[]): void {
  const storage: SubscriptionsStorage = {
    version: 1,
    subscriptions,
  }
  localStorage.setItem(STORAGE_KEYS.subscriptions, JSON.stringify(storage))
}

export function exportSubscriptions(subscriptions: Subscription[]): string {
  const storage: SubscriptionsStorage = {
    version: 1,
    subscriptions,
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(storage, null, 2)
}

export function importSubscriptions(json: string): Subscription[] {
  const parsed = JSON.parse(json)
  const result = SubscriptionsStorageSchema.parse(parsed)
  return result.subscriptions
}

// Notification settings
export function loadNotificationSettings(): NotificationSettings {
  const raw = localStorage.getItem(STORAGE_KEYS.notificationSettings)
  const parsed = safeJsonParse(raw, defaultNotificationSettings)
  const result = NotificationSettingsSchema.safeParse(parsed)
  return result.success ? result.data : defaultNotificationSettings
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  localStorage.setItem(STORAGE_KEYS.notificationSettings, JSON.stringify(settings))
}

// Theme
export type Theme = 'light' | 'dark' | 'system'

export function loadTheme(): Theme {
  const raw = localStorage.getItem(STORAGE_KEYS.theme)
  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    return raw
  }
  return 'system'
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEYS.theme, theme)
}

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

// Sidebar state
export interface SidebarState {
  collapsed: boolean
  expandedGroups: string[]
}

export function loadSidebarState(): SidebarState {
  const raw = localStorage.getItem(STORAGE_KEYS.sidebarState)
  return safeJsonParse(raw, { collapsed: false, expandedGroups: [] })
}

export function saveSidebarState(state: SidebarState): void {
  localStorage.setItem(STORAGE_KEYS.sidebarState, JSON.stringify(state))
}

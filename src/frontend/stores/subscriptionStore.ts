import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type Subscription,
  type SubscriptionTarget,
  type NotificationSettings,
  generateSubscriptionId,
  defaultNotificationSettings,
} from '@shared/schemas'
import {
  exportSubscriptions,
  importSubscriptions,
  saveNotificationSettings,
} from '@frontend/lib/storage'

interface SubscriptionState {
  // Subscriptions
  subscriptions: Subscription[]

  // Actions
  subscribe: (subscription: SubscriptionTarget) => void
  unsubscribe: (id: string) => void
  unsubscribeByTarget: (subscription: SubscriptionTarget) => void
  clearAll: () => void

  // Query helpers
  isSubscribed: (subscription: SubscriptionTarget) => boolean
  getSubscription: (id: string) => Subscription | undefined
  getSubscriptionsByType: (type: Subscription['type']) => Subscription[]
  getSubscriptionsByDashboard: (dashboardName: string) => Subscription[]

  // Import/Export
  exportToJson: () => string
  importFromJson: (json: string) => { success: boolean; count: number; error?: string }

  // Notification settings
  notificationSettings: NotificationSettings
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state - will be hydrated by persist middleware
      subscriptions: [],
      notificationSettings: defaultNotificationSettings,

      // Subscribe to a dashboard/tab/test
      subscribe: (subscription) => {
        const id = generateSubscriptionId(subscription)
        const existing = get().subscriptions.find((s) => s.id === id)

        if (existing) {
          return // Already subscribed
        }

        const newSubscription: Subscription = {
          ...subscription,
          id,
          createdAt: new Date().toISOString(),
        } as Subscription

        set((state) => ({
          subscriptions: [...state.subscriptions, newSubscription],
        }))
      },

      // Unsubscribe by ID
      unsubscribe: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.id !== id),
        }))
      },

      // Unsubscribe by target (dashboard/tab/test)
      unsubscribeByTarget: (subscription) => {
        const id = generateSubscriptionId(subscription)
        get().unsubscribe(id)
      },

      // Clear all subscriptions
      clearAll: () => {
        set({ subscriptions: [] })
      },

      // Check if subscribed
      isSubscribed: (subscription) => {
        const id = generateSubscriptionId(subscription)
        return get().subscriptions.some((s) => s.id === id)
      },

      // Get subscription by ID
      getSubscription: (id) => {
        return get().subscriptions.find((s) => s.id === id)
      },

      // Get subscriptions by type
      getSubscriptionsByType: (type) => {
        return get().subscriptions.filter((s) => s.type === type)
      },

      // Get subscriptions for a dashboard
      getSubscriptionsByDashboard: (dashboardName) => {
        return get().subscriptions.filter((s) => s.dashboardName === dashboardName)
      },

      // Export to JSON
      exportToJson: () => {
        return exportSubscriptions(get().subscriptions)
      },

      // Import from JSON
      importFromJson: (json) => {
        try {
          const imported = importSubscriptions(json)

          // Merge with existing, avoiding duplicates
          const existing = get().subscriptions
          const existingIds = new Set(existing.map((s) => s.id))
          const newSubscriptions = imported.filter((s) => !existingIds.has(s.id))

          const merged = [...existing, ...newSubscriptions]
          set({ subscriptions: merged })

          return { success: true, count: newSubscriptions.length }
        } catch (error) {
          return {
            success: false,
            count: 0,
            error: error instanceof Error ? error.message : 'Invalid JSON format',
          }
        }
      },

      // Update notification settings
      updateNotificationSettings: (settings) => {
        set((state) => {
          const updated = { ...state.notificationSettings, ...settings }
          saveNotificationSettings(updated)
          return { notificationSettings: updated }
        })
      },
    }),
    {
      name: 'pano:subscription-store',
      // Only persist subscriptions and settings, not the methods
      partialize: (state) => ({
        subscriptions: state.subscriptions,
        notificationSettings: state.notificationSettings,
      }),
    }
  )
)

// Selector hooks for optimized re-renders
export const useSubscriptions = () => useSubscriptionStore((state) => state.subscriptions)
export const useSubscriptionCount = () => useSubscriptionStore((state) => state.subscriptions.length)
export const useNotificationSettings = () => useSubscriptionStore((state) => state.notificationSettings)

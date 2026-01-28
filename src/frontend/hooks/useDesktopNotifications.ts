import { useEffect, useState, useCallback } from 'react'
import { useSubscriptionStore } from '@frontend/stores/subscriptionStore'
import {
  isTauri,
  startPolling,
  stopPolling,
  setSubscriptions,
  isPolling as checkIsPolling,
  requestNotificationPermission,
  type Subscription,
} from '@frontend/lib/tauri'

interface UseDesktopNotificationsOptions {
  /** Polling interval in minutes (default: 5) */
  intervalMinutes?: number
  /** Auto-start polling when subscriptions exist (default: true) */
  autoStart?: boolean
}

interface UseDesktopNotificationsResult {
  /** Whether running in Tauri desktop environment */
  isDesktop: boolean
  /** Whether background polling is active */
  isPolling: boolean
  /** Whether notifications are permitted */
  hasPermission: boolean
  /** Start background polling */
  start: () => Promise<void>
  /** Stop background polling */
  stop: () => Promise<void>
  /** Request notification permission */
  requestPermission: () => Promise<boolean>
}

export function useDesktopNotifications(
  options: UseDesktopNotificationsOptions = {}
): UseDesktopNotificationsResult {
  const { intervalMinutes = 5, autoStart = true } = options

  const [isDesktop] = useState(() => isTauri())
  const [polling, setPolling] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)

  const subscriptions = useSubscriptionStore((state) => state.subscriptions)

  // Sync subscriptions to Tauri backend
  useEffect(() => {
    if (!isDesktop) return

    const tauriSubscriptions: Subscription[] = subscriptions.map((sub) => ({
      id: sub.id,
      subscriptionType: sub.type,
      dashboardName: sub.dashboardName,
      tabName: 'tabName' in sub ? sub.tabName : undefined,
      testName: 'testName' in sub ? sub.testName : undefined,
    }))

    setSubscriptions(tauriSubscriptions)
  }, [isDesktop, subscriptions])

  // Check initial polling status
  useEffect(() => {
    if (!isDesktop) return

    checkIsPolling().then(setPolling)
  }, [isDesktop])

  // Auto-start polling if enabled and subscriptions exist
  useEffect(() => {
    if (!isDesktop || !autoStart || subscriptions.length === 0) return

    if (!polling) {
      startPolling(intervalMinutes).then(() => setPolling(true))
    }
  }, [isDesktop, autoStart, subscriptions.length, polling, intervalMinutes])

  const start = useCallback(async () => {
    if (!isDesktop) return

    // Request permission first
    const permitted = await requestNotificationPermission()
    setHasPermission(permitted)

    if (permitted) {
      await startPolling(intervalMinutes)
      setPolling(true)
    }
  }, [isDesktop, intervalMinutes])

  const stop = useCallback(async () => {
    if (!isDesktop) return

    await stopPolling()
    setPolling(false)
  }, [isDesktop])

  const requestPermission = useCallback(async () => {
    const permitted = await requestNotificationPermission()
    setHasPermission(permitted)
    return permitted
  }, [])

  return {
    isDesktop,
    isPolling: polling,
    hasPermission,
    start,
    stop,
    requestPermission,
  }
}

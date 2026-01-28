/**
 * Tauri desktop integration utilities
 *
 * These functions provide safe wrappers around Tauri APIs that work
 * in both web and desktop contexts.
 */

// Check if running in Tauri desktop environment
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

// Types for Tauri invoke commands
export interface Subscription {
  id: string
  subscriptionType: string
  dashboardName: string
  tabName?: string
  testName?: string
}

/**
 * Start background polling for test status changes
 * @param intervalMinutes - How often to check for changes (minimum 1 minute)
 */
export async function startPolling(intervalMinutes: number = 5): Promise<void> {
  if (!isTauri()) {
    return
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('start_polling', { intervalMinutes })
  } catch {
    // Silently fail in production; error will be visible in dev tools if needed
  }
}

/**
 * Stop background polling
 */
export async function stopPolling(): Promise<void> {
  if (!isTauri()) return

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('stop_polling')
  } catch {
    // Silently fail in production
  }
}

/**
 * Update the subscriptions list for background monitoring
 */
export async function setSubscriptions(subscriptions: Subscription[]): Promise<void> {
  if (!isTauri()) return

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('set_subscriptions', { subscriptions })
  } catch {
    // Silently fail in production
  }
}

/**
 * Check if background polling is currently active
 */
export async function isPolling(): Promise<boolean> {
  if (!isTauri()) return false

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke('get_polling_status')
  } catch {
    return false
  }
}

/**
 * Request notification permission (required on some platforms)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isTauri()) {
    // For web, use the browser Notification API
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  try {
    const { isPermissionGranted, requestPermission } = await import(
      '@tauri-apps/plugin-notification'
    )
    let permissionGranted = await isPermissionGranted()
    if (!permissionGranted) {
      const permission = await requestPermission()
      permissionGranted = permission === 'granted'
    }
    return permissionGranted
  } catch {
    return false
  }
}

/**
 * Send a notification (works in both web and desktop)
 */
export async function sendNotification(title: string, body: string): Promise<void> {
  if (!isTauri()) {
    // Use browser Notification API for web
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
    return
  }

  try {
    const { sendNotification: tauriNotify } = await import('@tauri-apps/plugin-notification')
    await tauriNotify({ title, body })
  } catch {
    // Silently fail in production
  }
}

import { WifiOff, Wifi } from 'lucide-react'
import { useOnlineStatus } from '@frontend/hooks/useOnlineStatus'
import { cn } from '@frontend/lib/cn'

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus()

  // Show "back online" message briefly after reconnecting
  if (isOnline && wasOffline) {
    return (
      <div className="bg-green-600 text-white px-4 py-2 text-sm flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
        <Wifi className="h-4 w-4" />
        <span>Back online - data will refresh automatically</span>
      </div>
    )
  }

  // Show offline warning
  if (!isOnline) {
    return (
      <div className="bg-yellow-600 text-white px-4 py-2 text-sm flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
        <WifiOff className="h-4 w-4" />
        <span>You're offline - showing cached data</span>
      </div>
    )
  }

  return null
}

// Compact version for smaller spaces
export function OfflineIndicator({ className }: { className?: string }) {
  const { isOnline } = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs',
        className
      )}
    >
      <WifiOff className="h-3 w-3" />
      <span>Offline</span>
    </div>
  )
}

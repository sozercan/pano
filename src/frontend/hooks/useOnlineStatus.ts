import { useState, useEffect, useCallback, useRef } from 'react'

export interface OnlineStatus {
  isOnline: boolean
  wasOffline: boolean
  lastOnlineAt: Date | null
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [wasOffline, setWasOffline] = useState(false)
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    setLastOnlineAt(new Date())
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    // Keep wasOffline true for a few seconds so we can show "back online" message
    timeoutRef.current = setTimeout(() => setWasOffline(false), 5000)
  }, [])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setWasOffline(true)
  }, [])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      // Clean up the timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [handleOnline, handleOffline])

  return { isOnline, wasOffline, lastOnlineAt }
}

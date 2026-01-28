import { useState, useCallback, useMemo, useRef, useEffect } from 'react'

export interface VirtualScrollOptions {
  /** Total number of items */
  itemCount: number
  /** Height of each row in pixels */
  itemHeight: number
  /** Height of the container in pixels */
  containerHeight: number
  /** Number of items to render above/below visible area */
  overscan?: number
}

export interface VirtualScrollResult {
  /** Items to render (indices) */
  virtualItems: VirtualItem[]
  /** Total height of all items (for scrollbar) */
  totalHeight: number
  /** Offset from top for the first rendered item */
  offsetTop: number
  /** Current scroll position */
  scrollTop: number
  /** Handler for scroll events */
  onScroll: (event: React.UIEvent<HTMLElement>) => void
  /** Ref to attach to the scroll container */
  scrollRef: React.RefObject<HTMLDivElement>
  /** Scroll to a specific index */
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void
}

export interface VirtualItem {
  /** Index in the original array */
  index: number
  /** Offset from top in pixels */
  offsetTop: number
  /** Height of this item */
  height: number
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
}: VirtualScrollOptions): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const onScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const target = event.currentTarget
    setScrollTop(target.scrollTop)
  }, [])

  const { virtualItems, offsetTop } = useMemo(() => {
    if (itemCount === 0) {
      return { virtualItems: [], offsetTop: 0 }
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    const items: VirtualItem[] = []
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        offsetTop: i * itemHeight,
        height: itemHeight,
      })
    }

    return {
      virtualItems: items,
      offsetTop: startIndex * itemHeight,
    }
  }, [itemCount, itemHeight, containerHeight, scrollTop, overscan])

  const totalHeight = itemCount * itemHeight

  const scrollToIndex = useCallback(
    (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      if (!scrollRef.current) return

      let targetScrollTop: number
      const itemTop = index * itemHeight

      switch (align) {
        case 'center':
          targetScrollTop = itemTop - containerHeight / 2 + itemHeight / 2
          break
        case 'end':
          targetScrollTop = itemTop - containerHeight + itemHeight
          break
        case 'start':
        default:
          targetScrollTop = itemTop
          break
      }

      targetScrollTop = Math.max(0, Math.min(targetScrollTop, totalHeight - containerHeight))
      scrollRef.current.scrollTop = targetScrollTop
    },
    [itemHeight, containerHeight, totalHeight]
  )

  return {
    virtualItems,
    totalHeight,
    offsetTop,
    scrollTop,
    onScroll,
    scrollRef: scrollRef as React.RefObject<HTMLDivElement>,
    scrollToIndex,
  }
}

// Hook for measuring container height dynamically
export function useContainerHeight(defaultHeight: number = 600) {
  const [height, setHeight] = useState(defaultHeight)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height)
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return { height, containerRef }
}

import { Bell, BellRing } from 'lucide-react'
import { cn } from '@frontend/lib/cn'
import { useSubscriptionStore } from '@frontend/stores/subscriptionStore'
import type { SubscriptionTarget } from '@shared/schemas'

interface SubscribeButtonProps {
  target: SubscriptionTarget
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  showLabel?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-7 px-2 text-xs',
  md: 'h-8 px-3 text-sm',
  lg: 'h-10 px-4 text-sm',
}

const iconSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function SubscribeButton({
  target,
  size = 'md',
  variant = 'default',
  showLabel = true,
  className,
}: SubscribeButtonProps) {
  const { subscribe, unsubscribeByTarget, isSubscribed } = useSubscriptionStore()
  const subscribed = isSubscribed(target)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (subscribed) {
      unsubscribeByTarget(target)
    } else {
      subscribe(target)
    }
  }

  const baseClasses = cn(
    'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
    sizeClasses[size]
  )

  const variantClasses = {
    default: subscribed
      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90'
      : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/80',
    ghost: subscribed
      ? 'text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))]'
      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
    outline: cn(
      'border border-[hsl(var(--border))]',
      subscribed
        ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10'
        : 'hover:bg-[hsl(var(--accent))]'
    ),
  }

  const Icon = subscribed ? BellRing : Bell

  return (
    <button
      onClick={handleClick}
      className={cn(baseClasses, variantClasses[variant], className)}
      aria-label={subscribed ? 'Unsubscribe' : 'Subscribe'}
      aria-pressed={subscribed}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && (subscribed ? 'Subscribed' : 'Subscribe')}
    </button>
  )
}

// Icon-only version for compact displays
interface SubscribeIconButtonProps {
  target: SubscriptionTarget
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const iconButtonSizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
}

export function SubscribeIconButton({
  target,
  size = 'md',
  className,
}: SubscribeIconButtonProps) {
  const { subscribe, unsubscribeByTarget, isSubscribed } = useSubscriptionStore()
  const subscribed = isSubscribed(target)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (subscribed) {
      unsubscribeByTarget(target)
    } else {
      subscribe(target)
    }
  }

  const Icon = subscribed ? BellRing : Bell

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
        subscribed
          ? 'text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10'
          : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
        iconButtonSizes[size],
        className
      )}
      aria-label={subscribed ? 'Unsubscribe' : 'Subscribe'}
      aria-pressed={subscribed}
    >
      <Icon className={iconSizes[size]} />
    </button>
  )
}

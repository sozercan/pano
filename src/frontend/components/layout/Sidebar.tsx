import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@frontend/lib/cn'
import { useUIStore } from '@frontend/stores/uiStore'
import { useSubscriptionCount } from '@frontend/stores/subscriptionStore'
import { AccordionNav } from './AccordionNav'
import { SubscriptionManager } from '@frontend/components/subscriptions'
import { ChevronLeft, ChevronRight, Bell, Settings } from 'lucide-react'

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const subscriptionCount = useSubscriptionCount()
  const [managerOpen, setManagerOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Dashboard navigation"
        className={cn(
          'fixed left-0 top-14 z-30 flex h-[calc(100vh-3.5rem)] flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] transition-all duration-300',
          'lg:sticky lg:z-0',
          sidebarCollapsed ? 'w-0 -translate-x-full lg:w-16 lg:translate-x-0' : 'w-72'
        )}
      >
        {/* Subscriptions link */}
        {!sidebarCollapsed && (
          <div className="border-b border-[hsl(var(--border))] p-2">
            <Link
              to="/subscribed"
              aria-label={`View subscribed items${subscriptionCount > 0 ? `, ${subscriptionCount} active` : ''}`}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[hsl(var(--accent))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-inset',
                location.pathname === '/subscribed' && 'bg-[hsl(var(--accent))]'
              )}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">Subscribed</span>
              {subscriptionCount > 0 && (
                <span className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs px-1.5 py-0.5 rounded-full" aria-hidden="true">
                  {subscriptionCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setManagerOpen(true)}
              aria-label="Open subscription manager"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-inset"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span>Manage Subscriptions</span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {!sidebarCollapsed && <AccordionNav />}
        </div>

        {/* Collapse button - desktop only */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
          className={cn(
            'hidden lg:flex h-10 items-center justify-center border-t border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-inset',
            sidebarCollapsed && 'justify-center'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </aside>

      {/* Subscription Manager Dialog */}
      <SubscriptionManager open={managerOpen} onOpenChange={setManagerOpen} />
    </>
  )
}

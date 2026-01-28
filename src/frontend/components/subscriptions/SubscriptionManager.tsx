import { useState, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import {
  X,
  Trash2,
  Download,
  Upload,
  Layers,
  FileText,
  TestTube,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@frontend/lib/cn'
import { useSubscriptionStore, useSubscriptions } from '@frontend/stores/subscriptionStore'
import type { Subscription } from '@shared/schemas'

interface SubscriptionManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubscriptionManager({ open, onOpenChange }: SubscriptionManagerProps) {
  const subscriptions = useSubscriptions()
  const { unsubscribe, clearAll, exportToJson, importFromJson } = useSubscriptionStore()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dashboardSubs = subscriptions.filter((s) => s.type === 'dashboard')
  const tabSubs = subscriptions.filter((s) => s.type === 'tab')
  const testSubs = subscriptions.filter((s) => s.type === 'test')

  const filteredSubscriptions =
    activeTab === 'all'
      ? subscriptions
      : activeTab === 'dashboards'
        ? dashboardSubs
        : activeTab === 'tabs'
          ? tabSubs
          : testSubs

  const handleExport = () => {
    const json = exportToJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pano-subscriptions-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const result = importFromJson(text)

      if (result.success) {
        setImportStatus({
          type: 'success',
          message: `Imported ${result.count} new subscription${result.count !== 1 ? 's' : ''}`,
        })
      } else {
        setImportStatus({
          type: 'error',
          message: result.error ?? 'Failed to import subscriptions',
        })
      }
    } catch {
      setImportStatus({
        type: 'error',
        message: 'Failed to read file',
      })
    }

    // Reset input
    e.target.value = ''

    // Clear status after 3 seconds
    setTimeout(() => setImportStatus(null), 3000)
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to remove all subscriptions?')) {
      clearAll()
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-lg flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
            <Dialog.Title className="font-semibold text-lg">
              Subscription Manager
            </Dialog.Title>
            <Dialog.Close className="rounded-md p-1 hover:bg-[hsl(var(--muted))]">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {/* Actions bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleImport}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md hover:bg-[hsl(var(--accent))]"
              >
                <Upload className="h-4 w-4" />
                Import
              </button>
              <button
                onClick={handleExport}
                disabled={subscriptions.length === 0}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md hover:bg-[hsl(var(--accent))] disabled:opacity-50 disabled:pointer-events-none"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={handleClearAll}
                disabled={subscriptions.length === 0}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md text-red-600 hover:bg-red-500/10 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            </div>
          </div>

          {/* Import status */}
          {importStatus && (
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm',
                importStatus.type === 'success'
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-red-500/10 text-red-600'
              )}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {importStatus.message}
            </div>
          )}

          {/* Tabs */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List className="flex border-b border-[hsl(var(--border))]">
              <TabTrigger value="all" count={subscriptions.length}>
                All
              </TabTrigger>
              <TabTrigger value="dashboards" count={dashboardSubs.length}>
                <Layers className="h-3.5 w-3.5" />
                Dashboards
              </TabTrigger>
              <TabTrigger value="tabs" count={tabSubs.length}>
                <FileText className="h-3.5 w-3.5" />
                Tabs
              </TabTrigger>
              <TabTrigger value="tests" count={testSubs.length}>
                <TestTube className="h-3.5 w-3.5" />
                Tests
              </TabTrigger>
            </Tabs.List>

            <div className="flex-1 overflow-auto p-4">
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                  <p>No subscriptions yet</p>
                  <p className="text-sm mt-1">
                    Subscribe to dashboards, tabs, or tests to get notified of status changes
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSubscriptions.map((subscription) => (
                    <SubscriptionItem
                      key={subscription.id}
                      subscription={subscription}
                      onRemove={() => unsubscribe(subscription.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function TabTrigger({
  value,
  count,
  children,
}: {
  value: string
  count: number
  children: React.ReactNode
}) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 border-transparent',
        'data-[state=active]:border-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary))]',
        'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
      )}
    >
      {children}
      <span className="ml-1 text-xs bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded-full">
        {count}
      </span>
    </Tabs.Trigger>
  )
}

function SubscriptionItem({
  subscription,
  onRemove,
}: {
  subscription: Subscription
  onRemove: () => void
}) {
  const icon =
    subscription.type === 'dashboard' ? (
      <Layers className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
    ) : subscription.type === 'tab' ? (
      <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
    ) : (
      <TestTube className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
    )

  const getLink = () => {
    if (subscription.type === 'dashboard') {
      return { to: '/dashboard/$dashboard', params: { dashboard: subscription.dashboardName } }
    }
    if (subscription.type === 'tab') {
      return {
        to: '/dashboard/$dashboard/tab/$tab',
        params: { dashboard: subscription.dashboardName, tab: subscription.tabName },
      }
    }
    // Test subscriptions also link to the tab
    return {
      to: '/dashboard/$dashboard/tab/$tab',
      params: { dashboard: subscription.dashboardName, tab: subscription.tabName },
    }
  }

  const link = getLink()

  const getLabel = () => {
    if (subscription.type === 'dashboard') {
      return subscription.dashboardName
    }
    if (subscription.type === 'tab') {
      return `${subscription.dashboardName} / ${subscription.tabName}`
    }
    return `${subscription.dashboardName} / ${subscription.tabName} / ${subscription.testName}`
  }

  const createdAt = new Date(subscription.createdAt).toLocaleDateString()

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]/50">
      {icon}
      <div className="flex-1 min-w-0">
        <Link
          to={link.to as any}
          params={link.params as any}
          className="font-medium text-sm hover:underline truncate block"
        >
          {getLabel()}
        </Link>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          Subscribed {createdAt}
        </span>
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-red-600"
        aria-label="Remove subscription"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

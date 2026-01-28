import { describe, test, expect, beforeEach, afterAll } from 'bun:test'
import { setupDOM, teardownDOM } from '../setup'

// Set up DOM with localStorage before any dynamic imports
setupDOM()

describe('subscriptionStore', () => {
  // Lazily load the store module
  let useSubscriptionStore: typeof import('@frontend/stores/subscriptionStore').useSubscriptionStore

  const getStore = () => useSubscriptionStore.getState()

  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear()

    // Dynamically import the store (fresh each time isn't needed, but import must be after setupDOM)
    if (!useSubscriptionStore) {
      const module = await import('@frontend/stores/subscriptionStore')
      useSubscriptionStore = module.useSubscriptionStore
    }

    // Reset the store state
    useSubscriptionStore.setState({
      subscriptions: [],
      notificationSettings: {
        enabled: true,
        pollIntervalSeconds: 60,
        browserNotifications: true,
      }
    })
  })

  afterAll(() => {
    teardownDOM()
  })

  test('starts with empty subscriptions', () => {
    expect(getStore().subscriptions).toEqual([])
  })

  test('subscribe creates a new subscription', () => {
    getStore().subscribe({
      type: 'dashboard',
      dashboardName: 'sig-release',
    })

    expect(getStore().subscriptions).toHaveLength(1)
    expect(getStore().subscriptions[0].type).toBe('dashboard')
    expect(getStore().subscriptions[0].dashboardName).toBe('sig-release')
    expect(getStore().subscriptions[0].id).toBe('dashboard:sig-release')
  })

  test('subscribe does not duplicate existing subscription', () => {
    getStore().subscribe({
      type: 'dashboard',
      dashboardName: 'sig-release',
    })

    getStore().subscribe({
      type: 'dashboard',
      dashboardName: 'sig-release',
    })

    expect(getStore().subscriptions).toHaveLength(1)
  })

  test('unsubscribe removes subscription by ID', () => {
    getStore().subscribe({
      type: 'dashboard',
      dashboardName: 'sig-release',
    })

    getStore().unsubscribe('dashboard:sig-release')

    expect(getStore().subscriptions).toHaveLength(0)
  })

  test('unsubscribeByTarget removes subscription by target', () => {
    getStore().subscribe({
      type: 'tab',
      dashboardName: 'sig-release',
      tabName: 'kind-master',
    })

    getStore().unsubscribeByTarget({
      type: 'tab',
      dashboardName: 'sig-release',
      tabName: 'kind-master',
    })

    expect(getStore().subscriptions).toHaveLength(0)
  })

  test('clearAll removes all subscriptions', () => {
    getStore().subscribe({ type: 'dashboard', dashboardName: 'dash1' })
    getStore().subscribe({ type: 'dashboard', dashboardName: 'dash2' })
    getStore().subscribe({ type: 'dashboard', dashboardName: 'dash3' })

    expect(getStore().subscriptions).toHaveLength(3)

    getStore().clearAll()

    expect(getStore().subscriptions).toHaveLength(0)
  })

  test('isSubscribed returns correct boolean', () => {
    getStore().subscribe({
      type: 'dashboard',
      dashboardName: 'sig-release',
    })

    expect(
      getStore().isSubscribed({
        type: 'dashboard',
        dashboardName: 'sig-release',
      })
    ).toBe(true)

    expect(
      getStore().isSubscribed({
        type: 'dashboard',
        dashboardName: 'other-dashboard',
      })
    ).toBe(false)
  })

  test('getSubscription returns correct subscription', () => {
    getStore().subscribe({
      type: 'tab',
      dashboardName: 'sig-release',
      tabName: 'kind-master',
    })

    const sub = getStore().getSubscription('tab:sig-release:kind-master')
    expect(sub).toBeDefined()
    expect(sub?.type).toBe('tab')
    expect(sub?.dashboardName).toBe('sig-release')
    expect((sub as any)?.tabName).toBe('kind-master')
  })

  test('getSubscriptionsByType filters correctly', () => {
    getStore().subscribe({ type: 'dashboard', dashboardName: 'dash1' })
    getStore().subscribe({ type: 'tab', dashboardName: 'dash1', tabName: 'tab1' })
    getStore().subscribe({ type: 'test', dashboardName: 'dash1', tabName: 'tab1', testName: 'test1' })
    getStore().subscribe({ type: 'dashboard', dashboardName: 'dash2' })

    expect(getStore().getSubscriptionsByType('dashboard')).toHaveLength(2)
    expect(getStore().getSubscriptionsByType('tab')).toHaveLength(1)
    expect(getStore().getSubscriptionsByType('test')).toHaveLength(1)
  })

  test('getSubscriptionsByDashboard filters correctly', () => {
    getStore().subscribe({ type: 'dashboard', dashboardName: 'dash1' })
    getStore().subscribe({ type: 'tab', dashboardName: 'dash1', tabName: 'tab1' })
    getStore().subscribe({ type: 'dashboard', dashboardName: 'dash2' })

    expect(getStore().getSubscriptionsByDashboard('dash1')).toHaveLength(2)
    expect(getStore().getSubscriptionsByDashboard('dash2')).toHaveLength(1)
    expect(getStore().getSubscriptionsByDashboard('dash3')).toHaveLength(0)
  })

  test('exportToJson returns valid JSON', () => {
    getStore().subscribe({ type: 'dashboard', dashboardName: 'sig-release' })

    const json = getStore().exportToJson()
    const parsed = JSON.parse(json)

    expect(parsed.version).toBe(1)
    expect(parsed.subscriptions).toHaveLength(1)
    expect(parsed.exportedAt).toBeDefined()
  })

  test('importFromJson imports subscriptions correctly', () => {
    const importData = {
      version: 1,
      subscriptions: [
        {
          type: 'dashboard',
          id: 'dashboard:imported-dash',
          createdAt: '2026-01-28T00:00:00Z',
          dashboardName: 'imported-dash',
        },
      ],
    }

    const importResult = getStore().importFromJson(JSON.stringify(importData))
    expect(importResult.success).toBe(true)
    expect(importResult.count).toBe(1)

    expect(getStore().subscriptions).toHaveLength(1)
    expect(getStore().subscriptions[0].dashboardName).toBe('imported-dash')
  })

  test('importFromJson merges without duplicates', () => {
    getStore().subscribe({ type: 'dashboard', dashboardName: 'existing-dash' })

    const importData = {
      version: 1,
      subscriptions: [
        {
          type: 'dashboard',
          id: 'dashboard:existing-dash',
          createdAt: '2026-01-28T00:00:00Z',
          dashboardName: 'existing-dash',
        },
        {
          type: 'dashboard',
          id: 'dashboard:new-dash',
          createdAt: '2026-01-28T00:00:00Z',
          dashboardName: 'new-dash',
        },
      ],
    }

    const importResult = getStore().importFromJson(JSON.stringify(importData))
    expect(importResult.success).toBe(true)
    expect(importResult.count).toBe(1) // Only new-dash was added

    expect(getStore().subscriptions).toHaveLength(2)
  })

  test('importFromJson handles invalid JSON', () => {
    const importResult = getStore().importFromJson('not valid json')
    expect(importResult.success).toBe(false)
    expect(importResult.error).toBeDefined()
  })

  test('updateNotificationSettings updates correctly', () => {
    getStore().updateNotificationSettings({
      enabled: false,
      pollIntervalSeconds: 120,
    })

    expect(getStore().notificationSettings.enabled).toBe(false)
    expect(getStore().notificationSettings.pollIntervalSeconds).toBe(120)
    // Should preserve existing settings not being updated
    expect(getStore().notificationSettings.browserNotifications).toBe(true)
  })
})

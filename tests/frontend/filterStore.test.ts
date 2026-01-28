import { describe, test, expect, beforeEach, afterAll } from 'bun:test'
import { setupDOM, teardownDOM } from '../setup'

// Set up DOM with localStorage before any dynamic imports
setupDOM()

describe('filterStore', () => {
  let useFilterStore: typeof import('@frontend/stores/filterStore').useFilterStore

  const getStore = () => useFilterStore.getState()

  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear()

    // Dynamically import the store
    if (!useFilterStore) {
      const module = await import('@frontend/stores/filterStore')
      useFilterStore = module.useFilterStore
    }

    // Reset the store state
    useFilterStore.setState({ filters: {} })
  })

  afterAll(() => {
    teardownDOM()
  })

  test('starts with empty filters', () => {
    expect(getStore().filters).toEqual({})
  })

  test('getFilters returns default values for non-existent key', () => {
    const filters = getStore().getFilters('dash', 'tab')

    expect(filters.statusFilter).toBe('all')
    expect(filters.textFilter).toBe('')
    expect(filters.showOnlyFailures).toBe(false)
  })

  test('setStatusFilter updates filter correctly', () => {
    getStore().setStatusFilter('dash', 'tab', 'fail')

    const filters = getStore().getFilters('dash', 'tab')
    expect(filters.statusFilter).toBe('fail')
  })

  test('setTextFilter updates filter correctly', () => {
    getStore().setTextFilter('dash', 'tab', 'test-name')

    const filters = getStore().getFilters('dash', 'tab')
    expect(filters.textFilter).toBe('test-name')
  })

  test('setShowOnlyFailures updates filter correctly', () => {
    getStore().setShowOnlyFailures('dash', 'tab', true)

    const filters = getStore().getFilters('dash', 'tab')
    expect(filters.showOnlyFailures).toBe(true)
  })

  test('filters are isolated per dashboard/tab', () => {
    getStore().setStatusFilter('dash1', 'tab1', 'pass')
    getStore().setStatusFilter('dash1', 'tab2', 'fail')
    getStore().setTextFilter('dash2', 'tab1', 'search-term')

    expect(getStore().getFilters('dash1', 'tab1').statusFilter).toBe('pass')
    expect(getStore().getFilters('dash1', 'tab2').statusFilter).toBe('fail')
    expect(getStore().getFilters('dash2', 'tab1').textFilter).toBe('search-term')
    expect(getStore().getFilters('dash2', 'tab1').statusFilter).toBe('all') // default
  })

  test('clearFilters removes filters for specific dashboard/tab', () => {
    getStore().setStatusFilter('dash', 'tab', 'fail')
    getStore().setTextFilter('dash', 'tab', 'test')
    getStore().setStatusFilter('dash', 'other-tab', 'pass')

    getStore().clearFilters('dash', 'tab')

    // Should be reset to defaults
    expect(getStore().getFilters('dash', 'tab').statusFilter).toBe('all')
    expect(getStore().getFilters('dash', 'tab').textFilter).toBe('')

    // Other tab should be unaffected
    expect(getStore().getFilters('dash', 'other-tab').statusFilter).toBe('pass')
  })

  test('clearAllFilters removes all filters', () => {
    getStore().setStatusFilter('dash1', 'tab1', 'fail')
    getStore().setStatusFilter('dash2', 'tab2', 'pass')
    getStore().setTextFilter('dash3', 'tab3', 'search')

    getStore().clearAllFilters()

    expect(getStore().filters).toEqual({})
    expect(getStore().getFilters('dash1', 'tab1').statusFilter).toBe('all')
    expect(getStore().getFilters('dash2', 'tab2').statusFilter).toBe('all')
    expect(getStore().getFilters('dash3', 'tab3').textFilter).toBe('')
  })

  test('getFilterKey generates correct keys', () => {
    const key = getStore().getFilterKey('my-dashboard', 'my-tab')
    expect(key).toBe('my-dashboard/my-tab')
  })

  test('multiple filter updates preserve other filter values', () => {
    getStore().setStatusFilter('dash', 'tab', 'fail')
    getStore().setTextFilter('dash', 'tab', 'search')
    getStore().setShowOnlyFailures('dash', 'tab', true)

    const filters = getStore().getFilters('dash', 'tab')
    expect(filters.statusFilter).toBe('fail')
    expect(filters.textFilter).toBe('search')
    expect(filters.showOnlyFailures).toBe(true)
  })

  test('all status filter options work', () => {
    const statuses = ['all', 'pass', 'fail', 'skip', 'flaky', 'empty'] as const

    for (const status of statuses) {
      getStore().setStatusFilter('dash', 'tab', status)
      expect(getStore().getFilters('dash', 'tab').statusFilter).toBe(status)
    }
  })
})

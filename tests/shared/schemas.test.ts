import { describe, test, expect } from 'bun:test'
import {
  DashboardGroupListResponseSchema,
  DashboardsInGroupResponseSchema,
  DashboardSummaryResponseSchema,
  DashboardSummariesResponseSchema,
  TabListResponseSchema,
  TabSummariesResponseSchema,
  TabSummaryResponseSchema,
  HeadersResponseSchema,
  RowsResponseSchema,
  SubscriptionSchema,
  generateSubscriptionId,
  getResultCode,
  getResultStatus,
  isPassingResult,
  isFailingResult,
  KnownResultCodes,
} from '@shared/schemas'

describe('Dashboard Schemas', () => {
  test('DashboardGroupListResponseSchema validates correctly', () => {
    const data = {
      dashboard_groups: [
        { name: 'sig-release', link: '/dashboard-groups/sigrelease' },
        { name: 'sig-node', link: '/dashboard-groups/signode' },
      ],
    }
    const result = DashboardGroupListResponseSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dashboard_groups).toHaveLength(2)
    }
  })

  test('DashboardsInGroupResponseSchema validates correctly', () => {
    const data = {
      dashboards: [
        { name: 'sig-release-1.35-blocking', link: '/dashboards/sigrelease135blocking' },
      ],
    }
    const result = DashboardsInGroupResponseSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  test('DashboardSummaryResponseSchema validates correctly', () => {
    const data = {
      dashboard_summary: {
        name: 'sig-release-master-blocking',
        overall_status: 'FLAKY',
        tab_status_count: {
          FLAKY: 4,
          PASSING: 18,
        },
      },
    }
    const result = DashboardSummaryResponseSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dashboard_summary.overall_status).toBe('FLAKY')
    }
  })

  test('DashboardSummariesResponseSchema validates correctly', () => {
    const data = {
      dashboard_summaries: [
        {
          name: 'sig-release-master-blocking',
          overall_status: 'PASSING',
          tab_status_count: { PASSING: 10 },
        },
      ],
    }
    const result = DashboardSummariesResponseSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  test('tab_status_count accepts empty string key', () => {
    const data = {
      dashboard_summary: {
        name: 'test',
        overall_status: 'FAILING',
        tab_status_count: {
          '': 1,
          FAILING: 1,
          FLAKY: 16,
          PASSING: 21,
        },
      },
    }
    const result = DashboardSummaryResponseSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  test('rejects invalid status', () => {
    const data = {
      dashboard_summary: {
        name: 'test',
        overall_status: 'INVALID',
      },
    }
    const result = DashboardSummaryResponseSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('Tab Schemas', () => {
  test('TabListResponseSchema validates correctly', () => {
    const data = {
      dashboard_tabs: [
        { name: 'kind-master', link: '/dashboards/sigrelease/tabs/kindmaster' },
      ],
    }
    const result = TabListResponseSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  test('TabSummariesResponseSchema validates correctly', () => {
    const data = {
      tab_summaries: [
        {
          dashboard_name: 'sig-release-master-blocking',
          tab_name: 'kind-master',
          overall_status: 'PASSING',
          detailed_status_message: 'Tab stats: 10 of 10 (100.0%) recent columns passed',
          last_run_timestamp: '2026-01-28T18:16:55Z',
          last_update_timestamp: '2026-01-28T18:47:50Z',
          latest_passing_build: 'a57b4befd',
        },
      ],
    }
    const result = TabSummariesResponseSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  test('TabSummaryResponseSchema validates correctly', () => {
    const data = {
      tab_summary: {
        dashboard_name: 'test-dashboard',
        tab_name: 'test-tab',
        overall_status: 'FAILING',
      },
    }
    const result = TabSummaryResponseSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})

describe('Grid Schemas', () => {
  test('HeadersResponseSchema validates correctly', () => {
    const data = {
      headers: [
        {
          build: '2016584716093755392',
          started: '2026-01-28T18:50:37Z',
          extra: [''],
        },
        {
          build: '2016569868328898560',
          started: '2026-01-28T17:51:37Z',
          extra: ['a57b4befd'],
        },
      ],
    }
    const result = HeadersResponseSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.headers).toHaveLength(2)
    }
  })

  test('RowsResponseSchema validates correctly', () => {
    const data = {
      rows: [
        {
          name: 'Kubernetes e2e suite.[It] test',
          cells: [
            {},
            { result: 1 },
            { result: 2, message: 'Test failed' },
            { result: 3, icon: 'S' },
          ],
        },
      ],
    }
    const result = RowsResponseSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rows[0].cells).toHaveLength(4)
    }
  })

  test('getResultCode returns correct values', () => {
    expect(getResultCode({})).toBe(0)
    expect(getResultCode({ result: 1 })).toBe(1)
    expect(getResultCode({ result: 2 })).toBe(2)
  })

  test('getResultStatus returns correct status names', () => {
    expect(getResultStatus({})).toBe('empty')
    expect(getResultStatus({ result: 1 })).toBe('pass')
    expect(getResultStatus({ result: 2 })).toBe('fail')
    expect(getResultStatus({ result: 3 })).toBe('skip')
    expect(getResultStatus({ result: 6 })).toBe('truncated')
    expect(getResultStatus({ result: 12 })).toBe('pass_with_errors')
  })

  test('RowsResponseSchema accepts extended result codes', () => {
    const data = {
      rows: [
        {
          name: 'test',
          cells: [
            { result: 12, message: 'Passed with errors', icon: 'F' },
            { result: 15 },
            { result: 20 },
          ],
        },
      ],
    }
    const result = RowsResponseSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  test('isPassingResult correctly identifies passing statuses', () => {
    expect(isPassingResult(KnownResultCodes.PASS)).toBe(true)
    expect(isPassingResult(KnownResultCodes.PASS_WITH_ERRORS)).toBe(true)
    expect(isPassingResult(KnownResultCodes.PASS_WITH_SKIPS)).toBe(true)
    expect(isPassingResult(KnownResultCodes.FAIL)).toBe(false)
    expect(isPassingResult(KnownResultCodes.NO_RESULT)).toBe(false)
  })

  test('isFailingResult correctly identifies failing statuses', () => {
    expect(isFailingResult(KnownResultCodes.FAIL)).toBe(true)
    expect(isFailingResult(KnownResultCodes.BUILD_FAIL)).toBe(true)
    expect(isFailingResult(KnownResultCodes.CATEGORIZED_FAIL)).toBe(true)
    expect(isFailingResult(KnownResultCodes.PASS)).toBe(false)
  })
})

describe('Subscription Schemas', () => {
  test('validates dashboard subscription', () => {
    const data = {
      type: 'dashboard',
      id: 'dashboard:sig-release',
      createdAt: '2026-01-28T00:00:00Z',
      dashboardName: 'sig-release',
    }
    const result = SubscriptionSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  test('validates tab subscription', () => {
    const data = {
      type: 'tab',
      id: 'tab:sig-release:kind-master',
      createdAt: '2026-01-28T00:00:00Z',
      dashboardName: 'sig-release',
      tabName: 'kind-master',
    }
    const result = SubscriptionSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  test('validates test subscription', () => {
    const data = {
      type: 'test',
      id: 'test:sig-release:kind-master:e2e-test',
      createdAt: '2026-01-28T00:00:00Z',
      dashboardName: 'sig-release',
      tabName: 'kind-master',
      testName: 'e2e-test',
    }
    const result = SubscriptionSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  test('generateSubscriptionId generates correct IDs', () => {
    expect(
      generateSubscriptionId({
        type: 'dashboard',
        dashboardName: 'sig-release',
      })
    ).toBe('dashboard:sig-release')

    expect(
      generateSubscriptionId({
        type: 'tab',
        dashboardName: 'sig-release',
        tabName: 'kind-master',
      })
    ).toBe('tab:sig-release:kind-master')

    expect(
      generateSubscriptionId({
        type: 'test',
        dashboardName: 'sig-release',
        tabName: 'kind-master',
        testName: 'e2e-test',
      })
    ).toBe('test:sig-release:kind-master:e2e-test')
  })
})

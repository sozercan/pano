# Architecture

This document describes the architecture of Pano, a modern TestGrid viewer.

## Overview

Pano is a single-page application (SPA) that provides a user-friendly interface for browsing TestGrid dashboards. It fetches data from the TestGrid API and presents it in an organized, filterable format.

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  React Frontend                                          │    │
│  │  ├── Zustand (UI state, subscriptions)                  │    │
│  │  ├── TanStack Query (API cache, background refresh)     │    │
│  │  └── localStorage (subscription persistence)            │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Hono API Server (development proxy)                            │
│  ├── /api/proxy/*     → Proxies to TestGrid API                │
│  └── /api/health      → Health check                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  TestGrid API (https://testgrid-api.prow.k8s.io)               │
│  └── Read-only public API                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App
├── ErrorBoundary              # Global error handling
├── OfflineBanner              # Connectivity status
├── AppShell                   # Main layout
│   ├── Header                 # Top bar with theme toggle
│   └── Sidebar                # Navigation sidebar
│       └── AccordionNav       # Collapsible group/dashboard/tab tree
├── SearchModal                # Global search (Cmd+K)
└── Routes
    ├── /                      # Home page
    ├── /dashboard/:name       # Dashboard view
    ├── /dashboard/:name/tab/:tab  # Tab view with TestGrid
    └── /subscribed            # Subscriptions manager
```

### State Management

#### Zustand Stores

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `uiStore` | Sidebar state, expanded groups, search | localStorage |
| `themeStore` | Dark/light mode preference | localStorage |
| `subscriptionStore` | User subscriptions | localStorage |
| `filterStore` | Grid filters per tab | localStorage |

#### TanStack Query

Handles all API data fetching with:
- **Automatic caching** - Responses cached by query key
- **Background refetching** - Data refreshes when window regains focus
- **Retry logic** - Failed requests retry with exponential backoff
- **Stale time** - 1-5 minutes depending on data volatility

### Key Components

#### TestGrid (`components/grid/TestGrid.tsx`)

The core visualization component that renders test results:

- **Virtual scrolling** - Only renders visible rows for performance
- **Column virtualization** - Only renders visible columns
- **Filtering** - Real-time filtering by status and name
- **Cell interactions** - Click to view detailed error messages

#### AccordionNav (`components/layout/AccordionNav.tsx`)

Hierarchical navigation component:

- **Three levels** - Groups → Dashboards → Tabs
- **Status aggregation** - Groups show worst status among children
- **Lazy loading** - Dashboard data fetched on expand

#### SearchModal (`components/search/SearchModal.tsx`)

Global search with fuzzy matching:

- **Keyboard-first** - Full keyboard navigation
- **Cached search** - Searches through TanStack Query cache
- **Result highlighting** - Matched characters highlighted

## Data Flow

### API Data Fetching

```
User action (expand group, navigate to tab)
    │
    ▼
Custom hook (useTestGridApi.ts)
    │
    ▼
TanStack Query
    ├── Check cache → Return if fresh
    │
    ▼
API Client (api-client.ts)
    │
    ▼
Fetch from /api/proxy/*
    │
    ▼
Zod validation (schemas/*.ts)
    │
    ▼
Return typed data
```

### Subscription Flow

```
User clicks Subscribe
    │
    ▼
SubscribeButton component
    │
    ▼
subscriptionStore.subscribe()
    │
    ├── Generate unique ID
    ├── Add to store
    └── Persist to localStorage
```

## API Integration

### TestGrid API Endpoints

| Endpoint | Usage | Cache Time |
|----------|-------|------------|
| `GET /dashboard-groups` | List groups | 5 min |
| `GET /dashboard-groups/:group` | Dashboards in group | 5 min |
| `GET /dashboards/:name/tab-summaries` | Tab status overview | 1 min |
| `GET /dashboards/:name/tabs/:tab/headers` | Build columns | 1 min |
| `GET /dashboards/:name/tabs/:tab/rows` | Test results | 1 min |

### Schema Validation

All API responses are validated with Zod schemas:

```typescript
// Example: Row schema
export const RowSchema = z.object({
  name: z.string(),
  cells: z.array(CellSchema),
})
```

This provides:
- **Type safety** - TypeScript types inferred from schemas
- **Runtime validation** - Catches API changes early
- **Error messages** - Clear validation errors

## Performance Optimizations

### Bundle Splitting

Vite splits the bundle into chunks:

```javascript
manualChunks: {
  vendor: ['react', 'react-dom'],
  router: ['@tanstack/react-router'],
  query: ['@tanstack/react-query'],
  ui: ['@radix-ui/...'],
}
```

### Virtual Scrolling

The test grid uses virtual scrolling for both:
- **Rows** - Only visible rows rendered
- **Columns** - Only visible columns rendered

This allows rendering grids with thousands of rows without performance issues.

### Memoization

Key components use `React.memo` and `useMemo` to prevent unnecessary re-renders:

```typescript
const filteredRows = useMemo(() => {
  return rows.filter(row => matchesFilter(row, filters))
}, [rows, filters])
```

## Error Handling

### Error Boundary

The `ErrorBoundary` component catches React errors and displays a friendly error page with:
- Error message (development only)
- Retry button
- Home navigation

### API Errors

TanStack Query handles API errors with:
- **Automatic retry** - 2 retries with backoff
- **Error state** - Components can render error UI
- **Offline support** - Shows cached data when offline

## Testing Strategy

### Unit Tests

- **Schemas** - Validate against real API responses
- **Stores** - Test Zustand store logic
- **Hooks** - Test custom hooks (useSearch, etc.)

### Integration Tests

- **API proxy** - Test proxy routes against real API
- **Components** - Test React components with Testing Library

### Test Files

```
tests/
├── api/
│   ├── proxy.test.ts       # API proxy tests
│   └── integration.test.ts # Full API integration
├── frontend/
│   ├── filterStore.test.ts # Filter store logic
│   ├── useSearch.test.ts   # Search hook tests
│   └── grid.test.ts        # Grid component tests
└── shared/
    └── schemas.test.ts     # Schema validation
```

## Future Considerations

### Desktop App (Phase 7)

The architecture supports a future Tauri desktop wrapper:
- **Notifications** - Native OS notifications for test failures
- **System tray** - Background monitoring
- **Offline-first** - Full offline support with local database

### Scalability

Current design handles:
- **Large grids** - 10,000+ rows via virtual scrolling
- **Many subscriptions** - Efficient localStorage usage
- **Frequent updates** - Optimistic UI updates

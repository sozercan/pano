# TestGrid API Report

**Base URL:** `https://testgrid-api.prow.k8s.io`  
**API Version:** v1  
**Documentation:** https://testgrid-api.prow.k8s.io/  
**Proto Definitions:** https://github.com/GoogleCloudPlatform/testgrid/blob/master/pb/api/v1/data.proto

---

## Overview

The TestGrid API provides access to Kubernetes CI/CD test results. It exposes dashboard groups, dashboards, tabs, and detailed test results through a RESTful JSON API.

---

## API Endpoints

### 1. LIST Endpoints

#### 1.1 List All Dashboards
```
GET /api/v1/dashboards
```

**Response Structure:**
```json
{
  "dashboards": [
    {
      "name": "sig-release-master-blocking",
      "link": "/dashboards/sigreleasemasterblocking",
      "dashboard_group_name": "sig-release"
    }
  ]
}
```

**Notes:**
- Returns all dashboards across all groups
- Each dashboard includes its parent group name
- Links are URL-encoded versions of names (hyphens removed)

---

#### 1.2 List All Dashboard Groups
```
GET /api/v1/dashboard-groups
```

**Response Structure:**
```json
{
  "dashboard_groups": [
    {
      "name": "sig-release",
      "link": "/dashboard-groups/sigrelease"
    }
  ]
}
```

**Notes:**
- Returns all top-level dashboard groups
- Groups organize related dashboards (e.g., by SIG, cloud provider, project)

---

#### 1.3 List Dashboards in a Group
```
GET /api/v1/dashboard-groups/{dashboard-group}
```

**Example:** `/api/v1/dashboard-groups/sig-release`

**Response Structure:**
```json
{
  "dashboards": [
    {
      "name": "sig-release-1.35-blocking",
      "link": "/dashboards/sigrelease135blocking"
    }
  ]
}
```

---

#### 1.4 List Tabs in a Dashboard
```
GET /api/v1/dashboards/{dashboard}/tabs
```

**Example:** `/api/v1/dashboards/sig-release-master-blocking/tabs`

**Response Structure:**
```json
{
  "dashboard_tabs": [
    {
      "name": "kind-master",
      "link": "/dashboards/sigreleasemasterblocking/tabs/kindmaster"
    }
  ]
}
```

---

#### 1.5 List Tab Summaries for a Dashboard
```
GET /api/v1/dashboards/{dashboard}/tab-summaries
```

**Example:** `/api/v1/dashboards/sig-release-master-blocking/tab-summaries`

**Response Structure:**
```json
{
  "tab_summaries": [
    {
      "dashboard_name": "sig-release-master-blocking",
      "tab_name": "kind-master",
      "overall_status": "PASSING",
      "detailed_status_message": "Tab stats: 10 of 10 (100.0%) recent columns passed (26510 of 26510 or 100.0% cells)",
      "last_run_timestamp": "2026-01-28T18:16:55Z",
      "last_update_timestamp": "2026-01-28T18:47:50Z",
      "latest_passing_build": "a57b4befd"
    }
  ]
}
```

**Status Values:**
- `PASSING` - All recent tests passed
- `FLAKY` - Some tests intermittently fail
- `FAILING` - Tests are consistently failing
- `STALE` - No recent test runs

---

#### 1.6 List Dashboard Summaries for a Group
```
GET /api/v1/dashboard-groups/{dashboard-group}/dashboard-summaries
```

**Example:** `/api/v1/dashboard-groups/sig-release/dashboard-summaries`

**Response Structure:**
```json
{
  "dashboard_summaries": [
    {
      "name": "sig-release-master-blocking",
      "overall_status": "FLAKY",
      "tab_status_count": {
        "FLAKY": 4,
        "PASSING": 18
      }
    }
  ]
}
```

---

### 2. GET Endpoints

#### 2.1 Get Dashboard Configuration
```
GET /api/v1/dashboards/{dashboard}
```

**Example:** `/api/v1/dashboards/sig-release-master-blocking`

**Response Structure:**
```json
{}
```

**Notes:**
- Often returns empty object `{}`
- Dashboard-level configuration is rare
- Most configuration is at tab level

---

#### 2.2 Get Dashboard Summary
```
GET /api/v1/dashboards/{dashboard}/summary
```

**Example:** `/api/v1/dashboards/sig-release-master-blocking/summary`

**Response Structure:**
```json
{
  "dashboard_summary": {
    "name": "sig-release-master-blocking",
    "overall_status": "FLAKY",
    "tab_status_count": {
      "FLAKY": 4,
      "PASSING": 18
    }
  }
}
```

---

#### 2.3 Get Tab Configuration
```
GET /api/v1/dashboards/{dashboard}/tabs/{tab}
```

**Notes:**
- Returns 404 in testing - endpoint may require specific tab names
- Configuration includes test grouping, filtering rules, etc.

---

#### 2.4 Get Tab Summary
```
GET /api/v1/dashboards/{dashboard}/tab-summaries/{tab}
```

**Example:** `/api/v1/dashboards/sig-release-master-blocking/tab-summaries/kind-master`

**Response Structure:**
```json
{
  "tab_summary": {
    "dashboard_name": "sig-release-master-blocking",
    "tab_name": "kind-master",
    "overall_status": "PASSING",
    "detailed_status_message": "Tab stats: 10 of 10 (100.0%) recent columns passed",
    "last_run_timestamp": "2026-01-28T18:16:55Z",
    "last_update_timestamp": "2026-01-28T18:47:50Z",
    "latest_passing_build": "a57b4befd"
  }
}
```

---

#### 2.5 Get Tab Headers (Grid Columns)
```
GET /api/v1/dashboards/{dashboard}/tabs/{tab}/headers
```

**Example:** `/api/v1/dashboards/sig-release-master-blocking/tabs/gce-cos-master-default/headers`

**Response Structure:**
```json
{
  "headers": [
    {
      "build": "2016584716093755392",
      "started": "2026-01-28T18:50:37Z",
      "extra": [""]
    },
    {
      "build": "2016569868328898560",
      "started": "2026-01-28T17:51:37Z",
      "extra": ["a57b4befd"]
    }
  ]
}
```

**Header Fields:**
- `build` - Build ID (Prow job ID)
- `started` - ISO 8601 timestamp when the build started
- `extra` - Additional metadata (often commit SHA)

---

#### 2.6 Get Tab Rows (Test Results Grid)
```
GET /api/v1/dashboards/{dashboard}/tabs/{tab}/rows
```

**Example:** `/api/v1/dashboards/sig-release-master-blocking/tabs/gce-cos-master-default/rows`

**Response Structure:**
```json
{
  "rows": [
    {
      "name": "Kubernetes e2e suite.[It] [sig-api-machinery] ...",
      "cells": [
        {},
        {"result": 1},
        {"result": 1, "message": "...", "icon": "..."}
      ]
    }
  ]
}
```

**Cell Result Codes:**
| Code | Status | Description |
|------|--------|-------------|
| 0 | Empty | No result / not run |
| 1 | Pass | Test passed |
| 2 | Fail | Test failed |
| 3 | Skipped | Test was skipped |
| 6 | Truncated | Data truncated due to size limits |

**Cell Fields:**
- `result` - Numeric status code
- `message` - Error message or skip reason
- `icon` - Display icon (e.g., "S" for skipped, "..." for truncated)

**Size Limits:**
- Maximum grid size: 2MB (2,000,000 bytes)
- Large grids are truncated with result code 6

---

## Data Model

### Hierarchy
```
Dashboard Group
  └── Dashboard
        └── Tab
              ├── Headers (columns = builds/runs)
              └── Rows (tests)
                    └── Cells (test results per build)
```

### Status Aggregation
- Tab status is aggregated from individual cell results
- Dashboard status is aggregated from tab statuses
- Group status is the worst status among all dashboards

---

## Key Observations

### 1. **Response Format**
- All valid responses are JSON
- Error responses may not be JSON
- No authentication required for read access

### 2. **URL Encoding**
- Dashboard and tab names in URLs have hyphens removed
- Example: `sig-release-master-blocking` → `sigreleasemasterblocking`
- Use original names with hyphens in API paths

### 3. **Data Size**
- Tab row data can be very large (thousands of tests × dozens of runs)
- Grid data is truncated at 2MB with special result code 6
- Consider pagination strategies for UI

### 4. **Timestamps**
- All timestamps are ISO 8601 format with UTC timezone
- `last_run_timestamp` - When the test last ran
- `last_update_timestamp` - When data was last refreshed

### 5. **Missing/Optional Endpoints**
- No OpenAPI/Swagger specification (`/swagger.json` returns 404)
- Individual tab configuration endpoint returns 404 for some tabs
- No write/mutation endpoints (read-only API)

---

## Example Workflow

### Getting a Full Test Grid View

1. **List dashboard groups** → Choose a group
2. **Get dashboards in group** → Choose a dashboard  
3. **Get dashboard summary** → View overall health
4. **List tabs** → Choose a tab
5. **Get tab summary** → View tab health
6. **Get headers** → Get build/column information
7. **Get rows** → Get test results matrix

---

## API Limitations & Considerations for Modern UI

### 1. **No WebSocket/Real-time Updates**
- Need to poll for updates
- Suggest: Implement client-side polling with reasonable intervals (30s-60s)

### 2. **Large Payload Sizes**
- Row data can be megabytes
- Suggest: Lazy loading, virtual scrolling, progressive loading

### 3. **No Filtering/Pagination on Server**
- All filtering must be client-side
- Suggest: Implement client-side search, filter by status

### 4. **No Historical Trends API**
- Only current grid data available
- Trends must be computed from row data

### 5. **Cross-Origin Requests**
- API appears to support CORS (needs verification)
- May need proxy for production deployment

---

## Sample Dashboard Groups

| Group | Description |
|-------|-------------|
| `sig-release` | Kubernetes release blocking/informing tests |
| `sig-node` | Node-related tests |
| `sig-network` | Networking tests |
| `google` | Google-managed tests |
| `amazon` | AWS/Amazon EC2 tests |
| `conformance` | Conformance test suites |

---

## Next Steps / Questions for You


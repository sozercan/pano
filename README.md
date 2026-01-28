# Pano

A modern, subscription-based viewer for [TestGrid](https://testgrid.k8s.io/) dashboards with desktop notification support.

## Features

- **Dashboard Navigation** - Browse TestGrid dashboard groups, dashboards, and tabs with an intuitive accordion sidebar
- **Virtual Scrolling Grid** - Efficiently render thousands of test results with virtual scrolling
- **Subscriptions** - Subscribe to dashboards, tabs, or individual tests to track their status
- **Global Search** - Quick search across all groups, dashboards, and tabs (`Cmd/Ctrl+K`)
- **Grid Filtering** - Filter test results by status (pass/fail/skip/flaky) or name pattern
- **Dark/Light Mode** - System-aware theme with manual toggle
- **Offline Support** - View cached data when offline with status indicators
- **Real-time Updates** - Auto-refreshing data with configurable intervals

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | [Bun](https://bun.sh/) 1.2+ |
| Frontend | [React](https://react.dev/) 19 |
| Build Tool | [Vite](https://vitejs.dev/) 6 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 4 |
| State Management | [Zustand](https://zustand-demo.pmnd.rs/) 5 |
| Data Fetching | [TanStack Query](https://tanstack.com/query) 5 |
| Routing | [TanStack Router](https://tanstack.com/router) |
| Schema Validation | [Zod](https://zod.dev/) 3 |
| UI Primitives | [Radix UI](https://www.radix-ui.com/) |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.2 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/pano.git
cd pano

# Install dependencies
bun install
```

### Development

```bash
# Start development server (frontend + hot reload)
bun run dev
```

The app will be available at http://localhost:5173

### Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Building

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
pano/
├── src/
│   ├── frontend/               # React application
│   │   ├── components/         # React components
│   │   │   ├── dashboard/      # Dashboard views
│   │   │   ├── grid/           # Test grid components
│   │   │   ├── layout/         # App shell, sidebar, header
│   │   │   ├── search/         # Global search modal
│   │   │   └── subscriptions/  # Subscription management
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand stores
│   │   ├── routes/             # TanStack Router routes
│   │   ├── lib/                # Utilities
│   │   └── styles/             # Global styles
│   └── shared/                 # Shared code (schemas, types)
│       └── schemas/            # Zod schemas for API responses
├── tests/                      # Test files
├── public/                     # Static assets
└── .github/workflows/          # CI/CD workflows
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |

### TestGrid API

The app fetches data directly from the TestGrid API at `https://testgrid-api.prow.k8s.io/api/v1`.

## Usage

### Navigation

1. **Sidebar** - Click on dashboard groups to expand and see dashboards
2. **Dashboard View** - Shows tab summaries with status indicators
3. **Tab View** - Displays the full test results grid

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open global search |
| `↑ / ↓` | Navigate search results |
| `Enter` | Select search result |
| `Escape` | Close search/dialogs |

### Subscriptions

1. Click the bell icon or "Subscribe" button on any dashboard, tab, or test
2. View all subscriptions in the "Subscribed" view
3. Export/import subscriptions as JSON for backup

### Grid Filtering

On any tab's test grid:
- **Text filter** - Type to filter tests by name
- **Status filter** - Dropdown to show only pass/fail/skip/flaky
- **Failures only** - Toggle to show only failing tests

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`bun test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [TestGrid](https://github.com/GoogleCloudPlatform/testgrid) - The CI/CD dashboard system
- [Kubernetes](https://kubernetes.io/) - The TestGrid data source

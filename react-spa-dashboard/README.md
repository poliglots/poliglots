# 🎨 React SPA Dashboard

Real-time IoT monitoring dashboard built with React, TypeScript, and Node.js.

## Features

- **Real-time Updates** — WebSocket live telemetry stream
- **Interactive Charts** — Recharts-based time-series visualizations
- **Device Management** — View, filter, and control connected devices
- **Alerting** — Configurable thresholds with notification system
- **Dark/Light Theme** — Theme toggle with persistent preference
- **Responsive** — Mobile-first design with Tailwind CSS
- **Offline Support** — Service worker for offline data caching

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
react-spa-dashboard/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── charts/      # Recharts chart components
│   │   ├── device/      # Device cards and controls
│   │   └── layout/      # Header, sidebar, main layout
│   ├── pages/           # Route-level pages
│   │   ├── Dashboard.tsx
│   │   ├── Devices.tsx
│   │   ├── Telemetry.tsx
│   │   └── Settings.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useWebSocket.ts
│   │   └── useDeviceStore.ts
│   ├── services/        # API client layer
│   │   └── api.ts
│   ├── stores/          # Zustand state stores
│   ├── utils/           # Helpers and formatters
│   └── assets/          # Images, icons, styles
├── public/              # Static assets
└── package.json
```

## Tech Stack

- **Framework:** React 18+ with Vite
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **State:** Zustand + React Query
- **WebSocket:** Native WebSocket API
- **Testing:** Vitest + Testing Library

## Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview with real-time charts and KPIs |
| **Devices** | Device inventory with search/filter |
| **Telemetry** | Historical data explorer with custom date ranges |
| **Alerts** | Active alerts and threshold configuration |
| **Settings** | User preferences and notification settings |

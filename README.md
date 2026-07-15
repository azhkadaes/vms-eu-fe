# VMS Back Office

Visitor Management System admin back office built with TanStack Start, React, TypeScript, and Tailwind CSS.

It is currently wired to a mock repository layer, so the UI works end-to-end without a backend. The intended backend contract is documented in [api_contract.md](api_contract.md).

## What It Does

- Manage visitor bookings.
- Check visitors in and out.
- Maintain employees, roles, permissions, and officer assignments.
- Manage integration API keys.
- Review audit logs and export reports.
- View analytics and booking trends.

## Tech Stack

- TanStack Start
- React 19
- TypeScript
- TanStack Router
- TanStack Query
- Tailwind CSS v4
- Radix UI
- Recharts
- Sonner

## Project Structure

- `src/routes/` route pages and layout routes
- `src/components/` UI and page components
- `src/app/` app-level contexts, queries, and repository wiring
- `src/data/` mock data layer and shared repository interfaces
- `src/domain/` domain types and permission logic

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

## Environment

The frontend expects `VITE_API_BASE_URL` when the mock repository layer is swapped for a real API client.

## Notes

- Routes are file-based under `src/routes/`.
- The current session flow is demo/mock only.
- UI filtering and search are client-side.
- `src/data/README.md` and `src/routes/README.md` document repo conventions and the route layout.

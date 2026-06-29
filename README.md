# VMS Booking App

Responsive visitor booking app for Otorita IKN built with React, TypeScript, and Vite.

## What it does

- Lets visitors create a booking through a multi-step form
- Generates a 6-digit PIN for booking lookup
- Lets users check booking status by PIN
- Stores demo booking data in `localStorage`
- Uses a full-screen responsive UI instead of a phone-frame layout

## Tech Stack

- React 18
- TypeScript
- Vite
- motion/react
- lucide-react
- Tailwind CSS utilities and custom styles

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Project Notes

- The app currently runs without a real backend; booking and PIN lookup behavior are inferred from the UI flow.
- API expectations are documented in [API_CONTRACT.md](API_CONTRACT.md).
- The mock PIN lookup data expires after 3 months in the browser store.

## Repository Structure

- `src/app/App.tsx` - main application logic and screens
- `src/styles/` - global styles and theme files
- `src/imports/` - bundled image assets
- `API_CONTRACT.md` - inferred API and schema contract

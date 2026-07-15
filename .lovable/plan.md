# NUSANTARA Visitor Management — Backoffice Frontend

React + TanStack Start + Tailwind v4 + shadcn. Frontend-only, mock in-memory repositories, structured so a Go REST backend can plug in by replacing only the data layer.

## Architecture (deliberately lightweight)

```
src/
  domain/                    // pure types + use-case functions (backend contract)
    types.ts                 // Employee, Role, Permission, Officer, Booking, ...
    permissions.ts           // FEATURE_KEYS constant + hasPermission(user, key)
    bookings.ts              // deriveIsVip(b, officer), canApprove(user, booking), scopeBookings(user, list)

  data/                      // repository interfaces + mock implementations
    types.ts                 // BookingRepository, EmployeeRepository, RoleRepository,
                             // OfficerRepository, IntegrationRepository, LogRepository,
                             // AnalyticsRepository, SessionRepository
    mock/
      seed.ts                // seed arrays matching the ERD
      bookingRepo.ts         // implements BookingRepository against in-memory store
      employeeRepo.ts
      roleRepo.ts
      officerRepo.ts
      integrationRepo.ts
      logRepo.ts
      analyticsRepo.ts
      sessionRepo.ts
      store.ts               // shared in-memory store, localStorage-persisted

  app/
    RepositoriesContext.tsx  // provides { bookings, employees, roles, ... }
    SessionContext.tsx       // current mock user + role switcher
    useRepos()               // hook wrapping useContext
    RoleGate.tsx             // <RoleGate feature="booking.approve">...</RoleGate>

  components/                // dumb / presentational (no fetching, no rules)
    shell/{AppShell,AppSidebar,TopBar,UserMenu,RoleSwitcher,NotificationBell}
    ui/                      // shadcn primitives
    data/{DataTable,ResponsiveTable,StatusBadge,StatCard,ActionTile,EmptyState,PageHeader}
    dialogs/{ConfirmDialog,FormDialog,CodeInputDialog,QrScanDialog,BookingFormDialog}

  routes/                    // pages — fetch via repos through TanStack Query hooks
```

**Rules:**
- Components never touch mock arrays directly. They call `useBookings()` etc., which use `useRepos()` + TanStack Query.
- Every repo method is `async` and returns Promises, so signatures already match a `fetch()` implementation.
- Swap to Go = one new file per repo (`data/http/bookingRepo.ts`) implementing the same interface, then change the provider in `RepositoriesContext`. No component changes.
- Domain functions (`canApprove`, `deriveIsVip`, `scopeBookings`) live in `domain/`, tested-able, reused by pages and guards.
- No Redux, no Zustand — Context + `useReducer` where needed.

## Design system

Tokens in `src/styles.css` via `@theme inline` (oklch):
- `--background` warm off-white `#faf8f5`, `--muted` page canvas light gray, `--card` white.
- `--primary` orange `#f5a623` (active nav + primary CTAs), pill-shaped buttons matching the mockups.
- Status tokens: `--success`, `--warning`, `--destructive`, `--info`, `--vip` (gold) — consumed by `StatusBadge`.
- Fonts: Space Grotesk (display) + DM Sans (body), loaded via `<link>` in `__root.tsx`. Registered as `--font-display` / `--font-sans`.
- Radius `0.75rem` for cards; sidebar active pill uses full `--primary` background + white text.
- All colors semantic — no hex/`text-white` in components.

## Responsiveness (Tailwind defaults sm/md/lg/xl)

- **Sidebar:** `md:` and up = fixed rail (`Sidebar collapsible="icon"`). Below `md` = off-canvas drawer via `SidebarTrigger` in the top bar. Top bar always visible.
- **Tables:** `ResponsiveTable` wraps `DataTable`. `md:` and up renders a normal table; below `md` renders each row as a card (`ResponsiveRowCard`) with label/value pairs stacked vertically and actions in a bottom row. No pure horizontal scroll.
- **Dialogs & forms:** full-width on mobile (`sm:max-w-lg` on larger), thumb-friendly buttons (`h-11` on mobile).
- **KPI grids:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- **Search bar in top bar:** collapses to an icon-only trigger below `sm`, opens a sheet.

## Routes

```
/                       -> redirect to /dashboard
/_app                   -> pathless layout: <AppShell> + <Outlet />
  /dashboard
  /today
  /analytics
  /booking              /booking/$id (drawer route)
  /check-in
  /check-out
  /employees
  /roles
  /integration
  /logs
/unauthorized
```

Each route has its own `head()` (title + description). `beforeLoad` calls `requirePermission("<feature.action>")`; failure → redirect `/unauthorized`.

Root shell head: "NUSANTARA — Visitor Management Backoffice".

## Data model (mirrors the ERD 1:1)

`src/domain/types.ts` types match the schema:
`Employee`, `Role`, `Permission` (`{id, featureKey, description}`), `RolePermission`, `EmployeeRole`, `Officer` (`{id, name, isVip}`), `EmployeeOfficerAssignment`, `Booking` (`{id, officerId, visitorName, date, time, location, agenda, bookingCode, status, checkedInAt?, checkedOutAt?}`), `IntegrationKey`, `AuditLog`.

`isVip` on a booking is a **derived** getter: `deriveIsVip(booking, officers)` — never stored. Any UI badge/filter/count calls this.

Seed data includes: 1 Head of Otorita officer with `isVip=true`, ~4 regular officers, ~12 employees across 4 roles, permission set covering every feature action, ~30 bookings across statuses and dates.

## RBAC — driven by `role_permission`, not role names

Feature keys (in `domain/permissions.ts`):

```
dashboard.view         today.view          analytics.view
booking.view           booking.create      booking.update       booking.delete
booking.approve        booking.reject      booking.reschedule
checkin.perform        checkout.perform
employee.manage        role.manage         integration.manage
logs.export            report.download
```

Seed `role_permission` per the matrix in section 5. A permission may be scoped: the domain layer's `scopeBookings(user, bookings)` returns the visible slice (PA → assigned officer, Protocol Officer → all with edit rights only on VIP officer's, Receptionist/others → all). Scoping is one function, called by every list page — no `if (role === ...)` in components.

`<RoleGate feature="booking.approve">` hides UI. Route `beforeLoad` calls the same `hasPermission` for defense-in-depth. Sidebar items filter through the same predicate.

**Role switcher** lives in the `UserMenu` (top-right). Persists to localStorage. Changing role updates `SessionContext` → the sidebar, page guards, and buttons re-render automatically because everything reads from permissions.

## Screens

1. **Dashboard** — KPI cards (Accepted / Pending / Rejected) + Bookings panel + Today's Visit table + Check-in/out counters + Tomorrow's visitors + Total Visitor trend line (Recharts). Data comes from repos, scoped via `scopeBookings`.
2. **Today's Visit** — filterable table (Waktu / Visitor / Lokasi / Agenda / Status), defaults to today.
3. **Analytics** — year selector, VIP vs Regular trend line, KPI tiles (Total / VIP / VVIP / Peak Time / Regular / Service & Utility). VVIP is a subclass of VIP officers flagged in seed.
4. **Booking** — `ResponsiveTable` (Tanggal / Waktu / Visitor / Lokasi / Agenda / Kode Booking / Status), search + filter popover + sort + pagination. Row → drawer with Approve/Reject/Reschedule/Edit/Delete gated by permissions. "New Booking" dialog.
5. **Check-In / Check-Out** — filtered booking list + three `ActionTile`s:
   - **On Site** → searchable booking picker → confirm → status + timestamp update.
   - **Input Code** → `CodeInputDialog` with validation (unknown / wrong day / already checked in) → success toast.
   - **Scan QR** → `QrScanDialog` using `@zxing/browser` on `getUserMedia`; manual fallback and dev "simulate scan" button; camera permission error state.
   Successful check-in/out mutates via `bookingRepo.checkIn(id, by)` and invalidates query keys so Dashboard/Today update immediately.
6. **Employee Directory** (Super Admin) — card grid with name/employee_number/department/role badges. Add/Edit/Delete.
7. **Roles** (Super Admin) — table (Nama / Jabatan / Unit / Roles / Action). Edit dialog: multi-select roles for the employee, officer assignment (for PA / Protocol Officer). Second tab: role-permission matrix editor (checkboxes over feature keys).
8. **Integration** (Super Admin) — three cards (Database / Turnstile / FrontEnd) with masked key inputs, Submit → repo update + toast.
9. **Log History & Report** (Super Admin) — Export Log CSV (email input + generate blob + download + "sent to email" mock toast); Download Report (same pattern).

## Dependencies

Add: `recharts`, `@zxing/browser`, `date-fns`, `sonner`.
Add missing shadcn: `sidebar`, `dialog`, `drawer`, `sheet`, `dropdown-menu`, `table`, `popover`, `select`, `command`, `badge`, `tabs`, `form`, `checkbox`, `switch`.

## Backend swap plan (documented in `data/README.md`)

1. Create `src/data/http/<resource>Repo.ts` implementing the same interface with `fetch(API_BASE + "/...")`.
2. Read `VITE_API_BASE_URL` from env, add an `apiClient` with auth header injection.
3. Swap the provider in `RepositoriesContext` from mock repos to HTTP repos.
4. Replace `SessionContext`'s mock role switcher with a real login + JWT decode.

Nothing in `components/` or `routes/` changes.

## Out of scope

Real auth, real backend, real email, real PDF, public visitor booking app.

# API Contract

This contract is aligned to the current frontend repository interfaces in `src/data/types.ts` and the UI usage in `src/routes/`.

## Contract Rules

- Base URL comes from `VITE_API_BASE_URL`.
- The frontend does not currently attach an Authorization header.
- The frontend does not currently implement login, logout, token refresh, or server-side session bootstrap.
- List endpoints return full collections; the UI filters, searches, and paginates client-side.
- IDs are strings everywhere.
- JSON is the default request and response format.
- Null values are only used where the frontend already expects them, such as `session.current()` returning no active user.

## Common Error Shape

When returning structured errors, use this envelope:

    {
      "code": "STRING_CODE",
      "message": "Human readable error",
      "field": "optional_field_name"
    }

Recommended transport semantics:

- 400 for malformed JSON or malformed request shape.
- 401 for unauthenticated requests.
- 403 for authenticated-but-forbidden requests.
- 404 for missing resources.
- 409 for unique constraint conflicts or invalid state transitions.
- 422 for validation failures.
- 500 for unexpected server errors.

## Session

### GET /session/current

- Returns the current resolved session or `null`.
- Authentication: not required in the current frontend contract.

Response 200:

- SessionUserResponse or null

SessionUserResponse:

- employee: EmployeeResponse
- roles: RoleResponse[]
- permissions: string[]
- assignedOfficerIds: string[]

Errors:

- 500 INTERNAL_SERVER_ERROR

### GET /session/available

- Returns all switchable sessions as a raw array.
- Authentication: not required in the current frontend contract.

Response 200:

- SessionUserResponse[]

Errors:

- 500 INTERNAL_SERVER_ERROR

### POST /session/switch

- Switches the active session.
- Authentication: not required in the current frontend contract.

Request body:

- employeeId: string, required

Response 200:

- SessionUserResponse

Errors:

- 400 VALIDATION_ERROR for empty or malformed input
- 404 EMPLOYEE_NOT_FOUND
- 500 INTERNAL_SERVER_ERROR

### POST /session/reset-demo

> Added in revision: the UI's "Switch Role (Demo)" menu has a "Reset demo data" action
> (see Image 2) with no corresponding endpoint in the original contract.

- Resets all demo data (bookings, employees, etc.) back to seed state. Intended for the demo/staging
  environment only.

Response 204:

- empty body

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

## Rooms

> Added in revision: the ERD defines `Ruangan` as its own entity (id, nama, lokasi, status_aktif),
> but bookings only stored a free-text `location`. The New Booking form needs a real list to
> populate the room dropdown, so this endpoint is added.

### GET /rooms

- Returns all active rooms, used to populate the location selector when creating/editing a booking.

Response 200:

- RoomResponse[]

RoomResponse:

- id: string
- name: string
- locationLabel: string
- statusAktif: boolean

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

## Bookings

### GET /bookings

- Returns all bookings.
- The frontend applies filtering, search, and page slicing locally.

Response 200:

- BookingResponse[]

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

### POST /bookings

- Creates a booking.

Request body:

- officerId: string, required
- visitorName: string, required
- visitorOrg: string, optional, defaults to empty string in the current UI
- date: string, required, format yyyy-mm-dd
- time: string, required, format HH:mm (visit start time)
- endTime: string, optional, format HH:mm (visit end time — added to match `waktu_selesai` on
  `Detail Kunjungan` in the ERD, which was previously not represented in the contract)
- roomId: string, required (references Rooms; replaces the old free-text `location` field —
  keep accepting `location` as a display-only echo of the room name in the response for
  backward compatibility with the current UI)
- agenda: string, optional, defaults to empty string in the current UI
- category: string, required, allowed values regular or service_utility
- visitorIdNumber: string, optional (maps to `nomor_identitas` on `Pengunjung`)
- visitorPhone: string, optional (maps to `nomor_telpon` on `Pengunjung`)
- visitorEmail: string, optional, should be a valid email if present (maps to `email` on `Pengunjung`)
- visitorHeadcount: number, optional, defaults to 1 (maps to `jumlah_pengunjung` on `Pengunjung`)

> Note: the ERD models the visitor (`Pengunjung`) as an entity independent from the visit
> (`Kunjungan`/`Detail Kunjungan`), which would normally imply a visitor could be reused across
> multiple bookings. Since the current UI has no visitor-management screen and always creates
> booking + visitor together, this contract keeps visitor fields inline on the booking request
> rather than introducing separate `/visitors` endpoints. Revisit if the product later needs to
> look up or reuse existing visitors.

Response 201:

- BookingResponse

Errors:

- 400 VALIDATION_ERROR for malformed JSON or missing required fields
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 422 OFFICER_NOT_FOUND, ROOM_NOT_FOUND, or VALIDATION_ERROR
- 500 INTERNAL_SERVER_ERROR

### PATCH /bookings/{id}

- Partially updates a booking.

Request path:

- id: string, required

Request body fields are optional:

- officerId: string
- visitorName: string
- visitorOrg: string
- date: string
- time: string
- endTime: string
- roomId: string
- agenda: string
- category: string, allowed values regular or service_utility
- visitorIdNumber: string
- visitorPhone: string
- visitorEmail: string, should be a valid email if present
- visitorHeadcount: number

Response 200:

- BookingResponse

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 BOOKING_NOT_FOUND
- 409 INVALID_BOOKING_STATE
- 422 VALIDATION_ERROR
- 500 INTERNAL_SERVER_ERROR

### DELETE /bookings/{id}

- Deletes a booking.

Response 204:

- empty body

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 BOOKING_NOT_FOUND
- 500 INTERNAL_SERVER_ERROR

### POST /bookings/{id}/status

- Changes a booking status.

Request body:

- status: string, required, allowed values accepted, rejected, reschedule

Response 200:

- BookingResponse

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 BOOKING_NOT_FOUND
- 409 INVALID_BOOKING_STATE
- 500 INTERNAL_SERVER_ERROR

> Clarified: booking creation and PIN issuance happen on the **end-user** side, not in this
> backoffice. The flow is: end-user submits a booking → gets a PIN to check approval status →
> once an admin/backoffice user approves it (`POST /bookings/{id}/status` with `accepted`) → the
> end-user side receives a QR code. Generating and delivering that QR code is therefore **not** a
> backoffice-triggered action and is out of scope for this contract — it should happen
> automatically on the backend (or in the end-user app's own API) the moment status flips to
> `accepted`, not via a button/call from the backoffice UI. The `QR Kunjungan` entity in the ERD
> still needs a create path, but it belongs in the end-user/booking API contract, not here.
>
> What the backoffice *does* need is the ability to **scan and verify** a QR at the door
> (reception/security check-in), so that part of the original QR design stays below.

### POST /bookings/verify-qr

- Validates a scanned QR token and, if valid, performs check-in (equivalent to
  `POST /bookings/{id}/check-in` but looked up by token instead of id). This is the only
  QR-related action the backoffice UI needs — used by reception/security when a visitor arrives.

Request body:

- qrToken: string, required
- by: string, required

Response 200:

- BookingResponse

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 QR_TOKEN_NOT_FOUND
- 409 QR_TOKEN_EXPIRED, QR_TOKEN_REVOKED, or BOOKING_CODE_NOT_ELIGIBLE
- 500 INTERNAL_SERVER_ERROR

### POST /bookings/{id}/check-in

- Checks a visitor in.

Request body:

- by: string, required

Response 200:

- BookingResponse

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 BOOKING_NOT_FOUND
- 409 BOOKING_CODE_NOT_ELIGIBLE
- 500 INTERNAL_SERVER_ERROR

### POST /bookings/{id}/check-out

- Checks a visitor out.

Request body:

- by: string, required

Response 200:

- BookingResponse

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 BOOKING_NOT_FOUND
- 409 BOOKING_NOT_CHECKED_IN
- 500 INTERNAL_SERVER_ERROR

## Employees

### GET /employees

- Returns all employees.

Response 200:

- EmployeeResponse[]

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

### POST /employees

- Creates an employee.

Request body:

- name: string, required
- employeeNumber: string, required
- department: string, optional
- jabatan: string, optional
- unit: string, optional
- email: string, optional, should be a valid email if present
- phone: string, optional

Response 201:

- EmployeeResponse

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 409 EMPLOYEE_NUMBER_ALREADY_EXISTS
- 422 VALIDATION_ERROR
- 500 INTERNAL_SERVER_ERROR

### PATCH /employees/{id}

- Partially updates an employee.

Request path:

- id: string, required

Request body fields are optional:

- name: string
- employeeNumber: string
- department: string
- jabatan: string
- unit: string
- email: string, should be a valid email if present
- phone: string

Response 200:

- EmployeeResponse

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 EMPLOYEE_NOT_FOUND
- 409 EMPLOYEE_NUMBER_ALREADY_EXISTS
- 422 VALIDATION_ERROR
- 500 INTERNAL_SERVER_ERROR

### DELETE /employees/{id}

- Deletes an employee.

Response 204:

- empty body

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 EMPLOYEE_NOT_FOUND
- 500 INTERNAL_SERVER_ERROR

## Officers

### GET /officers

- Returns all officers.

Response 200:

- OfficerResponse[]

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

## Roles and Permissions

### GET /roles

- Returns all roles.

Response 200:

- RoleResponse[]

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

### GET /permissions

- Returns all permissions.

Response 200:

- PermissionResponse[]

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

### GET /role-permissions

- Returns all role-permission links.

Response 200:

- RolePermissionResponse[]

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

### PUT /roles/{roleId}/permissions

- Replaces the complete permission set for one role.

Request path:

- roleId: string, required

Request body:

- permissionIds: string[], required

Response 204:

- empty body

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 ROLE_NOT_FOUND
- 422 PERMISSION_NOT_FOUND
- 500 INTERNAL_SERVER_ERROR

### GET /employee-roles

- Returns all employee-role links.

Response 200:

- EmployeeRoleResponse[]

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

### PUT /employees/{employeeId}/roles

- Replaces the complete role set for one employee.

Request path:

- employeeId: string, required

Request body:

- roleIds: string[], required

Response 204:

- empty body

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 EMPLOYEE_NOT_FOUND
- 422 ROLE_NOT_FOUND
- 500 INTERNAL_SERVER_ERROR

### GET /employee-officer-assignments

- Returns all employee-officer assignments.

Response 200:

- EmployeeOfficerAssignmentResponse[]

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

### PUT /employees/{employeeId}/officers

- Replaces the complete officer assignment set for one employee.

Request path:

- employeeId: string, required

Request body:

- officerIds: string[], required

Response 204:

- empty body

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 EMPLOYEE_NOT_FOUND
- 422 OFFICER_NOT_FOUND
- 500 INTERNAL_SERVER_ERROR

## Integrations

### GET /integrations

- Returns all integration keys.

Response 200:

- IntegrationResponse[]

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

### PATCH /integrations/{id}

- Updates the API key for one integration.

Request path:

- id: string, required

Request body:

- apiKey: string, required

Response 200:

- IntegrationResponse

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 404 INTEGRATION_NOT_FOUND
- 422 VALIDATION_ERROR
- 500 INTERNAL_SERVER_ERROR

## Logs and Reports

### GET /logs

- Returns audit logs.

Response 200:

- AuditLogResponse[]

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

### POST /logs/export-csv

- Generates a CSV export of audit logs and records the destination email.

Request body:

- email: string, required, valid email

Response 200:

- CsvExportResponse

CsvExportResponse:

- csv: string
- sentTo: string

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 422 VALIDATION_ERROR
- 500 INTERNAL_SERVER_ERROR

### POST /reports/download

- Generates a CSV visitor report and records the destination email.

Request body:

- email: string, required, valid email

Response 200:

- CsvExportResponse

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 422 VALIDATION_ERROR
- 500 INTERNAL_SERVER_ERROR

## Analytics

### GET /analytics/trend?year={year}

- Returns the monthly trend for one year.

Query parameters:

- year: integer, required

Response 200:

- AnalyticsTrendItemResponse[]

AnalyticsTrendItemResponse:

- month: string
- vip: number
- regular: number

Errors:

- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

### GET /analytics/kpis

- Returns dashboard KPI counts.

Response 200:

- AnalyticsKpisResponse

AnalyticsKpisResponse:

- total: number
- vip: number
- vvip: number
- regular: number
- serviceUtility: number
- peakTime: string

Errors:

- 401 UNAUTHORIZED
- 403 FORBIDDEN
- 500 INTERNAL_SERVER_ERROR

## Canonical Response Shapes

EmployeeResponse:

- id: string
- name: string
- employeeNumber: string
- department: string
- jabatan: string
- unit: string
- email: string
- phone: string

RoleResponse:

- id: string
- name: string
- description: string

PermissionResponse:

- id: string
- featureKey: string
- description: string

RolePermissionResponse:

- roleId: string
- permissionId: string

EmployeeRoleResponse:

- employeeId: string
- roleId: string

EmployeeOfficerAssignmentResponse:

- employeeId: string
- officerId: string

OfficerResponse:

- id: string
- name: string
- jabatan: string
- isVip: boolean (derived from `Jabatan.pejabat_vip` — a trait of the job title)
- isVvip: boolean (derived from `Pejabat.is_vvip` — a trait of the individual official; see
  "Known Schema Gaps" below, this requires a new column)

BookingResponse:

- id: string
- officerId: string
- visitorName: string
- visitorOrg: string
- date: string
- time: string
- endTime: string or null
- roomId: string
- location: string (denormalized room name, kept for the current UI's display columns)
- agenda: string
- bookingCode: string
- status: string
- category: string
- visitorIdNumber: string or null
- visitorPhone: string or null
- visitorEmail: string or null
- visitorHeadcount: number
- checkedInAt: string or null
- checkedOutAt: string or null
- checkedInBy: string or null
- checkedOutBy: string or null
- createdAt: string

IntegrationResponse:

- id: string
- name: string
- apiKey: string
- active: boolean
- createdAt: string

AuditLogResponse:

- id: string
- employeeId: string
- actorName: string
- kind: string
- date: string
- description: string
- ipAddress: string

## Not Part of the Current Frontend Contract

- No login, logout, refresh, or password flows are currently wired in the UI.
- No server-side pagination, search, or sorting parameters are currently consumed by the UI.
- No dedicated booking lookup-by-code endpoint is currently used by the UI; code lookup happens client-side.
- No transport-level auth header shape is currently implemented in the frontend.

## Known Schema Gaps (need product/backend decision, not resolved by this revision)

1. **VVIP is derived per-officer, not per-jabatan — `Pejabat` needs its own flag.** Confirmed with
   product: VVIP status depends on the specific individual official, not their job title. Example:
   if a visitor's booking to meet a particular official (e.g. "Pak Basuki") is approved, that
   booking becomes VVIP — regardless of what `Jabatan` that official holds. Two officers sharing
   the same `Jabatan` can have different VVIP status. This means the existing `pejabat_vip: bool`
   on `Jabatan` is the wrong table for this: it correctly drives **VIP** (a jabatan-level trait),
   but **VVIP** needs a new boolean column directly on `Pejabat` (e.g. `is_vvip`), independent of
   `id_jabatan`. `OfficerResponse.isVvip` should be read from that new `Pejabat.is_vvip` column,
   and a booking's VVIP status is simply "was this booking's `officerId` VVIP at approval time" —
   no separate flag is needed on `Kunjungan`/`BookingResponse` beyond what's derivable from the
   officer. Action item: add `is_vvip: bool NOT NULL DEFAULT false` to `Pejabat` in the ERD.
2. **Role → Policy → Permission chain is flattened in this contract.** The ERD models
   `Role -> RolePolicy -> Policy -> PolicyPermission -> Permission`, with `Permission` itself
   composed from `Feature` + `Action`. This contract intentionally exposes only the simplified
   `Role <-> Permission` shape (`RolePermissionResponse`) because that's all the current UI
   consumes. If a future admin screen needs to manage Policies directly, add `/policies`,
   `/role-policies`, `/policy-permissions`, `/features`, and `/actions` endpoints mirroring the
   ERD.
3. **Audit metadata on Role/Policy/Permission tables is not exposed.** `created_at`,
   `created_by`, `updated_at`, `updated_by`, and `status_aktif` exist on `Role`, `Policy`,
   `RolePolicy`, `Permission`, and `PolicyPermission` in the ERD but are omitted from
   `RoleResponse`/`PermissionResponse`/`RolePermissionResponse` since the current UI doesn't
   display them. Documented here so the omission is a deliberate choice, not an oversight.
4. **`File Storage` is unused.** The ERD has a `File Storage` entity referenced by `Pengunjung`
   (likely for an ID photo or supporting document), but no upload/attach endpoint exists and no
   UI screen currently shows this. Confirm with product whether this is planned before adding
   endpoints for it.
5. **Employee fields `kedeputian` and `direktorat` on `Pegawai` are not clearly mapped.**
   `EmployeeResponse` has `department` and `unit`, which likely correspond to `direktorat` and
   `kedeputian`, but the naming isn't confirmed 1:1. Clarify the mapping with the backend team
   before implementation to avoid silently swapped fields.
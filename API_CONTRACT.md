# VMS API Design Contract

This contract is derived from the frontend behavior in `src/app/App.tsx`.

Important note: no outbound HTTP/WebSocket/GraphQL calls were found in the codebase. The endpoints below are **inferred** from UI behavior, component state, and the booking/PIN flow the frontend expects a backend to support.

## Feature: Booking Creation

### 1. Endpoint

`POST /bookings`

### 2. HTTP Method

`POST` — the UI submits a new booking request from the confirmation screen.

### 3. Request Parameters

- Path params: none
- Query params: none
- Required headers:
  - `Content-Type: application/json`
  - `Accept: application/json`
- Authentication headers/cookies: none observed in the UI

### 4. Request Body

JSON object based on the booking form state.

| Field              | Type    | Required | Validation visible in frontend                                             |
| ------------------ | ------- | -------- | -------------------------------------------------------------------------- |
| `pejabat`          | string  | yes      | Selected from a fixed dropdown list                                        |
| `tanggal`          | string  | yes      | Date input; min is today (`YYYY-MM-DD`)                                    |
| `waktuMulai`       | string  | yes      | Selected from fixed time-slot options                                      |
| `waktuSelesai`     | string  | yes      | Must be later than `waktuMulai`                                            |
| `keperluan`        | string  | yes      | Selected from a fixed dropdown list                                        |
| `keperluanLain`    | string  | yes      | Required when `keperluan === "Lainnya"`; otherwise empty string is allowed |
| `catatan`          | string  | yes      | Optional free text; UI initializes as empty string                         |
| `namaLengkap`      | string  | yes      | Free text                                                                  |
| `nomorIdentitas`   | string  | yes      | Free text                                                                  |
| `asalInstansi`     | string  | yes      | Free text                                                                  |
| `nomorTelepon`     | string  | yes      | Free text, phone format implied but not strictly validated in UI           |
| `email`            | string  | yes      | Email input; HTML `type="email"`                                           |
| `jumlahPengunjung` | integer | yes      | Digits only in UI; backend should normalize to integer                     |

Observed client-side rules:

- `waktuSelesai` options are filtered to only times after `waktuMulai`.
- `jumlahPengunjung` is sanitized to digits only.
- The UI allows submission only when required fields are present and the time range is valid.
- `pejabat` is selected from a fixed list in the UI, but should be stored through a dedicated officers table in the backend.

### 5. Response Format

The UI only needs a booking PIN on success.

```json
{
  "pin": "123456"
}
```

Minimal response schema:

- `pin`: string, 6 digits, required

### 6. Status Codes

- `201 Created` — booking created successfully and PIN generated
- `400 Bad Request` — malformed JSON or structurally invalid payload
- `401 Unauthorized` — not expected from current UI; include only if backend later adds auth
- `403 Forbidden` — not expected from current UI; include only if backend later adds auth/authorization
- `409 Conflict` — duplicate booking or PIN collision if backend enforces uniqueness
- `422 Unprocessable Entity` — semantic validation failed, for example invalid time range or missing required field
- `500 Internal Server Error` — unexpected server failure

### 7. Authentication

- Scheme: none
- Attachment: none

The current frontend shows no login/session/token flow and no auth headers.

### 8. Error Handling

Suggested error shape inferred from UI patterns and the need for field-level validation:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "field": "waktuSelesai"
  }
}
```

Possible error codes/messages:

- `invalid_request` — malformed JSON or missing body
- `validation_error` — one or more fields failed validation
- `invalid_time_range` — `waktuSelesai` is not after `waktuMulai`
- `duplicate_booking` — booking or PIN collision
- `internal_error` — unexpected server failure

---

## Feature: Booking Status Lookup by PIN

### 1. Endpoint

`GET /bookings/{pin}`

### 2. HTTP Method

`GET` — the UI retrieves booking status by entering a PIN.

### 3. Request Parameters

- Path params:
  - `pin` — string, required, 6-digit PIN entered on the PIN lookup screen
- Query params: none
- Required headers:
  - `Accept: application/json`
- Authentication headers/cookies: none observed in the UI

### 4. Request Body

None.

### 5. Response Format

The lookup screen consumes a booking record with status and expiry metadata.

```json
{
  "pin": "123456",
  "status": "menunggu",
  "tanggal": "2025-08-15",
  "waktu": "10:00 - 11:00",
  "keperluan": "Koordinasi Investasi",
  "nama": "Budi Santoso",
  "catatan": "optional",
  "issuedAt": "2025-06-29T12:00:00.000Z",
  "expiresAt": "2025-09-29T12:00:00.000Z"
}
```

Minimal response schema:

- `pin`: string, 6 digits, required
- `status`: string, required
- `tanggal`: string, required, date-like value
- `waktu`: string, required, formatted time range string
- `keperluan`: string, required
- `nama`: string, required
- `issuedAt`: string, required, ISO datetime
- `expiresAt`: string, required, ISO datetime
- `catatan`: string, optional

### 6. Status Codes

- `200 OK` — booking found and still valid
- `400 Bad Request` — PIN is missing or not a 6-digit numeric string
- `401 Unauthorized` — not expected from current UI; include only if backend later adds auth
- `403 Forbidden` — not expected from current UI; include only if backend later adds auth/authorization
- `404 Not Found` — PIN does not exist
- `410 Gone` — PIN exists but has expired and is no longer usable
- `500 Internal Server Error` — unexpected server failure

### 7. Authentication

- Scheme: none
- Attachment: none

The UI shows a public PIN lookup flow with no token, session, or auth header.

### 8. Error Handling

Suggested error shape:

```json
{
  "error": {
    "code": "booking_not_found",
    "message": "PIN is not registered in the system",
    "field": "pin"
  }
}
```

Possible error codes/messages:

- `invalid_pin` — PIN must be 6 digits
- `booking_not_found` — no booking exists for the PIN
- `booking_expired` — PIN exists but is expired
- `internal_error` — unexpected server failure

---

## Database Schema

Minimal normalized schema aligned to the diagram and the backend recommendations.

### Table: `pengunjung`

| Column              | Type         | Key | Nullable | Notes                                                       |
| ------------------- | ------------ | --- | -------- | ----------------------------------------------------------- |
| `id`                | uuid         | PK  | no       | Visitor primary key                                         |
| `nama`              | string       |     | no       | Visitor name                                                |
| `nomor_identitas`   | integer      |     | no       | Identity number, normalized to integer per requested design |
| `asal_instansi`     | string       |     | no       | Visitor institution                                         |
| `nomor_telpon`      | integer      |     | no       | Phone number, stored as integer in the design image         |
| `email`             | varchar(255) |     | no       | Visitor email                                               |
| `jumlah_pengunjung` | integer      |     | no       | Confirmed as integer                                        |

### Table: `officers`

| Column | Type   | Key | Nullable | Notes                |
| ------ | ------ | --- | -------- | -------------------- |
| `id`   | uuid   | PK  | no       | Officer primary key  |
| `nama` | string |     | no       | Officer display name |

### Table: `detail_kunjungan`

| Column           | Type         | Key | Nullable | Notes                          |
| ---------------- | ------------ | --- | -------- | ------------------------------ |
| `id`             | uuid         | PK  | no       | Visit detail primary key       |
| `pejabat_id`     | uuid         | FK  | no       | References `officers.id`       |
| `tanggal`        | date         |     | no       | Visit date                     |
| `waktu_mulai`    | time         |     | no       | Confirmed as time              |
| `waktu_selesai`  | time         |     | no       | Confirmed as time              |
| `keperluan`      | enum         |     | no       | Confirmed as enum              |
| `keperluan_lain` | varchar(255) |     | yes      | Used when purpose is `Lainnya` |
| `catatan`        | string       |     | yes      | Optional note                  |

### Table: `kunjungan`

| Column                | Type    | Key | Nullable | Notes                                            |
| --------------------- | ------- | --- | -------- | ------------------------------------------------ |
| `id`                  | uuid    | PK  | no       | Visit primary key                                |
| `id_pengunjung`       | uuid    | FK  | no       | References `pengunjung.id`                       |
| `id_detail_kunjungan` | uuid    | FK  | no       | References `detail_kunjungan.id`                 |
| `pin`                 | char(6) |     | no       | 6-digit booking PIN with leading zeros preserved |

### ER Relationships

- `pengunjung` 1:N `kunjungan` via `kunjungan.id_pengunjung`
- `detail_kunjungan` 1:N `kunjungan` via `kunjungan.id_detail_kunjungan`
- `officers` 1:N `detail_kunjungan` via `detail_kunjungan.pejabat_id`

### Ambiguous Fields

- `pin` is stored as `char(6)` so the backend preserves leading zeros while still matching the 6-digit PIN format used by the UI.
- `nomor_identitas` and `nomor_telpon` are shown as integers in the diagram, which is acceptable for the backend design you confirmed, but these fields are typically safer as strings in public APIs if formatting or leading zeros matter.
- `keperluan` is modeled as an enum because the diagram and UI both imply a fixed list.

---

## Assumptions

- The attached database-design image was readable enough to align the core data types, including integer visitor count, time fields, enum purpose, and officer normalization.
- No real HTTP, GraphQL, WebSocket, or auth flow exists in the codebase today.
- The booking create endpoint is inferred from the confirmation submit action, and the PIN lookup endpoint is inferred from the PIN status screen.
- `waktu` in the lookup response is expected to be a formatted range string, not separate start/end fields, because that is what the UI renders today.
- `jumlahPengunjung` in the request body is normalized to integer in the backend contract, even though the UI input starts as text.

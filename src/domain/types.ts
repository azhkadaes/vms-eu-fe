// Current staff preview models. They are not the accepted backend contract;
// map API responses explicitly when the shared contract is implemented.

export type ID = string;

export interface Employee {
  id: ID;
  name: string;
  employeeNumber: string;
  department: string;
  jabatan: string; // job title
  unit: string;
  email: string;
  phone: string;
}

export interface Role {
  id: ID;
  name: string;
  description: string;
}

export interface Permission {
  id: ID;
  featureKey: string; // e.g. "booking.approve"
  description: string;
}

export interface RolePermission {
  roleId: ID;
  permissionId: ID;
}

export interface EmployeeRole {
  employeeId: ID;
  roleId: ID;
}

export interface Officer {
  id: ID;
  name: string;
  jabatan: string; // e.g. "Head of Otorita", "Deputy 1"
  isVip: boolean;
  isVvip?: boolean;
}

export interface EmployeeOfficerAssignment {
  employeeId: ID;
  officerId: ID;
}

export type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "reschedule"
  | "checked_in"
  | "checked_out"
  | "cancelled";

export type VisitorCategory = "regular" | "service_utility";

export interface Booking {
  id: ID;
  officerId: ID;
  visitorName: string;
  visitorOrg: string;
  date: string; // ISO yyyy-mm-dd
  time: string; // HH:mm
  location: string;
  agenda: string;
  bookingCode: string;
  status: BookingStatus;
  category: VisitorCategory;
  checkedInAt?: string; // ISO datetime
  checkedOutAt?: string;
  checkedInBy?: string;
  checkedOutBy?: string;
  createdAt: string;
}

export interface IntegrationKey {
  id: ID;
  name: string; // Database | Turnstile | FrontEnd
  apiKey: string;
  active: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: ID;
  employeeId: ID;
  actorName: string;
  kind: string;
  date: string;
  description: string;
  ipAddress: string;
}

/** Resolved session shape used by the UI. Mirrors what a JWT payload
 * would decode to on the real backend. */
export interface SessionUser {
  employee: Employee;
  roles: Role[];
  permissions: string[]; // feature keys
  assignedOfficerIds: ID[]; // for PA / Protocol Officer
}

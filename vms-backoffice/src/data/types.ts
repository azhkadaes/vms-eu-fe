// Preview repository interfaces. A future HTTP adapter must validate and map
// the approved API contract instead of assuming these mock shapes match it.

import type {
  AuditLog,
  Booking,
  BookingStatus,
  Employee,
  EmployeeOfficerAssignment,
  EmployeeRole,
  ID,
  IntegrationKey,
  Officer,
  Permission,
  Role,
  RolePermission,
  SessionUser,
  VisitorCategory,
} from "@/domain/types";

export interface BookingInput {
  officerId: ID;
  visitorName: string;
  visitorOrg: string;
  date: string;
  time: string;
  location: string;
  agenda: string;
  category: VisitorCategory;
}

export interface BookingRepository {
  list(): Promise<Booking[]>;
  get(id: ID): Promise<Booking | undefined>;
  findByCode(code: string): Promise<Booking | undefined>;
  create(input: BookingInput): Promise<Booking>;
  update(id: ID, patch: Partial<BookingInput>): Promise<Booking>;
  delete(id: ID): Promise<void>;
  setStatus(id: ID, status: BookingStatus): Promise<Booking>;
  checkIn(id: ID, by: string): Promise<Booking>;
  checkOut(id: ID, by: string): Promise<Booking>;
}

export interface EmployeeRepository {
  list(): Promise<Employee[]>;
  create(input: Omit<Employee, "id">): Promise<Employee>;
  update(id: ID, patch: Partial<Employee>): Promise<Employee>;
  delete(id: ID): Promise<void>;
}

export interface RoleRepository {
  listRoles(): Promise<Role[]>;
  listPermissions(): Promise<Permission[]>;
  listRolePermissions(): Promise<RolePermission[]>;
  setRolePermissions(roleId: ID, permissionIds: ID[]): Promise<void>;
  listEmployeeRoles(): Promise<EmployeeRole[]>;
  setEmployeeRoles(employeeId: ID, roleIds: ID[]): Promise<void>;
  listAssignments(): Promise<EmployeeOfficerAssignment[]>;
  setEmployeeOfficers(employeeId: ID, officerIds: ID[]): Promise<void>;
}

export interface OfficerRepository {
  list(): Promise<Officer[]>;
}

export interface IntegrationRepository {
  list(): Promise<IntegrationKey[]>;
  update(id: ID, apiKey: string): Promise<IntegrationKey>;
}

export interface LogRepository {
  list(): Promise<AuditLog[]>;
  exportCsv(): Promise<{ csv: string }>;
  downloadReport(): Promise<{ csv: string }>;
}

export interface AnalyticsRepository {
  yearlyTrend(year: number): Promise<{ month: string; vip: number; regular: number }[]>;
  kpis(): Promise<{
    total: number;
    vip: number;
    vvip: number;
    regular: number;
    serviceUtility: number;
    peakTime: string;
  }>;
}

export interface SessionRepository {
  current(): Promise<SessionUser | null>;
  listAvailable(): Promise<SessionUser[]>;
  switchTo(employeeId: ID): Promise<SessionUser>;
}

export interface Repositories {
  bookings: BookingRepository;
  employees: EmployeeRepository;
  roles: RoleRepository;
  officers: OfficerRepository;
  integrations: IntegrationRepository;
  logs: LogRepository;
  analytics: AnalyticsRepository;
  session: SessionRepository;
}

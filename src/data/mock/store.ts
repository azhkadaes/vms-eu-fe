// In-memory store + seed data. Persisted to localStorage on the client.
import { FEATURES } from "@/domain/permissions";
import type {
  AuditLog,
  Booking,
  Employee,
  EmployeeOfficerAssignment,
  EmployeeRole,
  IntegrationKey,
  Officer,
  Permission,
  Role,
  RolePermission,
} from "@/domain/types";

export interface DB {
  employees: Employee[];
  roles: Role[];
  permissions: Permission[];
  rolePermissions: RolePermission[];
  employeeRoles: EmployeeRole[];
  officers: Officer[];
  assignments: EmployeeOfficerAssignment[];
  bookings: Booking[];
  integrations: IntegrationKey[];
  logs: AuditLog[];
  currentEmployeeId: string;
}

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

const permissions: Permission[] = Object.entries(FEATURES).map(([k, v]) => ({
  id: `p_${v}`,
  featureKey: v,
  description: k.toLowerCase().replaceAll("_", " "),
}));

const roles: Role[] = [
  { id: "r_super", name: "Super Admin", description: "System administrator" },
  { id: "r_pa", name: "Personal Assistant", description: "Assistant to an officer" },
  { id: "r_recept", name: "Receptionist", description: "Front-desk check-in/out" },
  { id: "r_protocol", name: "Protocol Officer", description: "VIP protocol officer" },
];

const p = (key: string) => `p_${key}`;

const rolePermissions: RolePermission[] = [
  // Super Admin
  ...[
    FEATURES.EMPLOYEE_MANAGE,
    FEATURES.ROLE_MANAGE,
    FEATURES.INTEGRATION_MANAGE,
    FEATURES.LOGS_EXPORT,
    FEATURES.REPORT_DOWNLOAD,
  ].map((k) => ({ roleId: "r_super", permissionId: p(k) })),

  // Personal Assistant
  ...[
    FEATURES.DASHBOARD_VIEW,
    FEATURES.TODAY_VIEW,
    FEATURES.ANALYTICS_VIEW,
    FEATURES.BOOKING_VIEW,
    FEATURES.BOOKING_CREATE,
    FEATURES.BOOKING_UPDATE,
    FEATURES.BOOKING_DELETE,
    FEATURES.BOOKING_APPROVE,
    FEATURES.BOOKING_REJECT,
    FEATURES.BOOKING_RESCHEDULE,
  ].map((k) => ({ roleId: "r_pa", permissionId: p(k) })),

  // Receptionist
  ...[
    FEATURES.DASHBOARD_VIEW,
    FEATURES.TODAY_VIEW,
    FEATURES.BOOKING_VIEW,
    FEATURES.CHECKIN_PERFORM,
    FEATURES.CHECKOUT_PERFORM,
  ].map((k) => ({ roleId: "r_recept", permissionId: p(k) })),

  // Protocol Officer
  ...[
    FEATURES.DASHBOARD_VIEW,
    FEATURES.TODAY_VIEW,
    FEATURES.ANALYTICS_VIEW,
    FEATURES.BOOKING_VIEW,
    FEATURES.BOOKING_CREATE,
    FEATURES.BOOKING_UPDATE,
    FEATURES.BOOKING_DELETE,
    FEATURES.BOOKING_APPROVE,
    FEATURES.BOOKING_REJECT,
    FEATURES.BOOKING_RESCHEDULE,
  ].map((k) => ({ roleId: "r_protocol", permissionId: p(k) })),
];

const officers: Officer[] = [
  { id: "off_1", name: "Bambang Susanto", jabatan: "Head of Otorita", isVip: true, isVvip: true },
  { id: "off_2", name: "Rina Wijaya", jabatan: "Deputy I", isVip: false },
  { id: "off_3", name: "Ahmad Fadli", jabatan: "Deputy II", isVip: false },
  { id: "off_4", name: "Siti Nurhaliza", jabatan: "Director of Planning", isVip: false },
];

const employees: Employee[] = [
  {
    id: "emp_1",
    name: "Ahmad Rizki",
    employeeNumber: "IKN-0001",
    department: "Executive Office",
    jabatan: "Super Admin",
    unit: "IT",
    email: "ahmad.rizki@ikn.go.id",
    phone: "+62 812 0000 0001",
  },
  {
    id: "emp_2",
    name: "Dewi Lestari",
    employeeNumber: "IKN-0002",
    department: "Head of Otorita Office",
    jabatan: "Personal Assistant",
    unit: "Executive",
    email: "dewi.lestari@ikn.go.id",
    phone: "+62 812 0000 0002",
  },
  {
    id: "emp_3",
    name: "Budi Santoso",
    employeeNumber: "IKN-0003",
    department: "Front Office",
    jabatan: "Receptionist",
    unit: "Operations",
    email: "budi.santoso@ikn.go.id",
    phone: "+62 812 0000 0003",
  },
  {
    id: "emp_4",
    name: "Maya Anggraini",
    employeeNumber: "IKN-0004",
    department: "Protocol",
    jabatan: "Protocol Officer",
    unit: "Executive",
    email: "maya.anggraini@ikn.go.id",
    phone: "+62 812 0000 0004",
  },
  {
    id: "emp_5",
    name: "Rangga Pratama",
    employeeNumber: "IKN-0005",
    department: "Deputy I Office",
    jabatan: "Personal Assistant",
    unit: "Executive",
    email: "rangga.pratama@ikn.go.id",
    phone: "+62 812 0000 0005",
  },
  {
    id: "emp_6",
    name: "Sinta Puspita",
    employeeNumber: "IKN-0006",
    department: "Front Office",
    jabatan: "Receptionist",
    unit: "Operations",
    email: "sinta.puspita@ikn.go.id",
    phone: "+62 812 0000 0006",
  },
];

const employeeRoles: EmployeeRole[] = [
  { employeeId: "emp_1", roleId: "r_super" },
  { employeeId: "emp_2", roleId: "r_pa" },
  { employeeId: "emp_3", roleId: "r_recept" },
  { employeeId: "emp_4", roleId: "r_protocol" },
  { employeeId: "emp_5", roleId: "r_pa" },
  { employeeId: "emp_6", roleId: "r_recept" },
];

const assignments: EmployeeOfficerAssignment[] = [
  { employeeId: "emp_2", officerId: "off_1" }, // PA of Head of Otorita
  { employeeId: "emp_5", officerId: "off_2" }, // PA of Deputy I
  { employeeId: "emp_4", officerId: "off_1" }, // Protocol → VIP officer
];

const bookingSeed: Array<Partial<Booking> & Pick<Booking, "visitorName" | "officerId" | "time" | "location" | "agenda">> = [
  { visitorName: "PT Nusantara Karya", visitorOrg: "PT Nusantara Karya", officerId: "off_1", time: "09:00", location: "Ruang VIP 1", agenda: "Investment Discussion", status: "accepted", category: "regular" },
  { visitorName: "World Bank Delegation", visitorOrg: "World Bank", officerId: "off_1", time: "10:30", location: "Ruang VIP 1", agenda: "Infrastructure Financing", status: "pending", category: "regular" },
  { visitorName: "Ministry of Finance", visitorOrg: "Kemenkeu RI", officerId: "off_2", time: "13:00", location: "Ruang Rapat 2", agenda: "Budget Review", status: "accepted", category: "regular" },
  { visitorName: "PT Adhi Karya", visitorOrg: "PT Adhi Karya", officerId: "off_3", time: "14:30", location: "Ruang Rapat 3", agenda: "Construction Progress", status: "reschedule", category: "regular" },
  { visitorName: "Journalist - Kompas", visitorOrg: "Kompas", officerId: "off_4", time: "15:00", location: "Media Room", agenda: "Press Interview", status: "rejected", category: "regular" },
  { visitorName: "Green Energy Co.", visitorOrg: "Green Energy Co.", officerId: "off_1", time: "11:00", location: "Ruang VIP 1", agenda: "Renewable Partnership", status: "accepted", category: "regular" },
  { visitorName: "PLN Team", visitorOrg: "PLN", officerId: "off_2", time: "09:30", location: "Ruang Rapat 2", agenda: "Grid Planning", status: "accepted", category: "service_utility" },
  { visitorName: "Waste Management SVC", visitorOrg: "Waste Mgmt", officerId: "off_3", time: "10:00", location: "Site Office", agenda: "Utility Audit", status: "accepted", category: "service_utility" },
];

const bookings: Booking[] = bookingSeed.map((b, i) => {
  const day = i % 3 === 0 ? today : i % 3 === 1 ? addDays(today, 1) : addDays(today, -1);
  return {
    id: `bk_${i + 1}`,
    officerId: b.officerId,
    visitorName: b.visitorName,
    visitorOrg: b.visitorOrg ?? "",
    date: iso(day),
    time: b.time,
    location: b.location,
    agenda: b.agenda,
    bookingCode: `BK${String(100000 + i).padStart(6, "0")}`,
    status: (b.status ?? "pending") as Booking["status"],
    category: (b.category ?? "regular") as Booking["category"],
    createdAt: new Date().toISOString(),
  };
});

// Add more bookings across earlier months for analytics
for (let m = 0; m < 6; m++) {
  for (let n = 0; n < 4; n++) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 5 + n * 5);
    bookings.push({
      id: `bk_hist_${m}_${n}`,
      officerId: n % 2 === 0 ? "off_1" : "off_2",
      visitorName: `Historical Visitor ${m}-${n}`,
      visitorOrg: "Org",
      date: iso(d),
      time: "10:00",
      location: "Ruang Rapat",
      agenda: "Historical meeting",
      bookingCode: `BK${String(200000 + m * 10 + n).padStart(6, "0")}`,
      status: "checked_out",
      category: n === 3 ? "service_utility" : "regular",
      createdAt: d.toISOString(),
    });
  }
}

const integrations: IntegrationKey[] = [
  { id: "int_db", name: "Database", apiKey: "", active: true, createdAt: new Date().toISOString() },
  { id: "int_turnstile", name: "Turnstile", apiKey: "", active: true, createdAt: new Date().toISOString() },
  { id: "int_frontend", name: "FrontEnd", apiKey: "", active: true, createdAt: new Date().toISOString() },
];

const logs: AuditLog[] = [
  { id: "log_1", employeeId: "emp_1", actorName: "Ahmad Rizki", kind: "role.update", date: new Date().toISOString(), description: "Updated permissions for Personal Assistant", ipAddress: "10.0.0.12" },
  { id: "log_2", employeeId: "emp_3", actorName: "Budi Santoso", kind: "checkin.perform", date: new Date().toISOString(), description: "Checked in booking BK100000", ipAddress: "10.0.0.34" },
  { id: "log_3", employeeId: "emp_2", actorName: "Dewi Lestari", kind: "booking.approve", date: new Date().toISOString(), description: "Approved booking BK100001", ipAddress: "10.0.0.45" },
];

const initial: DB = {
  employees,
  roles,
  permissions,
  rolePermissions,
  employeeRoles,
  officers,
  assignments,
  bookings,
  integrations,
  logs,
  currentEmployeeId: "emp_1", // default Super Admin so the reviewer sees full nav
};

const STORAGE_KEY = "vms.db.v1";

function load(): DB {
  if (typeof window === "undefined") return structuredClone(initial);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(initial);
    const parsed = JSON.parse(raw) as DB;
    return { ...initial, ...parsed };
  } catch {
    return structuredClone(initial);
  }
}

let db: DB = load();
const listeners = new Set<() => void>();

export const store = {
  get(): DB {
    return db;
  },
  update(mutator: (draft: DB) => void) {
    const next = structuredClone(db);
    mutator(next);
    db = next;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      } catch {
        /* ignore */
      }
    }
    listeners.forEach((l) => l());
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  reset() {
    db = structuredClone(initial);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    listeners.forEach((l) => l());
  },
};

// Async helper: simulate network latency lightly so callers exercise loading states.
export function tick<T>(value: T, ms = 60): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function nextId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

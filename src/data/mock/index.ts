import type {
  AnalyticsRepository,
  BookingRepository,
  EmployeeRepository,
  IntegrationRepository,
  LogRepository,
  OfficerRepository,
  Repositories,
  RoleRepository,
  SessionRepository,
} from "@/data/types";
import { FEATURES } from "@/domain/permissions";
import type { Permission, Role, SessionUser } from "@/domain/types";
import { nextId, store, tick } from "./store";

export const bookingRepo: BookingRepository = {
  async list() {
    return tick([...store.get().bookings]);
  },
  async get(id) {
    return tick(store.get().bookings.find((b) => b.id === id));
  },
  async findByCode(code) {
    return tick(store.get().bookings.find((b) => b.bookingCode.toLowerCase() === code.toLowerCase()));
  },
  async create(input) {
    const id = nextId("bk");
    const code = `BK${String(Math.floor(100000 + Math.random() * 899999))}`;
    store.update((db) => {
      db.bookings.unshift({
        id,
        ...input,
        bookingCode: code,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    });
    return tick(store.get().bookings.find((b) => b.id === id)!);
  },
  async update(id, patch) {
    store.update((db) => {
      const b = db.bookings.find((x) => x.id === id);
      if (b) Object.assign(b, patch);
    });
    return tick(store.get().bookings.find((b) => b.id === id)!);
  },
  async delete(id) {
    store.update((db) => {
      db.bookings = db.bookings.filter((b) => b.id !== id);
    });
    return tick(undefined);
  },
  async setStatus(id, status) {
    store.update((db) => {
      const b = db.bookings.find((x) => x.id === id);
      if (b) b.status = status;
    });
    return tick(store.get().bookings.find((b) => b.id === id)!);
  },
  async checkIn(id, by) {
    store.update((db) => {
      const b = db.bookings.find((x) => x.id === id);
      if (b) {
        b.status = "checked_in";
        b.checkedInAt = new Date().toISOString();
        b.checkedInBy = by;
      }
    });
    return tick(store.get().bookings.find((b) => b.id === id)!);
  },
  async checkOut(id, by) {
    store.update((db) => {
      const b = db.bookings.find((x) => x.id === id);
      if (b) {
        b.status = "checked_out";
        b.checkedOutAt = new Date().toISOString();
        b.checkedOutBy = by;
      }
    });
    return tick(store.get().bookings.find((b) => b.id === id)!);
  },
};

export const employeeRepo: EmployeeRepository = {
  async list() {
    return tick([...store.get().employees]);
  },
  async create(input) {
    const id = nextId("emp");
    store.update((db) => {
      db.employees.push({ id, ...input });
    });
    return tick(store.get().employees.find((e) => e.id === id)!);
  },
  async update(id, patch) {
    store.update((db) => {
      const e = db.employees.find((x) => x.id === id);
      if (e) Object.assign(e, patch);
    });
    return tick(store.get().employees.find((e) => e.id === id)!);
  },
  async delete(id) {
    store.update((db) => {
      db.employees = db.employees.filter((e) => e.id !== id);
      db.employeeRoles = db.employeeRoles.filter((r) => r.employeeId !== id);
      db.assignments = db.assignments.filter((a) => a.employeeId !== id);
    });
    return tick(undefined);
  },
};

export const roleRepo: RoleRepository = {
  async listRoles() {
    return tick([...store.get().roles]);
  },
  async listPermissions() {
    return tick([...store.get().permissions]);
  },
  async listRolePermissions() {
    return tick([...store.get().rolePermissions]);
  },
  async setRolePermissions(roleId, permissionIds) {
    store.update((db) => {
      db.rolePermissions = db.rolePermissions.filter((rp) => rp.roleId !== roleId);
      for (const pid of permissionIds) db.rolePermissions.push({ roleId, permissionId: pid });
    });
    return tick(undefined);
  },
  async listEmployeeRoles() {
    return tick([...store.get().employeeRoles]);
  },
  async setEmployeeRoles(employeeId, roleIds) {
    store.update((db) => {
      db.employeeRoles = db.employeeRoles.filter((r) => r.employeeId !== employeeId);
      for (const rid of roleIds) db.employeeRoles.push({ employeeId, roleId: rid });
    });
    return tick(undefined);
  },
  async listAssignments() {
    return tick([...store.get().assignments]);
  },
  async setEmployeeOfficers(employeeId, officerIds) {
    store.update((db) => {
      db.assignments = db.assignments.filter((a) => a.employeeId !== employeeId);
      for (const oid of officerIds) db.assignments.push({ employeeId, officerId: oid });
    });
    return tick(undefined);
  },
};

export const officerRepo: OfficerRepository = {
  async list() {
    return tick([...store.get().officers]);
  },
};

export const integrationRepo: IntegrationRepository = {
  async list() {
    return tick([...store.get().integrations]);
  },
  async update(id, apiKey) {
    store.update((db) => {
      const k = db.integrations.find((x) => x.id === id);
      if (k) k.apiKey = apiKey;
    });
    return tick(store.get().integrations.find((k) => k.id === id)!);
  },
};

function bookingsToCsv(): string {
  const rows = store.get().bookings;
  const header = "id,booking_code,date,time,visitor,location,agenda,status,category";
  const lines = rows.map((b) =>
    [b.id, b.bookingCode, b.date, b.time, b.visitorName, b.location, b.agenda, b.status, b.category]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(","),
  );
  return [header, ...lines].join("\n");
}

export const logRepo: LogRepository = {
  async list() {
    return tick([...store.get().logs]);
  },
  async exportCsv(email) {
    const logs = store.get().logs;
    const header = "id,actor,kind,date,description,ip";
    const lines = logs.map((l) =>
      [l.id, l.actorName, l.kind, l.date, l.description, l.ipAddress]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(","),
    );
    return tick({ csv: [header, ...lines].join("\n"), sentTo: email });
  },
  async downloadReport(email) {
    return tick({ csv: bookingsToCsv(), sentTo: email });
  },
};

export const analyticsRepo: AnalyticsRepository = {
  async yearlyTrend(year) {
    const bookings = store.get().bookings;
    const officers = store.get().officers;
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const data = months.map((m, i) => {
      const monthBookings = bookings.filter((b) => {
        const d = new Date(b.date);
        return d.getFullYear() === year && d.getMonth() === i;
      });
      const vip = monthBookings.filter((b) => officers.find((o) => o.id === b.officerId)?.isVip).length;
      const regular = monthBookings.length - vip;
      return { month: m, vip, regular };
    });
    return tick(data);
  },
  async kpis() {
    const bookings = store.get().bookings;
    const officers = store.get().officers;
    const total = bookings.length;
    const vip = bookings.filter((b) => officers.find((o) => o.id === b.officerId)?.isVip).length;
    const vvip = bookings.filter((b) => officers.find((o) => o.id === b.officerId)?.isVvip).length;
    const serviceUtility = bookings.filter((b) => b.category === "service_utility").length;
    const regular = total - vip - serviceUtility;
    // pick modal hour
    const counts: Record<string, number> = {};
    for (const b of bookings) {
      const hour = b.time.slice(0, 2);
      counts[hour] = (counts[hour] ?? 0) + 1;
    }
    const peakHour = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "10";
    return tick({
      total,
      vip,
      vvip,
      regular,
      serviceUtility,
      peakTime: `${peakHour}:00`,
    });
  },
};

function buildSessionUser(employeeId: string): SessionUser | null {
  const db = store.get();
  const employee = db.employees.find((e) => e.id === employeeId);
  if (!employee) return null;

  const roleIds = db.employeeRoles.filter((r) => r.employeeId === employeeId).map((r) => r.roleId);
  const empRoles: Role[] = db.roles.filter((r) => roleIds.includes(r.id));
  const permissionIds = db.rolePermissions.filter((rp) => roleIds.includes(rp.roleId)).map((rp) => rp.permissionId);
  const perms: Permission[] = db.permissions.filter((p) => permissionIds.includes(p.id));

  // Baseline: every authenticated user can view a dashboard.
  const permKeys = new Set(perms.map((p) => p.featureKey));
  permKeys.add(FEATURES.DASHBOARD_VIEW);

  const assignedOfficerIds = db.assignments.filter((a) => a.employeeId === employeeId).map((a) => a.officerId);

  return {
    employee,
    roles: empRoles,
    permissions: [...permKeys],
    assignedOfficerIds,
  };
}

export const sessionRepo: SessionRepository = {
  async current() {
    return tick(buildSessionUser(store.get().currentEmployeeId));
  },
  async listAvailable() {
    const users = store
      .get()
      .employees.map((e) => buildSessionUser(e.id))
      .filter((u): u is SessionUser => u !== null);
    return tick(users);
  },
  async switchTo(employeeId) {
    store.update((db) => {
      db.currentEmployeeId = employeeId;
    });
    return tick(buildSessionUser(employeeId)!);
  },
};

export const mockRepositories: Repositories = {
  bookings: bookingRepo,
  employees: employeeRepo,
  roles: roleRepo,
  officers: officerRepo,
  integrations: integrationRepo,
  logs: logRepo,
  analytics: analyticsRepo,
  session: sessionRepo,
};

// Feature-key catalogue. UI permission checks reference these constants
// only — never role names — so RBAC is driven by role_permission data.

import type { Booking, Officer, SessionUser } from "./types";

export const FEATURES = {
  DASHBOARD_VIEW: "dashboard.view",
  TODAY_VIEW: "today.view",
  ANALYTICS_VIEW: "analytics.view",

  BOOKING_VIEW: "booking.view",
  BOOKING_CREATE: "booking.create",
  BOOKING_UPDATE: "booking.update",
  BOOKING_DELETE: "booking.delete",
  BOOKING_APPROVE: "booking.approve",
  BOOKING_REJECT: "booking.reject",
  BOOKING_RESCHEDULE: "booking.reschedule",

  CHECKIN_PERFORM: "checkin.perform",
  CHECKOUT_PERFORM: "checkout.perform",

  EMPLOYEE_MANAGE: "employee.manage",
  ROLE_MANAGE: "role.manage",
  INTEGRATION_MANAGE: "integration.manage",

  LOGS_EXPORT: "logs.export",
  REPORT_DOWNLOAD: "report.download",
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

export const ALL_FEATURES: FeatureKey[] = Object.values(FEATURES);

export function hasPermission(user: SessionUser | null, key: FeatureKey): boolean {
  if (!user) return false;
  return user.permissions.includes(key);
}

export function hasAny(user: SessionUser | null, keys: FeatureKey[]): boolean {
  return keys.some((k) => hasPermission(user, k));
}

/** Derive VIP from officer, never store on booking. */
export function isBookingVip(booking: Booking, officer: Officer | undefined): boolean {
  return Boolean(officer?.isVip);
}

function hasRole(user: SessionUser, name: string): boolean {
  return user.roles.some((role) => role.name === name);
}

// Preview-only scope adapter. The eventual API must return resolved, enforced
// permissions and scope; a role name in the browser is not authorization.
export function scopeBookings(
  user: SessionUser | null,
  bookings: Booking[],
  officers: Officer[],
): Booking[] {
  if (!user) return [];
  if (!hasPermission(user, FEATURES.BOOKING_VIEW)) return [];

  if (hasRole(user, "Super Admin") || hasRole(user, "Receptionist") || hasRole(user, "Protocol Officer")) {
    return bookings;
  }
  if (!hasRole(user, "Personal Assistant")) return [];
  const assigned = new Set(user.assignedOfficerIds);
  return bookings.filter((booking) => {
    if (!assigned.has(booking.officerId)) return false;
    const officer = officers.find((item) => item.id === booking.officerId);
    return officer?.isVip === false;
  });
}

export type BookingAction = "approve" | "reject" | "reschedule";

const ACTION_PERMISSION: Record<BookingAction, FeatureKey> = {
  approve: FEATURES.BOOKING_APPROVE,
  reject: FEATURES.BOOKING_REJECT,
  reschedule: FEATURES.BOOKING_RESCHEDULE,
};

export function canActOnBooking(
  user: SessionUser | null,
  booking: Booking,
  officers: Officer[],
  action: BookingAction,
): boolean {
  if (!user) return false;
  if (!hasPermission(user, FEATURES.BOOKING_VIEW)) return false;
  if (!hasPermission(user, ACTION_PERMISSION[action])) return false;
  if (action === "approve" || action === "reject") {
    if (booking.status !== "pending") return false;
  } else if (booking.status !== "accepted") {
    return false;
  }

  const officer = officers.find((item) => item.id === booking.officerId);
  if (!officer) return false;
  if (hasRole(user, "Super Admin")) return true;
  if (hasRole(user, "Protocol Officer") && officer.isVip) return true;
  return hasRole(user, "Personal Assistant") &&
    !officer.isVip &&
    user.assignedOfficerIds.includes(booking.officerId);
}

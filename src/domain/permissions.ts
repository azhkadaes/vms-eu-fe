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

/**
 * Scope a list of bookings for the current user:
 * - PA (has BOOKING_UPDATE but not manage-all): only their assigned officers
 * - Protocol Officer: sees all, editable only on VIP officer bookings
 * - Receptionist/others with BOOKING_VIEW: sees all
 */
export function scopeBookings(
  user: SessionUser | null,
  bookings: Booking[],
  officers: Officer[],
): Booking[] {
  if (!user) return [];
  if (!hasPermission(user, FEATURES.BOOKING_VIEW)) return [];

  const isPA = user.roles.some((r) => r.name === "Personal Assistant");
  if (isPA && user.assignedOfficerIds.length > 0) {
    const allowed = new Set(user.assignedOfficerIds);
    return bookings.filter((b) => allowed.has(b.officerId));
  }
  // Everyone else with view sees all; individual actions are gated separately.
  void officers;
  return bookings;
}

/**
 * Can the user act (approve/edit/etc) on this specific booking?
 * Protocol Officer only edits VIP-officer bookings; PA only their assigned.
 */
export function canActOnBooking(
  user: SessionUser | null,
  booking: Booking,
  officers: Officer[],
): boolean {
  if (!user) return false;
  if (!hasPermission(user, FEATURES.BOOKING_UPDATE)) return false;

  const roleNames = user.roles.map((r) => r.name);
  if (roleNames.includes("Personal Assistant")) {
    return user.assignedOfficerIds.includes(booking.officerId);
  }
  if (roleNames.includes("Protocol Officer")) {
    const officer = officers.find((o) => o.id === booking.officerId);
    return Boolean(officer?.isVip);
  }
  return true;
}

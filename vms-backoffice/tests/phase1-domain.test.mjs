import test from "node:test";
import assert from "node:assert/strict";
import { FEATURES, canActOnBooking, scopeBookings } from "../src/domain/permissions.ts";
import { canMockChangeStatus, canMockCheckIn, canMockCheckOut } from "../src/domain/bookingLifecycle.ts";
import { addCalendarDays, millisecondsUntilNextWitaDate, witaDate, witaYear } from "../src/domain/wita.ts";

const officers = [
  { id: "general", isVip: false },
  { id: "vip", isVip: true },
];
const bookings = [
  { id: "general-booking", officerId: "general", status: "pending", date: "2026-09-24" },
  { id: "vip-booking", officerId: "vip", status: "pending", date: "2026-09-24" },
];

function staff(roles, permissions, assignedOfficerIds = []) {
  return {
    employee: { id: "staff" },
    roles: roles.map((name) => ({ id: name, name })),
    permissions,
    assignedOfficerIds,
  };
}

test("PA without an assignment sees and manages no bookings", () => {
  const pa = staff(["Personal Assistant"], [FEATURES.BOOKING_VIEW, FEATURES.BOOKING_APPROVE]);
  assert.deepEqual(scopeBookings(pa, bookings, officers), []);
  assert.equal(canActOnBooking(pa, bookings[0], officers, "approve"), false);
});

test("PA scope is assigned general visits only, with an exact action permission", () => {
  const pa = staff(["Personal Assistant"], [FEATURES.BOOKING_VIEW, FEATURES.BOOKING_UPDATE], ["general", "vip"]);
  assert.deepEqual(scopeBookings(pa, bookings, officers).map((booking) => booking.id), ["general-booking"]);
  assert.equal(canActOnBooking(pa, bookings[0], officers, "approve"), false);
  pa.permissions.push(FEATURES.BOOKING_APPROVE);
  assert.equal(canActOnBooking(pa, bookings[0], officers, "approve"), true);
  assert.equal(canActOnBooking(pa, bookings[1], officers, "approve"), false);
});

test("Protocol can view general but only manage VIP; combined roles retain assigned general access", () => {
  const protocol = staff(["Protocol Officer"], [FEATURES.BOOKING_VIEW, FEATURES.BOOKING_APPROVE]);
  assert.equal(scopeBookings(protocol, bookings, officers).length, 2);
  assert.equal(canActOnBooking(protocol, bookings[0], officers, "approve"), false);
  assert.equal(canActOnBooking(protocol, bookings[1], officers, "approve"), true);
  const combined = staff(["Protocol Officer", "Personal Assistant"], protocol.permissions, ["general"]);
  assert.equal(canActOnBooking(combined, bookings[0], officers, "approve"), true);
});

test("receptionist cannot approve even with booking view and admission permission", () => {
  const reception = staff(["Receptionist"], [FEATURES.BOOKING_VIEW, FEATURES.CHECKIN_PERFORM]);
  assert.equal(scopeBookings(reception, bookings, officers).length, 2);
  assert.equal(canActOnBooking(reception, bookings[0], officers, "approve"), false);
});

test("preview lifecycle rejects pending arrival and duplicate arrival or departure", () => {
  const booking = { ...bookings[0] };
  assert.equal(canMockCheckIn(booking, "2026-09-24"), false);
  assert.equal(canMockChangeStatus("pending", "accepted"), true);
  assert.equal(canMockChangeStatus("pending", "checked_in"), false);
  booking.status = "accepted";
  assert.equal(canMockCheckIn(booking, "2026-09-24"), true);
  assert.equal(canMockCheckIn(booking, "2026-09-25"), false);
  booking.status = "checked_in";
  assert.equal(canMockCheckIn(booking, "2026-09-24"), false);
  assert.equal(canMockCheckOut(booking), true);
  booking.status = "checked_out";
  assert.equal(canMockCheckOut(booking), false);
});

test("WITA calendar date and year cross UTC midnight correctly", () => {
  assert.equal(witaDate(new Date("2026-09-23T15:30:00Z")), "2026-09-23");
  assert.equal(witaDate(new Date("2026-09-23T16:30:00Z")), "2026-09-24");
  assert.equal(witaYear(new Date("2026-12-31T17:00:00Z")), 2027);
  assert.equal(addCalendarDays("2026-09-30", 1), "2026-10-01");
  assert.equal(millisecondsUntilNextWitaDate(new Date("2026-09-23T15:30:00Z")), 30 * 60 * 1000);
});

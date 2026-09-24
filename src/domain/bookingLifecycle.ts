import type { Booking, BookingStatus } from "./types";

// These are the current staff preview's legacy statuses. The backend's proposed
// `approved` contract is not accepted yet; keep the translation explicit here.
export function isMockAdmissionApproved(status: BookingStatus): boolean {
  return status === "accepted";
}

export function canMockChangeStatus(from: BookingStatus, to: BookingStatus): boolean {
  return (from === "pending" && (to === "accepted" || to === "rejected")) ||
    (from === "accepted" && to === "reschedule");
}

export function canMockCheckIn(booking: Booking, today: string): boolean {
  return isMockAdmissionApproved(booking.status) && booking.date === today;
}

export function canMockCheckOut(booking: Booking): boolean {
  return booking.status === "checked_in";
}

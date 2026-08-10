import { get, post } from "./api";

export interface ReqCreateBooking {
  pejabat: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  keperluan: string;
  keperluanLain?: string;
  catatan?: string;
  namaLengkap: string;
  nomorIdentitas: string;
  asalInstansi: string;
  nomorTelepon: string;
  email: string;
  jumlahPengunjung: number;
}

export interface ResBookingCreated {
  pin: string;
}

export type BookingStatus = "menunggu" | "disetujui" | "ditolak" | "selesai";

export interface ResBookingLookup {
  pin: string;
  status: BookingStatus;
  pejabat: string;
  tanggal: string;
  waktu: string;
  keperluan: string;
  nama: string;
  catatan?: string;
  issuedAt: string;
  expiresAt: string;
}

export type BookingLookupKind = "found" | "expired" | "not-found";

export interface BookingLookupFound {
  kind: "found";
  record: ResBookingLookup;
}

export interface BookingLookupExpired {
  kind: "expired";
  record: ResBookingLookup;
}

export interface BookingLookupNotFound {
  kind: "not-found";
}

export type BookingLookupResult =
  | BookingLookupFound
  | BookingLookupExpired
  | BookingLookupNotFound;

export async function createBooking(
  payload: ReqCreateBooking,
): Promise<ResBookingCreated> {
  return post<ResBookingCreated>("/bookings", payload);
}

export async function fetchBookingByPin(
  pin: string,
): Promise<ResBookingLookup> {
  return get<ResBookingLookup>(`/bookings/${pin}`);
}

export function isBookingExpired(expiresAt: string): boolean {
  try {
    return new Date(expiresAt).getTime() <= Date.now();
  } catch {
    return false;
  }
}

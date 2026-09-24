// Adapter for the currently registered backend create response. This is not
// the proposed shared visitor/staff API contract.
export function parseLegacyBookingCreated(value: unknown): { pin: string } {
  if (typeof value !== "object" || value === null || !("pin" in value)) {
    throw new Error("Kode booking tidak diterima dari server. Catat waktu pengiriman dan hubungi petugas sebelum mencoba lagi.");
  }
  const pin = value.pin;
  if (typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
    throw new Error("Kode booking dari server tidak valid. Hubungi petugas sebelum mencoba lagi.");
  }
  return { pin };
}

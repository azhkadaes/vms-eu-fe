import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Copy,
  Calendar,
  Clock,
  CheckCircle2,
  User,
  Building2,
  Phone,
  Mail,
  CreditCard,
  FileText,
  X,
  Search,
  AlertCircle,
  Hourglass,
  XCircle,
  Users,
} from "lucide-react";

const imgBg = new URL(
  "../imports/IPhone13141/bb7b728a1a6e3f913073a407a73a558eb5867bcf.png",
  import.meta.url,
).href;
const imgLogo = new URL(
  "../imports/IPhone13141/a9831c90286c93afd5ddc0ae3f97d4e76acee910.png",
  import.meta.url,
).href;

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "landing" | "step1" | "step2" | "confirm" | "cek-pin";
type BookingStatus = "menunggu" | "disetujui" | "ditolak" | "selesai";
type Language = "id" | "en";
type BookingLookupResult =
  | { kind: "found"; record: BookingRecord }
  | { kind: "expired"; record: BookingRecord }
  | { kind: "not-found" };

interface BookingRecord {
  pin: string;
  status: BookingStatus;
  pejabat: string;
  ruangan?: string;
  tanggal: string;
  waktu: string;
  keperluan: string;
  nama: string;
  catatan?: string;
  issuedAt: string;
  expiresAt: string;
}

function formatVisitTimeRange(start: string, end: string) {
  if (!start || !end) return "-";
  return `${start} - ${end}`;
}

const BOOKING_EXPIRY_MONTHS = 3;
const BOOKING_STORAGE_KEY = "vms-bookings";

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

function readBookings(): Record<string, BookingRecord> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(BOOKING_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, BookingRecord>;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveBookings(bookings: Record<string, BookingRecord>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookings));
}

function storeBooking(record: BookingRecord) {
  const bookings = readBookings();
  bookings[record.pin] = record;
  saveBookings(bookings);
}

function buildBookingFromPin(pin: string): BookingRecord {
  const last = Number.parseInt(pin.slice(-1), 10);
  const statusMap: Record<number, BookingStatus> = {
    0: "menunggu",
    1: "menunggu",
    2: "menunggu",
    3: "menunggu",
    4: "disetujui",
    5: "disetujui",
    6: "disetujui",
    7: "ditolak",
    8: "ditolak",
    9: "selesai",
  };
  const issuedAt = new Date().toISOString();

  return {
    pin,
    status: statusMap[last],
    pejabat: "Deputi Bidang Perencanaan dan Pertanahan",
    ruangan: ROOM_OPTIONS[0],
    tanggal: "2025-08-15",
    waktu: "10:00 - 11:00",
    keperluan: "Koordinasi Investasi",
    nama: "Budi Santoso",
    issuedAt,
    expiresAt: addMonths(
      new Date(issuedAt),
      BOOKING_EXPIRY_MONTHS,
    ).toISOString(),
  };
}

// ─── Mock booking database ────────────────────────────────────────────────────
// Demo PINs are persisted for 3 months, then removed from the local store.
function mockLookup(pin: string): BookingLookupResult {
  if (pin.length !== 6) return { kind: "not-found" };

  const bookings = readBookings();
  const stored = bookings[pin];

  if (stored) {
    if (isExpired(stored.expiresAt)) {
      delete bookings[pin];
      saveBookings(bookings);
      return { kind: "expired", record: stored };
    }

    return { kind: "found", record: stored };
  }

  const record = buildBookingFromPin(pin);
  bookings[pin] = record;
  saveBookings(bookings);
  return { kind: "found", record };
}

interface FormData {
  pejabat: string;
  ruangan: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  keperluan: string;
  keperluanLain: string;
  catatan: string;
  namaLengkap: string;
  nomorIdentitas: string;
  asalInstansi: string;
  nomorTelepon: string;
  email: string;
  jumlahPengunjung: string;
}

// ─── Translations ────────────────────────────────────────────────────────────
type TranslationKey = keyof typeof translations.id;

const translations = {
  id: {
    // Landing
    welcomeTitle: "Selamat Datang di Otorita IKN",
    welcomeDesc:
      "Mulai perjalanan Anda menuju Ibu Kota Nusantara, pesan kunjungan Anda hari ini.",
    startBooking: "Buat Kunjungan",
    alreadyBooked: "Sudah membuat kunjungan?",
    checkPin: "Cek PIN Booking",

    // Step 1
    visitDetails: "Detail Kunjungan",
    fillVisitInfo: "Isi informasi kunjungan Anda ke Otorita IKN",
    selectOfficer: "Pejabat yang Dikunjungi",
    officerPlaceholder: "Pilih pejabat tujuan",
    selectRoom: "Ruangan yang Dipesan",
    roomPlaceholder: "Pilih ruangan",
    visitDate: "Tanggal Kunjungan",
    visitTime: "Waktu Kunjungan",
    timePlaceholder: "Pilih waktu kunjungan",
    visitPurpose: "Keperluan",
    purposePlaceholder: "Pilih keperluan kunjungan",
    otherPurpose: "Lainnya",
    explanatePurpose: "Jelaskan Keperluan Lainnya",
    explanatePurposePlaceholder: "Deskripsikan keperluan kunjungan Anda...",
    additionalNotes: "Catatan Tambahan",
    optional: "(opsional)",
    notesPlaceholder: "Tambahkan catatan khusus jika ada...",
    next: "Lanjut",

    // Step 2
    personalData: "Data Diri",
    completeIdentity: "Lengkapi identitas Anda sebagai pengunjung",
    fullName: "Nama Lengkap",
    fullNamePlaceholder: "Sesuai KTP / dokumen resmi",
    idNumber: "Nomor Identitas (KTP / Paspor)",
    idNumberPlaceholder: "Nomor KTP atau Paspor",
    institution: "Asal Instansi / Lembaga",
    institutionPlaceholder: "Nama instansi atau lembaga",
    phone: "Nomor Telepon",
    phonePlaceholder: "+62 8xx-xxxx-xxxx",
    email: "Email",
    emailPlaceholder: "alamat@email.com",
    visitorCount: "Jumlah Pengunjung",
    visitorCountPlaceholder: "Berapa orang akan berkunjung?",
    confirmBooking: "Konfirmasi Kunjungan",

    // Confirmation
    confirmation: "Konfirmasi",
    reviewData: "Periksa kembali data kunjungan Anda sebelum mengirim",
    visitDetailsSection: "Detail Kunjungan",
    officerLabel: "Pejabat yang Dikunjungi",
    roomLabel: "Ruangan yang Dipesan",
    dateLabel: "Tanggal Kunjungan",
    timeLabel: "Waktu Kunjungan",
    purposeLabel: "Keperluan",
    notesLabel: "Catatan Tambahan",
    personalDataSection: "Data Diri",
    nameLabel: "Nama Lengkap",
    idLabel: "Nomor Identitas",
    institutionLabel: "Asal Instansi / Lembaga",
    phoneLabel: "Nomor Telepon",
    emailLabel: "Email",
    visitorCountLabel: "Jumlah Pengunjung",
    agreeTerms:
      "Dengan mengirim formulir ini, Anda menyetujui bahwa data yang diberikan adalah benar dan akan digunakan untuk keperluan administrasi kunjungan ke Otorita IKN.",
    submitRequest: "Kirim Permohonan",
    editData: "Ubah Data",

    // Success
    requestSubmitted: "Permohonan Terkirim!",
    successDesc:
      "Kunjungan Anda telah berhasil didaftarkan. Gunakan PIN di bawah untuk memantau status kunjungan.",
    bookingPin: "PIN Booking Anda",
    savePinNotice:
      "Harap simpan PIN ini. Anda akan dihubungi melalui email dan telepon untuk konfirmasi lebih lanjut.",
    checkStatus: "Cek Status Booking",
    backHome: "Kembali ke Beranda",

    // PIN Check
    checkBookingStatus: "Cek Status Booking",
    enterPinDesc:
      "Masukkan 6 digit PIN yang Anda terima setelah mendaftar kunjungan.",
    pinLabel: "PIN Booking",
    checkStatusBtn: "Cek Status",
    searchAnother: "Cari PIN lain",

    // Status
    pendingConfirm: "Menunggu Konfirmasi",
    pendingDesc:
      "Permohonan kunjungan Anda sedang dalam proses peninjauan oleh pihak terkait. Kami akan menghubungi Anda segera.",
    approved: "Kunjungan Disetujui",
    approvedDesc:
      "Selamat! Permohonan kunjungan Anda telah disetujui. Harap hadir tepat waktu dan membawa dokumen identitas asli.",
    rejected: "Kunjungan Ditolak",
    rejectedDesc:
      "Mohon maaf, permohonan kunjungan Anda tidak dapat diproses saat ini. Silakan hubungi kami untuk informasi lebih lanjut.",
    completed: "Kunjungan Selesai",
    completedDesc:
      "Kunjungan Anda telah selesai dilaksanakan. Terima kasih telah mengunjungi Otorita IKN.",

    // Form Labels
    pinNotFound: "PIN Tidak Ditemukan",
    pinNotFoundDesc:
      "PIN yang Anda masukkan tidak terdaftar dalam sistem. Pastikan PIN sudah benar atau hubungi kantor Otorita IKN.",
    back: "Kembali",
    step: "Step",
    wib: "WIB",
    required: "Harus diisi",

    // Additional translations for screens
    step1Title: "Detail Kunjungan",
    step1Subtitle: "Isi informasi kunjungan Anda ke Otorita IKN",
    officialLabel: "Pejabat yang Dikunjungi",
    selectOfficial: "Pilih pejabat tujuan",
    startTimeLabel: "Waktu Mulai",
    endTimeLabel: "Waktu Selesai",
    selectStartTime: "Pilih waktu mulai",
    selectEndTime: "Pilih waktu selesai",
    endTimeDisabledHint: "Pilih waktu mulai terlebih dahulu.",
    timeRangeHint: "Waktu selesai harus setelah waktu mulai.",
    selectTime: "Pilih waktu kunjungan",
    selectPurpose: "Pilih keperluan kunjungan",
    explainPurpose: "Jelaskan Keperluan Lainnya",
    describePurposePlaceholder: "Deskripsikan keperluan kunjungan Anda...",
    step2Title: "Data Diri",
    step2Subtitle: "Lengkapi identitas Anda sebagai pengunjung",
    fullNameLabel: "Nama Lengkap",
    identityNumberLabel: "Nomor Identitas (KTP / Paspor)",
    identityNumberPlaceholder: "Nomor KTP atau Paspor",
    confirmTitle: "Konfirmasi",
    confirmSubtitle: "Periksa kembali data kunjungan Anda sebelum mengirim",
    visitDetailTitle: "Detail Kunjungan",
    personalDataTitle: "Data Diri",
    confirmDisclaimer:
      "Dengan mengirim formulir ini, Anda menyetujui bahwa data yang diberikan adalah benar dan akan digunakan untuk keperluan administrasi kunjungan ke Otorita IKN.",
    submitBooking: "Kirim Permohonan",
    successTitle: "Permohonan Terkirim!",
    successSubtitle:
      "Kunjungan Anda telah berhasil didaftarkan. Gunakan PIN di bawah untuk memantau status kunjungan.",
    savePin:
      "Harap simpan PIN ini. Anda akan dihubungi melalui email dan telepon untuk konfirmasi lebih lanjut.",
    copy: "Salin",
    copied: "Tersalin",
    copyPin: "Salin PIN booking",
    backToHome: "Kembali ke Beranda",
    checkStatusTitle: "Cek Status Booking",
    checkStatusSubtitle:
      "Masukkan 6 digit PIN yang Anda terima setelah mendaftar kunjungan.",
    checkStatusButton: "Cek Status",
    searchAnotherPin: "Cari PIN lain",
    pinExpired: "PIN Kedaluwarsa",
    pinExpiredDesc:
      "PIN ini sudah melewati masa berlaku dan tidak lagi disimpan di sistem. Silakan ajukan kunjungan baru untuk mendapatkan PIN yang aktif.",
  },
  en: {
    // Landing
    welcomeTitle: "Welcome to IKN Authority",
    welcomeDesc:
      "Start your journey to the Capital of Nusantara, book your visit today.",
    startBooking: "Create Booking",
    alreadyBooked: "Already made a booking?",
    checkPin: "Check PIN Booking",

    // Step 1
    visitDetails: "Visit Details",
    fillVisitInfo: "Fill in your visit information to IKN Authority",
    selectOfficer: "Officer to Visit",
    officerPlaceholder: "Select target officer",
    selectRoom: "Room to Book",
    roomPlaceholder: "Select room",
    visitDate: "Visit Date",
    visitTime: "Visit Time",
    timePlaceholder: "Select visit time",
    visitPurpose: "Purpose",
    purposePlaceholder: "Select visit purpose",
    otherPurpose: "Other",
    explanatePurpose: "Explain Other Purpose",
    explanatePurposePlaceholder: "Describe your visit purpose...",
    additionalNotes: "Additional Notes",
    optional: "(optional)",
    notesPlaceholder: "Add special notes if any...",
    next: "Next",

    // Step 2
    personalData: "Personal Data",
    completeIdentity: "Complete your identity as a visitor",
    fullName: "Full Name",
    fullNamePlaceholder: "According to ID / official document",
    idNumber: "ID Number (KTP / Passport)",
    idNumberPlaceholder: "KTP or Passport number",
    institution: "Organization / Institution",
    institutionPlaceholder: "Organization or institution name",
    phone: "Phone Number",
    phonePlaceholder: "+62 8xx-xxxx-xxxx",
    email: "Email",
    emailPlaceholder: "address@email.com",
    visitorCount: "Number of Visitors",
    visitorCountPlaceholder: "How many people will visit?",
    confirmBooking: "Confirm Booking",

    // Confirmation
    confirmation: "Confirmation",
    reviewData: "Review your booking data before submitting",
    visitDetailsSection: "Visit Details",
    officerLabel: "Officer to Visit",
    roomLabel: "Room to Book",
    dateLabel: "Visit Date",
    timeLabel: "Visit Time",
    purposeLabel: "Purpose",
    notesLabel: "Additional Notes",
    personalDataSection: "Personal Data",
    nameLabel: "Full Name",
    idLabel: "ID Number",
    institutionLabel: "Organization / Institution",
    phoneLabel: "Phone Number",
    emailLabel: "Email",
    visitorCountLabel: "Number of Visitors",
    agreeTerms:
      "By submitting this form, you agree that the information provided is correct and will be used for administrative purposes of visits to IKN Authority.",
    submitRequest: "Submit Request",
    editData: "Edit Data",

    // Success
    requestSubmitted: "Request Submitted!",
    successDesc:
      "Your visit has been successfully registered. Use the PIN below to check your visit status.",
    bookingPin: "Your Booking PIN",
    savePinNotice:
      "Please save this PIN. You will be contacted via email and phone for further confirmation.",
    checkStatus: "Check Status Booking",
    backHome: "Back to Home",

    // PIN Check
    checkBookingStatus: "Check Booking Status",
    enterPinDesc:
      "Enter the 6-digit PIN you received after registering your visit.",
    pinLabel: "Booking PIN",
    checkStatusBtn: "Check Status",
    searchAnother: "Search another PIN",

    // Status
    pendingConfirm: "Pending Confirmation",
    pendingDesc:
      "Your visit request is under review. We will contact you soon.",
    approved: "Visit Approved",
    approvedDesc:
      "Congratulations! Your visit request has been approved. Please arrive on time and bring your original ID.",
    rejected: "Visit Rejected",
    rejectedDesc:
      "Sorry, your visit request cannot be processed at this time. Please contact us for more information.",
    completed: "Visit Completed",
    completedDesc:
      "Your visit has been completed. Thank you for visiting IKN Authority.",

    // Form Labels
    pinNotFound: "PIN Not Found",
    pinNotFoundDesc:
      "The PIN you entered is not registered in the system. Make sure the PIN is correct or contact the IKN Authority office.",
    back: "Back",
    step: "Step",
    wib: "WIB",
    required: "Required",

    // Additional translations for screens
    step1Title: "Visit Details",
    step1Subtitle: "Fill in your visit information to IKN Authority",
    officialLabel: "Officer to Visit",
    selectOfficial: "Select target officer",
    startTimeLabel: "Start Time",
    endTimeLabel: "End Time",
    selectStartTime: "Select start time",
    selectEndTime: "Select end time",
    endTimeDisabledHint: "Select a start time first.",
    timeRangeHint: "End time must be after start time.",
    selectTime: "Select visit time",
    selectPurpose: "Select visit purpose",
    explainPurpose: "Explain Other Purpose",
    describePurposePlaceholder: "Describe your visit purpose...",
    step2Title: "Personal Data",
    step2Subtitle: "Complete your identity as a visitor",
    fullNameLabel: "Full Name",
    identityNumberLabel: "ID Number (KTP / Passport)",
    identityNumberPlaceholder: "KTP or Passport number",
    confirmTitle: "Confirmation",
    confirmSubtitle: "Review your booking data before submitting",
    visitDetailTitle: "Visit Details",
    personalDataTitle: "Personal Data",
    confirmDisclaimer:
      "By submitting this form, you agree that the information provided is correct and will be used for administrative purposes of visits to IKN Authority.",
    submitBooking: "Submit Request",
    successTitle: "Request Submitted!",
    successSubtitle:
      "Your visit has been successfully registered. Use the PIN below to check your visit status.",
    savePin:
      "Please save this PIN. You will be contacted via email and phone for further confirmation.",
    copy: "Copy",
    copied: "Copied",
    copyPin: "Copy booking PIN",
    backToHome: "Back to Home",
    checkStatusTitle: "Check Booking Status",
    checkStatusSubtitle:
      "Enter the 6-digit PIN you received after registering your visit.",
    checkStatusButton: "Check Status",
    searchAnotherPin: "Search another PIN",
    pinExpired: "PIN Expired",
    pinExpiredDesc:
      "This PIN has expired and is no longer stored in the system. Please submit a new visit request to get an active PIN.",
  },
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PEJABAT_OPTIONS = [
  "Kepala Otorita Ibu Kota Nusantara",
  "Sekretaris",
  "Kepala Unit Kerja Hukum dan Kepatuhan",
  "Deputi Bidang Perencanaan dan Pertanahan",
  "Deputi Bidang Pengendalian Pembangunan",
  "Deputi Bidang Sosial, Budaya, dan Pemberdayaan Masyarakat",
  "Deputi Bidang Transformasi Hijau dan Digital",
  "Deputi Bidang Lingkungan Hidup dan Sumber Daya Alam",
  "Deputi Bidang Pendanaan dan Investasi",
  "Deputi Bidang Sarana dan Prasarana",
  "Staf Khusus Kepala Otorita Ibu Kota Nusantara Bidang Komunikasi Publik",
  "Staf Khusus Kepala Otorita IKN Bidang Keamanan dan Keselamatan Publik",
  "Staf Khusus Kepala Otorita Ibu Kota Nusantara Bidang Perencanaan Pembangunan",
  "Staf Khusus Kepala Otorita Ibu Kota Nusantara Bidang Audit dan Pengawasan Pembangunan",
  "Staf Khusus Kepala Otorita Ibu Kota Nusantara Bidang Manajemen dan Strategi Konstruksi",
  "Kepala Biro Perencanaan, Organisasi, dan Kerja Sama",
  "Kepala Biro Sumber Daya Manusia dan Hubungan Masyarakat",
  "(Plt.) Kepala Biro Umum dan Pengadaan Barang/Jasa",
  "Kepala Biro Keuangan, Barang Milik Negara, dan Aset Dalam Penguasaan",
  "(Plt.) Direktur Hukum",
  "Direktur Kepatuhan",
  "Direktur Pengawasan dan Audit Internal",
  "Direktur Perencanaan Makro",
  "Direktur Perencanaan Mikro",
  "Direktur Pertanahan",
  "Direktur Pengendalian Penyelenggaraan Pemerintahan dan Perizinan Pembangunan",
  "Direktur Pengawasan, Pemantauan, dan Evaluasi",
  "Direktur Ketentraman dan Ketertiban Umum",
  "Direktur Pelayanan Dasar",
  "Direktur Pemberdayaan Masyarakat",
  "Direktur Kebudayaan, Pariwisata, dan Ekonomi Kreatif",
  "Direktur Pengembangan Ekosistem Digital",
  "Direktur Transformasi Hijau",
  "Direktur Data dan Kecerdasan Buatan",
  "Direktur Lingkungan Hidup dan Penanggulangan Bencana",
  "Direktur Pengembangan Pemanfaatan Kehutanan dan Sumber Daya Air",
  "Direktur Ketahanan Pangan",
  "Direktur Investasi dan Kemudahan Berusaha",
  "Direktur Pendanaan",
  "Direktur Pembiayaan",
  "Direktur Sarana Prasarana Dasar",
  "Direktur Sarana Prasarana Sosial",
  "(Plt) Direktur Pengelolaan Gedung, Kawasan dan Perkotaan",
  "Kepala Bagian Tata Usaha",
  "Kepala Bagian Protokol",
  "Kepala Bagian Rumah Tangga",
];

const ROOM_OPTIONS = ["Kemenko Tower 2", "War Room", "Visitor Room"];

const KEPERLUAN_OPTIONS = [
  "Kunjungan Resmi Pemerintah",
  "Kunjungan Akademis / Penelitian",
  "Kunjungan Pers / Media",
  "Koordinasi Investasi",
  "Audiensi Masyarakat",
  "Lainnya",
];

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-[13px] font-medium text-white/90 mb-1 block">
      {children}
      {required && <span className="text-red-300 ml-0.5">*</span>}
    </label>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col mb-3.5">{children}</div>;
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  icon?: React.ReactNode;
  compact?: boolean;
  disabled?: boolean;
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  icon,
  compact,
  disabled,
}: SelectProps) {
  return (
    <div className="relative">
      {icon && (
        <div
          className={`${compact ? "left-2.5" : "left-3"} absolute top-1/2 -translate-y-1/2 text-[#2e7465] pointer-events-none`}
        >
          {icon}
        </div>
      )}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-white/75 border border-[#2e7465] rounded-[8px] appearance-none outline-none focus:border-[#3f9e89] focus:ring-2 focus:ring-[#2e7465]/20 transition-all disabled:cursor-not-allowed disabled:opacity-60 ${compact ? "py-2.5 pr-9 text-[13px] md:text-[14px]" : "py-3 pr-10 text-[14px]"} ${icon ? (compact ? "pl-8" : "pl-9") : "pl-3"} ${value ? "text-[#1a3d34]" : "text-gray-400"}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={compact ? 14 : 16}
        className={`absolute ${compact ? "right-2.5" : "right-3"} top-1/2 -translate-y-1/2 text-[#2e7465] pointer-events-none`}
      />
    </div>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  multiline,
  autoComplete,
  inputMode,
  min,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
  multiline?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  min?: number;
  step?: number;
}) {
  const base =
    "w-full bg-white/75 border border-[#2e7465] rounded-[8px] text-[14px] text-[#1a3d34] placeholder:text-gray-400 outline-none focus:border-[#3f9e89] focus:ring-2 focus:ring-[#2e7465]/20 transition-all";
  const pad = icon ? "pl-9 pr-3 py-3" : "pl-3 pr-3 py-3";

  if (multiline) {
    return (
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${base} pl-3 pr-3 py-3 resize-none`}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2e7465] pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        step={step}
        className={`${base} ${pad}`}
      />
    </div>
  );
}

// ─── Step Progress Bar ─────────────────────────────────────────────────────────
function StepBar({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2].map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all ${n <= step ? "bg-[#2e7465] text-white" : "bg-white/30 text-white/60"}`}
          >
            {n <= step && n < step ? <CheckCircle2 size={14} /> : n}
          </div>
          {n === 1 && (
            <div
              className={`h-[2px] flex-1 w-16 rounded transition-all ${step >= 2 ? "bg-[#2e7465]" : "bg-white/30"}`}
            />
          )}
        </div>
      ))}
      <span className="text-white/60 text-[11px] ml-1">
        {step === 1 ? "Detail Kunjungan" : "Data Diri"}
      </span>
    </div>
  );
}

// ─── Screen: Cek PIN ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  BookingStatus,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bg: string;
    border: string;
    desc: string;
  }
> = {
  menunggu: {
    icon: <Hourglass size={28} />,
    label: "Menunggu Konfirmasi",
    color: "text-amber-300",
    bg: "bg-amber-400/15",
    border: "border-amber-400/40",
    desc: "Permohonan kunjungan Anda sedang dalam proses peninjauan oleh pihak terkait. Kami akan menghubungi Anda segera.",
  },
  disetujui: {
    icon: <CheckCircle2 size={28} />,
    label: "Kunjungan Disetujui",
    color: "text-emerald-300",
    bg: "bg-emerald-400/15",
    border: "border-emerald-400/40",
    desc: "Selamat! Permohonan kunjungan Anda telah disetujui. Harap hadir tepat waktu dan membawa dokumen identitas asli.",
  },
  ditolak: {
    icon: <XCircle size={28} />,
    label: "Kunjungan Ditolak",
    color: "text-red-300",
    bg: "bg-red-400/15",
    border: "border-red-400/40",
    desc: "Mohon maaf, permohonan kunjungan Anda tidak dapat diproses saat ini. Silakan hubungi kami untuk informasi lebih lanjut.",
  },
  selesai: {
    icon: <CheckCircle2 size={28} />,
    label: "Kunjungan Selesai",
    color: "text-sky-300",
    bg: "bg-sky-400/15",
    border: "border-sky-400/40",
    desc: "Kunjungan Anda telah selesai dilaksanakan. Terima kasih telah mengunjungi Otorita IKN.",
  },
};

function PinInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0)
      refs[i - 1].current?.focus();
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = value.split("").concat(Array(6).fill("")).slice(0, 6);
    arr[i] = digit;
    const next = arr.join("");
    onChange(next);
    if (digit && i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    refs[Math.min(pasted.length, 5)].current?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center">
      {refs.map((ref, i) => (
        <input
          key={i}
          ref={ref}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="w-11 h-13 text-center text-[20px] font-bold bg-white/15 border-2 border-white/30 rounded-[10px] text-white outline-none focus:border-[#3f9e89] focus:bg-white/20 transition-all caret-transparent"
          style={{ height: "52px" }}
        />
      ))}
    </div>
  );
}

function CekPinScreen({
  onBack,
  sessionPin,
  language = "id",
}: {
  onBack: () => void;
  sessionPin?: string;
  language?: Language;
}) {
  const t = (key: TranslationKey): string => translations[language][key] || "";
  const [pin, setPin] = useState(sessionPin || "");
  const [result, setResult] = useState<BookingLookupResult | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    const normalizedPin = pin.replace(/\D/g, "");
    if (normalizedPin.length < 6) return;
    const found = mockLookup(normalizedPin);
    setResult(found);
    setSearched(true);
  };

  const handleReset = () => {
    setPin("");
    setResult(null);
    setSearched(false);
  };

  return (
    <div className="relative min-h-dvh w-full overflow-hidden flex flex-col">
      <img
        src={imgBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-110"
        style={{ objectPosition: "center 40%" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,60,45,0.88)] to-[rgba(0,30,20,0.97)]" />

      {/* Header */}
      <div className="relative z-10 pt-8 md:pt-12 lg:pt-16 pb-6 md:pb-8 px-6 md:px-8 lg:px-12">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white/70 text-xs md:text-sm mb-6 -ml-1 hover:text-white/90"
        >
          <ChevronLeft size={16} /> {t("back")}
        </button>
        <div className="flex items-center gap-3 mb-1">
          <img
            src={imgLogo}
            alt=""
            className="w-8 h-8 object-contain opacity-90"
          />
          <h2 className="font-['Inter',sans-serif] font-semibold text-white text-xl md:text-2xl lg:text-3xl">
            {t("checkStatusTitle")}
          </h2>
        </div>
        <p className="text-white/55 text-xs md:text-sm lg:text-base mt-2 leading-[1.6]">
          {t("checkStatusSubtitle")}
        </p>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-6 md:px-8 lg:px-12 pb-8 md:pb-12">
        <div className="max-w-md mx-auto">
          {/* PIN entry */}
          <div className="bg-white/8 border border-white/15 rounded-[14px] p-5 mb-5">
            <p className="text-white/60 text-xs md:text-sm text-center mb-4 font-medium uppercase tracking-widest">
              {t("pinLabel")}
            </p>
            <PinInput value={pin} onChange={setPin} />

            <button
              onClick={handleSearch}
              disabled={pin.replace(/\D/g, "").length < 6}
              className="w-full mt-5 bg-[#2e7465] disabled:bg-[#2e7465]/35 text-white font-semibold text-sm md:text-base rounded-[8px] py-3 md:py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:enabled:bg-[#3f9e89]"
            >
              <Search size={16} /> {t("checkStatusButton")}
            </button>

            {searched && (
              <button
                onClick={handleReset}
                className="w-full mt-2 text-white/50 text-xs md:text-sm py-2 underline underline-offset-2 hover:text-white/70"
              >
                {t("searchAnotherPin")}
              </button>
            )}
          </div>

          {/* Result */}
          <AnimatePresence mode="wait">
            {result?.kind === "found" &&
              (() => {
                const cfg = STATUS_CONFIG[result.record.status];
                return (
                  <motion.div
                    key="found"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Status badge */}
                    <div
                      className={`${cfg.bg} border ${cfg.border} rounded-[14px] p-5 mb-4 flex flex-col items-center text-center`}
                    >
                      <div className={`${cfg.color} mb-3`}>{cfg.icon}</div>
                      <p
                        className={`${cfg.color} font-semibold text-base md:text-lg mb-2`}
                      >
                        {cfg.label}
                      </p>
                      <p className="text-white/60 text-xs md:text-sm leading-[1.6]">
                        {cfg.desc}
                      </p>
                    </div>

                    {/* Booking detail */}
                    <div className="bg-white/8 border border-white/12 rounded-[14px] px-4 py-1 mb-4">
                      {[
                        ["PIN", result.record.pin],
                        ["Nama", result.record.nama],
                        ["Pejabat", result.record.pejabat],
                        ["Ruangan", result.record.ruangan || "-"],
                        ["Tanggal", formatDate(result.record.tanggal)],
                        ["Waktu", `${result.record.waktu} WIB`],
                        ["Keperluan", result.record.keperluan],
                        ["Berlaku Hingga", formatDate(result.record.expiresAt)],
                      ].map(([label, val]) => (
                        <div
                          key={label}
                          className="flex justify-between items-start gap-3 py-3 border-b border-white/8 last:border-0"
                        >
                          <span className="text-white/45 text-xs md:text-sm shrink-0">
                            {label}
                          </span>
                          <span className="text-white text-xs md:text-sm font-medium text-right">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })()}

            {result?.kind === "expired" && (
              <motion.div
                key="expired"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-amber-400/12 border border-amber-400/30 rounded-[14px] p-5 flex flex-col items-center text-center"
              >
                <Hourglass size={28} className="text-amber-300 mb-3" />
                <p className="text-amber-300 font-semibold text-base md:text-lg mb-2">
                  {t("pinExpired")}
                </p>
                <p className="text-white/55 text-xs md:text-sm leading-[1.6]">
                  {t("pinExpiredDesc")}
                </p>
              </motion.div>
            )}

            {result?.kind === "not-found" && (
              <motion.div
                key="notfound"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-red-400/12 border border-red-400/30 rounded-[14px] p-5 flex flex-col items-center text-center"
              >
                <AlertCircle size={28} className="text-red-300 mb-3" />
                <p className="text-red-300 font-semibold text-base md:text-lg mb-2">
                  {t("pinNotFound")}
                </p>
                <p className="text-white/55 text-xs md:text-sm leading-[1.6]">
                  {t("pinNotFoundDesc")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Landing ──────────────────────────────────────────────────────────
function LandingScreen({
  onStart,
  onCekPin,
  language,
}: {
  onStart: () => void;
  onCekPin: () => void;
  language: Language;
}) {
  const t = (key: TranslationKey) => translations[language][key];

  return (
    <div className="relative min-h-dvh w-full overflow-hidden flex flex-col items-center justify-center">
      {/* Background image */}
      <img
        src={imgBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-110"
        style={{ objectPosition: "center 40%" }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(155,139,177,0.65)] via-[rgba(46,116,101,0.4)] to-[rgba(0,0,0,0.75)]" />

      {/* Logo */}
      <div className="relative z-10 mb-6 md:mb-8 lg:mb-10 w-20 md:w-28 lg:w-32">
        <img
          src={imgLogo}
          alt="Otorita IKN"
          className="w-full object-contain"
        />
      </div>

      {/* Headline */}
      <div className="relative z-10 px-6 md:px-8 lg:px-12 text-center mb-12 md:mb-16 lg:mb-20 max-w-2xl">
        <h1 className="font-['Inter',sans-serif] font-medium text-white text-3xl md:text-4xl lg:text-5xl leading-[1.15] mb-4">
          {t("welcomeTitle")}
        </h1>
        <p className="font-['Inter',sans-serif] text-white/85 text-base md:text-lg lg:text-xl leading-[1.5]">
          {t("welcomeDesc")}
        </p>
      </div>

      {/* CTA */}
      <div className="relative z-10 px-6 md:px-8 lg:px-12 flex flex-col gap-3 w-full max-w-md">
        <button
          onClick={onStart}
          className="w-full bg-white/75 border border-[#2e7465] rounded-[8px] py-3 md:py-4 lg:py-5 flex items-center justify-between px-4 text-[#2e7465] font-medium text-sm md:text-base lg:text-lg active:scale-[0.98] transition-transform hover:bg-white/85"
        >
          <span>{t("startBooking")}</span>
          <ChevronRight size={18} />
        </button>
        <p className="text-white/80 text-xs md:text-sm text-center">
          {t("alreadyBooked")}{" "}
          <button
            onClick={onCekPin}
            className="text-[#3f9e89] font-medium underline-offset-2 hover:underline"
          >
            {t("checkPin")}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Screen: Step 1 ───────────────────────────────────────────────────────────
function Step1Screen({
  data,
  setData,
  onNext,
  onBack,
  language = "id",
}: {
  data: FormData;
  setData: (d: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  language?: Language;
}) {
  const t = (key: TranslationKey): string => translations[language][key] || "";

  const isOther = data.keperluan === "Lainnya";
  const waktuMulaiIdx = TIME_SLOTS.indexOf(data.waktuMulai);
  const waktuSelesaiIdx = TIME_SLOTS.indexOf(data.waktuSelesai);
  const isTimeRangeValid =
    data.waktuMulai &&
    data.waktuSelesai &&
    waktuMulaiIdx >= 0 &&
    waktuMulaiIdx < waktuSelesaiIdx;
  const waktuSelesaiOptions =
    waktuMulaiIdx >= 0 ? TIME_SLOTS.slice(waktuMulaiIdx + 1) : TIME_SLOTS;
  const isValid =
    data.pejabat &&
    data.ruangan &&
    data.tanggal &&
    isTimeRangeValid &&
    data.keperluan &&
    (!isOther || data.keperluanLain.trim());

  return (
    <div className="relative min-h-dvh w-full overflow-hidden flex flex-col">
      {/* Background */}
      <img
        src={imgBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-110"
        style={{ objectPosition: "center 40%" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,60,45,0.82)] to-[rgba(0,30,20,0.92)]" />

      {/* Header */}
      <div className="relative z-10 pt-8 md:pt-12 lg:pt-16 pb-4 md:pb-6 px-6 md:px-8 lg:px-12">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white/70 text-xs md:text-sm mb-5 -ml-1 hover:text-white/90"
        >
          <ChevronLeft size={16} /> {t("back")}
        </button>
        <StepBar step={1} />
        <h2 className="font-['Inter',sans-serif] font-semibold text-white text-xl md:text-2xl lg:text-3xl leading-tight">
          {t("step1Title")}
        </h2>
        <p className="text-white/60 text-xs md:text-sm lg:text-base mt-1">
          {t("step1Subtitle")}
        </p>
      </div>

      {/* Form */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 md:px-8 lg:px-12 pb-8 md:pb-12">
        <div className="max-w-2xl mx-auto md:grid md:grid-cols-2 md:gap-4 lg:gap-6">
          <div className="md:col-span-2">
            <FieldWrap>
              <Label required>{t("officialLabel")}</Label>
              <SelectField
                value={data.pejabat}
                onChange={(v) => setData({ pejabat: v })}
                options={PEJABAT_OPTIONS}
                placeholder={t("selectOfficial")}
                icon={<User size={15} />}
              />
            </FieldWrap>
          </div>

          <div className="md:col-span-2">
            <FieldWrap>
              <Label required>{t("roomLabel")}</Label>
              <SelectField
                value={data.ruangan}
                onChange={(v) => setData({ ruangan: v })}
                options={ROOM_OPTIONS}
                placeholder={t("roomPlaceholder")}
                icon={<Building2 size={15} />}
              />
            </FieldWrap>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-[0.95fr_1.35fr] gap-4 lg:gap-5 items-start">
            <div className="flex flex-col gap-1.5">
              <Label required>{t("dateLabel")}</Label>
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#2e7465] pointer-events-none"
                />
                <input
                  type="date"
                  value={data.tanggal}
                  onChange={(e) => setData({ tanggal: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-white/75 border border-[#2e7465] rounded-[8px] pl-8 pr-3 py-2.5 text-sm md:text-base text-[#1a3d34] outline-none focus:border-[#3f9e89] focus:ring-2 focus:ring-[#2e7465]/20 transition-all appearance-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3 lg:gap-4 items-start">
              <div className="flex flex-col gap-1.5">
                <Label required>{t("startTimeLabel")}</Label>
                <SelectField
                  value={data.waktuMulai}
                  onChange={(v) => {
                    const selectedIdx = TIME_SLOTS.indexOf(v);
                    const currentEndIdx = TIME_SLOTS.indexOf(data.waktuSelesai);
                    setData({
                      waktuMulai: v,
                      waktuSelesai:
                        currentEndIdx > selectedIdx ? data.waktuSelesai : "",
                    });
                  }}
                  options={TIME_SLOTS}
                  placeholder={t("selectStartTime")}
                  icon={<Clock size={15} />}
                  compact
                />
                <p className="text-[11px] text-white/55">
                  {t("timeRangeHint")}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label required>{t("endTimeLabel")}</Label>
                <SelectField
                  value={data.waktuSelesai}
                  onChange={(v) => setData({ waktuSelesai: v })}
                  options={waktuSelesaiOptions}
                  placeholder={t("selectEndTime")}
                  icon={<Clock size={15} />}
                  disabled={!data.waktuMulai}
                  compact
                />
                {!data.waktuMulai && (
                  <p className="text-[11px] text-white/55">
                    {t("endTimeDisabledHint")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <FieldWrap>
              <Label required>{t("purposeLabel")}</Label>
              <SelectField
                value={data.keperluan}
                onChange={(v) =>
                  setData({
                    keperluan: v,
                    keperluanLain: v !== "Lainnya" ? "" : data.keperluanLain,
                  })
                }
                options={KEPERLUAN_OPTIONS}
                placeholder={t("selectPurpose")}
                icon={<FileText size={15} />}
              />
            </FieldWrap>
          </div>

          <AnimatePresence>
            {isOther && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden" }}
                className="md:col-span-2"
              >
                <Label required>{t("explainPurpose")}</Label>
                <InputField
                  value={data.keperluanLain}
                  onChange={(v) => setData({ keperluanLain: v })}
                  placeholder={t("describePurposePlaceholder")}
                  multiline
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="md:col-span-2">
            <FieldWrap>
              <Label>
                {t("notesLabel")}{" "}
                <span className="text-white/50 font-normal">
                  ({t("optional")})
                </span>
              </Label>
              <InputField
                value={data.catatan}
                onChange={(v) => setData({ catatan: v })}
                placeholder={t("notesPlaceholder")}
                multiline
              />
            </FieldWrap>

            <button
              onClick={onNext}
              disabled={!isValid}
              className="w-full mt-2 bg-[#2e7465] disabled:bg-[#2e7465]/40 text-white font-semibold text-sm md:text-base lg:text-lg rounded-[8px] py-3 md:py-4 lg:py-5 flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:enabled:bg-[#3f9e89]"
            >
              {t("next")} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Step 2 ───────────────────────────────────────────────────────────
function Step2Screen({
  data,
  setData,
  onNext,
  onBack,
  language = "id",
}: {
  data: FormData;
  setData: (d: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  language?: Language;
}) {
  const t = (key: TranslationKey): string => translations[language][key] || "";
  const visitorCount = Number.parseInt(data.jumlahPengunjung, 10);

  const isValid =
    data.namaLengkap &&
    data.nomorIdentitas &&
    data.asalInstansi &&
    data.nomorTelepon &&
    data.email &&
    Number.isInteger(visitorCount) &&
    visitorCount >= 1;

  return (
    <div className="relative min-h-dvh w-full overflow-hidden flex flex-col">
      <img
        src={imgBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-110"
        style={{ objectPosition: "center 40%" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,60,45,0.82)] to-[rgba(0,30,20,0.92)]" />

      {/* Header */}
      <div className="relative z-10 pt-8 md:pt-12 lg:pt-16 pb-4 md:pb-6 px-6 md:px-8 lg:px-12">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white/70 text-xs md:text-sm mb-5 -ml-1 hover:text-white/90"
        >
          <ChevronLeft size={16} /> {t("back")}
        </button>
        <StepBar step={2} />
        <h2 className="font-['Inter',sans-serif] font-semibold text-white text-xl md:text-2xl lg:text-3xl leading-tight">
          {t("step2Title")}
        </h2>
        <p className="text-white/60 text-xs md:text-sm lg:text-base mt-1">
          {t("step2Subtitle")}
        </p>
      </div>

      {/* Form */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 md:px-8 lg:px-12 pb-8 md:pb-12">
        <div className="max-w-2xl mx-auto md:grid md:grid-cols-2 md:gap-4 lg:gap-6">
          <div className="md:col-span-2">
            <FieldWrap>
              <Label required>{t("fullNameLabel")}</Label>
              <InputField
                value={data.namaLengkap}
                onChange={(v) => setData({ namaLengkap: v })}
                placeholder={t("fullNamePlaceholder")}
                icon={<User size={15} />}
                autoComplete="name"
              />
            </FieldWrap>
          </div>

          <FieldWrap>
            <Label required>{t("identityNumberLabel")}</Label>
            <InputField
              value={data.nomorIdentitas}
              onChange={(v) => setData({ nomorIdentitas: v })}
              placeholder={t("identityNumberPlaceholder")}
              type="text"
              icon={<CreditCard size={15} />}
            />
          </FieldWrap>

          <FieldWrap>
            <Label required>{t("institutionLabel")}</Label>
            <InputField
              value={data.asalInstansi}
              onChange={(v) => setData({ asalInstansi: v })}
              placeholder={t("institutionPlaceholder")}
              icon={<Building2 size={15} />}
            />
          </FieldWrap>

          <FieldWrap>
            <Label required>{t("phoneLabel")}</Label>
            <InputField
              value={data.nomorTelepon}
              onChange={(v) => setData({ nomorTelepon: v })}
              placeholder={t("phonePlaceholder")}
              type="tel"
              icon={<Phone size={15} />}
              autoComplete="tel"
              inputMode="tel"
            />
          </FieldWrap>

          <FieldWrap>
            <Label required>{t("emailLabel")}</Label>
            <InputField
              value={data.email}
              onChange={(v) => setData({ email: v })}
              placeholder={t("emailPlaceholder")}
              type="email"
              icon={<Mail size={15} />}
              autoComplete="email"
            />
          </FieldWrap>

          <FieldWrap>
            <Label required>{t("visitorCountLabel")}</Label>
            <InputField
              value={data.jumlahPengunjung}
              onChange={(v) =>
                setData({ jumlahPengunjung: v.replace(/[^\d]/g, "") })
              }
              placeholder={t("visitorCountPlaceholder")}
              type="number"
              icon={<Users size={15} />}
              inputMode="numeric"
              min={1}
              step={1}
            />
          </FieldWrap>

          <div className="md:col-span-2">
            <button
              onClick={onNext}
              disabled={!isValid}
              className="w-full mt-2 bg-[#2e7465] disabled:bg-[#2e7465]/40 text-white font-semibold text-sm md:text-base lg:text-lg rounded-[8px] py-3 md:py-4 lg:py-5 flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:enabled:bg-[#3f9e89]"
            >
              {t("confirmBooking")} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Confirmation ────────────────────────────────────────────────────
function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-white/10 last:border-0">
      <span className="text-[11px] text-white/50 uppercase tracking-wider font-medium">
        {label}
      </span>
      <span className="text-[14px] text-white font-medium">{value || "-"}</span>
    </div>
  );
}

function ConfirmSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-[1px] w-3 bg-[#3f9e89]" />
        <span className="text-[#3f9e89] text-[12px] font-semibold uppercase tracking-widest">
          {title}
        </span>
        <div className="h-[1px] flex-1 bg-[#3f9e89]/30" />
      </div>
      <div className="bg-white/10 rounded-[10px] px-4">{children}</div>
    </div>
  );
}

function ConfirmScreen({
  data,
  onBack,
  onSubmit,
  language = "id",
}: {
  data: FormData;
  onBack: () => void;
  onSubmit: () => void;
  language?: Language;
}) {
  const t = (key: TranslationKey): string => translations[language][key] || "";

  const keperluanDisplay =
    data.keperluan === "Lainnya"
      ? `Lainnya — ${data.keperluanLain}`
      : data.keperluan;
  const waktuKunjungan = formatVisitTimeRange(
    data.waktuMulai,
    data.waktuSelesai,
  );

  return (
    <div className="relative min-h-dvh w-full overflow-hidden flex flex-col">
      <img
        src={imgBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-110"
        style={{ objectPosition: "center 40%" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,60,45,0.88)] to-[rgba(0,30,20,0.96)]" />

      {/* Header */}
      <div className="relative z-10 pt-8 md:pt-12 lg:pt-16 pb-4 md:pb-6 px-6 md:px-8 lg:px-12">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white/70 text-xs md:text-sm mb-5 -ml-1 hover:text-white/90"
        >
          <ChevronLeft size={16} /> {t("back")}
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-full bg-[#2e7465] flex items-center justify-center">
            <CheckCircle2 size={16} className="text-white" />
          </div>
          <h2 className="font-['Inter',sans-serif] font-semibold text-white text-xl md:text-2xl lg:text-3xl">
            {t("confirmTitle")}
          </h2>
        </div>
        <p className="text-white/60 text-xs md:text-sm lg:text-base mt-1">
          {t("confirmSubtitle")}
        </p>
      </div>

      {/* Summary */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 md:px-8 lg:px-12 pb-8 md:pb-12">
        <div className="max-w-2xl mx-auto">
          <ConfirmSection title={t("visitDetailTitle")}>
            <ConfirmRow label={t("officialLabel")} value={data.pejabat} />
            <ConfirmRow label={t("roomLabel")} value={data.ruangan} />
            <ConfirmRow
              label={t("dateLabel")}
              value={formatDate(data.tanggal)}
            />
            <ConfirmRow
              label={t("timeLabel")}
              value={waktuKunjungan === "-" ? "-" : `${waktuKunjungan} WIB`}
            />
            <ConfirmRow label={t("purposeLabel")} value={keperluanDisplay} />
            {data.catatan && (
              <ConfirmRow label={t("notesLabel")} value={data.catatan} />
            )}
          </ConfirmSection>

          <ConfirmSection title={t("personalDataTitle")}>
            <ConfirmRow label={t("fullNameLabel")} value={data.namaLengkap} />
            <ConfirmRow
              label={t("identityNumberLabel")}
              value={data.nomorIdentitas}
            />
            <ConfirmRow
              label={t("institutionLabel")}
              value={data.asalInstansi}
            />
            <ConfirmRow label={t("phoneLabel")} value={data.nomorTelepon} />
            <ConfirmRow label={t("emailLabel")} value={data.email} />
            <ConfirmRow
              label={t("visitorCountLabel")}
              value={data.jumlahPengunjung}
            />
          </ConfirmSection>

          <p className="text-white/50 text-xs md:text-sm text-center mb-5 leading-[1.6]">
            {t("confirmDisclaimer")}
          </p>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={onSubmit}
              className="flex-1 bg-[#2e7465] text-white font-semibold text-sm md:text-base lg:text-lg rounded-[8px] py-3 md:py-4 lg:py-5 flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-[#3f9e89] shadow-lg shadow-[#2e7465]/30"
            >
              <CheckCircle2 size={17} /> {t("submitBooking")}
            </button>
            <button
              onClick={onBack}
              className="flex-1 border border-white/30 text-white/80 font-medium text-sm md:text-base rounded-[8px] py-3 md:py-4 lg:py-5 transition-all active:scale-[0.98] hover:border-white/50"
            >
              {t("editData")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Success ───────────────────────────────────────────────────────────
function SuccessScreen({
  onReset,
  onCekPin,
  pin,
  language = "id",
}: {
  onReset: () => void;
  onCekPin: (pin: string) => void;
  pin: string;
  language?: Language;
}) {
  const t = (key: TranslationKey): string => translations[language][key] || "";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative min-h-dvh w-full overflow-hidden flex flex-col items-center justify-center px-6 md:px-8 lg:px-12">
      <img
        src={imgBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-110"
        style={{ objectPosition: "center 40%" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,60,45,0.9)] to-[rgba(0,30,20,0.97)]" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.1,
          }}
          className="w-16 md:w-20 h-16 md:h-20 rounded-full bg-[#2e7465] flex items-center justify-center mb-6 shadow-xl shadow-[#2e7465]/40"
        >
          <CheckCircle2 size={40} className="text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-white font-semibold text-2xl md:text-3xl lg:text-4xl mb-2">
            {t("successTitle")}
          </h2>
          <p className="text-white/65 text-sm md:text-base lg:text-lg leading-[1.6] mb-8">
            {t("successSubtitle")}
          </p>

          <div className="bg-white/12 border border-[#3f9e89]/50 rounded-[12px] px-6 md:px-8 py-4 md:py-5 mb-8">
            <p className="text-[#3f9e89] text-xs md:text-sm font-semibold uppercase tracking-widest mb-2">
              {t("pinLabel")}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <p className="text-white text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.3em]">
                {pin}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs md:text-sm text-white/80 transition-all hover:bg-white/15"
                aria-label={t("copyPin")}
              >
                <Copy size={14} />
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
          </div>

          <p className="text-white/40 text-xs md:text-sm mb-8">
            {t("savePin")}
          </p>

          <div className="flex flex-col md:flex-row gap-3 w-full">
            <button
              onClick={() => onCekPin(pin)}
              className="flex-1 bg-[#2e7465] text-white font-semibold text-sm md:text-base rounded-[8px] py-3 md:py-4 transition-all active:scale-[0.98] flex items-center justify-center gap-2 hover:bg-[#3f9e89]"
            >
              <Search size={15} /> {t("checkStatus")}
            </button>
            <button
              onClick={onReset}
              className="flex-1 border border-white/25 text-white/70 font-medium text-sm md:text-base rounded-[8px] py-3 md:py-4 transition-all active:scale-[0.98] hover:border-white/50"
            >
              {t("backToHome")}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
const EMPTY: FormData = {
  pejabat: "",
  ruangan: "",
  tanggal: "",
  waktuMulai: "",
  waktuSelesai: "",
  keperluan: "",
  keperluanLain: "",
  catatan: "",
  namaLengkap: "",
  nomorIdentitas: "",
  asalInstansi: "",
  nomorTelepon: "",
  email: "",
  jumlahPengunjung: "",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [sessionPin, setSessionPin] = useState("");
  const [prevScreen, setPrevScreen] = useState<Screen>("landing");
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "id";
    return (localStorage.getItem("vms-language") as Language) || "id";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vms-language", language);
    }
  }, [language]);

  const t = (key: TranslationKey) => translations[language][key];

  const patch = (d: Partial<FormData>) => setForm((f) => ({ ...f, ...d }));

  const goTo = (s: Screen) => {
    setPrevScreen(screen);
    setScreen(s);
  };

  const handleCekPin = (pin?: string) => {
    if (pin) setSessionPin(pin);
    goTo("cek-pin");
  };

  const screens: Record<string, React.ReactNode> = {
    landing: (
      <LandingScreen
        onStart={() => goTo("step1")}
        onCekPin={() => handleCekPin()}
        language={language}
      />
    ),
    step1: (
      <Step1Screen
        data={form}
        setData={patch}
        onNext={() => goTo("step2")}
        onBack={() => goTo("landing")}
        language={language}
      />
    ),
    step2: (
      <Step2Screen
        data={form}
        setData={patch}
        onNext={() => goTo("confirm")}
        onBack={() => goTo("step1")}
        language={language}
      />
    ),
    "cek-pin": (
      <CekPinScreen
        onBack={() => goTo(prevScreen === "cek-pin" ? "landing" : prevScreen)}
        sessionPin={sessionPin}
        language={language}
      />
    ),
    confirm: submitted ? (
      <SuccessScreen
        pin={sessionPin}
        onReset={() => {
          setSubmitted(false);
          setForm(EMPTY);
          setSessionPin("");
          goTo("landing");
        }}
        onCekPin={(p) => handleCekPin(p)}
        language={language}
      />
    ) : (
      <ConfirmScreen
        data={form}
        onBack={() => goTo("step2")}
        onSubmit={() => {
          const newPin = Math.floor(100000 + Math.random() * 900000).toString();
          const issuedAt = new Date().toISOString();
          storeBooking({
            pin: newPin,
            status: "menunggu",
            pejabat: form.pejabat,
            ruangan: form.ruangan,
            tanggal: form.tanggal,
            waktu: formatVisitTimeRange(form.waktuMulai, form.waktuSelesai),
            keperluan:
              form.keperluan === "Lainnya"
                ? form.keperluanLain
                : form.keperluan,
            nama: form.namaLengkap,
            catatan: form.catatan,
            issuedAt,
            expiresAt: addMonths(
              new Date(issuedAt),
              BOOKING_EXPIRY_MONTHS,
            ).toISOString(),
          });
          setSessionPin(newPin);
          setSubmitted(true);
        }}
        language={language}
      />
    ),
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,116,101,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_28%),linear-gradient(180deg,#0f172a_0%,#020617_100%)]" />
      <div className="relative z-10">
        {/* Language Toggle */}
        <div className="fixed top-4 right-4 md:top-6 md:right-6 lg:top-8 lg:right-8 z-50">
          <div className="bg-white/10 border border-white/20 rounded-[8px] p-1 flex gap-1 backdrop-blur">
            <button
              onClick={() => setLanguage("id")}
              className={`px-3 md:px-4 py-2 rounded-[6px] text-xs md:text-sm font-medium transition-all ${
                language === "id"
                  ? "bg-[#2e7465] text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              ID
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 md:px-4 py-2 rounded-[6px] text-xs md:text-sm font-medium transition-all ${
                language === "en"
                  ? "bg-[#2e7465] text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={screen + String(submitted) + sessionPin}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="min-h-dvh"
          >
            {screens[screen]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

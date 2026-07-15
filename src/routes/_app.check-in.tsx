import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin, KeyRound, QrCode, LogIn } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatusBadge } from "@/components/data/StatusBadge";
import { EmptyState } from "@/components/data/EmptyState";
import { ActionTile } from "@/components/data/ActionTile";
import { Button } from "@/components/ui/button";
import { CodeInputDialog, QrScanDialog } from "@/components/dialogs/CheckInDialogs";
import { useBookings, useBookingMutations } from "@/app/queries";
import { useSession } from "@/app/SessionContext";
import { FEATURES, hasPermission } from "@/domain/permissions";
import type { Booking } from "@/domain/types";

export const Route = createFileRoute("/_app/check-in")({
  head: () => ({
    meta: [
      { title: "Check In — NUSANTARA" },
      { name: "description", content: "Check visitors in via QR, code, or on-site." },
    ],
  }),
  component: CheckInPage,
});

function CheckInPage() {
  const { user } = useSession();
  const { data: bookings = [] } = useBookings();
  const mut = useBookingMutations();
  const [openCode, setOpenCode] = useState(false);
  const [openQr, setOpenQr] = useState(false);

  if (!hasPermission(user, FEATURES.CHECKIN_PERFORM)) {
    throw redirect({ to: "/unauthorized" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const eligible = useMemo(
    () => bookings.filter((b) => b.date === today && (b.status === "accepted" || b.status === "pending")),
    [bookings, today],
  );
  const availableCodes = eligible.map((b) => b.bookingCode);

  const doCheckIn = async (code: string) => {
    const booking = bookings.find((b) => b.bookingCode.toLowerCase() === code.toLowerCase());
    if (!booking) return { ok: false, message: "Booking code not found." };
    if (booking.date !== today) return { ok: false, message: "This booking isn't scheduled for today." };
    if (booking.status === "checked_in") return { ok: false, message: "Visitor is already checked in." };
    if (booking.status === "rejected" || booking.status === "cancelled") return { ok: false, message: `Booking is ${booking.status}.` };
    await mut.checkIn.mutateAsync({ id: booking.id, by: user?.employee.name ?? "receptionist" });
    toast.success(`Checked in: ${booking.visitorName}`);
    return { ok: true, message: "Success" };
  };

  const columns: Column<Booking>[] = [
    { key: "time", header: "Waktu", cell: (b) => <span className="font-mono text-sm">{b.time}</span>, className: "w-24" },
    { key: "visitor", header: "Visitor", cell: (b) => <span className="font-medium">{b.visitorName}</span> },
    { key: "code", header: "Kode", cell: (b) => <span className="font-mono text-xs">{b.bookingCode}</span> },
    { key: "location", header: "Lokasi", cell: (b) => b.location },
    { key: "status", header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
    { key: "action", header: "Action", cell: (b) => (
      <Button
        size="sm"
        onClick={async (e) => {
          e.stopPropagation();
          await doCheckIn(b.bookingCode);
        }}
        disabled={b.status === "checked_in" || b.status === "checked_out"}
      >
        Check In
      </Button>
    ) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Check In" description="Check visitors in on arrival." />

      <div className="grid gap-4 sm:grid-cols-3">
        <ActionTile
          title="On Site"
          description="Pick from today's list and confirm arrival."
          icon={<MapPin className="h-5 w-5" />}
          onClick={() => document.getElementById("checkin-list")?.scrollIntoView({ behavior: "smooth" })}
        />
        <ActionTile
          title="Input Code"
          description="Type the visitor's booking code manually."
          icon={<KeyRound className="h-5 w-5" />}
          onClick={() => setOpenCode(true)}
        />
        <ActionTile
          title="Scan QR"
          description="Scan the QR code from the visitor's confirmation."
          icon={<QrCode className="h-5 w-5" />}
          onClick={() => setOpenQr(true)}
        />
      </div>

      <div id="checkin-list" className="space-y-3">
        <h2 className="font-display text-lg font-bold">Today's arrivals</h2>
        <DataTable
          columns={columns}
          rows={eligible}
          rowKey={(b) => b.id}
          emptyState={
            <EmptyState
              icon={<LogIn className="h-5 w-5" />}
              title="No visitors scheduled today"
              description="Bookings will appear here on their scheduled date."
            />
          }
        />
      </div>

      <CodeInputDialog
        open={openCode}
        onOpenChange={setOpenCode}
        title="Check In by Code"
        description="Enter the visitor's booking code to check them in."
        onSubmit={doCheckIn}
      />
      <QrScanDialog
        open={openQr}
        onOpenChange={setOpenQr}
        title="Scan QR to Check In"
        onSubmit={doCheckIn}
        simulatedCodes={availableCodes}
      />
    </div>
  );
}

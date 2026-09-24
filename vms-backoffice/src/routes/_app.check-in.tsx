import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin, KeyRound, LogIn } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatusBadge } from "@/components/data/StatusBadge";
import { EmptyState } from "@/components/data/EmptyState";
import { ActionTile } from "@/components/data/ActionTile";
import { Button } from "@/components/ui/button";
import { CodeInputDialog } from "@/components/dialogs/CheckInDialogs";
import { DataLoadState } from "@/components/data/DataLoadState";
import { useBookings, useBookingMutations } from "@/app/queries";
import { useSession } from "@/app/SessionContext";
import { FEATURES, hasPermission } from "@/domain/permissions";
import type { Booking } from "@/domain/types";
import { canMockCheckIn } from "@/domain/bookingLifecycle";
import { useWitaToday } from "@/app/useWitaToday";

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
  const bookingsQuery = useBookings();
  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const mut = useBookingMutations();
  const [openCode, setOpenCode] = useState(false);

  if (!hasPermission(user, FEATURES.CHECKIN_PERFORM)) {
    throw redirect({ to: "/unauthorized" });
  }

  const today = useWitaToday();
  const eligible = useMemo(
    () => bookings.filter((booking) => canMockCheckIn(booking, today)),
    [bookings, today],
  );

  const doCheckIn = async (code: string) => {
    const booking = bookings.find((b) => b.bookingCode.toLowerCase() === code.toLowerCase());
    if (!booking) return { ok: false, message: "Booking code not found." };
    if (!canMockCheckIn(booking, today)) {
      return { ok: false, message: booking.status !== "accepted" ? "This booking is not approved for arrival." : "This booking isn't scheduled for today (WITA)." };
    }
    try {
      await mut.checkIn.mutateAsync({ id: booking.id, by: user?.employee.name ?? "receptionist" });
      toast.success(`Checked in: ${booking.visitorName}`);
      return { ok: true, message: "Success" };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Check-in failed. Please try again." };
    }
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
        disabled={mut.checkIn.isPending}
      >
        Check In
      </Button>
    ) },
  ];

  if (bookingsQuery.isPending) return <DataLoadState subject="today's arrivals" />;
  if (bookingsQuery.isError) return <DataLoadState subject="today's arrivals" error onRetry={() => void bookingsQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Check In" description="Check visitors in on arrival." />

      <div className="grid gap-4 sm:grid-cols-2">
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
    </div>
  );
}

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin, KeyRound, LogOut } from "lucide-react";
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
import { canMockCheckOut } from "@/domain/bookingLifecycle";

export const Route = createFileRoute("/_app/check-out")({
  head: () => ({
    meta: [
      { title: "Check Out — NUSANTARA" },
      { name: "description", content: "Check visitors out." },
    ],
  }),
  component: CheckOutPage,
});

function CheckOutPage() {
  const { user } = useSession();
  const bookingsQuery = useBookings();
  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const mut = useBookingMutations();
  const [openCode, setOpenCode] = useState(false);

  if (!hasPermission(user, FEATURES.CHECKOUT_PERFORM)) {
    throw redirect({ to: "/unauthorized" });
  }

  const eligible = useMemo(() => bookings.filter((b) => b.status === "checked_in"), [bookings]);

  const doCheckOut = async (code: string) => {
    const booking = bookings.find((b) => b.bookingCode.toLowerCase() === code.toLowerCase());
    if (!booking) return { ok: false, message: "Booking code not found." };
    if (!canMockCheckOut(booking)) return { ok: false, message: "Only a checked-in visitor can be checked out." };
    try {
      await mut.checkOut.mutateAsync({ id: booking.id, by: user?.employee.name ?? "receptionist" });
      toast.success(`Checked out: ${booking.visitorName}`);
      return { ok: true, message: "Success" };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Check-out failed. Please try again." };
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
        variant="outline"
        onClick={async (e) => {
          e.stopPropagation();
          await doCheckOut(b.bookingCode);
        }}
      >
        Check Out
      </Button>
    ) },
  ];

  if (bookingsQuery.isPending) return <DataLoadState subject="checked-in visits" />;
  if (bookingsQuery.isError) return <DataLoadState subject="checked-in visits" error onRetry={() => void bookingsQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Check Out" description="Check visitors out at the end of their visit." />

      <div className="grid gap-4 sm:grid-cols-2">
        <ActionTile
          title="On Site"
          description="Pick from the currently-checked-in list."
          icon={<MapPin className="h-5 w-5" />}
          onClick={() => document.getElementById("checkout-list")?.scrollIntoView({ behavior: "smooth" })}
        />
        <ActionTile
          title="Input Code"
          description="Type the visitor's booking code to check them out."
          icon={<KeyRound className="h-5 w-5" />}
          onClick={() => setOpenCode(true)}
        />
      </div>

      <div id="checkout-list" className="space-y-3">
        <h2 className="font-display text-lg font-bold">Currently on-site</h2>
        <DataTable
          columns={columns}
          rows={eligible}
          rowKey={(b) => b.id}
          emptyState={
            <EmptyState
              icon={<LogOut className="h-5 w-5" />}
              title="No visitors currently checked in"
              description="Check-outs will appear here after visitors arrive."
            />
          }
        />
      </div>

      <CodeInputDialog
        open={openCode}
        onOpenChange={setOpenCode}
        title="Check Out by Code"
        description="Enter the visitor's booking code to check them out."
        onSubmit={doCheckOut}
      />
    </div>
  );
}

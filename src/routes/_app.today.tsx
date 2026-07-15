import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatusBadge } from "@/components/data/StatusBadge";
import { EmptyState } from "@/components/data/EmptyState";
import { useBookings, useOfficers } from "@/app/queries";
import { useSession } from "@/app/SessionContext";
import { FEATURES, hasPermission, scopeBookings } from "@/domain/permissions";
import type { Booking } from "@/domain/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/today")({
  head: () => ({
    meta: [
      { title: "Today's Visit — NUSANTARA" },
      { name: "description", content: "Visits scheduled for today." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { user } = useSession();
  const { data: allBookings = [] } = useBookings();
  const { data: officers = [] } = useOfficers();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);

  if (!hasPermission(user, FEATURES.TODAY_VIEW)) {
    throw redirect({ to: "/unauthorized" });
  }

  const bookings = useMemo(
    () => scopeBookings(user, allBookings, officers).filter((b) => b.date === date),
    [user, allBookings, officers, date],
  );

  const columns: Column<Booking>[] = [
    { key: "time", header: "Waktu", cell: (b) => <span className="font-mono text-sm">{b.time}</span>, className: "w-24" },
    { key: "visitor", header: "Visitor", cell: (b) => (
      <div>
        <p className="font-medium">{b.visitorName}</p>
        {b.visitorOrg && <p className="text-xs text-muted-foreground">{b.visitorOrg}</p>}
      </div>
    ) },
    { key: "location", header: "Lokasi", cell: (b) => b.location },
    { key: "agenda", header: "Agenda", cell: (b) => <span className="line-clamp-2">{b.agenda}</span> },
    { key: "status", header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's Visit"
        description="All visits scheduled for the selected date."
        actions={
          <div className="flex items-center gap-2">
            <Label htmlFor="date" className="text-sm text-muted-foreground">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 w-auto"
            />
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={bookings}
        rowKey={(b) => b.id}
        page={page}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title="No visits for this date"
            description="Try a different date or ask your PA to create a booking."
          />
        }
      />
    </div>
  );
}

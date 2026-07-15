import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Plus, Search, Trash2, XCircle, CalendarClock, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatusBadge } from "@/components/data/StatusBadge";
import { EmptyState } from "@/components/data/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useBookings, useBookingMutations, useOfficers } from "@/app/queries";
import { useSession } from "@/app/SessionContext";
import {
  FEATURES,
  canActOnBooking,
  hasPermission,
  isBookingVip,
  scopeBookings,
} from "@/domain/permissions";
import type { Booking, BookingStatus, VisitorCategory } from "@/domain/types";

export const Route = createFileRoute("/_app/booking")({
  head: () => ({
    meta: [
      { title: "Booking — NUSANTARA" },
      { name: "description", content: "Manage visitor bookings." },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  const { user } = useSession();
  const { data: allBookings = [] } = useBookings();
  const { data: officers = [] } = useOfficers();
  const mut = useBookingMutations();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [openBooking, setOpenBooking] = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);

  if (!hasPermission(user, FEATURES.BOOKING_VIEW)) {
    throw redirect({ to: "/unauthorized" });
  }

  const bookings = useMemo(() => {
    let list = scopeBookings(user, allBookings, officers);
    if (statusFilter !== "all") list = list.filter((b) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.visitorName.toLowerCase().includes(q) ||
          b.bookingCode.toLowerCase().includes(q) ||
          b.location.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));
  }, [user, allBookings, officers, statusFilter, search]);

  const columns: Column<Booking>[] = [
    { key: "date", header: "Tanggal", cell: (b) => <span className="font-mono text-sm">{b.date}</span> },
    { key: "time", header: "Waktu", cell: (b) => <span className="font-mono text-sm">{b.time}</span> },
    { key: "visitor", header: "Visitor", cell: (b) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{b.visitorName}</span>
        {isBookingVip(b, officers.find((o) => o.id === b.officerId)) && (
          <Sparkles className="h-3.5 w-3.5 text-vip" />
        )}
      </div>
    ) },
    { key: "location", header: "Lokasi", cell: (b) => b.location },
    { key: "agenda", header: "Agenda", cell: (b) => <span className="line-clamp-1">{b.agenda}</span> },
    { key: "code", header: "Kode", cell: (b) => <span className="font-mono text-xs">{b.bookingCode}</span> },
    { key: "status", header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking"
        description="Manage visitor bookings — approve, reject, or reschedule."
        actions={
          hasPermission(user, FEATURES.BOOKING_CREATE) ? (
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Booking
            </Button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by visitor, code, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | "all")}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="reschedule">Reschedule</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={bookings}
        rowKey={(b) => b.id}
        onRowClick={setOpenBooking}
        page={page}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={<CalendarClock className="h-5 w-5" />}
            title="No bookings match your filters"
            description="Try clearing the search or filter."
          />
        }
      />

      <BookingDetailSheet
        booking={openBooking}
        officers={officers}
        onClose={() => setOpenBooking(null)}
        canAct={openBooking ? canActOnBooking(user, openBooking, officers) : false}
        onApprove={async () => {
          if (!openBooking) return;
          await mut.approve.mutateAsync(openBooking.id);
          toast.success("Booking approved");
          setOpenBooking(null);
        }}
        onReject={async () => {
          if (!openBooking) return;
          await mut.reject.mutateAsync(openBooking.id);
          toast.success("Booking rejected");
          setOpenBooking(null);
        }}
        onReschedule={async () => {
          if (!openBooking) return;
          await mut.reschedule.mutateAsync(openBooking.id);
          toast.success("Booking marked for reschedule");
          setOpenBooking(null);
        }}
        onDelete={async () => {
          if (!openBooking) return;
          await mut.remove.mutateAsync(openBooking.id);
          toast.success("Booking deleted");
          setOpenBooking(null);
        }}
      />

      <BookingCreateDialog
        open={creating}
        onOpenChange={setCreating}
        onCreate={async (input) => {
          await mut.create.mutateAsync(input);
          toast.success("Booking created");
        }}
      />
    </div>
  );
}

function BookingDetailSheet({
  booking,
  officers,
  onClose,
  canAct,
  onApprove,
  onReject,
  onReschedule,
  onDelete,
}: {
  booking: Booking | null;
  officers: ReturnType<typeof useOfficers>["data"];
  onClose: () => void;
  canAct: boolean;
  onApprove: () => void;
  onReject: () => void;
  onReschedule: () => void;
  onDelete: () => void;
}) {
  const officer = officers?.find((o) => o.id === booking?.officerId);
  return (
    <Sheet open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {booking && (
          <>
            <SheetHeader>
              <SheetTitle className="font-display">{booking.visitorName}</SheetTitle>
              <SheetDescription>{booking.visitorOrg}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4 px-4 sm:px-6">
              <Detail label="Booking Code" value={<span className="font-mono">{booking.bookingCode}</span>} />
              <Detail label="Officer" value={officer ? `${officer.name} — ${officer.jabatan}` : "—"} />
              <Detail label="Date & Time" value={`${booking.date} · ${booking.time}`} />
              <Detail label="Location" value={booking.location} />
              <Detail label="Agenda" value={booking.agenda} />
              <Detail label="Category" value={<StatusBadge status={booking.category} />} />
              <Detail label="Status" value={<StatusBadge status={booking.status} />} />
              {booking.checkedInAt && <Detail label="Checked in" value={new Date(booking.checkedInAt).toLocaleString()} />}
              {booking.checkedOutAt && <Detail label="Checked out" value={new Date(booking.checkedOutAt).toLocaleString()} />}
            </div>
            {canAct && (
              <div className="mt-6 space-y-2 border-t border-border px-4 pt-4 sm:px-6">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={onApprove} className="gap-2"><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                  <Button onClick={onReject} variant="destructive" className="gap-2"><XCircle className="h-4 w-4" /> Reject</Button>
                </div>
                <Button onClick={onReschedule} variant="outline" className="w-full gap-2">
                  <CalendarClock className="h-4 w-4" /> Reschedule
                </Button>
                <Button onClick={onDelete} variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" /> Delete booking
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 text-sm">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}

function BookingCreateDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (input: {
    officerId: string;
    visitorName: string;
    visitorOrg: string;
    date: string;
    time: string;
    location: string;
    agenda: string;
    category: VisitorCategory;
  }) => Promise<void>;
}) {
  const { data: officers = [] } = useOfficers();
  const [form, setForm] = useState({
    officerId: "",
    visitorName: "",
    visitorOrg: "",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    location: "",
    agenda: "",
    category: "regular" as VisitorCategory,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.officerId || !form.visitorName || !form.location) return;
    await onCreate(form);
    onOpenChange(false);
    setForm({ ...form, visitorName: "", visitorOrg: "", location: "", agenda: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">New Booking</DialogTitle>
          <DialogDescription>Create a visitor booking for one of the officers you manage.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Officer</Label>
            <Select value={form.officerId} onValueChange={(v) => setForm({ ...form, officerId: v })}>
              <SelectTrigger><SelectValue placeholder="Select officer" /></SelectTrigger>
              <SelectContent>
                {officers.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name} — {o.jabatan}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Visitor name</Label>
              <Input value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label>Organization</Label>
              <Input value={form.visitorOrg} onChange={(e) => setForm({ ...form, visitorOrg: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Time</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          </div>
          <div className="grid gap-2">
            <Label>Agenda</Label>
            <Textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={3} />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as VisitorCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="service_utility">Service & Utility</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create booking</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

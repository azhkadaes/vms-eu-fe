import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { PageHeader } from "@/components/data/PageHeader";
import { StatCard } from "@/components/data/StatCard";
import { StatusBadge } from "@/components/data/StatusBadge";
import { DataTable, type Column } from "@/components/data/DataTable";
import { EmptyState } from "@/components/data/EmptyState";
import { useAnalyticsTrend, useBookings, useOfficers } from "@/app/queries";
import { useSession } from "@/app/SessionContext";
import { FEATURES, hasPermission, scopeBookings } from "@/domain/permissions";
import type { Booking } from "@/domain/types";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NUSANTARA" },
      { name: "description", content: "Overview of bookings, check-ins, and visitor activity." },
    ],
  }),
  beforeLoad: () => {
    // Client-side gate — see permission check in component too.
    if (typeof window === "undefined") return;
  },
  component: DashboardPage,
});

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function DashboardPage() {
  const { user } = useSession();
  const { data: allBookings = [] } = useBookings();
  const { data: officers = [] } = useOfficers();
  const year = new Date().getFullYear();
  const { data: trend = [] } = useAnalyticsTrend(year);

  if (!hasPermission(user, FEATURES.DASHBOARD_VIEW)) {
    throw redirect({ to: "/unauthorized" });
  }

  const bookings = useMemo(() => scopeBookings(user, allBookings, officers), [user, allBookings, officers]);

  const accepted = bookings.filter((b) => b.status === "accepted").length;
  const pending = bookings.filter((b) => b.status === "pending" || b.status === "reschedule").length;
  const rejected = bookings.filter((b) => b.status === "rejected").length;

  const today = todayIso();
  const tomorrow = tomorrowIso();
  const todayList = bookings.filter((b) => b.date === today);
  const tomorrowList = bookings.filter((b) => b.date === tomorrow);
  const checkedInToday = bookings.filter((b) => b.status === "checked_in" && b.date === today).length;
  const checkedOutToday = bookings.filter((b) => b.status === "checked_out" && b.date === today).length;

  const columns: Column<Booking>[] = [
    { key: "time", header: "Waktu", cell: (b) => <span className="font-mono text-sm">{b.time}</span>, className: "w-24" },
    { key: "visitor", header: "Visitor", cell: (b) => <span className="font-medium">{b.visitorName}</span> },
    { key: "location", header: "Lokasi", cell: (b) => b.location },
    { key: "status", header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${user?.employee.name.split(" ")[0] ?? "there"}`}
        description="Here's what's happening across visitor activity today."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Accepted" value={accepted} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" />
        <StatCard label="Pending / Reschedule" value={pending} icon={<CalendarClock className="h-5 w-5" />} accent="warning" />
        <StatCard label="Rejected" value={rejected} icon={<XCircle className="h-5 w-5" />} accent="destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Total Visitor Trend</h2>
            <span className="text-xs text-muted-foreground">{year}</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Line type="monotone" dataKey="vip" stroke="var(--vip)" strokeWidth={2} />
                <Line type="monotone" dataKey="regular" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <StatCard label="Checked In today" value={checkedInToday} icon={<LogIn className="h-5 w-5" />} accent="info" />
          <StatCard label="Checked Out today" value={checkedOutToday} icon={<LogOut className="h-5 w-5" />} accent="success" />
          <StatCard label="Bookings total" value={bookings.length} icon={<BookOpen className="h-5 w-5" />} accent="primary" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Today's Visit</h2>
            <span className="text-xs text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" />
              {today}
            </span>
          </div>
          <DataTable
            columns={columns}
            rows={todayList}
            rowKey={(b) => b.id}
            emptyState={
              <EmptyState
                icon={<CalendarClock className="h-5 w-5" />}
                title="No visits scheduled today"
                description="New bookings will appear here as soon as they're created."
              />
            }
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Tomorrow's Visitors</h2>
            <span className="text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3 w-3" />
              {tomorrow}
            </span>
          </div>
          <DataTable
            columns={columns}
            rows={tomorrowList}
            rowKey={(b) => b.id}
            emptyState={
              <EmptyState
                icon={<CalendarClock className="h-5 w-5" />}
                title="Nothing on the calendar for tomorrow yet"
              />
            }
          />
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Clock,
  Crown,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/data/PageHeader";
import { StatCard } from "@/components/data/StatCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBookings, useOfficers } from "@/app/queries";
import { DataLoadState } from "@/components/data/DataLoadState";
import { useSession } from "@/app/SessionContext";
import { FEATURES, hasPermission, scopeBookings } from "@/domain/permissions";
import { witaYear } from "@/domain/wita";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — NUSANTARA" },
      { name: "description", content: "Visitor analytics and yearly trends." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user } = useSession();
  const [year, setYear] = useState(witaYear);
  const bookingsQuery = useBookings();
  const officersQuery = useOfficers();
  const bookings = useMemo(
    () => scopeBookings(user, bookingsQuery.data ?? [], officersQuery.data ?? []),
    [user, bookingsQuery.data, officersQuery.data],
  );
  const officers = useMemo(() => officersQuery.data ?? [], [officersQuery.data]);
  const trend = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month, index) => {
      const monthBookings = bookings.filter((booking) => booking.date.startsWith(`${year}-${String(index + 1).padStart(2, "0")}`));
      const vip = monthBookings.filter((booking) => officers.find((officer) => officer.id === booking.officerId)?.isVip).length;
      return { month, vip, regular: monthBookings.length - vip };
    });
  }, [bookings, officers, year]);
  const kpis = useMemo(() => {
    const vip = bookings.filter((booking) => officers.find((officer) => officer.id === booking.officerId)?.isVip).length;
    const vvip = bookings.filter((booking) => officers.find((officer) => officer.id === booking.officerId)?.isVvip).length;
    const serviceUtility = bookings.filter((booking) => booking.category === "service_utility").length;
    const regular = bookings.filter((booking) => booking.category === "regular" && !officers.find((officer) => officer.id === booking.officerId)?.isVip).length;
    const hours = new Map<string, number>();
    for (const booking of bookings) hours.set(booking.time.slice(0, 2), (hours.get(booking.time.slice(0, 2)) ?? 0) + 1);
    const peakHour = [...hours].sort((a, b) => b[1] - a[1])[0]?.[0];
    return { total: bookings.length, vip, vvip, serviceUtility, regular, peakTime: peakHour ? `${peakHour}:00` : "—" };
  }, [bookings, officers]);

  if (!hasPermission(user, FEATURES.ANALYTICS_VIEW)) {
    throw redirect({ to: "/unauthorized" });
  }

  const currentYear = witaYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];

  if (bookingsQuery.isPending || officersQuery.isPending) return <DataLoadState subject="analytics" />;
  if (bookingsQuery.isError || officersQuery.isError) {
    return <DataLoadState subject="analytics" error onRetry={() => { void bookingsQuery.refetch(); void officersQuery.refetch(); }} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Yearly visitor trends and category breakdowns."
        actions={
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Bookings" value={kpis.total} icon={<Users className="h-5 w-5" />} accent="primary" />
        <StatCard label="VIP Bookings" value={kpis.vip} icon={<Sparkles className="h-5 w-5" />} accent="vip" />
        <StatCard label="VVIP Bookings" value={kpis.vvip} icon={<Crown className="h-5 w-5" />} accent="warning" />
        <StatCard label="Peak Time" value={kpis.peakTime} icon={<Clock className="h-5 w-5" />} accent="info" />
        <StatCard label="Regular Bookings" value={kpis.regular} icon={<BarChart3 className="h-5 w-5" />} accent="default" />
        <StatCard label="Service & Utility" value={kpis.serviceUtility} icon={<Wrench className="h-5 w-5" />} accent="info" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display text-lg font-bold">Visits by Month</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="currentColor" fontSize={12} />
              <YAxis stroke="currentColor" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="vip" name="VIP" stroke="var(--vip)" strokeWidth={2} />
              <Line type="monotone" dataKey="regular" name="Regular" stroke="var(--primary)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

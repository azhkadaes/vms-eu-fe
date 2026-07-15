import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
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
import { useAnalyticsKpis, useAnalyticsTrend } from "@/app/queries";
import { useSession } from "@/app/SessionContext";
import { FEATURES, hasPermission } from "@/domain/permissions";

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
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: trend = [] } = useAnalyticsTrend(year);
  const { data: kpis } = useAnalyticsKpis();

  if (!hasPermission(user, FEATURES.ANALYTICS_VIEW)) {
    throw redirect({ to: "/unauthorized" });
  }

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];

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
        <StatCard label="Total Visitor" value={kpis?.total ?? "—"} icon={<Users className="h-5 w-5" />} accent="primary" />
        <StatCard label="VIP Visitor" value={kpis?.vip ?? "—"} icon={<Sparkles className="h-5 w-5" />} accent="vip" />
        <StatCard label="VVIP Visitor" value={kpis?.vvip ?? "—"} icon={<Crown className="h-5 w-5" />} accent="warning" />
        <StatCard label="Peak Time" value={kpis?.peakTime ?? "—"} icon={<Clock className="h-5 w-5" />} accent="info" />
        <StatCard label="Regular Visitor" value={kpis?.regular ?? "—"} icon={<BarChart3 className="h-5 w-5" />} accent="default" />
        <StatCard label="Service & Utility" value={kpis?.serviceUtility ?? "—"} icon={<Wrench className="h-5 w-5" />} accent="info" />
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

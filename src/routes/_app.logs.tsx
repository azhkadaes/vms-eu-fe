import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Send } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogs } from "@/app/queries";
import { useRepos } from "@/app/RepositoriesContext";
import { useSession } from "@/app/SessionContext";
import { FEATURES, hasPermission } from "@/domain/permissions";
import type { AuditLog } from "@/domain/types";

export const Route = createFileRoute("/_app/logs")({
  head: () => ({
    meta: [
      { title: "Log & Report — NUSANTARA" },
      { name: "description", content: "Export audit logs and download reports." },
    ],
  }),
  component: LogsPage,
});

function LogsPage() {
  const { user } = useSession();
  const { data: logs = [] } = useLogs();

  if (!hasPermission(user, FEATURES.LOGS_EXPORT) && !hasPermission(user, FEATURES.REPORT_DOWNLOAD)) {
    throw redirect({ to: "/unauthorized" });
  }

  const columns: Column<AuditLog>[] = [
    { key: "date", header: "Date", cell: (l) => <span className="font-mono text-xs">{new Date(l.date).toLocaleString()}</span> },
    { key: "actor", header: "Actor", cell: (l) => <span className="font-medium">{l.actorName}</span> },
    { key: "kind", header: "Kind", cell: (l) => <span className="font-mono text-xs">{l.kind}</span> },
    { key: "description", header: "Description", cell: (l) => l.description },
    { key: "ip", header: "IP", cell: (l) => <span className="font-mono text-xs">{l.ipAddress}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Log History & Report" description="Export audit logs and download visitor reports." />
      <div className="grid gap-4 lg:grid-cols-2">
        <ExportCard
          title="Export Log History"
          description="CSV export of the full audit log."
          buttonLabel="Export Log CSV"
          kind="log"
        />
        <ExportCard
          title="Download Report"
          description="CSV export of all visitor bookings."
          buttonLabel="Download Report"
          kind="report"
        />
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold">Recent activity</h2>
        <DataTable columns={columns} rows={logs} rowKey={(l) => l.id} />
      </div>
    </div>
  );
}

function ExportCard({
  title,
  description,
  buttonLabel,
  kind,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  kind: "log" | "report";
}) {
  const repos = useRepos();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const trigger = async () => {
    if (!email) {
      toast.error("Please enter a destination email.");
      return;
    }
    setBusy(true);
    const result = kind === "log"
      ? await repos.logs.exportCsv(email)
      : await repos.logs.downloadReport(email);
    setBusy(false);

    // Trigger browser download
    const blob = new Blob([result.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${kind === "log" ? "Log" : "Report"} sent to ${result.sentTo}`);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
          {kind === "log" ? <FileText className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        </div>
        <div>
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Send to email</Label>
        <div className="flex gap-2">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@ikn.go.id" />
          <Button onClick={trigger} disabled={busy} className="gap-2">
            <Send className="h-4 w-4" /> {busy ? "Working..." : buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

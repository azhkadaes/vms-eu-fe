import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { DataLoadState } from "@/components/data/DataLoadState";
import { useLogs } from "@/app/queries";
import { useRepos } from "@/app/RepositoriesContext";
import { useSession } from "@/app/SessionContext";
import { FEATURES, hasPermission } from "@/domain/permissions";
import { formatWitaTimestamp, witaDate } from "@/domain/wita";
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
  const canExportLogs = hasPermission(user, FEATURES.LOGS_EXPORT);
  const canDownloadReport = hasPermission(user, FEATURES.REPORT_DOWNLOAD);
  const logsQuery = useLogs(canExportLogs);
  const logs = logsQuery.data ?? [];

  if (!canExportLogs && !canDownloadReport) {
    throw redirect({ to: "/unauthorized" });
  }

  const columns: Column<AuditLog>[] = [
    { key: "date", header: "Date (WITA)", cell: (l) => <span className="font-mono text-xs">{formatWitaTimestamp(l.date)}</span> },
    { key: "actor", header: "Actor", cell: (l) => <span className="font-medium">{l.actorName}</span> },
    { key: "kind", header: "Kind", cell: (l) => <span className="font-mono text-xs">{l.kind}</span> },
    { key: "description", header: "Description", cell: (l) => l.description },
    { key: "ip", header: "IP", cell: (l) => <span className="font-mono text-xs">{l.ipAddress}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Log History & Report" description="Export audit logs and download visitor reports." />
      <div className="grid gap-4 lg:grid-cols-2">
        {canExportLogs && <ExportCard
          title="Export Log History"
          description="Download a CSV of the sample audit log."
          buttonLabel="Export Log CSV"
          kind="log"
        />}
        {canDownloadReport && <ExportCard
          title="Download Report"
          description="Download a CSV of sample visitor bookings."
          buttonLabel="Download Report"
          kind="report"
        />}
      </div>

      {canExportLogs && <div className="space-y-3">
        <h2 className="font-display text-lg font-bold">Recent activity</h2>
        {logsQuery.isPending ? <DataLoadState subject="activity logs" /> : logsQuery.isError ?
          <DataLoadState subject="activity logs" error onRetry={() => void logsQuery.refetch()} /> :
          <DataTable columns={columns} rows={logs} rowKey={(l) => l.id} />}
      </div>}
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
  const [busy, setBusy] = useState(false);

  const trigger = async () => {
    setBusy(true);
    try {
      const result = kind === "log" ? await repos.logs.exportCsv() : await repos.logs.downloadReport();
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-${witaDate()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${kind === "log" ? "Log" : "Report"} downloaded from the staff preview`);
    } catch (error) {
      toast.error("Download failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setBusy(false);
    }
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
      <div className="mt-4">
        <Button onClick={trigger} disabled={busy} className="gap-2">
          <Download className="h-4 w-4" /> {busy ? "Preparing..." : buttonLabel}
        </Button>
      </div>
    </div>
  );
}

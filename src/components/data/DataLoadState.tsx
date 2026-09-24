import { Button } from "@/components/ui/button";

export function DataLoadState({
  subject,
  error = false,
  onRetry,
}: {
  subject: string;
  error?: boolean;
  onRetry?: () => void;
}) {
  if (!error) {
    return <p role="status" className="py-8 text-sm text-muted-foreground">Loading {subject}…</p>;
  }
  return (
    <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-card p-6">
      <p className="font-medium">Could not load {subject}.</p>
      <p className="text-sm text-muted-foreground">Check your connection and try again. Your current page is still open.</p>
      {onRetry && <Button variant="outline" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

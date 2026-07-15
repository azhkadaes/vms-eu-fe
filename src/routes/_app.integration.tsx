import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Key, Eye, EyeOff, Save } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIntegrations } from "@/app/queries";
import { useRepos } from "@/app/RepositoriesContext";
import { useSession } from "@/app/SessionContext";
import { FEATURES, hasPermission } from "@/domain/permissions";

export const Route = createFileRoute("/_app/integration")({
  head: () => ({
    meta: [
      { title: "Integration — NUSANTARA" },
      { name: "description", content: "Manage API keys for external integrations." },
    ],
  }),
  component: IntegrationPage,
});

function IntegrationPage() {
  const { user } = useSession();
  const { data: keys = [] } = useIntegrations();

  if (!hasPermission(user, FEATURES.INTEGRATION_MANAGE)) {
    throw redirect({ to: "/unauthorized" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integration"
        description="Manage API keys used by the backoffice to connect to external services."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {keys.map((k) => (
          <IntegrationCard key={k.id} id={k.id} name={k.name} initial={k.apiKey} />
        ))}
      </div>
    </div>
  );
}

function IntegrationCard({ id, name, initial }: { id: string; name: string; initial: string }) {
  const repos = useRepos();
  const [value, setValue] = useState(initial);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await repos.integrations.update(id, value);
    setSaving(false);
    toast.success(`${name} key updated`);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
          <Key className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold">{name}</h3>
          <p className="text-xs text-muted-foreground">API key for {name.toLowerCase()} integration</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">API Key</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={visible ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Paste API key here"
              className="pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={visible ? "Hide key" : "Show key"}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button onClick={save} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}

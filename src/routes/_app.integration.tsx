import { createFileRoute, redirect } from "@tanstack/react-router";
import { Key } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { useSession } from "@/app/SessionContext";
import { FEATURES, hasPermission } from "@/domain/permissions";

export const Route = createFileRoute("/_app/integration")({
  head: () => ({
    meta: [
      { title: "Integration — NUSANTARA" },
      { name: "description", content: "Integration inventory." },
    ],
  }),
  component: IntegrationPage,
});

function IntegrationPage() {
  const { user } = useSession();

  if (!hasPermission(user, FEATURES.INTEGRATION_MANAGE)) {
    throw redirect({ to: "/unauthorized" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integration"
        description="Integration setup will be available after credential types and backend operations are agreed."
      />
      <div role="status" className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/15 p-5 text-sm">
        <Key className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Credential management is unavailable. Integration types, scopes, and secure storage must be defined before entering keys.</p>
      </div>
    </div>
  );
}

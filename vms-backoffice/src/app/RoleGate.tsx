import type { ReactNode } from "react";
import { hasPermission, type FeatureKey } from "@/domain/permissions";
import { useSession } from "./SessionContext";

export function RoleGate({
  feature,
  fallback = null,
  children,
}: {
  feature: FeatureKey;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { user } = useSession();
  if (!hasPermission(user, feature)) return <>{fallback}</>;
  return <>{children}</>;
}

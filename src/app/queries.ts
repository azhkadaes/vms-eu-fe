// Convenience hooks: repos + TanStack Query. Pages call these instead
// of touching repos directly, which keeps invalidation consistent.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRepos } from "@/app/RepositoriesContext";
import type { BookingInput } from "@/data/types";
import type { ID } from "@/domain/types";
import { store } from "@/data/mock/store";
import { useEffect, useState } from "react";

// Version bumps whenever the mock store changes so queries re-fetch fresh.
function useStoreTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => store.subscribe(() => setTick((t) => t + 1)) as unknown as () => void, []);
  return tick;
}

export function useBookings() {
  const repos = useRepos();
  const tick = useStoreTick();
  return useQuery({ queryKey: ["bookings", tick], queryFn: () => repos.bookings.list() });
}

export function useOfficers() {
  const repos = useRepos();
  const tick = useStoreTick();
  return useQuery({ queryKey: ["officers", tick], queryFn: () => repos.officers.list() });
}

export function useEmployees() {
  const repos = useRepos();
  const tick = useStoreTick();
  return useQuery({ queryKey: ["employees", tick], queryFn: () => repos.employees.list() });
}

export function useRoles() {
  const repos = useRepos();
  const tick = useStoreTick();
  return useQuery({ queryKey: ["roles", tick], queryFn: () => repos.roles.listRoles() });
}

export function useRolePermissions() {
  const repos = useRepos();
  const tick = useStoreTick();
  return useQuery({
    queryKey: ["rolePermissions", tick],
    queryFn: async () => ({
      permissions: await repos.roles.listPermissions(),
      links: await repos.roles.listRolePermissions(),
      employeeRoles: await repos.roles.listEmployeeRoles(),
      assignments: await repos.roles.listAssignments(),
    }),
  });
}

export function useIntegrations() {
  const repos = useRepos();
  const tick = useStoreTick();
  return useQuery({ queryKey: ["integrations", tick], queryFn: () => repos.integrations.list() });
}

export function useLogs() {
  const repos = useRepos();
  const tick = useStoreTick();
  return useQuery({ queryKey: ["logs", tick], queryFn: () => repos.logs.list() });
}

export function useAnalyticsTrend(year: number) {
  const repos = useRepos();
  const tick = useStoreTick();
  return useQuery({ queryKey: ["analytics", "trend", year, tick], queryFn: () => repos.analytics.yearlyTrend(year) });
}

export function useAnalyticsKpis() {
  const repos = useRepos();
  const tick = useStoreTick();
  return useQuery({ queryKey: ["analytics", "kpis", tick], queryFn: () => repos.analytics.kpis() });
}

export function useBookingMutations() {
  const repos = useRepos();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries();

  return {
    create: useMutation({
      mutationFn: (input: BookingInput) => repos.bookings.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, patch }: { id: ID; patch: Partial<BookingInput> }) =>
        repos.bookings.update(id, patch),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: ID) => repos.bookings.delete(id),
      onSuccess: invalidate,
    }),
    approve: useMutation({
      mutationFn: (id: ID) => repos.bookings.setStatus(id, "accepted"),
      onSuccess: invalidate,
    }),
    reject: useMutation({
      mutationFn: (id: ID) => repos.bookings.setStatus(id, "rejected"),
      onSuccess: invalidate,
    }),
    reschedule: useMutation({
      mutationFn: (id: ID) => repos.bookings.setStatus(id, "reschedule"),
      onSuccess: invalidate,
    }),
    checkIn: useMutation({
      mutationFn: ({ id, by }: { id: ID; by: string }) => repos.bookings.checkIn(id, by),
      onSuccess: invalidate,
    }),
    checkOut: useMutation({
      mutationFn: ({ id, by }: { id: ID; by: string }) => repos.bookings.checkOut(id, by),
      onSuccess: invalidate,
    }),
  };
}

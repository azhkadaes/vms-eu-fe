import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRepos } from "./RepositoriesContext";
import type { SessionUser } from "@/domain/types";
import { store } from "@/data/mock/store";

interface SessionContextValue {
  user: SessionUser | null;
  available: SessionUser[];
  switchTo: (employeeId: string) => Promise<void>;
  loading: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const repos = useRepos();
  const qc = useQueryClient();
  const [tick, setTick] = useState(0);

  // Re-fetch whenever the underlying store changes (role edits, permission edits, etc.)
  useEffect(() => {
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    return () => {
      unsub();
    };
  }, []);

  const currentQ = useQuery({
    queryKey: ["session", "current", tick],
    queryFn: () => repos.session.current(),
  });
  const availableQ = useQuery({
    queryKey: ["session", "available", tick],
    queryFn: () => repos.session.listAvailable(),
  });

  const switchTo = useCallback(
    async (employeeId: string) => {
      await repos.session.switchTo(employeeId);
      await qc.invalidateQueries();
    },
    [repos, qc],
  );

  const value: SessionContextValue = {
    user: currentQ.data ?? null,
    available: availableQ.data ?? [],
    switchTo,
    loading: currentQ.isLoading,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

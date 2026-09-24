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
    loading: currentQ.isPending,
  };

  return (
    <SessionContext.Provider value={value}>
      {currentQ.isPending ? (
        <div className="flex min-h-screen items-center justify-center bg-background px-4" role="status">
          Loading staff session…
        </div>
      ) : currentQ.isError ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center" role="alert">
          <p className="font-semibold">Staff session could not be loaded.</p>
          <p className="text-sm text-muted-foreground">Check your connection, then try again.</p>
          <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={() => void currentQ.refetch()}>
            Retry
          </button>
        </div>
      ) : children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

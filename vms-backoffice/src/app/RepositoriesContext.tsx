import { createContext, useContext, type ReactNode } from "react";
import { mockRepositories } from "@/data/mock";
import type { Repositories } from "@/data/types";

const RepositoriesContext = createContext<Repositories>(mockRepositories);

export function RepositoriesProvider({
  children,
  repositories = mockRepositories,
}: {
  children: ReactNode;
  repositories?: Repositories;
}) {
  return (
    <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>
  );
}

export function useRepos(): Repositories {
  return useContext(RepositoriesContext);
}

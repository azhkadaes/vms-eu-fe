import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useRepos } from "@/app/RepositoriesContext";
import { mockRepositories } from "@/data/mock";

export function AppShell({ children }: { children: ReactNode }) {
  const isMockPreview = useRepos() === mockRepositories;
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="min-w-0 flex-1">
          <TopBar />
          {isMockPreview && (
            <div role="status" className="border-b border-warning/40 bg-warning/15 px-4 py-2 text-sm text-foreground sm:px-6 lg:px-8">
              Staff preview: these are browser-stored sample records. Changes are not saved to the VMS server.
            </div>
          )}
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

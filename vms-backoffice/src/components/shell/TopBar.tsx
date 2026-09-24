import { User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/app/SessionContext";
import { toast } from "sonner";

export function TopBar() {
  const { user, available, switchTo } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-6">
      <SidebarTrigger className="shrink-0" />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-2 sm:px-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs text-muted-foreground">Hello,</p>
                <p className="text-sm font-semibold leading-none">
                  {user?.employee.name.split(" ")[0] ?? "Guest"}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div>
                <p className="font-semibold">{user?.employee.name}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {user?.roles.map((r) => r.name).join(", ") || "No role"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
              Switch role (demo)
            </DropdownMenuLabel>
            {available.map((u) => (
              <DropdownMenuItem
                key={u.employee.id}
                onSelect={async () => {
                  try {
                    await switchTo(u.employee.id);
                    toast.success(`Switched to ${u.employee.name}`);
                  } catch (error) {
                    toast.error("Could not switch preview role", {
                      description: error instanceof Error ? error.message : "Please try again.",
                    });
                  }
                }}
                className="flex items-center justify-between gap-2"
              >
                <span className="min-w-0 truncate">{u.employee.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {u.roles[0]?.name}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

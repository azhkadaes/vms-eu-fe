import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  BookOpen,
  LogIn,
  LogOut,
  Users,
  Shield,
  Plug,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { FEATURES, hasAny, type FeatureKey } from "@/domain/permissions";
import { useSession } from "@/app/SessionContext";
import type { ComponentType } from "react";

interface NavItem {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  features: FeatureKey[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: "Monitoring",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, features: [FEATURES.DASHBOARD_VIEW] },
      { title: "Today's Visit", url: "/today", icon: CalendarDays, features: [FEATURES.TODAY_VIEW] },
      { title: "Analytics", url: "/analytics", icon: BarChart3, features: [FEATURES.ANALYTICS_VIEW] },
    ],
  },
  {
    label: "Visitors",
    items: [
      { title: "Booking", url: "/booking", icon: BookOpen, features: [FEATURES.BOOKING_VIEW] },
      { title: "Check In", url: "/check-in", icon: LogIn, features: [FEATURES.CHECKIN_PERFORM] },
      { title: "Check Out", url: "/check-out", icon: LogOut, features: [FEATURES.CHECKOUT_PERFORM] },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Employee Directory", url: "/employees", icon: Users, features: [FEATURES.EMPLOYEE_MANAGE] },
      { title: "Roles", url: "/roles", icon: Shield, features: [FEATURES.ROLE_MANAGE] },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Integration", url: "/integration", icon: Plug, features: [FEATURES.INTEGRATION_MANAGE] },
      { title: "Log & Report", url: "/logs", icon: FileText, features: [FEATURES.LOGS_EXPORT, FEATURES.REPORT_DOWNLOAD] },
    ],
  },
];

export function AppSidebar() {
  const { user } = useSession();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => hasAny(user, i.features)),
  })).filter((g) => g.items.length > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-display text-lg font-bold">N</span>
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-display text-sm font-bold">NUSANTARA</p>
            <p className="truncate text-xs text-muted-foreground">Visitor Management</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary/90 data-[active=true]:hover:text-primary-foreground"
                      >
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

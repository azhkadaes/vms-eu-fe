import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRepos } from "@/app/RepositoriesContext";
import { useEmployees, useOfficers, useRolePermissions, useRoles } from "@/app/queries";
import { useSession } from "@/app/SessionContext";
import { FEATURES, hasPermission } from "@/domain/permissions";
import type { Employee, Role } from "@/domain/types";

export const Route = createFileRoute("/_app/roles")({
  head: () => ({
    meta: [
      { title: "Roles — NUSANTARA" },
      { name: "description", content: "Assign roles and permissions." },
    ],
  }),
  component: RolesPage,
});

function RolesPage() {
  const { user } = useSession();
  const { data: employees = [] } = useEmployees();
  const { data: roles = [] } = useRoles();
  const { data: rpData } = useRolePermissions();
  const { data: officers = [] } = useOfficers();
  const [editing, setEditing] = useState<Employee | null>(null);

  if (!hasPermission(user, FEATURES.ROLE_MANAGE)) {
    throw redirect({ to: "/unauthorized" });
  }

  const rolesFor = (empId: string) =>
    (rpData?.employeeRoles.filter((r) => r.employeeId === empId).map((r) => r.roleId) ?? [])
      .map((rid) => roles.find((x) => x.id === rid)?.name)
      .filter(Boolean) as string[];

  const columns: Column<Employee>[] = [
    { key: "name", header: "Nama", cell: (e) => <span className="font-medium">{e.name}</span> },
    { key: "jabatan", header: "Jabatan", cell: (e) => e.jabatan },
    { key: "unit", header: "Unit", cell: (e) => e.unit },
    { key: "roles", header: "Roles", cell: (e) => (
      <div className="flex flex-wrap gap-1">
        {rolesFor(e.id).map((r) => (
          <Badge key={r} variant="secondary">{r}</Badge>
        ))}
      </div>
    ) },
    { key: "action", header: "Action", cell: (e) => (
      <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); setEditing(e); }} className="gap-1">
        <Pencil className="h-3.5 w-3.5" /> Edit
      </Button>
    ) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Roles & Permissions" description="Assign roles to employees and permissions to roles." />

      <Tabs defaultValue="assign">
        <TabsList>
          <TabsTrigger value="assign">Assign roles</TabsTrigger>
          <TabsTrigger value="matrix">Permissions matrix</TabsTrigger>
        </TabsList>
        <TabsContent value="assign" className="pt-4">
          <DataTable columns={columns} rows={employees} rowKey={(e) => e.id} />
        </TabsContent>
        <TabsContent value="matrix" className="pt-4">
          <PermissionMatrix />
        </TabsContent>
      </Tabs>

      <AssignRoleDialog
        employee={editing}
        onOpenChange={(o) => !o && setEditing(null)}
        roles={roles}
        officers={officers}
      />
    </div>
  );
}

function AssignRoleDialog({
  employee,
  onOpenChange,
  roles,
  officers,
}: {
  employee: Employee | null;
  onOpenChange: (o: boolean) => void;
  roles: Role[];
  officers: ReturnType<typeof useOfficers>["data"];
}) {
  const repos = useRepos();
  const { data: rpData } = useRolePermissions();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedOfficers, setSelectedOfficers] = useState<string[]>([]);
  const [lastId, setLastId] = useState<string>("");

  if (employee && lastId !== employee.id) {
    setLastId(employee.id);
    setSelectedRoles(rpData?.employeeRoles.filter((r) => r.employeeId === employee.id).map((r) => r.roleId) ?? []);
    setSelectedOfficers(rpData?.assignments.filter((a) => a.employeeId === employee.id).map((a) => a.officerId) ?? []);
  }

  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  const save = async () => {
    if (!employee) return;
    await repos.roles.setEmployeeRoles(employee.id, selectedRoles);
    await repos.roles.setEmployeeOfficers(employee.id, selectedOfficers);
    toast.success(`Updated ${employee.name}`);
    onOpenChange(false);
  };

  const needsOfficer = useMemo(() => {
    const names = roles.filter((r) => selectedRoles.includes(r.id)).map((r) => r.name);
    return names.includes("Personal Assistant") || names.includes("Protocol Officer");
  }, [selectedRoles, roles]);

  return (
    <Dialog open={!!employee} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Assign roles</DialogTitle>
          <DialogDescription>{employee?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">Roles</Label>
            <div className="space-y-2">
              {roles.map((r) => (
                <label key={r.id} className="flex items-start gap-2 rounded-md border border-border p-2 hover:bg-muted/40">
                  <Checkbox
                    checked={selectedRoles.includes(r.id)}
                    onCheckedChange={() => setSelectedRoles((s) => toggle(s, r.id))}
                  />
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {needsOfficer && (
            <div>
              <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">Assigned officers</Label>
              <div className="space-y-2">
                {officers?.map((o) => (
                  <label key={o.id} className="flex items-center gap-2 rounded-md border border-border p-2 hover:bg-muted/40">
                    <Checkbox
                      checked={selectedOfficers.includes(o.id)}
                      onCheckedChange={() => setSelectedOfficers((s) => toggle(s, o.id))}
                    />
                    <div>
                      <p className="text-sm font-medium">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.jabatan}{o.isVip ? " · VIP" : ""}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionMatrix() {
  const repos = useRepos();
  const { data: roles = [] } = useRoles();
  const { data: rpData } = useRolePermissions();
  const permissions = rpData?.permissions ?? [];
  const links = rpData?.links ?? [];
  const [pending, setPending] = useState<Record<string, string[]>>({});

  const has = (roleId: string, permId: string) => {
    if (pending[roleId]) return pending[roleId].includes(permId);
    return links.some((l) => l.roleId === roleId && l.permissionId === permId);
  };

  const toggle = (roleId: string, permId: string) => {
    setPending((prev) => {
      const current = prev[roleId] ?? links.filter((l) => l.roleId === roleId).map((l) => l.permissionId);
      const next = current.includes(permId) ? current.filter((p) => p !== permId) : [...current, permId];
      return { ...prev, [roleId]: next };
    });
  };

  const save = async () => {
    for (const [roleId, permIds] of Object.entries(pending)) {
      await repos.roles.setRolePermissions(roleId, permIds);
    }
    setPending({});
    toast.success("Permissions updated");
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="sticky left-0 z-10 bg-muted/60 px-4 py-3 font-medium">Feature</th>
            {roles.map((r) => (
              <th key={r.id} className="px-4 py-3 text-center font-medium">{r.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="sticky left-0 z-10 bg-card px-4 py-2 font-mono text-xs">{p.featureKey}</td>
              {roles.map((r) => (
                <td key={r.id} className="px-4 py-2 text-center">
                  <Checkbox checked={has(r.id, p.id)} onCheckedChange={() => toggle(r.id, p.id)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end border-t border-border p-3">
        <Button onClick={save} disabled={Object.keys(pending).length === 0}>Save changes</Button>
      </div>
    </div>
  );
}

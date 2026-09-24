import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Mail, Phone, Pencil, Plus, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { EmptyState } from "@/components/data/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRepos } from "@/app/RepositoriesContext";
import { useEmployees } from "@/app/queries";
import { useSession } from "@/app/SessionContext";
import { FEATURES, hasPermission } from "@/domain/permissions";
import type { Employee } from "@/domain/types";

export const Route = createFileRoute("/_app/employees")({
  head: () => ({
    meta: [
      { title: "Employee Directory — NUSANTARA" },
      { name: "description", content: "Manage employees and their contact info." },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const { user } = useSession();
  const { data: employees = [] } = useEmployees();
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);

  if (!hasPermission(user, FEATURES.EMPLOYEE_MANAGE)) {
    throw redirect({ to: "/unauthorized" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        description="Add, edit, and remove employees."
        actions={
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Add employee
          </Button>
        }
      />

      {employees.length === 0 ? (
        <EmptyState icon={<Users className="h-5 w-5" />} title="No employees yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-bold">{e.name}</h3>
                  <p className="text-sm text-muted-foreground">{e.jabatan}</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary font-display text-lg font-bold">
                  {e.name.slice(0, 1)}
                </div>
              </div>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> <span>{e.department} · {e.unit}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> <span className="truncate">{e.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> <span>{e.phone}</span>
                </div>
                <div className="pt-1 text-xs text-muted-foreground">ID: {e.employeeNumber}</div>
              </dl>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(e)} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EmployeeFormDialog
        open={!!editing || creating}
        employee={editing}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            setCreating(false);
          }
        }}
      />
    </div>
  );
}

function EmployeeFormDialog({
  open,
  employee,
  onOpenChange,
}: {
  open: boolean;
  employee: Employee | null;
  onOpenChange: (o: boolean) => void;
}) {
  const repos = useRepos();
  const blank: Omit<Employee, "id"> = {
    name: "",
    employeeNumber: "",
    department: "",
    jabatan: "",
    unit: "",
    email: "",
    phone: "",
  };
  const [form, setForm] = useState<Omit<Employee, "id">>(blank);

  // Sync form when opening or switching target employee
  const targetKey = employee?.id ?? "new";
  const [lastKey, setLastKey] = useState<string>("");
  if (open && lastKey !== targetKey) {
    setLastKey(targetKey);
    setForm(employee ?? blank);
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (employee) {
      await repos.employees.update(employee.id, form);
      toast.success("Employee updated");
    } else {
      await repos.employees.create(form);
      toast.success("Employee created");
    }
    onOpenChange(false);
  };

  const remove = async () => {
    if (!employee) return;
    if (!confirm(`Delete ${employee.name}?`)) return;
    await repos.employees.delete(employee.id);
    toast.success("Employee deleted");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{employee ? "Edit Employee" : "New Employee"}</DialogTitle>
          <DialogDescription>Employee information used across the backoffice.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Full name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Employee number"><Input required value={form.employeeNumber} onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })} /></Field>
            <Field label="Jabatan (title)"><Input value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} /></Field>
            <Field label="Department"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
            <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <div className="sm:col-span-2">
              <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            </div>
          </div>
          <DialogFooter className="flex-wrap gap-2">
            {employee && (
              <Button type="button" variant="ghost" onClick={remove} className="mr-auto text-destructive hover:text-destructive gap-2">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{employee ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { toast } from "sonner";

import { updateEmployee, type EmployeeFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  employee_number: string | null;
  hire_date: string | null;
  status: "active" | "inactive" | "archived";
};

const initialState: EmployeeFormState = {};

export function EditEmployeeForm({ employee }: { employee: Employee }) {
  const [state, formAction, pending] = useActionState(
    updateEmployee,
    initialState,
  );

  useEffect(() => {
    if (state.success) toast.success("Fiche mise à jour.");
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={employee.id} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="first_name">Prénom</Label>
          <Input
            id="first_name"
            name="first_name"
            defaultValue={employee.first_name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Nom</Label>
          <Input
            id="last_name"
            name="last_name"
            defaultValue={employee.last_name}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={employee.email ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={employee.phone ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee_number">Matricule</Label>
          <Input
            id="employee_number"
            name="employee_number"
            defaultValue={employee.employee_number ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="hire_date">Date d&apos;entrée</Label>
          <Input
            id="hire_date"
            name="hire_date"
            type="date"
            defaultValue={employee.hire_date ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select name="status" defaultValue={employee.status}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}

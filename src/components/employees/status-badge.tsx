import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/types/database";

type Status = Database["public"]["Enums"]["employee_status"];

const config: Record<Status, { label: string; className: string }> = {
  active: {
    label: "Actif",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  inactive: {
    label: "Inactif",
    className: "bg-muted text-muted-foreground",
  },
  archived: {
    label: "Archivé",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function EmployeeStatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

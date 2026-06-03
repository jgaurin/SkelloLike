import { Badge } from "@/components/ui/badge";

type Status = "pending" | "approved" | "rejected" | "cancelled";

const config: Record<Status, { label: string; className: string }> = {
  pending: {
    label: "En attente",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  approved: {
    label: "Validée",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  rejected: {
    label: "Refusée",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  cancelled: {
    label: "Annulée",
    className: "bg-muted text-muted-foreground",
  },
};

export function AbsenceStatusBadge({ status }: { status: Status }) {
  const c = config[status];
  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  );
}

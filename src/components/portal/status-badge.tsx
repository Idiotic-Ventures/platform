// Subscription/invoice status badge — uses semantic CSS vars

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]",
  },
  trialing: {
    label: "Trial",
    className: "bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]",
  },
  past_due: {
    label: "Past Due",
    className: "bg-[hsl(var(--danger-bg))] text-[hsl(var(--danger))]",
  },
  canceled: {
    label: "Canceled",
    className: "bg-muted text-muted-foreground",
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-[hsl(var(--danger-bg))] text-[hsl(var(--danger))]",
  },
  incomplete: {
    label: "Incomplete",
    className: "bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]",
  },
  // Invoice statuses
  paid: {
    label: "Paid",
    className: "bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]",
  },
  open: {
    label: "Open",
    className: "bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]",
  },
  void: {
    label: "Void",
    className: "bg-muted text-muted-foreground",
  },
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}

"use client";

// LOW fix: Extract chart range toggle as reusable component

import { cn } from "@/lib/utils";

interface RangeOption {
  value: string;
  label: string;
}

interface RangeToggleProps {
  options: RangeOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const DEFAULT_OPTIONS: RangeOption[] = [
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "12mo", label: "12mo" },
];

export function RangeToggle({
  options = DEFAULT_OPTIONS,
  value,
  onChange,
  className,
}: RangeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Date range"
      className={cn(
        "inline-flex rounded-md border bg-muted p-0.5 gap-0.5",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cn(
            "px-2.5 py-1 text-xs font-medium rounded transition-colors",
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

"use client";

// M9 fix: Accessible FilterTabs component with keyboard navigation
// Replaces raw anchor links with proper tablist/tab ARIA roles

import Link from "next/link";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterTabsProps {
  options: FilterOption[];
  activeValue: string;
  baseUrl: string;
  paramName: string;
}

export function FilterTabs({
  options,
  activeValue,
  baseUrl,
  paramName,
}: FilterTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Filter options"
      className="flex gap-1 border-b"
    >
      {options.map((opt) => {
        const isActive = activeValue === opt.value;
        const href = opt.value
          ? `${baseUrl}?${paramName}=${encodeURIComponent(opt.value)}`
          : baseUrl;

        return (
          <Link
            key={opt.value}
            href={href}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {opt.label}
          </Link>
        );
      })}
    </nav>
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
};

export function Select({ label, value, options, onChange, className }: SelectProps) {
  return (
    <label className={cn("grid gap-2 text-sm font-medium text-slate-700", className)}>
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-md border border-white/70 bg-white/40 px-3 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-2xl transition hover:bg-white/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold shadow-sm backdrop-blur-xl transition-colors",
  {
    variants: {
      variant: {
        default: "border-white/50 bg-primary/85 text-primary-foreground",
        secondary: "border-white/50 bg-secondary/80 text-secondary-foreground",
        outline: "border-white/70 bg-white/40 text-slate-700",
        success: "border-emerald-200/70 bg-emerald-50/70 text-emerald-700",
        warning: "border-amber-200/70 bg-amber-50/75 text-amber-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

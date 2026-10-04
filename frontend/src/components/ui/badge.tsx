import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        success: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        neutral: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge: React.FC<BadgeProps> = ({ className, variant, ...props }) => (
  <span className={cn(badgeVariants({ variant, className }))} {...props} />
);

import * as React from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/utils/cn";

const variantConfig = {
  error: { icon: AlertCircle, classes: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40", role: "alert" as const },
  success: { icon: CheckCircle, classes: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/40", role: "status" as const },
  info: { icon: Info, classes: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40", role: "status" as const },
};

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: keyof typeof variantConfig;
}

export const Alert: React.FC<AlertProps> = ({ variant, className, children, ...props }) => {
  const { icon: Icon, classes, role } = variantConfig[variant];
  return (
    <div
      role={role}
      aria-live="polite"
      className={cn("flex items-start gap-3 p-4 rounded border text-sm", classes, className)}
      {...props}
    >
      <Icon size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
};

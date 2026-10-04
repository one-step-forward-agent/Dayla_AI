import * as React from "react";
import { cn } from "@/utils/cn";

interface SwitchProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export const Switch: React.FC<SwitchProps> = ({ id, checked, onCheckedChange, label, description }) => {
  const labelId = `${id}-label`;
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p id={labelId} className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
};

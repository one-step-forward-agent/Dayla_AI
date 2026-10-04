import * as React from "react";
import { cn } from "@/utils/cn";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  children: (fieldProps: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ id, label, error, hint, required, children }) => {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

const fieldClassName = "w-full border border-gray-200 dark:border-gray-700 rounded px-4 py-2.5 text-base bg-white dark:bg-gray-800 dark:text-white transition-colors focus:border-blue-500 aria-[invalid=true]:border-red-500";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldClassName, className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldClassName, className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(fieldClassName, className)} {...props} />
  )
);
Select.displayName = "Select";

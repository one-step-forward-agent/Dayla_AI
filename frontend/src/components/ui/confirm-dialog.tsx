import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, onOpenChange, title, description, confirmLabel = "Подтвердить", onConfirm, isDestructive = true,
  isLoading = false,
}) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
      <Dialog.Content
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        onEscapeKeyDown={(e) => { if (isLoading) e.preventDefault(); }}
        onInteractOutside={(e) => { if (isLoading) e.preventDefault(); }}
      >
        <div className="flex items-start gap-3">
          {isDestructive && (
            <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle size={20} aria-hidden="true" />
            </div>
          )}
          <div>
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">{title}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</Dialog.Description>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Dialog.Close asChild>
            <Button variant="outline" disabled={isLoading}>Отмена</Button>
          </Dialog.Close>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

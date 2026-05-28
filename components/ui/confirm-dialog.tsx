"use client";

import { ReactElement, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ConfirmDialogProps = {
  trigger: ReactElement;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
  onConfirm: () => Promise<void> | void;
};

/**
 * Reusable confirmation dialog. Replaces window.confirm() for a cleaner UX,
 * styled to match the rest of the app and supports async confirm handlers.
 *
 * Usage:
 *   <ConfirmDialog
 *     trigger={<Button variant="outline">Delete</Button>}
 *     title="Hapus invoice ini?"
 *     description="Data akan dihapus permanen."
 *     variant="destructive"
 *     onConfirm={async () => { ... }}
 *   />
 */
export function ConfirmDialog({
  trigger,
  title = "Konfirmasi aksi",
  description = "Apakah anda yakin ingin melanjutkan?",
  confirmText = "Lanjutkan",
  cancelText = "Batal",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                variant === "destructive" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
              }`}
            >
              <AlertTriangle className="size-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-base">{title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                await onConfirm();
                setOpen(false);
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

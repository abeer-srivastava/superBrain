"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  trigger,
  title = "Delete this item?",
  description = "This action cannot be undone. The content will be permanently removed from your brain.",
  confirmLabel = "Delete",
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-base)] border-[3px] border-border bg-accent-yellow text-black shadow-[var(--shadow-sm)]">
              <AlertTriangle className="h-5 w-5" />
            </span>
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={busy} className="gap-2">
            <Trash2 className="h-4 w-4" />
            {busy ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

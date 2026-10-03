"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type OrderCancelSectionProps = {
  orderCode: string;
  /** Resolves to an error message to show in the dialog, or null when the order was canceled. */
  onConfirm: () => Promise<string | null>;
};

export function OrderCancelSection({ orderCode, onConfirm }: OrderCancelSectionProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setPending(true);
    setError(null);
    const message = await onConfirm();
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    setOpen(false);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="h-11 w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 sm:w-auto"
        >
          Cancelar pedido
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar o pedido {orderCode}?</AlertDialogTitle>
          <AlertDialogDescription>
            Depois de cancelar, não pague o PIX deste pedido. Se você já pagou, não cancele: fale
            com a loja pelo WhatsApp.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Manter pedido</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void confirm();
            }}
            disabled={pending}
            className="bg-red-700 text-white hover:bg-red-800"
          >
            {pending ? "Cancelando…" : "Cancelar pedido"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

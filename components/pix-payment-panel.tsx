"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import {
  formatPixAmountFromCents,
  formatPixExpiresAt,
  pixQrCodeSrc,
  type PixPaymentPayload,
} from "@/lib/pix-payment";

type PixPaymentPanelProps = {
  payment: PixPaymentPayload;
  totalAmountCents?: number;
  orderId?: string;
  onPaidClick?: () => void;
  paidClickLabel?: string;
};

export function PixPaymentPanel({
  payment,
  totalAmountCents,
  orderId,
  onPaidClick,
  paidClickLabel = "Já paguei — ver meus pedidos",
}: PixPaymentPanelProps) {
  const [copied, setCopied] = useState(false);
  const expiresLabel = formatPixExpiresAt(payment.expiresAt);

  const copyPixCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(payment.brCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Não foi possível copiar o código. Copie manualmente.");
    }
  }, [payment.brCode]);

  useEffect(() => {
    setCopied(false);
  }, [payment.brCode]);

  return (
    <div className="space-y-4 text-center">
      <div>
        <h3 className="text-lg font-semibold text-theme-primary">
          Pague com PIX
        </h3>
        {orderId && (
          <p className="text-sm text-muted-foreground mt-1">
            Pedido #{orderId.slice(0, 8)}
          </p>
        )}
        {totalAmountCents !== undefined && (
          <p className="text-xl font-bold text-theme-primary mt-2">
            {formatPixAmountFromCents(totalAmountCents)}
          </p>
        )}
        {expiresLabel && (
          <p className="text-sm text-muted-foreground mt-1">
            Válido até {expiresLabel}
          </p>
        )}
      </div>

      {payment.brCodeBase64 && (
        <div className="flex justify-center">
          <img
            src={pixQrCodeSrc(payment.brCodeBase64)}
            alt="QR Code PIX"
            className="w-48 h-48 sm:w-56 sm:h-56 rounded-lg border border-border bg-white p-2"
          />
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Ou copie o código PIX copia e cola
        </p>
        <p className="text-xs break-all bg-muted rounded-md p-3 text-left font-mono max-h-24 overflow-y-auto">
          {payment.brCode}
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={copyPixCode}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copiar código PIX
            </>
          )}
        </Button>
      </div>

      {onPaidClick && (
        <Button
          type="button"
          className="w-full btn-theme-primary"
          onClick={onPaidClick}
        >
          {paidClickLabel}
        </Button>
      )}
    </div>
  );
}

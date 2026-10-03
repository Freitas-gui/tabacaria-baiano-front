"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, MessageCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import { useCountdown } from "@/hooks/use-countdown";
import { formatCurrency } from "@/lib/delivery-regions";
import { formatCountdown } from "@/lib/orders";
import { pixQrCodeSrc, type PixPaymentPayload } from "@/lib/pix-payment";

type PixPaymentPanelProps = {
  payment: PixPaymentPayload;
  totalAmount: number;
  orderCode: string;
  /** WhatsApp link offered once the deadline passes. */
  helpUrl: string;
};

export function PixPaymentPanel({ payment, totalAmount, orderCode, helpUrl }: PixPaymentPanelProps) {
  // On a phone the QR is useless (you can't scan your own screen): copy-and-paste
  // leads and the QR stays folded for paying from another device.
  const coarsePointer = useCoarsePointer();
  const remainingMs = useCountdown(payment.expiresAt);
  const countdown = remainingMs !== null ? formatCountdown(remainingMs) : null;
  const expired = remainingMs !== null && remainingMs <= 0;
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => {
    setCopied(false);
    setCopyFailed(false);
  }, [payment.brCode]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyPixCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(payment.brCode);
      setCopyFailed(false);
      setCopied(true);
    } catch {
      setCopyFailed(true);
    }
  }, [payment.brCode]);

  if (expired) {
    return (
      <section aria-labelledby="pix-title" className="card card-static p-4">
        <h2 id="pix-title" className="text-base font-semibold text-theme-primary">
          O prazo deste PIX acabou
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se você já pagou, fale com a loja pelo WhatsApp.
        </p>
        <Button asChild variant="outline" className="mt-3 h-11 w-full sm:w-auto">
          <a href={helpUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden="true" />
            Falar no WhatsApp
          </a>
        </Button>
      </section>
    );
  }

  const qrCode = payment.brCodeBase64 ? (
    <img
      src={pixQrCodeSrc(payment.brCodeBase64)}
      alt={`QR Code PIX do pedido ${orderCode}`}
      className="mx-auto h-48 w-48 rounded-lg border border-border bg-white p-2"
    />
  ) : null;

  return (
    <section aria-labelledby="pix-title" className="card card-static border-theme-accent p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="pix-title" className="text-base font-semibold text-theme-primary">
          Pague com PIX
        </h2>
        {countdown && (
          <p className="text-label text-muted-foreground">
            Expira em{" "}
            <span className="font-semibold tabular-nums text-theme-primary">{countdown}</span>
          </p>
        )}
      </div>
      <p className="price mt-1 text-2xl">{formatCurrency(totalAmount)}</p>

      {!coarsePointer && qrCode && (
        <div className="mt-4">
          {qrCode}
          <p className="mt-2 text-center text-label text-muted-foreground">
            Escaneie com o app do seu banco
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {!coarsePointer && (
          <p className="text-label text-muted-foreground">Ou use o PIX Copia e Cola:</p>
        )}
        <p
          className="max-h-20 select-all overflow-y-auto break-all rounded-md bg-muted p-3 font-mono text-xs text-theme-primary"
          aria-label="Código PIX copia e cola"
        >
          {payment.brCode}
        </p>
        <Button
          type="button"
          variant={coarsePointer ? "default" : "outline"}
          className="h-11 w-full"
          onClick={copyPixCode}
        >
          {copied ? (
            <>
              <Check aria-hidden="true" />
              Código copiado
            </>
          ) : (
            <>
              <Copy aria-hidden="true" />
              Copiar código PIX
            </>
          )}
        </Button>
        <p className="sr-only" aria-live="polite">
          {copied ? "Código PIX copiado." : ""}
        </p>
        {copyFailed && (
          <p className="text-sm text-red-700" role="alert">
            Não foi possível copiar automaticamente. Toque no código acima, selecione tudo e copie.
          </p>
        )}
      </div>

      {coarsePointer && (
        <ol className="mt-4 list-decimal space-y-0.5 pl-5 text-label text-muted-foreground">
          <li>Copie o código</li>
          <li>Abra o app do seu banco</li>
          <li>Escolha PIX Copia e Cola e confirme</li>
        </ol>
      )}

      {coarsePointer && qrCode && (
        <details className="mt-3">
          <summary className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-label font-medium text-theme-accentCaramel">
            <QrCode className="h-4 w-4" aria-hidden="true" />
            Mostrar QR Code
          </summary>
          <div className="pt-2">
            {qrCode}
            <p className="mt-2 text-center text-label text-muted-foreground">
              Para pagar com outro aparelho
            </p>
          </div>
        </details>
      )}

      <p className="mt-4 border-t border-border pt-3 text-label text-muted-foreground">
        A confirmação aparece aqui sozinha assim que o pagamento cair.
      </p>
    </section>
  );
}

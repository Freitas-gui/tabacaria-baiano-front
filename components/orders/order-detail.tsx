"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PixPaymentPanel } from "@/components/pix-payment-panel";
import { OrderCancelSection } from "@/components/orders/order-cancel-section";
import { OrderFulfillment } from "@/components/orders/order-fulfillment";
import { OrderHelp } from "@/components/orders/order-help";
import { OrderItems } from "@/components/orders/order-items";
import { OrderDetailSkeleton } from "@/components/orders/order-skeletons";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { cancelOrder, fetchOrder } from "@/lib/customer-orders-api";
import {
  buildWhatsAppHelpUrl,
  formatOrderDate,
  getStatusBadge,
  isPixExpired,
  isTerminalPaymentStatus,
  withStoredPix,
  type CustomerOrder,
} from "@/lib/orders";
import { clearStoredPixPaymentForOrder, readStoredPixPaymentForOrder } from "@/lib/pix-payment";

const POLL_INTERVAL_MS = 5000;

type OrderDetailProps = {
  orderId: string;
  /** null while the stored session is still loading. */
  token: string | null;
  onUnauthorized: () => void;
};

type DetailError = { message: string; canRetry: boolean };

export function OrderDetail({ orderId, token, onUnauthorized }: OrderDetailProps) {
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [error, setError] = useState<DetailError | null>(null);
  const [justPaid, setJustPaid] = useState(false);
  const mountedRef = useRef(true);
  const awaitingPixRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** Silent loads (polling) never replace the page with an error. */
  const load = useCallback(
    async (silent: boolean) => {
      if (!token) return;
      if (!silent) setError(null);
      const result = await fetchOrder(token, orderId);
      if (!mountedRef.current) return;
      if (result.kind === "unauthorized") {
        onUnauthorized();
        return;
      }
      if (result.kind !== "ok") {
        if (!silent) {
          setError(
            result.kind === "not_found"
              ? { message: "Não encontramos esse pedido na sua conta.", canRetry: false }
              : { message: "Verifique sua conexão e tente de novo.", canRetry: true },
          );
        }
        return;
      }
      if (isTerminalPaymentStatus(result.data.paymentStatus)) clearStoredPixPaymentForOrder(orderId);
      const next = withStoredPix(result.data, readStoredPixPaymentForOrder(orderId));
      if (awaitingPixRef.current && next.paymentStatus === "paid") setJustPaid(true);
      awaitingPixRef.current = next.pixPayment !== null;
      setOrder(next);
    },
    [orderId, token, onUnauthorized],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  // Poll while the PIX can still be paid, and only while the tab is visible.
  // After the deadline one more load lets the backend sync and cancel the order.
  const pollPix = order !== null && order.pixPayment !== null && !isPixExpired(order);
  useEffect(() => {
    if (!pollPix) return;
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    const interval = window.setInterval(refreshIfVisible, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [pollPix, load]);

  const handleCancel = useCallback(async (): Promise<string | null> => {
    if (!token) return null;
    const result = await cancelOrder(token, orderId);
    if (result.kind === "unauthorized") {
      onUnauthorized();
      return null;
    }
    if (result.kind === "ok") {
      await load(false);
      return null;
    }
    return result.kind === "error" && result.message
      ? result.message
      : "Não foi possível cancelar o pedido. Tente de novo.";
  }, [orderId, token, onUnauthorized, load]);

  if (!order && error) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="card card-static mx-auto w-full max-w-lg px-4 py-12 text-center">
          <Package className="mx-auto mb-4 h-14 w-14 text-muted-foreground opacity-40" aria-hidden="true" />
          <h1 className="mb-2 text-lg font-semibold text-theme-primary">Não foi possível abrir o pedido</h1>
          <p className="mb-6 text-muted-foreground">{error.message}</p>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            {error.canRetry && (
              <Button onClick={() => void load(false)} className="btn-theme-primary">
                Tentar de novo
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/pedidos">Ver meus pedidos</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return <OrderDetailSkeleton />;

  const helpUrl = buildWhatsAppHelpUrl(order);

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/pedidos"
          className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-label font-medium text-muted-foreground transition-colors hover:text-theme-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Meus pedidos
        </Link>

        <header className="mb-4 mt-1 sm:mb-6">
          <h1 className="break-words text-2xl font-bold text-theme-primary sm:text-3xl">
            Pedido {order.code}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className="text-label text-muted-foreground">{formatOrderDate(order.createdAt)}</p>
            <OrderStatusBadge badge={getStatusBadge(order)} />
          </div>
        </header>

        <div role="status">
          {justPaid && (
            <p className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                <strong>Pagamento confirmado!</strong> A loja já recebeu seu pedido.
              </span>
            </p>
          )}
        </div>

        {/* DOM order is the mobile order (what to do now first); on desktop the
            grid moves the status column to a sticky right rail. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6">
          <aside
            aria-label="Situação do pedido"
            className="space-y-4 lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1"
          >
            {order.pixPayment && (
              <PixPaymentPanel
                payment={order.pixPayment}
                totalAmount={order.total}
                orderCode={order.code}
                helpUrl={helpUrl}
              />
            )}
            <OrderStatusTimeline order={order} />
          </aside>

          <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1">
            <OrderItems order={order} />
            <OrderFulfillment order={order} />
            <OrderHelp href={helpUrl} />
            {order.canCancel && (
              <div className="pt-2">
                <OrderCancelSection orderCode={order.code} onConfirm={handleCancel} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

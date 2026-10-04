"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { useCountdown } from "@/hooks/use-countdown";
import { formatCurrency } from "@/lib/delivery-regions";
import {
  formatOrderDateShort,
  formatRemainingMinutes,
  getDeliveryMethodLabel,
  getStatusBadge,
  type CustomerOrder,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

export function OrderListCard({ order }: { order: CustomerOrder }) {
  const remainingMs = useCountdown(order.pixPayment?.expiresAt, 30_000);
  const awaitingPix = order.pixPayment !== null && (remainingMs === null || remainingMs > 0);
  const remaining = remainingMs !== null ? formatRemainingMinutes(remainingMs) : null;
  const [first, ...rest] = order.items;

  return (
    <Link
      href={`/pedidos?orderId=${encodeURIComponent(order.id)}`}
      className={cn(
        "card block p-4 text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        awaitingPix && "border-theme-accent",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        {/* Customers tell orders apart by date and items; the code stays small at the bottom. */}
        <h3 className="text-sm font-semibold text-theme-primary">
          {formatOrderDateShort(order.createdAt)}
        </h3>
        <OrderStatusBadge badge={getStatusBadge(order)} />
      </div>
      <p className="mt-0.5 text-label text-muted-foreground">
        {getDeliveryMethodLabel(order.deliveryMethod)}
      </p>

      {first && (
        <div className="mt-3 flex items-center gap-3">
          <div className="flex shrink-0 -space-x-2">
            {order.items.slice(0, 3).map((item) => (
              <Image
                key={item.id}
                src={item.image}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-md border-2 border-card bg-muted object-contain"
              />
            ))}
          </div>
          {/* The count sits on its own line so clamping a long name never hides it. */}
          <div className="min-w-0">
            <p className="line-clamp-2 break-words text-label leading-5 text-theme-primary">
              {first.name}
            </p>
            {rest.length > 0 && (
              <p className="text-label leading-5 text-muted-foreground">
                e mais {rest.length} {rest.length === 1 ? "item" : "itens"}
              </p>
            )}
          </div>
        </div>
      )}

      {awaitingPix && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 text-label text-amber-900">
          <span>Pague o PIX{remaining ? `: expira em ${remaining}` : ""}</span>
          <span className="inline-flex shrink-0 items-center font-semibold">
            Pagar
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="price text-sm">{formatCurrency(order.total)}</span>
        <span className="inline-flex min-w-0 items-center gap-0.5 text-xs text-muted-foreground">
          <span className="truncate">Pedido nº {order.code}</span>
          <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

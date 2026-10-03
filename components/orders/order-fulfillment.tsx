import { CreditCard, ExternalLink, Package, Store, Truck } from "lucide-react";
import {
  formatAddressLines,
  getDeliveryMethodLabel,
  getPaymentSummary,
  type CustomerOrder,
} from "@/lib/orders";
import { STORE_INFO } from "@/lib/store-info";

const METHOD_ICONS = { delivery: Truck, pickup: Store, shipping: Package } as const;

export function OrderFulfillment({ order }: { order: CustomerOrder }) {
  const Icon = METHOD_ICONS[order.deliveryMethod];
  const methodLabel = getDeliveryMethodLabel(order.deliveryMethod);
  const title =
    order.deliveryMethod === "delivery" && order.address?.district
      ? `${methodLabel} · ${order.address.district}`
      : methodLabel;

  return (
    <section aria-labelledby="order-fulfillment-title" className="card card-static p-4">
      <h2 id="order-fulfillment-title" className="text-base font-semibold text-theme-primary">
        Entrega e pagamento
      </h2>

      <div className="mt-3 flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-theme-primary">{title}</p>
          {order.deliveryMethod === "pickup" ? (
            <>
              <p className="text-muted-foreground">{STORE_INFO.addressLine1}</p>
              <p className="text-muted-foreground">{STORE_INFO.addressLine2}</p>
              <p className="mt-1 text-label text-muted-foreground">
                {STORE_INFO.hoursWeekdays} · {STORE_INFO.hoursSaturday}
              </p>
              <a
                href={STORE_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1 text-label font-medium text-theme-accentCaramel underline-offset-2 hover:underline"
              >
                Abrir no mapa
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </>
          ) : order.address ? (
            formatAddressLines(order.address).map((line) => (
              <p key={line} className="break-words text-muted-foreground">
                {line}
              </p>
            ))
          ) : (
            <p className="text-muted-foreground">Endereço não informado</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-3 border-t border-border pt-4">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-theme-primary">{getPaymentSummary(order)}</p>
      </div>
    </section>
  );
}

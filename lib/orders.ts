import { resolveCdnUrl } from "@/lib/cdn";
import { formatCurrency } from "@/lib/delivery-regions";
import {
  buildPixPaymentPayload,
  isAwaitingPixPayment,
  type PixPaymentPayload,
} from "@/lib/pix-payment";
import { STORE_INFO } from "@/lib/store-info";

// ---------------------------------------------------------------------------
// API shape: tabacaria-baiano/app/Http/Resources/V1/OrderResource.php
// ---------------------------------------------------------------------------

export interface ApiOrderProduct {
  id: string;
  amount: number;
  /** Decimal string, e.g. "12.50". */
  price: string;
  pharmacy?: { id: string; name: string } | null;
  product?: {
    id: string;
    name: string;
    slug?: string | null;
    images?: string[];
  } | null;
  variationOption?: { typeName?: string | null; optionName?: string | null } | null;
}

export interface ApiOrder {
  id: string;
  code: string;
  status: string;
  payment_method?: string | null;
  payment_provider?: string | null;
  payment_status?: string | null;
  payment_expires_at?: string | null;
  payment_paid_at?: string | null;
  pix_copy_paste?: string | null;
  pix_qrcode_base64?: string | null;
  address?: {
    street?: string | null;
    street_number?: string | null;
    postal_code?: string | null;
    district?: string | null;
    city?: string | null;
    state?: string | null;
    address_details?: string | null;
  } | null;
  pharmacy?: { id: string; name: string } | null;
  products?: ApiOrderProduct[];
  total?: string | null;
  price_adjustment?: string | null;
  delivery_method?: string | null;
  delivery_fee?: string | null;
  free_shipping_promotion_fee?: string | number | null;
  coupon_code?: string | null;
  discount_amount?: string | null;
  discount_type?: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Storefront model
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "waiting_confirmation"
  | "confirmed"
  | "out_for_delivery"
  | "delivered"
  | "canceled"
  | "unknown";

export type DeliveryMethod = "delivery" | "pickup" | "shipping";

export interface OrderAddress {
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  details: string | null;
}

export interface OrderItem {
  id: string;
  name: string;
  slug: string | null;
  unitPrice: number;
  quantity: number;
  image: string;
  pharmacyName: string | null;
  variation: { typeName: string; optionName: string } | null;
}

export interface CustomerOrder {
  id: string;
  code: string;
  createdAt: string;
  paidAt: string | null;
  status: OrderStatus;
  /** Mirrors the API rule: customers may only cancel while waiting_confirmation. */
  canCancel: boolean;
  deliveryMethod: DeliveryMethod;
  address: OrderAddress | null;
  items: OrderItem[];
  productsSubtotal: number;
  deliveryFee: number;
  /** Original fee waived by the free-shipping promotion, when it applied. */
  freeShippingPromotionFee: number | null;
  discountAmount: number;
  couponCode: string | null;
  couponDiscountType: string | null;
  /** Manual adjustment the store applied to the order (negative = discount). */
  priceAdjustment: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string | null;
  pixPayment: PixPaymentPayload | null;
}

const KNOWN_STATUSES: readonly OrderStatus[] = [
  "waiting_confirmation",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "canceled",
];

const TERMINAL_PAYMENT_STATUSES = new Set([
  "paid",
  "expired",
  "cancelled",
  "canceled",
  "failed",
  "refunded",
]);

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de crédito",
  credit: "Cartão de crédito",
  debit_card: "Cartão de débito",
  debit: "Cartão de débito",
  cash: "Dinheiro",
  dinheiro: "Dinheiro",
  boleto: "Boleto",
};

/** The API sends money as decimal strings ("12.50"); some metadata values are numbers. */
export function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** A status the storefront doesn't know yet must not look like (or be cancellable as) a pending order. */
export function parseOrderStatus(raw: string | null | undefined): OrderStatus {
  return KNOWN_STATUSES.find((status) => status === raw) ?? "unknown";
}

export function parseDeliveryMethod(raw: string | null | undefined): DeliveryMethod {
  return raw === "pickup" || raw === "shipping" ? raw : "delivery";
}

export function isTerminalPaymentStatus(status: string | null | undefined): boolean {
  return !!status && TERMINAL_PAYMENT_STATUSES.has(status.toLowerCase());
}

function mapAddress(address: ApiOrder["address"]): OrderAddress | null {
  if (!address?.street) return null;
  return {
    street: address.street,
    number: address.street_number ?? "",
    district: address.district ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    postalCode: address.postal_code ?? "",
    details: address.address_details?.trim() || null,
  };
}

export function hasFreeShipping(
  order: Pick<CustomerOrder, "couponDiscountType" | "freeShippingPromotionFee">,
): boolean {
  return order.couponDiscountType === "free_shipping" || order.freeShippingPromotionFee !== null;
}

export function mapApiOrder(api: ApiOrder): CustomerOrder {
  const items: OrderItem[] = (api.products ?? []).map((product) => ({
    id: product.id,
    name: product.product?.name || "Produto",
    slug: product.product?.slug || null,
    unitPrice: parseMoney(product.price),
    quantity: product.amount || 0,
    image: resolveCdnUrl(product.product?.images?.[0]) || "/placeholder.svg",
    pharmacyName: product.pharmacy?.name || api.pharmacy?.name || null,
    variation: product.variationOption?.optionName
      ? {
          typeName: product.variationOption.typeName || "Opção",
          optionName: product.variationOption.optionName,
        }
      : null,
  }));

  const status = parseOrderStatus(api.status);
  const productsSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryFee = parseMoney(api.delivery_fee);
  const promotionFee = api.free_shipping_promotion_fee;
  const freeShippingPromotionFee =
    promotionFee === null || promotionFee === undefined || promotionFee === ""
      ? null
      : parseMoney(promotionFee);
  const discountAmount = parseMoney(api.discount_amount);
  const priceAdjustment = parseMoney(api.price_adjustment);
  const couponDiscountType = api.discount_type ?? null;
  const serverTotal = Number.parseFloat(api.total ?? "");
  const localTotal = Math.max(
    0,
    productsSubtotal +
      priceAdjustment +
      (hasFreeShipping({ couponDiscountType, freeShippingPromotionFee }) ? 0 : deliveryFee) -
      discountAmount,
  );

  return {
    id: api.id,
    code: api.code,
    createdAt: api.created_at,
    paidAt: api.payment_paid_at ?? null,
    status,
    canCancel: status === "waiting_confirmation",
    deliveryMethod: parseDeliveryMethod(api.delivery_method),
    address: mapAddress(api.address),
    items,
    productsSubtotal,
    deliveryFee,
    freeShippingPromotionFee,
    discountAmount,
    couponCode: api.coupon_code ?? null,
    couponDiscountType,
    priceAdjustment,
    // The backend total is the source of truth: it includes the store's manual adjustment.
    total: Number.isFinite(serverTotal) ? serverTotal : localTotal,
    paymentMethod: PAYMENT_METHOD_LABELS[api.payment_method ?? ""] ?? api.payment_method ?? "",
    paymentStatus: api.payment_status ?? null,
    // A canceled order must never offer a PIX to pay, whatever the payment status says.
    pixPayment:
      status === "waiting_confirmation" && isAwaitingPixPayment(api)
        ? buildPixPaymentPayload(api)
        : null,
  };
}

/** Falls back to the PIX the checkout kept in sessionStorage while the API doesn't expose it. */
export function withStoredPix(
  order: CustomerOrder,
  stored: PixPaymentPayload | null,
): CustomerOrder {
  if (order.pixPayment || !stored) return order;
  if (order.status !== "waiting_confirmation" || isTerminalPaymentStatus(order.paymentStatus)) {
    return order;
  }
  return { ...order, pixPayment: stored };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const DAY_MONTH_FORMAT = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
const DAY_MONTH_YEAR_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const TIME_FORMAT = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "3 de out. de 2026 às 13:10" */
export function formatOrderDate(iso: string | null | undefined): string {
  const date = parseDate(iso);
  return date ? `${DAY_MONTH_YEAR_FORMAT.format(date)} às ${TIME_FORMAT.format(date)}` : "";
}

/** "3 de out., 13:10"; the year is added outside the current one ("12 de set. de 2025, 07:05"). */
export function formatOrderDateShort(iso: string | null | undefined, now = Date.now()): string {
  const date = parseDate(iso);
  if (!date) return "";
  const day =
    date.getFullYear() === new Date(now).getFullYear()
      ? DAY_MONTH_FORMAT.format(date)
      : DAY_MONTH_YEAR_FORMAT.format(date);
  return `${day}, ${TIME_FORMAT.format(date)}`;
}

/** Milliseconds until `expiresAt` (negative once past); null when there is no usable date. */
export function getRemainingMs(expiresAt: string | null | undefined, now: number): number | null {
  const date = parseDate(expiresAt);
  return date ? date.getTime() - now : null;
}

/** "46:12" under an hour, "1h05" above; null once the time is up. */
export function formatCountdown(ms: number): string | null {
  if (ms <= 0) return null;
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h${String(minutes).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** "46 min", "1 h 5 min", "menos de 1 min"; null once the time is up. */
export function formatRemainingMinutes(ms: number): string | null {
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return "menos de 1 min";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export function formatCep(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : raw;
}

function streetLine(address: OrderAddress): string {
  return address.number ? `${address.street}, ${address.number}` : address.street;
}

function areaLine(address: OrderAddress, citySeparator: string): string {
  const place = [address.city, address.state].filter(Boolean).join(citySeparator);
  return [address.district, place].filter(Boolean).join(", ");
}

/** Up to three lines: street (+ complement), area, CEP. */
export function formatAddressLines(address: OrderAddress): string[] {
  return [
    [streetLine(address), address.details].filter(Boolean).join(" · "),
    areaLine(address, " – "),
    address.postalCode ? `CEP ${formatCep(address.postalCode)}` : "",
  ].filter(Boolean);
}

/** "Avenida dos Navegantes, 1234 - Centro, Porto Seguro - BA" */
export function formatAddressInline(address: OrderAddress): string {
  return [streetLine(address), areaLine(address, " - ")].filter(Boolean).join(" - ");
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export type StatusTone = "amber" | "stone" | "sky" | "orange" | "emerald" | "red" | "neutral";

export interface StatusBadge {
  label: string;
  tone: StatusTone;
}

export type TimelineStepKey = "placed" | "paid" | "dispatched" | "delivered";

export interface TimelineStep {
  key: TimelineStepKey;
  label: string;
  state: "done" | "current" | "upcoming";
  /** ISO date shown under the step, when the backend records it. */
  at: string | null;
}

const PLACED = { key: "placed", label: "Pedido feito" } as const;
const PAID = { key: "paid", label: "Pagamento confirmado" } as const;

const TIMELINES: Record<DeliveryMethod, readonly { key: TimelineStepKey; label: string }[]> = {
  delivery: [PLACED, PAID, { key: "dispatched", label: "Saiu para entrega" }, { key: "delivered", label: "Entregue" }],
  pickup: [PLACED, PAID, { key: "delivered", label: "Retirado" }],
  shipping: [PLACED, PAID, { key: "dispatched", label: "Enviado" }, { key: "delivered", label: "Entregue" }],
};

const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  delivery: "Entrega local",
  pickup: "Retirada na loja",
  shipping: "Envio nacional",
};

export function isPixExpired(order: Pick<CustomerOrder, "pixPayment">, now = Date.now()): boolean {
  const remaining = getRemainingMs(order.pixPayment?.expiresAt, now);
  return remaining !== null && remaining <= 0;
}

export function getStatusBadge(
  order: Pick<CustomerOrder, "status" | "paymentStatus" | "deliveryMethod" | "pixPayment">,
  now = Date.now(),
): StatusBadge {
  switch (order.status) {
    case "waiting_confirmation":
      if (order.paymentStatus === "pending") {
        return isPixExpired(order, now)
          ? { label: "PIX expirado", tone: "stone" }
          : { label: "Aguardando pagamento", tone: "amber" };
      }
      return { label: "Aguardando confirmação", tone: "stone" };
    case "confirmed":
      return { label: "Confirmado", tone: "sky" };
    case "out_for_delivery":
      if (order.deliveryMethod === "shipping") return { label: "Enviado", tone: "orange" };
      // Pickup orders never leave the store; the timeline treats this as confirmed too.
      if (order.deliveryMethod === "pickup") return { label: "Confirmado", tone: "sky" };
      return { label: "Saiu para entrega", tone: "orange" };
    case "delivered":
      return { label: order.deliveryMethod === "pickup" ? "Retirado" : "Entregue", tone: "emerald" };
    case "canceled":
      return { label: "Cancelado", tone: "red" };
    default:
      return { label: "Em andamento", tone: "neutral" };
  }
}

function completedSteps(order: Pick<CustomerOrder, "status" | "deliveryMethod">, total: number): number {
  switch (order.status) {
    case "confirmed":
      return 2;
    case "out_for_delivery":
      return order.deliveryMethod === "pickup" ? 2 : 3;
    case "delivered":
      return total;
    default:
      return 1;
  }
}

/** There is no status history: only "placed" (created_at) and "paid" (payment_paid_at) carry dates. */
export function getTimelineSteps(
  order: Pick<CustomerOrder, "status" | "deliveryMethod" | "createdAt" | "paidAt">,
): TimelineStep[] {
  if (order.status === "canceled") return [];
  const definitions = TIMELINES[order.deliveryMethod];
  const done = completedSteps(order, definitions.length);
  return definitions.map((definition, index) => {
    const state = index < done ? "done" : index === done ? "current" : "upcoming";
    const at =
      definition.key === "placed"
        ? order.createdAt
        : definition.key === "paid" && state === "done"
          ? order.paidAt
          : null;
    return { ...definition, state, at };
  });
}

export function getCanceledReason(order: Pick<CustomerOrder, "status" | "paymentStatus">): string | null {
  if (order.status !== "canceled") return null;
  switch (order.paymentStatus) {
    case "expired":
      return "O PIX não foi pago no prazo e o pedido foi cancelado.";
    case "refunded":
      return "Este pedido foi cancelado e o pagamento foi estornado.";
    case "paid":
      return "Este pedido foi cancelado. Se o valor ainda não voltou para sua conta, fale com a loja.";
    default:
      return "Este pedido foi cancelado.";
  }
}

export function getDeliveryMethodLabel(method: DeliveryMethod): string {
  return DELIVERY_METHOD_LABELS[method];
}

/** What goes in "Frete (…)" in the order summary. */
export function getFreightLabel(order: Pick<CustomerOrder, "deliveryMethod" | "address">): string | undefined {
  if (order.deliveryMethod === "shipping") return "Envio nacional";
  if (order.deliveryMethod === "delivery") return order.address?.district || undefined;
  return undefined;
}

export function hasMultipleStores(items: Pick<OrderItem, "pharmacyName">[]): boolean {
  return new Set(items.map((item) => item.pharmacyName).filter(Boolean)).size > 1;
}

export function isActiveOrder(order: Pick<CustomerOrder, "status">): boolean {
  return order.status !== "delivered" && order.status !== "canceled";
}

export function groupOrders<T extends Pick<CustomerOrder, "status">>(orders: T[]): { active: T[]; past: T[] } {
  return {
    active: orders.filter(isActiveOrder),
    past: orders.filter((order) => !isActiveOrder(order)),
  };
}

function paymentStatusText(
  order: Pick<CustomerOrder, "status" | "paymentStatus" | "paidAt" | "pixPayment">,
  now: number,
): string | null {
  switch (order.paymentStatus) {
    case "paid": {
      const when = formatOrderDateShort(order.paidAt, now);
      return when ? `pago em ${when}` : "pago";
    }
    case "pending":
      if (order.status === "canceled") return "não pago";
      return isPixExpired(order, now) ? "prazo encerrado" : "aguardando pagamento";
    case "expired":
      return "expirado";
    case "refunded":
      return "estornado";
    case "failed":
      return "pagamento falhou";
    case "cancelled":
    case "canceled":
      return "cancelado";
    default:
      return null;
  }
}

/** "PIX · pago em 3 de out., 13:22" */
export function getPaymentSummary(
  order: Pick<CustomerOrder, "status" | "paymentMethod" | "paymentStatus" | "paidAt" | "pixPayment">,
  now = Date.now(),
): string {
  const method = order.paymentMethod || "PIX";
  const status = paymentStatusText(order, now);
  return status ? `${method} · ${status}` : method;
}

export function buildWhatsAppHelpUrl(order: CustomerOrder): string {
  const itemsList = order.items.map((item) => `* ${item.quantity}x ${item.name}`).join("\n");
  const whereLine =
    order.deliveryMethod === "pickup"
      ? "📍Retirada na loja"
      : `📍Endereço de entrega: ${order.address ? formatAddressInline(order.address) : "não informado"}`;

  const message = [
    "Salve tropa do baiano, gostaria de falar sobre meu pedido.",
    "",
    `Pedido: #${order.code}`,
    `Status: ${getStatusBadge(order).label}`,
    "",
    "🎁 Itens:",
    itemsList,
    `Total: ${formatCurrency(order.total)}`,
    "",
    whereLine,
  ].join("\n");

  const phone = STORE_INFO.whatsappUrl.replace("https://wa.me/", "");
  // wa.me's redirect strips 4-byte UTF-8 emoji (e.g. 🎁, 📍) from the "text"
  // param, replacing them with U+FFFD. api.whatsapp.com/send is the same
  // destination without that redirect hop, so emoji survive intact.
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

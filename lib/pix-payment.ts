export type PixPaymentPayload = {
  id?: string;
  brCode: string;
  brCodeBase64?: string;
  expiresAt?: string;
};

const TERMINAL_PIX_STATUSES = new Set([
  "paid",
  "expired",
  "cancelled",
  "canceled",
  "failed",
  "refunded",
]);

export function isAwaitingPixPayment(order: {
  payment_provider?: string | null;
  payment_status?: string | null;
  pix_copy_paste?: string | null;
}): boolean {
  if (order.payment_provider !== "abacatepay") {
    return false;
  }

  if (!order.pix_copy_paste) {
    return false;
  }

  const status = (order.payment_status ?? "").toLowerCase();

  return !TERMINAL_PIX_STATUSES.has(status);
}

export function buildPixPaymentPayload(order: {
  pix_copy_paste?: string | null;
  pix_qrcode_base64?: string | null;
  payment_expires_at?: string | null;
}): PixPaymentPayload | null {
  if (!order.pix_copy_paste) {
    return null;
  }

  return {
    brCode: order.pix_copy_paste,
    brCodeBase64: order.pix_qrcode_base64 ?? undefined,
    expiresAt: order.payment_expires_at ?? undefined,
  };
}

const PIX_PAYMENT_STORAGE_PREFIX = "pix-payment-";

export function storePixPaymentForOrder(
  orderId: string,
  payment: PixPaymentPayload,
): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(
    `${PIX_PAYMENT_STORAGE_PREFIX}${orderId}`,
    JSON.stringify(payment),
  );
}

export function readStoredPixPaymentForOrder(
  orderId: string,
): PixPaymentPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(`${PIX_PAYMENT_STORAGE_PREFIX}${orderId}`);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PixPaymentPayload;

    if (!parsed?.brCode) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredPixPaymentForOrder(orderId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(`${PIX_PAYMENT_STORAGE_PREFIX}${orderId}`);
}

export function formatPixAmountFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function pixQrCodeSrc(brCodeBase64: string): string {
  if (brCodeBase64.startsWith("data:")) {
    return brCodeBase64;
  }
  return `data:image/png;base64,${brCodeBase64}`;
}

export function formatPixExpiresAt(expiresAt?: string): string | null {
  if (!expiresAt) {
    return null;
  }
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

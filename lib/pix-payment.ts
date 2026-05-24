export type PixPaymentPayload = {
  id?: string;
  brCode: string;
  brCodeBase64: string;
  expiresAt?: string;
};

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

import { API_BASE_URL } from "@/lib/api";
import { mapApiOrder, type ApiOrder, type CustomerOrder } from "@/lib/orders";

export type ApiResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "unauthorized" }
  /** 403 (someone else's order) and 404 look the same to the customer. */
  | { kind: "not_found" }
  /** `message` is only set when the server sent a customer-facing reason (422). */
  | { kind: "error"; message: string | null };

type ApiBody = { success?: boolean; data?: unknown; message?: unknown } | null;

async function call<T>(
  path: string,
  token: string,
  read: (body: NonNullable<ApiBody>) => T | null,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return { kind: "error", message: null };
  }

  if (response.status === 401) return { kind: "unauthorized" };
  if (response.status === 403 || response.status === 404) return { kind: "not_found" };

  const body: ApiBody = await response.json().catch(() => null);

  if (!response.ok) {
    const reason = response.status === 422 && typeof body?.message === "string" ? body.message : null;
    return { kind: "error", message: reason };
  }

  const data = body?.success ? read(body) : null;
  return data === null ? { kind: "error", message: null } : { kind: "ok", data };
}

export function fetchOrders(token: string): Promise<ApiResult<CustomerOrder[]>> {
  return call("/api/customer/orders", token, (body) =>
    Array.isArray(body.data) ? (body.data as ApiOrder[]).map(mapApiOrder) : null,
  );
}

export function fetchOrder(token: string, orderId: string): Promise<ApiResult<CustomerOrder>> {
  return call(`/api/customer/orders/${encodeURIComponent(orderId)}`, token, (body) =>
    body.data ? mapApiOrder(body.data as ApiOrder) : null,
  );
}

export function cancelOrder(token: string, orderId: string): Promise<ApiResult<true>> {
  return call(
    `/api/customer/orders/${encodeURIComponent(orderId)}/cancel`,
    token,
    () => true,
    { method: "POST" },
  );
}

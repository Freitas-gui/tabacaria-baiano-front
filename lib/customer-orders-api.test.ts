import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { cancelOrder, fetchOrder, fetchOrders } from "@/lib/customer-orders-api";
import { apiOrder } from "@/lib/orders.fixtures";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

type Call = { url: string; init?: RequestInit };

function stubFetch(status: number, body: unknown): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  return calls;
}

test("fetchOrders maps the list and sends the bearer token", async () => {
  const calls = stubFetch(200, { success: true, data: [apiOrder()] });
  const result = await fetchOrders("tok");
  assert.equal(result.kind, "ok");
  assert.equal(result.kind === "ok" && result.data[0].code, "1002ab3k9z");
  assert.ok(calls[0].url.endsWith("/api/customer/orders"));
  const headers = calls[0].init?.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer tok");
  assert.equal(headers.Accept, "application/json");
});

test("401 means the session expired", async () => {
  stubFetch(401, { message: "Unauthenticated." });
  assert.deepEqual(await fetchOrders("tok"), { kind: "unauthorized" });
});

test("403 and 404 both read as not found", async () => {
  stubFetch(403, { success: false, message: "Unauthorized access to this order" });
  assert.deepEqual(await fetchOrder("tok", "x"), { kind: "not_found" });
  stubFetch(404, { success: false });
  assert.deepEqual(await fetchOrder("tok", "x"), { kind: "not_found" });
});

test("server errors, invalid payloads and network failures are generic errors", async () => {
  stubFetch(500, { message: "Server Error" });
  assert.deepEqual(await fetchOrders("tok"), { kind: "error", message: null });
  stubFetch(200, { success: false });
  assert.deepEqual(await fetchOrders("tok"), { kind: "error", message: null });
  globalThis.fetch = (async () => {
    throw new TypeError("Failed to fetch");
  }) as typeof fetch;
  assert.deepEqual(await fetchOrder("tok", "x"), { kind: "error", message: null });
});

test("fetchOrder encodes the id and maps the order", async () => {
  const calls = stubFetch(200, { success: true, data: apiOrder() });
  const result = await fetchOrder("tok", "a/b");
  assert.equal(result.kind, "ok");
  assert.ok(calls[0].url.endsWith("/api/customer/orders/a%2Fb"));
});

test("cancelOrder posts and surfaces the server's 422 reason", async () => {
  const calls = stubFetch(200, { success: true, data: apiOrder({ status: "canceled" }) });
  assert.deepEqual(await cancelOrder("tok", "abc"), { kind: "ok", data: true });
  assert.equal(calls[0].init?.method, "POST");
  assert.ok(calls[0].url.endsWith("/api/customer/orders/abc/cancel"));

  stubFetch(422, { success: false, message: "Este pedido não pode mais ser cancelado" });
  assert.deepEqual(await cancelOrder("tok", "abc"), {
    kind: "error",
    message: "Este pedido não pode mais ser cancelado",
  });
});

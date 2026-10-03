"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderDetail } from "@/components/orders/order-detail";
import { OrderList } from "@/components/orders/order-list";
import { useUser } from "@/contexts/user-context";
import { withNext } from "@/lib/safe-redirect";

/** The URL decides the view: /pedidos lists the orders, /pedidos?orderId=… shows one. */
export function OrdersPage() {
  const { user, isLoading, logout } = useUser();
  const router = useRouter();
  const orderId = useSearchParams().get("orderId");
  const token = isLoading ? null : user?.accessToken ?? null;

  // Wait for the stored session before deciding anything, otherwise the page
  // flashes an error on every visit. No session → login, then back here.
  useEffect(() => {
    if (isLoading || user?.accessToken) return;
    const here = `${window.location.pathname}${window.location.search}`;
    router.replace(withNext("/login", here));
  }, [isLoading, user?.accessToken, router]);

  // Expired token: dropping the session makes the effect above send the user to login.
  const handleUnauthorized = useCallback(() => logout(), [logout]);

  if (orderId) {
    // Keyed by id: another order starts from a clean state, and late responses
    // for the previous one are dropped when it unmounts.
    return (
      <OrderDetail
        key={orderId}
        orderId={orderId}
        token={token}
        onUnauthorized={handleUnauthorized}
      />
    );
  }

  return <OrderList token={token} onUnauthorized={handleUnauthorized} />;
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderListCard } from "@/components/orders/order-list-card";
import { OrderListSkeleton } from "@/components/orders/order-skeletons";
import { fetchOrders } from "@/lib/customer-orders-api";
import { groupOrders, type CustomerOrder } from "@/lib/orders";

type OrderListProps = {
  /** null while the stored session is still loading. */
  token: string | null;
  onUnauthorized: () => void;
};

type ListState = { kind: "loading" } | { kind: "error" } | { kind: "ready"; orders: CustomerOrder[] };

export function OrderList({ token, onUnauthorized }: OrderListProps) {
  const [state, setState] = useState<ListState>({ kind: "loading" });

  const load = useCallback(
    async (isCurrent: () => boolean) => {
      if (!token) return;
      setState({ kind: "loading" });
      const result = await fetchOrders(token);
      if (!isCurrent()) return;
      if (result.kind === "unauthorized") {
        onUnauthorized();
        return;
      }
      setState(result.kind === "ok" ? { kind: "ready", orders: result.data } : { kind: "error" });
    },
    [token, onUnauthorized],
  );

  useEffect(() => {
    let current = true;
    void load(() => current);
    return () => {
      current = false;
    };
  }, [load]);

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* .container's legacy max-widths win over utilities, so cap the width here. */}
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3">
          <Link
            href="/"
            aria-label="Voltar para a tela inicial"
            title="Voltar para a tela inicial"
            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-theme-primary"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <h1 className="text-2xl font-bold text-theme-primary sm:text-3xl">Meus pedidos</h1>
        </div>

        {state.kind === "loading" ? (
          <OrderListSkeleton />
        ) : state.kind === "error" ? (
          <ListMessage
            title="Não foi possível carregar seus pedidos"
            text="Verifique sua conexão e tente de novo."
            action={
              <Button onClick={() => void load(() => true)} className="btn-theme-primary">
                Tentar de novo
              </Button>
            }
          />
        ) : state.orders.length === 0 ? (
          <ListMessage
            title="Você ainda não fez nenhum pedido"
            text="Quando você comprar, seus pedidos aparecem aqui."
            action={
              <Button asChild className="btn-theme-primary">
                <Link href="/">Ver produtos</Link>
              </Button>
            }
          />
        ) : (
          <OrderGroups orders={state.orders} />
        )}
      </div>
    </div>
  );
}

function OrderGroups({ orders }: { orders: CustomerOrder[] }) {
  const { active, past } = groupOrders(orders);
  return (
    <div className="space-y-6">
      {active.length > 0 && <OrderGroup id="orders-active" title="Em andamento" orders={active} />}
      {past.length > 0 && <OrderGroup id="orders-past" title="Anteriores" orders={past} />}
    </div>
  );
}

function OrderGroup({ id, title, orders }: { id: string; title: string; orders: CustomerOrder[] }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-2 text-label font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id}>
            <OrderListCard order={order} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ListMessage({ title, text, action }: { title: string; text: string; action: ReactNode }) {
  return (
    <div className="card card-static px-4 py-12 text-center">
      <Package className="mx-auto mb-4 h-14 w-14 text-muted-foreground opacity-40" aria-hidden="true" />
      <h2 className="mb-2 text-lg font-semibold text-theme-primary">{title}</h2>
      <p className="mb-6 text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}

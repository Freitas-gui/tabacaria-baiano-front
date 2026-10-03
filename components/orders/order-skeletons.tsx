import { Skeleton } from "@/components/ui/skeleton";

export function OrderListSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Carregando pedidos…</span>
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div key={index} className="card card-static space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-4 sm:py-8" role="status">
      <span className="sr-only">Carregando pedido…</span>
      <div className="mx-auto w-full max-w-5xl" aria-hidden="true">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-8 w-64 max-w-full" />
        <Skeleton className="mt-2 h-5 w-48" />
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
          <Skeleton className="h-56 lg:col-start-2 lg:row-start-1" />
          <div className="space-y-4 lg:col-start-1 lg:row-start-1">
            <Skeleton className="h-64" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

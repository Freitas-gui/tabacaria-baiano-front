import { Check, XCircle } from "lucide-react";
import {
  formatOrderDateShort,
  getCanceledReason,
  getTimelineSteps,
  type CustomerOrder,
  type TimelineStep,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

const STATE_TEXT: Record<TimelineStep["state"], string> = {
  done: "concluída",
  current: "etapa atual",
  upcoming: "próxima etapa",
};

export function OrderStatusTimeline({ order }: { order: CustomerOrder }) {
  const canceledReason = getCanceledReason(order);

  if (canceledReason) {
    return (
      <section aria-labelledby="order-status-title" className="card card-static border-red-200 p-4">
        <h2 id="order-status-title" className="flex items-center gap-2 text-base font-semibold text-red-900">
          <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          Pedido cancelado
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{canceledReason}</p>
      </section>
    );
  }

  const steps = getTimelineSteps(order);

  return (
    <section aria-labelledby="order-status-title" className="card card-static p-4">
      <h2 id="order-status-title" className="text-base font-semibold text-theme-primary">
        Andamento
      </h2>
      <ol className="mt-3">
        {steps.map((step, index) => (
          <li
            key={step.key}
            className="relative flex gap-3 pb-4 last:pb-0"
            aria-current={step.state === "current" ? "step" : undefined}
          >
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute bottom-0 left-[11px] top-6 w-0.5",
                  step.state === "done" ? "bg-theme-accent" : "bg-border",
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                step.state === "done" && "border-transparent bg-theme-accent text-white",
                step.state === "current" && "border-theme-accent bg-card",
                step.state === "upcoming" && "border-border bg-card",
              )}
            >
              {step.state === "done" && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              {step.state === "current" && <span className="h-2 w-2 rounded-full bg-theme-accent" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm leading-5",
                  step.state === "upcoming" ? "text-muted-foreground" : "font-semibold text-theme-primary",
                )}
              >
                {step.label}
                <span className="sr-only"> ({STATE_TEXT[step.state]})</span>
              </p>
              {step.at && (
                <p className="text-label leading-5 text-muted-foreground">{formatOrderDateShort(step.at)}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

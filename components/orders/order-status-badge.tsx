import { CheckCircle, Clock, PackageCheck, Truck, XCircle, type LucideIcon } from "lucide-react";
import type { StatusBadge, StatusTone } from "@/lib/orders";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<StatusTone, string> = {
  amber: "bg-amber-50 text-amber-900 border-amber-200",
  stone: "bg-stone-100 text-stone-800 border-stone-200",
  sky: "bg-sky-50 text-sky-900 border-sky-200",
  orange: "bg-orange-50 text-orange-900 border-orange-200",
  emerald: "bg-emerald-50 text-emerald-900 border-emerald-200",
  red: "bg-red-50 text-red-900 border-red-200",
  neutral: "bg-muted text-muted-foreground border-border",
};

const TONE_ICONS: Record<StatusTone, LucideIcon> = {
  amber: Clock,
  stone: Clock,
  sky: CheckCircle,
  orange: Truck,
  emerald: PackageCheck,
  red: XCircle,
  neutral: Clock,
};

export function OrderStatusBadge({ badge, className }: { badge: StatusBadge; className?: string }) {
  const Icon = TONE_ICONS[badge.tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5",
        TONE_CLASSES[badge.tone],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {badge.label}
    </span>
  );
}

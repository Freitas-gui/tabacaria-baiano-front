"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  formatCurrency,
  parseRegionPrice,
  type DeliveryRegion,
} from "@/lib/delivery-regions";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DeliveryRegionFieldProps = {
  regions: DeliveryRegion[];
  value: string;
  onChange: (regionName: string) => void;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  label?: string;
  hint?: string;
  selectClassName?: string;
  showPrice?: boolean;
};

const SCROLL_WHEEL_FACTOR = 0.25;

export function DeliveryRegionField({
  regions,
  value,
  onChange,
  loading = false,
  error = null,
  disabled = false,
  required = true,
  id = "delivery-region",
  label = "Região de entrega",
  hint,
  selectClassName,
  showPrice = true,
}: DeliveryRegionFieldProps) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const placeholder = loading ? "Carregando regiões..." : "Selecione sua região";
  const isDisabled = disabled || loading || regions.length === 0;
  const selectedRegion = regions.find((region) => region.name === value);

  const formatRegionLabel = (region: DeliveryRegion) =>
    showPrice
      ? `${region.name} — ${formatCurrency(parseRegionPrice(region.price))}`
      : region.name;

  useEffect(() => {
    const list = listRef.current;
    if (!list || !open) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      list.scrollTop += event.deltaY * SCROLL_WHEEL_FACTOR;
    };

    list.addEventListener("wheel", handleWheel, { passive: false });
    return () => list.removeEventListener("wheel", handleWheel);
  }, [open]);

  return (
    <div className="space-y-2">
      <div>
        <label
          htmlFor={id}
          className="block text-xs sm:text-sm font-medium text-theme-primary mb-1"
        >
          {label}
          {required ? " *" : ""}
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              id={id}
              role="combobox"
              aria-expanded={open}
              aria-required={required}
              disabled={isDisabled}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                "rounded-lg text-sm sm:text-base focus:ring-theme-accent",
                selectClassName,
              )}
            >
              <span className="line-clamp-1 text-left">
                {selectedRegion ? (
                  formatRegionLabel(selectedRegion)
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Buscar região..." />
              <CommandList
                ref={listRef}
                className="max-h-[11.25rem] overscroll-contain scroll-smooth"
              >
                <CommandEmpty>Nenhuma região encontrada.</CommandEmpty>
                <CommandGroup>
                  {regions.map((region) => (
                    <CommandItem
                      key={region.id}
                      value={region.name}
                      onSelect={() => {
                        onChange(region.name);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === region.name ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {formatRegionLabel(region)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {error && (
          <p className="mt-1 text-xs sm:text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && regions.length === 0 && (
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Nenhuma região de entrega disponível no momento.
          </p>
        )}
        {hint && (
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{hint}</p>
        )}
      </div>
    </div>
  );
}

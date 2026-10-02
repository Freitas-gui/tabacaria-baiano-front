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
  // Touch devices get the OS picker: no on-screen keyboard from the search box
  // and no popover covering the fields above it.
  const [useNativeSelect, setUseNativeSelect] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const placeholder = loading ? "Carregando regiões..." : "Selecione sua região";
  const isDisabled = disabled || loading || regions.length === 0;
  const selectedRegion = regions.find((region) => region.name === value);

  const formatRegionLabel = (region: DeliveryRegion) =>
    showPrice
      ? `${region.name} — ${formatCurrency(parseRegionPrice(region.price))}`
      : region.name;

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const update = () => setUseNativeSelect(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

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
          className="block text-label leading-4 sm:text-sm font-medium text-theme-primary mb-1"
        >
          {label}
          {required ? " *" : ""}
        </label>
        {useNativeSelect ? (
          <div className="relative">
            <select
              id={id}
              value={selectedRegion ? selectedRegion.name : ""}
              onChange={(event) => onChange(event.target.value)}
              required={required}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              disabled={isDisabled}
              className={cn(
                "flex h-10 w-full appearance-none rounded-lg border border-input bg-background py-2 pl-3 pr-9 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                !selectedRegion && "text-muted-foreground",
                selectClassName,
              )}
            >
              <option value="" disabled>
                {placeholder}
              </option>
              {regions.map((region) => (
                <option key={region.id} value={region.name} className="text-foreground">
                  {formatRegionLabel(region)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
              aria-hidden="true"
            />
          </div>
        ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              id={id}
              role="combobox"
              aria-expanded={open}
              aria-required={required}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
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
        )}
        {error && (
          <p id={`${id}-error`} className="mt-1 text-xs sm:text-sm text-destructive">
            {error}
          </p>
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

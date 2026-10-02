"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export type DeliveryMethod = "delivery" | "pickup" | "shipping";

export type DeliveryMethodOption = {
  value: DeliveryMethod;
  title: string;
  description: string;
  /** Short price shown on the right, e.g. "R$ 6,00", "Grátis", "Pelo bairro". */
  price: string;
};

type DeliveryMethodOptionsProps = {
  options: DeliveryMethodOption[];
  value: DeliveryMethod;
  onChange: (value: DeliveryMethod) => void;
  disabled?: boolean;
};

export function DeliveryMethodOptions({
  options,
  value,
  onChange,
  disabled = false,
}: DeliveryMethodOptionsProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium text-theme-primary">
        Como deseja receber?
      </legend>
      <RadioGroup
        value={value}
        onValueChange={(next) => onChange(next as DeliveryMethod)}
        disabled={disabled}
        className="gap-2"
      >
        {options.map((option) => {
          const id = `delivery-method-${option.value}`;
          const selected = option.value === value;

          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                "flex min-h-[3.5rem] cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 transition-colors",
                selected
                  ? "border-theme-accent bg-muted/40"
                  : "border-border hover:bg-muted/30",
              )}
            >
              <RadioGroupItem
                id={id}
                value={option.value}
                aria-describedby={`${id}-description`}
                className="mt-0.5 h-5 w-5 shrink-0 border-theme-accent text-theme-accent"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-theme-primary">
                  {option.title}
                </span>
                <span
                  id={`${id}-description`}
                  className="mt-0.5 block text-xs sm:text-sm text-muted-foreground"
                >
                  {option.description}
                </span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-theme-primary">
                {option.price}
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}

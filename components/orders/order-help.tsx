import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrderHelp({ href }: { href: string }) {
  return (
    <section
      aria-labelledby="order-help-title"
      className="card card-static flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 id="order-help-title" className="text-base font-semibold text-theme-primary">
          Precisa de ajuda?
        </h2>
        <p className="text-sm text-muted-foreground">Fale com a loja pelo WhatsApp.</p>
      </div>
      <Button asChild className="h-11 bg-emerald-700 text-white hover:bg-emerald-800 sm:shrink-0">
        <a href={href} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden="true" />
          Falar no WhatsApp
        </a>
      </Button>
    </section>
  );
}

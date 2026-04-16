"use client";

import { useState, useEffect, type ReactNode } from "react";

const AGE_GATE_KEY = "tabacaria_age_verified";

export function AgeGate({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(AGE_GATE_KEY);
    setVerified(stored === "true");
  }, []);

  const handleConfirm = () => {
    localStorage.setItem(AGE_GATE_KEY, "true");
    setVerified(true);
  };

  const handleDecline = () => {
    window.location.href = "https://www.google.com";
  };

  if (verified === null) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center">
        <div className="animate-pulse text-[var(--text-primary)]/70">
          Carregando...
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card text-card-foreground rounded-2xl shadow-2xl p-8 border border-white/10">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Tabacaria do Baiano
            </h1>
            <p className="text-muted-foreground text-sm">
              Este site vende produtos para maiores de idade. Você tem 18 anos
              ou mais?
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 btn-theme-primary py-3 rounded-lg font-semibold"
            >
              Sim, tenho 18 anos ou mais
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="flex-1 py-3 rounded-lg font-semibold border-2 border-white/25 text-foreground hover:bg-muted transition-colors"
            >
              Não
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

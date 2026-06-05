"use client";

import { useState } from "react";
import { Instagram, Linkedin, MapPin, MessageCircle } from "lucide-react";
import { PolicyDialog } from "@/components/policy-dialog";
import { DEVELOPER_CREDIT } from "@/lib/developer-credit";
import { POLICY_LINKS, type PolicyId } from "@/lib/policies";
import { STORE_INFO } from "@/lib/store-info";

export function Footer() {
  const [activePolicy, setActivePolicy] = useState<PolicyId | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);

  function openPolicy(policyId: PolicyId) {
    setActivePolicy(policyId);
    setPolicyOpen(true);
  }

  function handlePolicyOpenChange(open: boolean) {
    setPolicyOpen(open);
    if (!open) {
      setActivePolicy(null);
    }
  }

  return (
    <>
      <footer className="footer-site mt-8 sm:mt-16">
        <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="text-2xl font-bold text-[color:var(--footer-muted)] mb-3">
                <span>Tabacaria</span>
                <div className="text-sm font-normal opacity-90">do Baiano</div>
              </div>
              <p className="text-sm opacity-90 mb-2">{STORE_INFO.tagline}</p>
              <p className="text-sm opacity-90 flex items-start gap-1.5">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[color:var(--footer-muted)]" />
                <span>{STORE_INFO.city}</span>
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[color:var(--footer-muted)] mb-4">
                POLÍTICAS
              </h3>
              <ul className="space-y-2 text-sm">
                {POLICY_LINKS.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => openPolicy(link.id)}
                      className="text-left transition-colors hover:text-[color:var(--footer-muted)]"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[color:var(--footer-muted)] mb-4">
                ATENDIMENTO
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href={STORE_INFO.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-[color:var(--footer-muted)]"
                  >
                    WhatsApp: {STORE_INFO.whatsappDisplay}
                  </a>
                </li>
                <li>{STORE_INFO.hoursWeekdays}</li>
                <li>{STORE_INFO.hoursSaturday}</li>
                <li>{STORE_INFO.delivery}</li>
                <li>
                  <a
                    href={STORE_INFO.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-[color:var(--footer-muted)]"
                  >
                    {STORE_INFO.addressLine1}
                    <br />
                    {STORE_INFO.addressLine2}
                  </a>
                </li>
              </ul>

              <div className="mt-6">
                <h4 className="font-semibold text-[color:var(--footer-muted)] mb-2">
                  SIGA A GENTE
                </h4>
                <a
                  href={STORE_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[color:var(--footer-muted)]"
                  aria-label={`Instagram ${STORE_INFO.instagramHandle}`}
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded bg-white/10">
                    <Instagram className="h-4 w-4" />
                  </span>
                  {STORE_INFO.instagramHandle}
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-[color:var(--footer-muted)] mb-4">
                FORMAS DE PAGAMENTO
              </h3>
              <div className="flex flex-wrap gap-2">
                {STORE_INFO.paymentMethods.map((method) => (
                  <div
                    key={method}
                    className="inline-flex h-10 w-16 items-center justify-center rounded bg-[color:var(--footer-muted)] text-[var(--footer-bg)] text-sm font-semibold"
                  >
                    {method}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/15 mt-6 sm:mt-8 pt-6 sm:pt-8">
            <p className="text-xs opacity-90 mb-3 sm:mb-4 break-words">
              {STORE_INFO.name} — artigos para tabacaria. Venda exclusiva para
              maiores de 18 anos.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs opacity-90">
                © {STORE_INFO.name} — Todos os direitos reservados
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <p className="text-xs opacity-75">
                  {DEVELOPER_CREDIT.label}
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={DEVELOPER_CREDIT.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded bg-white/10 transition-colors hover:text-[color:var(--footer-muted)]"
                    aria-label="LinkedIn de Guilherme Freitas da Silva"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a
                    href={DEVELOPER_CREDIT.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded bg-white/10 px-2.5 py-1.5 text-xs transition-colors hover:text-[color:var(--footer-muted)]"
                    aria-label={`WhatsApp ${DEVELOPER_CREDIT.whatsappDisplay}`}
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    {DEVELOPER_CREDIT.whatsappDisplay}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <PolicyDialog
        policyId={activePolicy}
        open={policyOpen}
        onOpenChange={handlePolicyOpenChange}
      />
    </>
  );
}

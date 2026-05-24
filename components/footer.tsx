export function Footer() {
  return (
    <footer className="footer-site mt-8 sm:mt-16">
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          <div className="lg:col-span-1">
            <div className="text-2xl font-bold text-[color:var(--footer-muted)] mb-4">
              <span>Tabacaria</span>
              <div className="text-sm font-normal opacity-90">do Baiano</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[color:var(--footer-muted)] mb-4">
              INSTITUCIONAL
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors">
                  Quem Somos
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors">
                  Lojas Parceiras
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors">
                  Fale Conosco
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[color:var(--footer-muted)] mb-4">
              POLÍTICAS
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="transition-colors">
                  Termos de Uso e Serviços
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors">
                  Políticas de Trocas e Devoluções
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors">
                  Política de Envios
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors">
                  Política de Pagamento
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors">
                  Política de Segurança
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors">
                  Política de Cookies
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[color:var(--footer-muted)] mb-4">
              ATENDIMENTO
            </h3>
            <ul className="space-y-2 text-sm">
              <li>WhatsApp: (11) 94796-0433</li>
              <li>Segunda a Sexta</li>
              <li>08:00 às 18:00</li>
            </ul>

            <div className="mt-6">
              <h4 className="font-semibold text-[color:var(--footer-muted)] mb-2">
                SIGA A GENTE
              </h4>
              <div className="flex space-x-2">
                <div className="w-8 h-8 rounded bg-white/10" />
                <div className="w-8 h-8 rounded bg-[color:var(--footer-muted)]/40" />
                <div className="w-8 h-8 rounded bg-white/10" />
                <div className="w-8 h-8 rounded bg-[color:var(--footer-muted)]/30" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[color:var(--footer-muted)] mb-4">
              FORMAS DE PAGAMENTO
            </h3>
            <div className="mb-6">
              <div className="inline-flex w-16 h-10 rounded items-center justify-center bg-[color:var(--footer-muted)] text-[var(--footer-bg)] text-sm font-semibold">
                PIX
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-[color:var(--footer-muted)] mb-2">
                SITE SEGURO
              </h4>
              <div className="flex space-x-2">
                <div className="w-8 h-8 rounded bg-white/10" />
                <div className="w-8 h-8 rounded bg-[color:var(--footer-muted)]/35" />
                <div className="w-8 h-8 rounded bg-white/10" />
                <div className="w-8 h-8 rounded bg-white/10" />
                <div className="w-8 h-8 rounded bg-[color:var(--footer-muted)]/25" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="text-xs opacity-90 mb-3 sm:mb-4 break-words">
            Tabacaria do Baiano - marketplace de artigos para tabacaria. Venda
            apenas para maiores de 18 anos.
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="text-xs opacity-90">
              © Tabacaria do Baiano - Todos os direitos reservados
            </div>
            <div className="flex space-x-3 sm:space-x-4">
              <span className="text-xs sm:text-sm font-semibold text-[color:var(--footer-muted)]">
                wlcomm
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[color:var(--footer-muted)]">
                wake
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

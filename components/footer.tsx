export function Footer() {
  return (
    <footer className="bg-theme-header mt-8 sm:mt-16">
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Logo */}
          <div className="lg:col-span-1">
            <div className="text-2xl font-bold text-theme-accent mb-4">
              <span>Click</span>
              <div className="text-sm font-normal">Farma</div>
            </div>
          </div>

          {/* Institucional */}
          <div>
            <h3 className="font-semibold text-theme-accent mb-4">INSTITUCIONAL</h3>
            <ul className="space-y-2 text-sm text-white">
              <li>
                <a href="#" className="hover:text-theme-accent">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-theme-accent">
                  Quem Somos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-theme-accent">
                  Lojas Parceiras
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-theme-accent">
                  Fale Conosco
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-theme-accent">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Políticas */}
          <div>
            <h3 className="font-semibold text-theme-accent mb-4">POLÍTICAS</h3>
            <ul className="space-y-2 text-sm text-white">
              <li>
                <a href="#" className="hover:text-theme-accent">
                  Termos de Uso e Serviços
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-theme-accent">
                  Políticas de Trocas e Devoluções
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-theme-accent">
                  Política de Envios
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-theme-accent">
                  Política de Pagamento
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-theme-accent">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-theme-accent">
                  Política de Segurança
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-theme-accent">
                  Política de Cookies
                </a>
              </li>
            </ul>
          </div>

          {/* Atendimento */}
          <div>
            <h3 className="font-semibold text-theme-accent mb-4">ATENDIMENTO</h3>
            <ul className="space-y-2 text-sm text-white">
              <li>WhatsApp: (11) 94796-0433</li>
              <li>Segunda a Sexta</li>
              <li>08:00 às 18:00</li>
            </ul>

            <div className="mt-6">
              <h4 className="font-semibold text-theme-accent mb-2">SIGA A GENTE</h4>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-theme-secondary rounded"></div>
                <div className="w-8 h-8 bg-theme-accent rounded"></div>
                <div className="w-8 h-8 bg-theme-secondary rounded"></div>
                <div className="w-8 h-8 bg-theme-primary rounded"></div>
              </div>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div>
            <h3 className="font-semibold text-theme-accent mb-4">FORMAS DE PAGAMENTO</h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="w-12 h-8 bg-theme-secondary rounded flex items-center justify-center text-white text-xs">
                VISA
              </div>
              <div className="w-12 h-8 bg-theme-accent rounded flex items-center justify-center text-white text-xs">
                MC
              </div>
              <div className="w-12 h-8 bg-theme-header rounded flex items-center justify-center text-white text-xs">
                ELO
              </div>
              <div className="w-12 h-8 bg-theme-secondary rounded flex items-center justify-center text-white text-xs">
                HIPER
              </div>
              <div className="w-12 h-8 bg-theme-accent rounded flex items-center justify-center text-white text-xs">
                BANRI
              </div>
              <div className="w-12 h-8 bg-theme-primary rounded flex items-center justify-center text-theme-primary text-xs">
                PIX
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-theme-accent mb-2">SITE SEGURO</h4>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-theme-secondary rounded"></div>
                <div className="w-8 h-8 bg-theme-accent rounded"></div>
                <div className="w-8 h-8 bg-theme-primary rounded"></div>
                <div className="w-8 h-8 bg-theme-secondary rounded"></div>
                <div className="w-8 h-8 bg-theme-header rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-theme-secondary mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="text-xs text-white mb-3 sm:mb-4 break-words">
            O nome fantasia CLICK FARMA e o domínio www.clickfarma.com.br especificamente, são marcas registradas por:
            Farmácias Drogarias Ltda. Av. Pereira Barreto, 1479 - Sala 714 - Bairro Neves - São Bernardo do Campo - SP -
            09751-000. CNPJ: 54.963.094.0001-06 Inscrição Estadual: 799.916.562.116 Atendimento Farmacêutico: Segunda a
            sexta das 8:00 às 18:00.
          </div>
          <div className="text-xs text-white mb-3 sm:mb-4 break-words">
            Toda a comercialização deste site é de propriedade da Farmácias Drogarias Ltda. É expressamente proibida a
            reprodução total ou parcial, mesmo citando a fonte.
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="text-xs text-white">© CLICK FARMA - TODOS DIREITOS RESERVADOS</div>
            <div className="flex space-x-3 sm:space-x-4">
              <span className="text-xs sm:text-sm font-semibold text-theme-accent">wlcomm</span>
              <span className="text-xs sm:text-sm font-semibold text-theme-accent">wake</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export type PolicyId =
  | "terms"
  | "returns"
  | "shipping"
  | "payment"
  | "privacy"
  | "security"
  | "cookies";

export type PolicySection = {
  heading?: string;
  paragraphs: string[];
};

export type Policy = {
  id: PolicyId;
  title: string;
  sections: PolicySection[];
};

const company = "Tabacaria do Baiano";
const contactChannel =
  "WhatsApp oficial informado no rodapé do site";

export const POLICIES: Policy[] = [
  {
    id: "terms",
    title: "Termos de Uso e Serviços",
    sections: [
      {
        paragraphs: [
          `Estes Termos regulam o uso do site e a compra de produtos oferecidos por ${company}, com sede em Porto Seguro (BA). Ao acessar ou comprar em nossa loja online, você declara ter lido e aceito estas condições.`,
        ],
      },
      {
        heading: "Elegibilidade",
        paragraphs: [
          "A venda é exclusiva para maiores de 18 anos. Ao finalizar um pedido, você confirma ter idade legal para adquirir artigos de tabacaria conforme a legislação brasileira.",
        ],
      },
      {
        heading: "Cadastro e pedidos",
        paragraphs: [
          "Você é responsável por manter seus dados de cadastro e entrega corretos. Reservamo-nos o direito de recusar ou cancelar pedidos em caso de indisponibilidade de estoque, suspeita de fraude ou violação destes Termos.",
        ],
      },
      {
        heading: "Preços e disponibilidade",
        paragraphs: [
          "Os preços exibidos no site podem ser alterados sem aviso prévio até a confirmação do pagamento. Imagens e descrições são meramente ilustrativas; em caso de divergência, prevalece a descrição do produto no momento da compra.",
        ],
      },
      {
        heading: "Contato",
        paragraphs: [
          `Dúvidas sobre estes Termos podem ser enviadas pelo ${contactChannel}.`,
        ],
      },
    ],
  },
  {
    id: "returns",
    title: "Políticas de Trocas e Devoluções",
    sections: [
      {
        paragraphs: [
          `A ${company} trabalha para que você receba seus produtos em perfeitas condições. Confira o pedido no ato do recebimento.`,
        ],
      },
      {
        heading: "Arrependimento (compra online)",
        paragraphs: [
          "Em compras realizadas pela internet, você pode exercer o direito de arrependimento em até 7 (sete) dias corridos após o recebimento, conforme o Código de Defesa do Consumidor, desde que o produto esteja lacrado, sem uso e na embalagem original.",
        ],
      },
      {
        heading: "Defeito ou divergência",
        paragraphs: [
          "Produtos com defeito de fabricação ou envio incorreto devem ser comunicados em até 7 dias após o recebimento, com fotos e descrição do problema. Analisaremos o caso e, quando aplicável, providenciaremos troca, reenvio ou reembolso conforme a situação.",
        ],
      },
      {
        heading: "Produtos não elegíveis",
        paragraphs: [
          "Não aceitamos devolução de itens abertos, usados ou sem embalagem original, salvo por defeito comprovado. Itens promocionais ou personalizados podem ter regras específicas informadas na página do produto.",
        ],
      },
      {
        heading: "Como solicitar",
        paragraphs: [
          "Entre em contato pelo WhatsApp informando número do pedido, motivo da solicitação e evidências (fotos). O reembolso, quando aprovado, será processado pelo mesmo meio de pagamento utilizado na compra (PIX).",
        ],
      },
    ],
  },
  {
    id: "shipping",
    title: "Política de Envios",
    sections: [
      {
        paragraphs: [
          `Realizamos entregas em Porto Seguro e região. O prazo e o valor do frete são calculados no checkout conforme o endereço informado.`,
        ],
      },
      {
        heading: "Processamento",
        paragraphs: [
          "Após a confirmação do pagamento via PIX, o pedido entra em preparação. O prazo de entrega informado no checkout é estimado e pode variar conforme demanda, clima ou feriados locais.",
        ],
      },
      {
        heading: "Recebimento",
        paragraphs: [
          "É necessário haver alguém no endereço para receber o pedido ou autorizar a entrega conforme combinado. Tentativas de entrega sem sucesso podem gerar nova taxa ou retorno do pedido à loja.",
        ],
      },
      {
        heading: "Retirada na loja",
        paragraphs: [
          "Quando disponível, a retirada pode ser combinada em nosso endereço em Porto Seguro, nos horários de atendimento informados no site.",
        ],
      },
    ],
  },
  {
    id: "payment",
    title: "Política de Pagamento",
    sections: [
      {
        paragraphs: [
          `No momento, a ${company} aceita pagamentos exclusivamente via PIX.`,
        ],
      },
      {
        heading: "Confirmação",
        paragraphs: [
          "O pedido só é confirmado após a compensação do PIX. Você receberá as instruções de pagamento na finalização da compra; o QR Code ou código copia e cola possui validade limitada.",
        ],
      },
      {
        heading: "Cancelamento por falta de pagamento",
        paragraphs: [
          "Pedidos não pagos dentro do prazo indicado são cancelados automaticamente, liberando os itens para nova venda.",
        ],
      },
      {
        heading: "Reembolsos",
        paragraphs: [
          "Reembolsos aprovados em trocas ou devoluções são realizados via PIX para a chave ou conta informada pelo cliente, em prazo de até 10 dias úteis após a aprovação.",
        ],
      },
    ],
  },
  {
    id: "privacy",
    title: "Política de Privacidade",
    sections: [
      {
        paragraphs: [
          `Esta Política descreve como a ${company} coleta, usa e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).`,
        ],
      },
      {
        heading: "Dados coletados",
        paragraphs: [
          "Podemos coletar nome, CPF, telefone, e-mail, endereço de entrega, histórico de pedidos e dados de navegação necessários ao funcionamento do site.",
        ],
      },
      {
        heading: "Finalidade",
        paragraphs: [
          "Utilizamos seus dados para processar pedidos, entregar produtos, comunicar status de compra, cumprir obrigações legais e melhorar nossos serviços.",
        ],
      },
      {
        heading: "Compartilhamento",
        paragraphs: [
          "Dados podem ser compartilhados com prestadores de pagamento (PIX), entregadores e provedores de tecnologia estritamente para operar a loja. Não vendemos seus dados pessoais.",
        ],
      },
      {
        heading: "Seus direitos",
        paragraphs: [
          `Você pode solicitar acesso, correção, exclusão ou portabilidade dos seus dados entrando em contato pelo ${contactChannel}.`,
        ],
      },
    ],
  },
  {
    id: "security",
    title: "Política de Segurança",
    sections: [
      {
        paragraphs: [
          `A ${company} adota medidas técnicas e organizacionais para proteger suas informações e transações.`,
        ],
      },
      {
        heading: "Comunicação segura",
        paragraphs: [
          "O site utiliza conexão criptografada (HTTPS) para proteger dados transmitidos entre seu navegador e nossos servidores.",
        ],
      },
      {
        heading: "Pagamentos",
        paragraphs: [
          "Pagamentos via PIX são processados por provedor certificado. Não armazenamos dados completos de transações bancárias em nossos sistemas.",
        ],
      },
      {
        heading: "Boas práticas",
        paragraphs: [
          "Não solicitamos senhas bancárias por WhatsApp ou e-mail. Em caso de mensagem suspeita em nome da loja, confirme pelos canais oficiais listados no rodapé do site.",
        ],
      },
    ],
  },
  {
    id: "cookies",
    title: "Política de Cookies",
    sections: [
      {
        paragraphs: [
          "Cookies são pequenos arquivos armazenados no seu navegador para melhorar a experiência no site.",
        ],
      },
      {
        heading: "Tipos utilizados",
        paragraphs: [
          "Utilizamos cookies essenciais para login, carrinho e segurança da sessão, e cookies analíticos para entender o uso do site e melhorar nossos serviços.",
        ],
      },
      {
        heading: "Gerenciamento",
        paragraphs: [
          "Você pode desativar cookies nas configurações do navegador. Algumas funcionalidades do site podem deixar de funcionar corretamente sem cookies essenciais.",
        ],
      },
      {
        heading: "Atualizações",
        paragraphs: [
          "Esta política pode ser atualizada periodicamente. A data da última revisão será indicada nesta página quando houver alterações relevantes.",
        ],
      },
    ],
  },
];

export const POLICY_LINKS = POLICIES.map((policy) => ({
  id: policy.id,
  label: policy.title,
}));

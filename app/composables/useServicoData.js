// ============================================
// COMPOSABLE: useServicoData
// Dados estruturados dos serviços da AD Telas
// ============================================

export const useServicoData = () => {
  // ============================================
  // CONFIGURAÇÕES - Edite aqui
  // ============================================
  const WHATSAPP_NUMBER = '5511983586611'
  const COMPANY_NAME = 'AD Telas e Redes'
  const GOOGLE_REVIEWS_URL = 'https://www.google.com/search?sca_esv=59de4d94fc229621&sxsrf=ADLYWIIjEuoUVhAIFwXy5vUQP17RrHg2ig:1729605268236&kgmid=/g/11rnbd2wmb&q=AD+TELAS+MOSQUITEIRAS&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5e4e7713d87c37c6&zx=1768571227913&no_sw_cr=1#lrd=0x94ce595a4d5fb92b:0xe81c9935ae058bde,1,,,,'
  
  // ============================================
  // DADOS DOS SERVIÇOS
  // ============================================
  const servicos = [
    {
      slug: 'rede-protecao',
      titulo: 'Rede de Proteção para Janelas e Sacadas',
      subtitulo: 'Segurança para crianças e pets',
      destaque: 'Resiste até 500kg',
      descricaoCurta: 'Proteção contra quedas e intrusões',
      descricaoCompleta: 'Nossa rede de proteção é fabricada com fios de polietileno de alta resistência, suportando até 500kg. Ideal para famílias com crianças pequenas e pets, oferece segurança total em janelas, sacadas e varandas.',
      imagem: '/images/familia.png', // Card principal
      imagemHero: '/images/familia.png', // Hero da página
      imagemDemo: '/images/protecaoinfantil.jpeg', // Seção demo
      
      // Benefícios principais (4 cards)
      beneficios: [
        {
          icone: 'shield',
          titulo: 'Resiste Chuva e Sol',
          descricao: 'Material UV resistente, não desbota nem resseca'
        },
        {
          icone: 'clock',
          titulo: 'Instalação em 48h',
          descricao: 'Agendamento rápido, instalação profissional'
        },
        {
          icone: 'check',
          titulo: 'Fácil de Limpar',
          descricao: 'Manutenção simples com água e sabão neutro'
        },
        {
          icone: 'award',
          titulo: 'Encaixe Perfeito',
          descricao: 'Medição precisa, acabamento impecável'
        }
      ],
      
      // Especificações técnicas
      especificacoes: [
        { label: 'Material', valor: 'Polietileno de alta resistência' },
        { label: 'Resistência', valor: 'Até 500kg' },
        { label: 'Garantia', valor: '2 anos' },
        { label: 'Malha', valor: '3x3cm ou 5x5cm' },
        { label: 'Cores', valor: 'Branca, preta, verde' },
        { label: 'Instalação', valor: '48h após medição' }
      ],
      
      // Comparação com concorrentes
      comparacao: {
        nos: ['Garantia 2 anos', 'Instalação 48h', 'Material premium', 'Suporte 500kg', 'Certificado INMETRO'],
        concorrentes: ['Garantia 6 meses', 'Instalação 7-15 dias', 'Material padrão', 'Suporte 300kg', 'Sem certificação']
      },
      
      // Cases específicos
      cases: [
        {
          cliente: 'Família Silva',
          local: 'Moema - SP',
          problema: 'Apartamento 8º andar com criança de 3 anos',
          solucao: 'Instalação de rede em 3 janelas e sacada',
          resultado: 'Tranquilidade total para os pais'
        },
        {
          cliente: 'Casal com 2 gatos',
          local: 'Vila Mariana - SP',
          problema: 'Gatos tentando pular da janela',
          solucao: 'Rede de proteção em todas as janelas',
          resultado: 'Pets seguros, donos tranquilos'
        }
      ],
      
      // FAQ específica
      faq: [
        {
          pergunta: 'A rede suporta o peso de um adulto?',
          resposta: 'Sim! Nossa rede suporta até 500kg, muito além do peso de um adulto. É testada e certificada pelo INMETRO.'
        },
        {
          pergunta: 'A rede estraga com chuva e sol?',
          resposta: 'Não! O material é tratado com proteção UV e resistente à água. Garantimos 2 anos contra desgaste natural.'
        },
        {
          pergunta: 'Quanto tempo demora a instalação?',
          resposta: 'Após a medição, instalamos em até 48h. O processo de instalação leva de 2 a 4 horas dependendo do tamanho.'
        },
        {
          pergunta: 'Posso escolher a cor da rede?',
          resposta: 'Sim! Oferecemos branca (mais comum), preta e verde. A cor não afeta a resistência.'
        },
        {
          pergunta: 'A rede atrapalha a vista da janela?',
          resposta: 'Muito pouco! A malha é discreta e após alguns dias você nem percebe que está lá.'
        }
      ],
      
      // Palavras-chave SEO
      keywords: ['rede de proteção', 'proteção janela', 'segurança criança', 'proteção pet', 'rede sacada'],
      
      // Meta tags
      metaTitle: 'Rede de Proteção em São Paulo | Instalação 48h | AD Telas',
      metaDescription: 'Rede de proteção para janelas e sacadas. Resiste até 500kg. Instalação em 48h. Garantia 2 anos. Proteja sua família e pets. Orçamento grátis!'
    },
    
    {
      slug: 'tela-mosquiteira',
      titulo: 'Tela Mosquiteira Invisível',
      subtitulo: 'Proteção contra dengue e mosquitos',
      destaque: 'Visão 100% clara',
      descricaoCurta: 'Transparência total, proteção máxima',
      descricaoCompleta: 'Tela mosquiteira de alta tecnologia com 85% de transparência. Protege contra mosquitos transmissores de dengue, zika e chikungunya sem comprometer a vista ou ventilação.',
      imagem: '/images/TELA_MOSQUITEIRA.png', // Card principal
      imagemHero: '/images/TELA_MOSQUITEIRA.png', // Hero da página
      imagemDemo: '/images/tela_proteção_servico.png', // Seção demo
      
      // Benefícios principais (4 cards)
      beneficios: [
        {
          icone: 'eye',
          titulo: 'Visão 100% Clara',
          descricao: '85% de transparência, não atrapalha a vista'
        },
        {
          icone: 'bug',
          titulo: 'Anti-Dengue/Zika',
          descricao: 'Bloqueia mosquitos transmissores de doenças'
        },
        {
          icone: 'wind',
          titulo: 'Ventilação Total',
          descricao: 'Ar circula livremente, sem abafar'
        },
        {
          icone: 'sparkles',
          titulo: 'Fácil Limpeza',
          descricao: 'Passa pano úmido, fica como nova'
        }
      ],
      
      // Especificações técnicas
      especificacoes: [
        { label: 'Material', valor: 'Fibra de vidro revestida' },
        { label: 'Transparência', valor: '85%' },
        { label: 'Garantia', valor: '2 anos' },
        { label: 'Malha', valor: '1x1mm (micro)' },
        { label: 'Cores', valor: 'Cinza escuro (invisível)' },
        { label: 'Instalação', valor: '48h após medição' }
      ],
      
      // Comparação com concorrentes
      comparacao: {
        nos: ['Transparência 85%', 'Instalação 48h', 'Malha micro 1mm', 'Não oxida', 'Garantia 2 anos'],
        concorrentes: ['Transparência 60%', 'Instalação 7-15 dias', 'Malha 2mm', 'Oxida com tempo', 'Garantia 6 meses']
      },
      
      // Cases específicos
      cases: [
        {
          cliente: 'Família Oliveira',
          local: 'Tatuapé - SP',
          problema: 'Surto de dengue no bairro, medo de mosquitos',
          solucao: 'Tela mosquiteira em todas as janelas',
          resultado: 'Zero picadas, casa ventilada'
        },
        {
          cliente: 'Apartamento térreo',
          local: 'Ipiranga - SP',
          problema: 'Muitos insetos entrando à noite',
          solucao: 'Tela mosquiteira com abertura lateral',
          resultado: 'Noites tranquilas sem mosquitos'
        }
      ],
      
      // FAQ específica
      faq: [
        {
          pergunta: 'A tela realmente não atrapalha a vista?',
          resposta: 'Sim! Com 85% de transparência, você praticamente não percebe que ela está lá. É muito mais discreta que telas comuns.'
        },
        {
          pergunta: 'Bloqueia todos os tipos de mosquitos?',
          resposta: 'Sim! A malha de 1x1mm bloqueia até os menores mosquitos, incluindo Aedes aegypti (dengue), pernilongos e borrachudos.'
        },
        {
          pergunta: 'A tela diminui a ventilação?',
          resposta: 'Não! A malha é projetada para permitir circulação total do ar. Você não sentirá diferença na ventilação.'
        },
        {
          pergunta: 'Como limpar a tela?',
          resposta: 'Muito fácil! Basta passar um pano úmido com água e sabão neutro. Recomendamos limpeza mensal.'
        },
        {
          pergunta: 'A tela oxida ou estraga com o tempo?',
          resposta: 'Não! O material é fibra de vidro revestida, não oxida. Garantimos 2 anos contra desgaste.'
        }
      ],
      
      // Palavras-chave SEO
      keywords: ['tela mosquiteira', 'proteção dengue', 'tela invisível', 'anti mosquito', 'tela janela'],
      
      // Meta tags
      metaTitle: 'Tela Mosquiteira Invisível em São Paulo | Anti-Dengue | AD Telas',
      metaDescription: 'Tela mosquiteira com 85% transparência. Proteção contra dengue, zika e mosquitos. Instalação 48h. Garantia 2 anos. Orçamento grátis!'
    }
  ]
  
  // ============================================
  // MÉTODOS
  // ============================================
  
  /**
   * Busca serviço por slug
   */
  const getServicoBySlug = (slug) => {
    return servicos.find(s => s.slug === slug)
  }
  
  /**
   * Retorna todos os serviços
   */
  const getAllServicos = () => {
    return servicos
  }
  
  /**
   * Gera mensagem WhatsApp para serviço específico
   */
  const getWhatsAppMessage = (servico, origem = 'card') => {
    let message = `Olá! Vim pelo site e gostaria de um orçamento para:\n\n`
    message += `📋 Serviço: ${servico.titulo}\n`
    message += `📍 Origem: ${origem}\n\n`
    message += `Pode me passar mais informações?`
    
    return encodeURIComponent(message)
  }
  
  /**
   * Gera URL WhatsApp completa
   */
  const getWhatsAppUrl = (servico, origem = 'card') => {
    const message = getWhatsAppMessage(servico, origem)
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`
  }
  
  // ============================================
  // RETORNO
  // ============================================
  return {
    servicos,
    getServicoBySlug,
    getAllServicos,
    getWhatsAppMessage,
    getWhatsAppUrl,
    WHATSAPP_NUMBER,
    COMPANY_NAME,
    GOOGLE_REVIEWS_URL
  }
}

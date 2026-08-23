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
      destaque: 'Sob medida',
      descricaoCurta: 'Proteção para janelas, sacadas e varandas',
      descricaoCompleta: 'Nossa rede de proteção é instalada sob medida para o vão de sua janela ou sacada. Ideal para famílias com crianças e pets, oferece mais segurança em janelas, sacadas e varandas.',
      imagem: '/images/familia.png', // Card principal
      imagemHero: '/images/familia.png', // Hero da página
      imagemDemo: '/images/protecaoinfantil.jpeg', // Seção demo
      
      // Benefícios principais (4 cards)
      beneficios: [
        {
          icone: 'shield',
          titulo: 'Proteção Sob Medida',
          descricao: 'Instalação adequada para o vão da sua janela ou sacada'
        },
        {
          icone: 'clock',
          titulo: 'Atendimento em SP',
          descricao: 'Agendamento e medição no local'
        },
        {
          icone: 'check',
          titulo: 'Fácil Manutenção',
          descricao: 'Manutenção simples com água e sabão neutro'
        },
        {
          icone: 'award',
          titulo: 'Gatos e pets protegidos',
          descricao: 'Prevenção contra acidentes em vãos externos'
        }
      ],
      
      // Especificações técnicas
      especificacoes: [
        { label: 'Material', valor: 'Rede de proteção sob medida' },
        { label: 'Fixação', valor: 'Pontos de ancoragem no vão' },
        { label: 'Garantia', valor: '2 anos' },
        { label: 'Instalação', valor: 'Agendamento rápido' }
      ],
      
      // Comparação com concorrentes
      comparacao: {
        nos: ['Garantia 2 anos', 'Instalação agendada', 'Material de qualidade', 'Atendimento sob medida', 'Instalação profissional'],
        concorrentes: ['Sem garantia formal', 'Demora no atendimento', 'Material comum', 'Sem medição local', 'Sem instalação sob medida']
      },
      
      // Cases específicos
      cases: [
        {
          cliente: 'Família em Moema',
          local: 'Moema - SP',
          problema: 'Janelas e sacada precisando de proteção para pets',
          solucao: 'Instalação de rede de proteção sob medida em todas as janelas',
          resultado: 'Ambiente seguro para a família'
        }
      ],
      
      // FAQ específica
      faq: [
        {
          pergunta: 'A rede de proteção aguenta o uso no dia a dia?',
          resposta: 'Sim! Nossa rede é dimensionada sob medida para a estrutura do seu imóvel e instalada por profissionais capacitados.'
        },
        {
          pergunta: 'Precisa de manutenção com sol e chuva?',
          resposta: 'A manutenção básica requer apenas limpeza periódica. Garantimos 2 anos contra defeitos de instalação.'
        },
        {
          pergunta: 'Quanto tempo demora a instalação?',
          resposta: 'Após a medição no local, a instalação é realizada na data combinada.'
        },
        {
          pergunta: 'Posso escolher a cor da rede?',
          resposta: 'Sim! Oferecemos branca (mais comum), preta e verde.'
        },
        {
          pergunta: 'A rede atrapalha a vista da janela?',
          resposta: 'Muito pouco! A malha é discreta e após alguns dias você nem percebe que está lá.'
        }
      ],
      
      // Palavras-chave SEO
      keywords: ['rede de proteção', 'proteção janela', 'segurança criança', 'proteção pet', 'rede sacada'],
      
      // Meta tags
      metaTitle: 'Rede de Proteção em São Paulo | Instalação Sob Medida | AD Telas',
      metaDescription: 'Rede de proteção para janelas e sacadas sob medida em SP. Garantia de 2 anos. Proteja sua família e pets. Orçamento grátis!'
    },
    
    {
      slug: 'tela-mosquiteira',
      titulo: 'Tela Mosquiteira Invisível',
      subtitulo: 'Proteção contra dengue e mosquitos',
      destaque: 'Visão 100% clara',
      descricaoCurta: 'Transparência total, proteção máxima',
      descricaoCompleta: 'Tela mosquiteira de alta tecnologia com 85% de transparência. Protege contra mosquitos transmissores de dengue, zika e chikungunya sem comprometer a vista ou ventilação.',
      imagem: '/images/tela_mosquiteira.png', // Card principal
      imagemHero: '/images/tela_mosquiteira.png', // Hero da página
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
        { label: 'Instalação', valor: '24h após medição' }
      ],
      
      // Comparação com concorrentes
      comparacao: {
        nos: ['Transparência 85%', 'Instalação 24h', 'Malha micro 1mm', 'Não oxida', 'Garantia 2 anos'],
        concorrentes: ['Transparência 60%', 'Instalação 7-15 dias', 'Malha 2mm', 'Oxida com tempo', 'Garantia 6 meses']
      },
      
      // Cases específicos
      cases: [
        {
          cliente: 'Família Oliveira',
          local: 'Tatuapé - SP',
          problema: 'Surto de dengue na região, medo de mosquitos',
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
      metaDescription: 'Tela mosquiteira com 85% transparência. Proteção contra dengue, zika e mosquitos. Instalação 24h. Garantia 2 anos. Orçamento grátis!'
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
    let message = `Olá! Vim pelo site https://www.adtelasmosquiteiras.com.br e gostaria de um orçamento para:\n\n`
    message += `Serviço: ${servico.titulo}\n`
    message += `Origem: ${origem}\n\n`
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

/**
 * Dados únicos por bairro para páginas de landing SEO
 * Cada bairro tem características locais que enriquecem o conteúdo
 */

const BAIRROS_DATA = {
  'itaim-bibi': {
    nome: 'Itaim Bibi',
    cidade: 'São Paulo',
    descricao: 'bairro nobre com intensa vida urbana, restaurantes, escritórios e residências de alto padrão',
    areasVerdes: ['Parque do Povo', 'Parque Burle Marx'],
    caracteristicas: [
      'Bairro com alta densidade de apartamentos e coberturas',
      'Próximo ao Parque do Povo e Parque Burle Marx — áreas verdes que atraem insetos',
      'Região com muitos restaurantes e estabelecimentos comerciais',
      'Alta concentração de pets em condomínios',
    ],
    beneficiosMosquiteira: 'Com o Parque do Povo e o Parque Burle Marx nas proximidades, o Itaim Bibi tem grande presença de mosquitos e insetos vindos das áreas verdes. Telas mosquiteiras são essenciais para aproveitar as varandas e janelas sem incômodos.',
    beneficiosRede: 'Os edifícios de alto padrão do Itaim Bibi exigem proteção de qualidade para crianças e pets. Redes de proteção garantem segurança nas sacadas e janelas dos apartamentos.',
    faq: [
      { q: 'Vocês atendem condomínios no Itaim Bibi?', r: 'Sim! Atendemos tanto apartamentos quanto casas no Itaim Bibi. Trabalhamos com síndicos e moradores, com instalação discreta e sem danos à estrutura.' },
      { q: 'Quanto tempo leva a instalação no Itaim Bibi?', r: 'A maioria das instalações é concluída em 1 dia. Fazemos a medição e retornamos com o material pronto para instalação.' },
      { q: 'As telas funcionam para os mosquitos da região do Parque do Povo?', r: 'Sim! Nossas telas têm malha fina que bloqueia mosquitos, pernilongos e outros insetos comuns em regiões próximas a parques e áreas verdes.' },
    ],
  },
  'pinheiros': {
    nome: 'Pinheiros',
    cidade: 'São Paulo',
    descricao: 'bairro boêmio e cultural, com casas, apartamentos e intensa vida noturna',
    areasVerdes: ['Parque Augusta', 'Rio Pinheiros'],
    caracteristicas: [
      'Bairro com mix de casas antigas e novos empreendimentos',
      'Próximo ao Rio Pinheiros — fonte de mosquitos e pernilongos',
      'Região com muitos bares, restaurantes e vida noturna',
      'Alta concentração de pets e crianças em residências',
    ],
    beneficiosMosquiteira: 'A proximidade com o Rio Pinheiros torna o bairro uma das regiões com maior incidência de mosquitos e pernilongos em São Paulo. Telas mosquiteiras são indispensáveis para dormir e viver com conforto em Pinheiros.',
    beneficiosRede: 'As casas e sobrados de Pinheiros têm características únicas que exigem soluções personalizadas de proteção. Nossas redes se adaptam a qualquer tipo de abertura.',
    faq: [
      { q: 'Vocês atendem casas antigas em Pinheiros?', r: 'Sim! Temos experiência com as janelas e portas características das casas antigas de Pinheiros, com soluções que não danificam a estrutura original.' },
      { q: 'Os mosquitos do Rio Pinheiros são um problema real?', r: 'Sim, a região próxima ao rio tem alta incidência de mosquitos, especialmente no verão. Nossas telas bloqueiam 100% dos insetos.' },
      { q: 'Atendem apartamentos no Pinheiros também?', r: 'Claro! Atendemos tanto casas quanto apartamentos em todo o bairro de Pinheiros e região.' },
    ],
  },
  'vila-olimpia': {
    nome: 'Vila Olímpia',
    cidade: 'São Paulo',
    descricao: 'bairro moderno e corporativo, com arranha-céus, shoppings e residências de luxo',
    areasVerdes: ['Parque do Povo', 'Parque Burle Marx'],
    caracteristicas: [
      'Bairro com alta concentração de edifícios corporativos e residenciais',
      'Próximo ao Parque do Povo — área verde que atrai insetos',
      'Região com muitos condomínios de alto padrão',
      'Alta demanda por proteção em sacadas e coberturas',
    ],
    beneficiosMosquiteira: 'A Vila Olímpia, apesar de moderna e urbanizada, sofre com insetos vindos do Parque do Povo e das margens do Rio Pinheiros. Telas mosquiteiras garantem conforto nas varandas dos apartamentos de alto padrão.',
    beneficiosRede: 'Os edifícios modernos da Vila Olímpia têm sacadas amplas e janelas grandes. Redes de proteção discretas e de alta qualidade são a solução ideal para manter a estética sem abrir mão da segurança.',
    faq: [
      { q: 'Vocês trabalham com condomínios de alto padrão na Vila Olímpia?', r: 'Sim! Temos experiência com os principais condomínios da Vila Olímpia. Usamos materiais premium e instalação discreta.' },
      { q: 'As redes afetam a estética do apartamento?', r: 'Não! Nossas redes são praticamente invisíveis e não comprometem a vista ou a estética do imóvel.' },
      { q: 'Atendem coberturas na Vila Olímpia?', r: 'Sim! Temos soluções específicas para coberturas, incluindo redes para áreas externas amplas.' },
    ],
  },
  'butanta': {
    nome: 'Butantã',
    cidade: 'São Paulo',
    descricao: 'bairro residencial próximo à USP, com casas, apartamentos e muitas áreas verdes',
    areasVerdes: ['Campus USP', 'Parque Estadual da Cantareira (proximidades)', 'Rio Pinheiros'],
    caracteristicas: [
      'Bairro com grande área verde do campus da USP',
      'Próximo ao Rio Pinheiros — alta incidência de mosquitos',
      'Região residencial com muitas casas e sobrados',
      'Comunidade universitária com alta demanda por conforto',
    ],
    beneficiosMosquiteira: 'O Butantã é cercado por áreas verdes — o campus da USP e as margens do Rio Pinheiros são fontes constantes de mosquitos e insetos. Telas mosquiteiras são essenciais para moradores da região.',
    beneficiosRede: 'As casas e sobrados do Butantã têm características que pedem proteção personalizada. Nossas redes se adaptam a janelas, portas e sacadas de qualquer tamanho.',
    faq: [
      { q: 'O campus da USP aumenta a quantidade de insetos no Butantã?', r: 'Sim! As áreas verdes extensas do campus são habitat natural de mosquitos e outros insetos. Nossas telas bloqueiam todos eles.' },
      { q: 'Atendem a região do Rio Pequeno e Raposo Tavares também?', r: 'Sim! Atendemos todo o distrito do Butantã, incluindo Rio Pequeno, Raposo Tavares e regiões vizinhas.' },
      { q: 'Quanto custa uma tela mosquiteira para janela no Butantã?', r: 'O valor varia conforme o tamanho e modelo. Entre em contato para um orçamento gratuito e personalizado.' },
    ],
  },
  'jardim-paulista': {
    nome: 'Jardim Paulista',
    cidade: 'São Paulo',
    descricao: 'bairro nobre e residencial, com mansões, apartamentos de luxo e ruas arborizadas',
    areasVerdes: ['Parque Trianon', 'Parque Siqueira Campos', 'Jardim Europa'],
    caracteristicas: [
      'Bairro com ruas extremamente arborizadas',
      'Próximo ao Parque Trianon e Parque Siqueira Campos',
      'Alta concentração de residências de alto padrão',
      'Muitos pets e crianças em apartamentos e casas',
    ],
    beneficiosMosquiteira: 'As ruas arborizadas e a proximidade com o Parque Trianon fazem do Jardim Paulista uma região com alta presença de insetos. Telas mosquiteiras permitem aproveitar as janelas abertas sem incômodos.',
    beneficiosRede: 'Os apartamentos e mansões do Jardim Paulista exigem proteção de alto padrão. Nossas redes são discretas, resistentes e se integram perfeitamente à arquitetura sofisticada do bairro.',
    faq: [
      { q: 'Vocês atendem mansões e casas grandes no Jardim Paulista?', r: 'Sim! Temos experiência com projetos de grande porte, incluindo mansões com múltiplas aberturas.' },
      { q: 'As árvores do bairro atraem mais insetos?', r: 'Sim! Bairros muito arborizados como o Jardim Paulista têm maior diversidade de insetos. Nossas telas protegem contra todos eles.' },
      { q: 'Trabalham com materiais premium para imóveis de alto padrão?', r: 'Sim! Oferecemos telas em alumínio, aço inox e outros materiais premium para imóveis de alto padrão.' },
    ],
  },
  'jardim-bonfiglioli': {
    nome: 'Jardim Bonfiglioli',
    cidade: 'São Paulo',
    descricao: 'bairro residencial tranquilo na Zona Oeste, com casas e apartamentos familiares',
    areasVerdes: ['Parque Estadual da Cantareira (proximidades)', 'Áreas verdes do Butantã'],
    caracteristicas: [
      'Bairro residencial familiar com muitas casas',
      'Região com boa arborização urbana',
      'Próximo a áreas verdes da Zona Oeste',
      'Alta demanda por proteção para crianças e pets',
    ],
    beneficiosMosquiteira: 'O Jardim Bonfiglioli, com suas ruas arborizadas e casas com jardins, é um ambiente propício para mosquitos. Telas mosquiteiras garantem conforto para toda a família.',
    beneficiosRede: 'As casas do Jardim Bonfiglioli têm janelas e portas que pedem proteção personalizada. Nossas redes são instaladas sem danos à estrutura e com garantia de 2 anos.',
    faq: [
      { q: 'Atendem casas com jardim no Jardim Bonfiglioli?', r: 'Sim! Casas com jardim têm maior exposição a insetos. Temos soluções para janelas, portas e áreas externas.' },
      { q: 'Quanto tempo leva a instalação em uma casa?', r: 'Depende do número de aberturas. Uma casa média é instalada em 1 dia.' },
      { q: 'As telas funcionam para pernilongos?', r: 'Sim! Nossa malha fina bloqueia pernilongos, mosquitos da dengue e outros insetos pequenos.' },
    ],
  },
  'jardim-das-vertentes': {
    nome: 'Jardim das Vertentes',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Oeste com casas e apartamentos próximos a áreas verdes',
    areasVerdes: ['Parque Estadual da Cantareira', 'Áreas verdes do Butantã'],
    caracteristicas: [
      'Bairro com boa arborização e áreas verdes próximas',
      'Região residencial familiar',
      'Próximo a parques e reservas da Zona Oeste',
      'Alta demanda por proteção residencial',
    ],
    beneficiosMosquiteira: 'A proximidade com áreas verdes e a arborização do Jardim das Vertentes criam um ambiente favorável para mosquitos. Telas mosquiteiras são a solução ideal para o conforto da família.',
    beneficiosRede: 'As residências do Jardim das Vertentes se beneficiam de redes de proteção para crianças e pets, especialmente em casas com múltiplos andares.',
    faq: [
      { q: 'Atendem o Jardim das Vertentes e região?', r: 'Sim! Atendemos todo o Jardim das Vertentes e bairros vizinhos na Zona Oeste.' },
      { q: 'Vocês fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso. Entre em contato pelo WhatsApp.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
    ],
  },
  'jardim-monte-kemel': {
    nome: 'Jardim Monte Kemel',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul com casas familiares e boa arborização',
    areasVerdes: ['Parque Estadual da Cantareira (proximidades)', 'Áreas verdes da Zona Sul'],
    caracteristicas: [
      'Bairro residencial com muitas casas e sobrados',
      'Boa arborização urbana',
      'Região familiar com crianças e pets',
      'Próximo a áreas verdes da Zona Sul',
    ],
    beneficiosMosquiteira: 'O Jardim Monte Kemel, com sua arborização e casas com quintais, é uma região com presença constante de mosquitos. Telas mosquiteiras garantem noites tranquilas para toda a família.',
    beneficiosRede: 'As casas do Jardim Monte Kemel têm características que pedem proteção para crianças e pets. Nossas redes são instaladas com rapidez e garantia.',
    faq: [
      { q: 'Atendem o Jardim Monte Kemel?', r: 'Sim! Atendemos o Jardim Monte Kemel e toda a região sul de São Paulo.' },
      { q: 'Vocês instalam em casas com quintal?', r: 'Sim! Temos soluções para janelas, portas e áreas externas de casas com quintal.' },
      { q: 'As redes são resistentes para pets?', r: 'Sim! Temos redes específicas para pets, com malha mais resistente a arranhões e mordidas.' },
    ],
  },
  'vila-sonia': {
    nome: 'Vila Sônia',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Oeste com casas, apartamentos e boa qualidade de vida',
    areasVerdes: ['Parque Estadual da Cantareira (proximidades)', 'Áreas verdes do Butantã'],
    caracteristicas: [
      'Bairro residencial com mix de casas e apartamentos',
      'Boa arborização e qualidade de vida',
      'Próximo ao metrô e com fácil acesso',
      'Alta demanda por proteção residencial',
    ],
    beneficiosMosquiteira: 'A Vila Sônia, com suas ruas arborizadas e casas com jardins, é uma região propícia para mosquitos. Telas mosquiteiras garantem conforto sem abrir mão da ventilação natural.',
    beneficiosRede: 'Os apartamentos e casas da Vila Sônia se beneficiam de redes de proteção de qualidade. Instalação rápida e garantia de 2 anos.',
    faq: [
      { q: 'Atendem a Vila Sônia e região?', r: 'Sim! Atendemos toda a Vila Sônia e bairros vizinhos na Zona Oeste.' },
      { q: 'Vocês trabalham com apartamentos pequenos?', r: 'Sim! Temos soluções para todos os tamanhos de apartamento, desde studios até coberturas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos contra defeitos de fabricação.' },
    ],
  },
}

// Slug normalizer
export function slugify(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function useBairroLanding(slug) {
  const data = BAIRROS_DATA[slug] || null
  return { data }
}

export { BAIRROS_DATA }

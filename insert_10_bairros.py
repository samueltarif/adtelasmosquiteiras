# -*- coding: utf-8 -*-
novos_bairros = '''
  'vila-formosa': {
    nome: 'Vila Formosa',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste, com casas familiares e boa arborização urbana',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córrego Vila Formosa', 'Áreas verdes da Zona Leste'],
    caracteristicas: [
      'Bairro residencial com muitas casas e sobrados familiares',
      'Córrego Vila Formosa aumenta a umidade e os mosquitos',
      'Boa arborização urbana nas ruas principais',
      'Alta demanda por proteção para famílias com crianças e pets',
    ],
    beneficiosMosquiteira: 'A Vila Formosa tem córregos e ruas arborizadas que favorecem a proliferação de mosquitos. Telas mosquiteiras garantem noites tranquilas para toda a família.',
    beneficiosRede: 'As casas da Vila Formosa têm características que pedem proteção personalizada para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem a Vila Formosa e região?', r: 'Sim! Atendemos toda a Vila Formosa e bairros vizinhos na Zona Leste.' },
      { q: 'Vocês instalam em casas com quintal?', r: 'Sim! Temos soluções para janelas, portas e áreas externas de casas com quintal.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
    ],
  },
  'cursino': {
    nome: 'Cursino',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul, com casas e sobrados próximos ao Parque do Estado e à Represa Guarapiranga',
    areasVerdes: ['Parque do Estado (proximidades)', 'Represa Guarapiranga (proximidades)', 'Córrego do Cursino'],
    caracteristicas: [
      'Bairro próximo ao Parque do Estado — grande área verde com fauna local',
      'Córrego do Cursino é criadouro natural de mosquitos',
      'Região residencial com casas e sobrados familiares',
      'Alta umidade favorece proliferação de pernilongos',
    ],
    beneficiosMosquiteira: 'O Cursino tem o Córrego do Cursino e a proximidade com o Parque do Estado, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores da região.',
    beneficiosRede: 'As casas do Cursino têm janelas e varandas que pedem proteção personalizada. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Córrego do Cursino aumenta os mosquitos no bairro?', r: 'Sim! Córregos e áreas úmidas são criadouros naturais de mosquitos.' },
      { q: 'Atendem o Cursino?', r: 'Sim! Atendemos o Cursino e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'saude-zona-sul': {
    nome: 'Saúde',
    cidade: 'São Paulo',
    descricao: 'bairro residencial tranquilo na Zona Sul, com casas e apartamentos próximos ao Parque do Ibirapuera',
    areasVerdes: ['Parque do Ibirapuera (proximidades)', 'Parque Estadual das Fontes do Ipiranga', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro próximo ao Parque do Ibirapuera — maior parque urbano de SP',
      'Ruas extremamente arborizadas com árvores centenárias',
      'Alta concentração de apartamentos e casas de médio e alto padrão',
      'Microclima úmido favorece proliferação de mosquitos',
    ],
    beneficiosMosquiteira: 'A Saúde tem a proximidade com o Ibirapuera e ruas com arborização densa, criando um microclima úmido favorável a mosquitos. Telas mosquiteiras são indispensáveis para os moradores.',
    beneficiosRede: 'Os apartamentos e casas da Saúde têm varandas e janelas que pedem proteção de qualidade. Instalação discreta com garantia de 2 anos.',
    faq: [
      { q: 'O Parque do Ibirapuera atrai mosquitos para o bairro Saúde?', r: 'Sim! Grandes parques urbanos são habitat natural de mosquitos, especialmente no verão.' },
      { q: 'Atendem o bairro Saúde?', r: 'Sim! Atendemos o bairro Saúde e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
    ],
  },
  'vila-andrade': {
    nome: 'Vila Andrade',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul, com condomínios fechados e casas próximas ao Parque Estadual da Cantareira',
    areasVerdes: ['Parque Estadual do Jaraguá (proximidades)', 'Represa Guarapiranga', 'Áreas verdes da Zona Sul'],
    caracteristicas: [
      'Bairro com muitos condomínios fechados e casas de alto padrão',
      'Proximidade com a Represa Guarapiranga aumenta mosquitos',
      'Região com muita vegetação e áreas verdes',
      'Alta demanda por proteção em condomínios e casas',
    ],
    beneficiosMosquiteira: 'A Vila Andrade tem a Represa Guarapiranga nas proximidades e muita vegetação, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores de condomínios e casas da região.',
    beneficiosRede: 'Os condomínios e casas de alto padrão da Vila Andrade se beneficiam de redes de proteção discretas e elegantes. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Represa Guarapiranga aumenta os mosquitos na Vila Andrade?', r: 'Sim! Represas e áreas úmidas são criadouros naturais de mosquitos.' },
      { q: 'Atendem condomínios fechados na Vila Andrade?', r: 'Sim! Atendemos condomínios e casas de todos os padrões.' },
      { q: 'Vocês fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'campo-belo-zona-sul': {
    nome: 'Campo Belo',
    cidade: 'São Paulo',
    descricao: 'bairro nobre na Zona Sul, com apartamentos de alto padrão e ruas arborizadas próximas ao Aeroporto de Congonhas',
    areasVerdes: ['Parque do Ibirapuera (proximidades)', 'Ruas arborizadas do Campo Belo', 'Córrego Campo Belo'],
    caracteristicas: [
      'Bairro nobre com apartamentos e casas de alto padrão',
      'Ruas extremamente arborizadas com árvores centenárias',
      'Córrego Campo Belo é criadouro natural de mosquitos',
      'Alta concentração de famílias com crianças e pets',
    ],
    beneficiosMosquiteira: 'O Campo Belo tem ruas arborizadas e o Córrego Campo Belo que favorecem a proliferação de mosquitos. Moradores de alto padrão valorizam telas discretas e eficientes.',
    beneficiosRede: 'Os apartamentos e casas de alto padrão do Campo Belo têm sacadas e janelas amplas que pedem proteção sofisticada. Nossas redes são discretas e elegantes.',
    faq: [
      { q: 'O Córrego Campo Belo aumenta os mosquitos no bairro?', r: 'Sim! Córregos e áreas úmidas são criadouros naturais de mosquitos.' },
      { q: 'Atendem edifícios de alto padrão no Campo Belo?', r: 'Sim! Temos soluções discretas e elegantes para edifícios de alto padrão.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
    ],
  },
  'vila-mariana': {
    nome: 'Vila Mariana',
    cidade: 'São Paulo',
    descricao: 'bairro residencial e universitário na Zona Sul, com ruas arborizadas e boa infraestrutura próximo ao Metrô',
    areasVerdes: ['Parque do Ibirapuera (proximidades)', 'Parque Aclimação (proximidades)', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro próximo ao Parque do Ibirapuera — maior parque urbano de SP',
      'Ruas extremamente arborizadas com árvores centenárias',
      'Alta concentração de apartamentos e estudantes universitários',
      'Microclima úmido favorece proliferação de mosquitos',
    ],
    beneficiosMosquiteira: 'A Vila Mariana tem a proximidade com o Ibirapuera e ruas com arborização densa. Telas mosquiteiras são indispensáveis para apartamentos e casas da região.',
    beneficiosRede: 'Os apartamentos da Vila Mariana têm varandas e janelas que pedem proteção de qualidade. Instalação discreta com garantia de 2 anos.',
    faq: [
      { q: 'O Parque do Ibirapuera atrai mosquitos para a Vila Mariana?', r: 'Sim! Grandes parques urbanos são habitat natural de mosquitos, especialmente no verão.' },
      { q: 'Atendem a Vila Mariana?', r: 'Sim! Atendemos a Vila Mariana e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'mooca-zona-leste': {
    nome: 'Mooca',
    cidade: 'São Paulo',
    descricao: 'bairro histórico na Zona Leste, com casas italianas, sobrados e novos condomínios próximos ao Rio Tamanduateí',
    areasVerdes: ['Parque da Mooca', 'Rio Tamanduateí (proximidades)', 'Áreas verdes da Zona Leste'],
    caracteristicas: [
      'Bairro histórico com casas italianas e sobrados antigos',
      'Rio Tamanduateí nas proximidades é criadouro de mosquitos',
      'Parque da Mooca aumenta a presença de insetos',
      'Mix de residências antigas e novos condomínios',
    ],
    beneficiosMosquiteira: 'A Mooca tem o Rio Tamanduateí e o Parque da Mooca que favorecem a proliferação de mosquitos. Telas mosquiteiras são essenciais para as casas históricas e novos condomínios do bairro.',
    beneficiosRede: 'As casas históricas e os novos condomínios da Mooca se beneficiam de redes de proteção personalizadas. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Rio Tamanduateí aumenta os mosquitos na Mooca?', r: 'Sim! Rios e áreas úmidas são criadouros naturais de mosquitos.' },
      { q: 'Atendem casas históricas na Mooca?', r: 'Sim! Temos experiência com instalações em casas históricas sem danificar a estrutura.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
    ],
  },
  'bela-vista-centro': {
    nome: 'Bela Vista',
    cidade: 'São Paulo',
    descricao: 'bairro boêmio no centro de São Paulo, conhecido pela Rua 13 de Maio e pela comunidade italiana do Bixiga',
    areasVerdes: ['Parque Trianon (proximidades)', 'Parque Siqueira Campos', 'Ruas arborizadas do Bixiga'],
    caracteristicas: [
      'Bairro central com alta densidade urbana e edifícios antigos',
      'Proximidade com o Parque Trianon aumenta a presença de insetos',
      'Muitos restaurantes e bares com áreas abertas',
      'Edifícios residenciais antigos com janelas que precisam de adaptação',
    ],
    beneficiosMosquiteira: 'A Bela Vista, com sua localização central e proximidade ao Parque Trianon, tem alta incidência de mosquitos. Telas mosquiteiras são especialmente importantes nos edifícios mais antigos do bairro.',
    beneficiosRede: 'Os edifícios históricos da Bela Vista têm janelas e varandas que pedem soluções personalizadas. Nossa equipe tem experiência com instalações em prédios antigos.',
    faq: [
      { q: 'Atendem edifícios antigos na Bela Vista?', r: 'Sim! Temos experiência com instalações em prédios antigos, adaptando as telas sem danificar a estrutura.' },
      { q: 'Qual o prazo de instalação na Bela Vista?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Vocês fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'higienopolis': {
    nome: 'Higienópolis',
    cidade: 'São Paulo',
    descricao: 'bairro nobre no centro de São Paulo, com edifícios históricos, museus e ruas extremamente arborizadas',
    areasVerdes: ['Parque Buenos Aires', 'Ruas arborizadas de Higienópolis', 'Parque da Luz (proximidades)'],
    caracteristicas: [
      'Bairro nobre com edifícios históricos e apartamentos de alto padrão',
      'Parque Buenos Aires é área verde com presença de insetos',
      'Ruas extremamente arborizadas com árvores centenárias',
      'Alta concentração de famílias de alto padrão',
    ],
    beneficiosMosquiteira: 'Higienópolis tem o Parque Buenos Aires e ruas com arborização densa, criando um microclima úmido favorável a mosquitos. Moradores de alto padrão valorizam telas discretas e eficientes.',
    beneficiosRede: 'Os edifícios históricos de Higienópolis têm sacadas e janelas amplas que pedem proteção sofisticada. Nossas redes são discretas e não comprometem a estética dos imóveis.',
    faq: [
      { q: 'O Parque Buenos Aires atrai mosquitos para Higienópolis?', r: 'Sim! Parques urbanos são habitat natural de mosquitos, especialmente em dias quentes e úmidos.' },
      { q: 'Atendem edifícios históricos em Higienópolis?', r: 'Sim! Temos soluções discretas e elegantes para edifícios históricos e de alto padrão.' },
      { q: 'As telas alteram a estética do apartamento?', r: 'Não! Nossas telas são instaladas de forma discreta, preservando a estética do imóvel.' },
    ],
  },
  'santana-zona-norte': {
    nome: 'Santana',
    cidade: 'São Paulo',
    descricao: 'bairro residencial e comercial na Zona Norte, com boa infraestrutura e próximo ao Parque Estadual da Cantareira',
    areasVerdes: ['Parque Estadual da Cantareira (proximidades)', 'Parque Estadual Alberto Löfgren', 'Rio Tietê (proximidades)'],
    caracteristicas: [
      'Bairro próximo à Cantareira — maior floresta urbana do mundo',
      'Rio Tietê nas proximidades é criadouro de mosquitos',
      'Região residencial com casas e apartamentos de médio padrão',
      'Alta umidade favorece proliferação de pernilongos',
    ],
    beneficiosMosquiteira: 'Santana tem a Cantareira e o Rio Tietê nas proximidades, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores da região.',
    beneficiosRede: 'As casas e apartamentos de Santana se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Cantareira aumenta os mosquitos em Santana?', r: 'Sim! Estar próximo à maior floresta urbana do mundo aumenta significativamente a presença de mosquitos.' },
      { q: 'Atendem Santana e região?', r: 'Sim! Atendemos Santana e toda a Zona Norte.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
'''

with open('app/composables/useBairroLanding.js', 'r', encoding='utf-8') as f:
    content = f.read()

marker = '\n}\n\n// Slug normalizer'
if marker in content:
    content = content.replace(marker, novos_bairros + '\n}\n\n// Slug normalizer')
    with open('app/composables/useBairroLanding.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK - 10 bairros inseridos')
else:
    print('ERRO - marcador nao encontrado')

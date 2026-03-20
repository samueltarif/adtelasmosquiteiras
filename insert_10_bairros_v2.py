import re

filepath = 'nuxt-app/app/composables/useBairroLanding.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

novos_bairros = """
  'republica': {
    nome: 'República',
    cidade: 'São Paulo',
    descricao: 'bairro central de São Paulo, com grande diversidade cultural, hotéis, comércio e a famosa Praça da República',
    areasVerdes: ['Praça da República', 'Parque Trianon (proximidades)', 'Viaduto do Chá'],
    caracteristicas: [
      'Bairro central com alta densidade urbana e fluxo intenso de pessoas',
      'Praça da República é área verde com presença de insetos',
      'Muitos edifícios residenciais antigos com janelas sem proteção',
      'Proximidade com o centro histórico aumenta a umidade local',
    ],
    beneficiosMosquiteira: 'A República, com a Praça da República e sua localização central, tem alta incidência de mosquitos. Telas mosquiteiras são essenciais nos edifícios mais antigos do bairro.',
    beneficiosRede: 'Os edifícios da República têm sacadas e janelas que pedem proteção. Nossa equipe tem experiência com instalações em prédios antigos do centro.',
    faq: [
      { q: 'Atendem edifícios antigos na República?', r: 'Sim! Temos experiência com instalações em prédios antigos, adaptando as telas sem danificar a estrutura.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Vocês fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'aclimacao': {
    nome: 'Aclimação',
    cidade: 'São Paulo',
    descricao: 'bairro residencial tranquilo no centro-sul de São Paulo, com o famoso Parque da Aclimação e ruas arborizadas',
    areasVerdes: ['Parque da Aclimação', 'Ruas arborizadas da Aclimação', 'Parque do Ibirapuera (proximidades)'],
    caracteristicas: [
      'Parque da Aclimação é grande área verde com lago e muitos insetos',
      'Bairro residencial tranquilo com casas e apartamentos de médio-alto padrão',
      'Ruas arborizadas criam microclima úmido favorável a mosquitos',
      'Proximidade com o Ibirapuera aumenta a biodiversidade local',
    ],
    beneficiosMosquiteira: 'A Aclimação tem o Parque da Aclimação com lago, criando condições ideais para proliferação de mosquitos. Telas mosquiteiras são indispensáveis para os moradores.',
    beneficiosRede: 'As casas e apartamentos da Aclimação se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Parque da Aclimação atrai mosquitos?', r: 'Sim! O lago do parque é habitat natural de mosquitos, especialmente no verão.' },
      { q: 'Atendem a Aclimação?', r: 'Sim! Atendemos a Aclimação e toda a região central-sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-clementino': {
    nome: 'Vila Clementino',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, próximo ao Hospital São Paulo e à Universidade Federal de São Paulo',
    areasVerdes: ['Parque do Ibirapuera (proximidades)', 'Ruas arborizadas', 'Parque Estadual das Fontes do Ipiranga'],
    caracteristicas: [
      'Bairro residencial com mix de casas e apartamentos',
      'Proximidade com grandes hospitais e universidades',
      'Ruas arborizadas com presença de insetos',
      'Região com alta densidade de famílias e crianças',
    ],
    beneficiosMosquiteira: 'Vila Clementino tem ruas arborizadas e proximidade com áreas verdes, favorecendo a presença de mosquitos. Telas mosquiteiras protegem famílias e crianças da região.',
    beneficiosRede: 'As famílias de Vila Clementino valorizam a segurança de crianças e pets. Nossas redes de proteção são instaladas rapidamente com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Clementino?', r: 'Sim! Atendemos Vila Clementino e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-america': {
    nome: 'Jardim América',
    cidade: 'São Paulo',
    descricao: 'bairro nobre na Zona Oeste de São Paulo, com casarões históricos, ruas arborizadas e alto padrão de vida',
    areasVerdes: ['Parque Trianon', 'Ruas arborizadas do Jardim América', 'Parque Estadual das Fontes do Ipiranga'],
    caracteristicas: [
      'Bairro nobre com casarões históricos e alto padrão',
      'Ruas extremamente arborizadas com árvores centenárias',
      'Proximidade com o Parque Trianon aumenta presença de insetos',
      'Alta concentração de famílias de alto padrão com pets',
    ],
    beneficiosMosquiteira: 'Jardim América tem ruas com arborização densa e proximidade ao Parque Trianon, criando microclima úmido favorável a mosquitos. Moradores de alto padrão valorizam telas discretas.',
    beneficiosRede: 'Os casarões e apartamentos de alto padrão do Jardim América pedem soluções sofisticadas. Nossas redes são discretas e não comprometem a estética dos imóveis.',
    faq: [
      { q: 'As telas alteram a estética do imóvel?', r: 'Não! Nossas telas são instaladas de forma discreta, preservando a estética do imóvel.' },
      { q: 'Atendem casarões históricos?', r: 'Sim! Temos experiência com instalações em casarões históricos sem danificar a estrutura.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
    ],
  },
  'vila-nova-conceicao': {
    nome: 'Vila Nova Conceição',
    cidade: 'São Paulo',
    descricao: 'bairro nobre na Zona Sul de São Paulo, com restaurantes sofisticados, boutiques e alto padrão residencial',
    areasVerdes: ['Parque do Ibirapuera (proximidades)', 'Ruas arborizadas', 'Parque Estadual das Fontes do Ipiranga'],
    caracteristicas: [
      'Bairro nobre com alto padrão residencial e comercial',
      'Proximidade com o Parque do Ibirapuera aumenta presença de insetos',
      'Ruas arborizadas com microclima úmido',
      'Alta concentração de apartamentos de luxo com sacadas amplas',
    ],
    beneficiosMosquiteira: 'Vila Nova Conceição fica próxima ao Ibirapuera, o que aumenta a presença de mosquitos. Moradores de alto padrão valorizam telas discretas e eficientes.',
    beneficiosRede: 'Os apartamentos de luxo de Vila Nova Conceição têm sacadas amplas que pedem proteção sofisticada. Nossas redes são discretas e elegantes.',
    faq: [
      { q: 'Atendem apartamentos de luxo em Vila Nova Conceição?', r: 'Sim! Temos soluções discretas e elegantes para apartamentos de alto padrão.' },
      { q: 'O Ibirapuera aumenta os mosquitos na região?', r: 'Sim! A proximidade com o parque aumenta significativamente a presença de mosquitos.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'moema-ibirapuera': {
    nome: 'Moema',
    cidade: 'São Paulo',
    descricao: 'bairro nobre na Zona Sul de São Paulo, com ruas arborizadas, restaurantes sofisticados e proximidade ao Parque do Ibirapuera',
    areasVerdes: ['Parque do Ibirapuera', 'Ruas arborizadas de Moema', 'Parque Estadual das Fontes do Ipiranga'],
    caracteristicas: [
      'Bairro nobre com alto padrão residencial',
      'Parque do Ibirapuera é grande área verde com lagos e insetos',
      'Ruas extremamente arborizadas criam microclima úmido',
      'Alta concentração de famílias com crianças e pets',
    ],
    beneficiosMosquiteira: 'Moema fica ao lado do Ibirapuera, o maior parque urbano de SP. A proximidade com o parque e as ruas arborizadas criam condições ideais para mosquitos.',
    beneficiosRede: 'As famílias de Moema valorizam a segurança de crianças e pets. Nossas redes de proteção são instaladas com rapidez e garantia de 2 anos.',
    faq: [
      { q: 'O Ibirapuera atrai mosquitos para Moema?', r: 'Sim! O parque com seus lagos é habitat natural de mosquitos, especialmente no verão.' },
      { q: 'Atendem Moema?', r: 'Sim! Atendemos Moema e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
    ],
  },
  'pompeia': {
    nome: 'Pompeia',
    cidade: 'São Paulo',
    descricao: 'bairro residencial e cultural na Zona Oeste de São Paulo, com o famoso SESC Pompeia e ruas arborizadas',
    areasVerdes: ['SESC Pompeia (área verde)', 'Ruas arborizadas da Pompeia', 'Parque da Água Branca (proximidades)'],
    caracteristicas: [
      'Bairro residencial com mix de casas e apartamentos',
      'SESC Pompeia é referência cultural com área verde',
      'Proximidade com o Parque da Água Branca',
      'Ruas arborizadas com presença de insetos',
    ],
    beneficiosMosquiteira: 'Pompeia tem o SESC e o Parque da Água Branca nas proximidades, aumentando a presença de mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas e apartamentos da Pompeia se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem a Pompeia?', r: 'Sim! Atendemos a Pompeia e toda a Zona Oeste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'sumare': {
    nome: 'Sumaré',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Oeste de São Paulo, com ruas tranquilas, boa infraestrutura e proximidade com Perdizes e Pompeia',
    areasVerdes: ['Parque da Água Branca (proximidades)', 'Ruas arborizadas do Sumaré', 'Parque Estadual das Fontes do Ipiranga'],
    caracteristicas: [
      'Bairro residencial tranquilo com casas e apartamentos',
      'Proximidade com o Parque da Água Branca',
      'Ruas arborizadas com microclima úmido',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Sumaré tem ruas arborizadas e proximidade com o Parque da Água Branca, favorecendo a presença de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As famílias do Sumaré valorizam a segurança de crianças e pets. Nossas redes de proteção são instaladas rapidamente com garantia de 2 anos.',
    faq: [
      { q: 'Atendem o Sumaré?', r: 'Sim! Atendemos o Sumaré e toda a Zona Oeste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'santa-cecilia': {
    nome: 'Santa Cecília',
    cidade: 'São Paulo',
    descricao: 'bairro central de São Paulo, com vida noturna agitada, restaurantes, bares e boa localização próxima ao centro',
    areasVerdes: ['Parque Buenos Aires (proximidades)', 'Ruas arborizadas', 'Parque Trianon (proximidades)'],
    caracteristicas: [
      'Bairro central com alta densidade urbana',
      'Vida noturna agitada com bares e restaurantes',
      'Edifícios residenciais antigos com janelas sem proteção',
      'Proximidade com Higienópolis e República',
    ],
    beneficiosMosquiteira: 'Santa Cecília, com sua localização central e edifícios antigos, tem alta incidência de mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'Os edifícios de Santa Cecília têm sacadas e janelas que pedem proteção. Nossa equipe tem experiência com instalações em prédios antigos do centro.',
    faq: [
      { q: 'Atendem edifícios antigos em Santa Cecília?', r: 'Sim! Temos experiência com instalações em prédios antigos, adaptando as telas sem danificar a estrutura.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'vila-romana': {
    nome: 'Vila Romana',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Oeste de São Paulo, com ruas tranquilas, casas e apartamentos de médio padrão',
    areasVerdes: ['Parque da Água Branca (proximidades)', 'Ruas arborizadas da Vila Romana', 'Rio Tietê (proximidades)'],
    caracteristicas: [
      'Bairro residencial tranquilo com casas e apartamentos',
      'Proximidade com o Rio Tietê aumenta a umidade local',
      'Ruas arborizadas com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Romana tem o Rio Tietê nas proximidades, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores da região.',
    beneficiosRede: 'As casas e apartamentos da Vila Romana se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Rio Tietê aumenta os mosquitos na Vila Romana?', r: 'Sim! A proximidade com o rio aumenta significativamente a umidade e a presença de mosquitos.' },
      { q: 'Atendem a Vila Romana?', r: 'Sim! Atendemos a Vila Romana e toda a Zona Oeste.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
"""

# Encontra a última chave do objeto e insere antes do fechamento final
# Procura pelo padrão: última ocorrência de "},\n}\n\n// Slug"
marker = "\n}\n\n// Slug normalizer"
idx = content.rfind(marker)

if idx == -1:
    print("ERRO: marcador não encontrado")
else:
    new_content = content[:idx] + novos_bairros + content[idx:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("OK - 10 bairros inseridos")

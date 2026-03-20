import re

filepath = 'nuxt-app/app/composables/useBairroLanding.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

novos_bairros = """
  'vila-mariana-sul': {
    nome: 'Vila Mariana',
    cidade: 'São Paulo',
    descricao: 'bairro residencial nobre na Zona Sul de São Paulo, com ruas arborizadas, metrô e proximidade ao Parque do Ibirapuera',
    areasVerdes: ['Parque do Ibirapuera', 'Parque Estadual das Fontes do Ipiranga', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro nobre com casas e apartamentos de alto padrão',
      'Parque do Ibirapuera nas proximidades aumenta presença de insetos',
      'Ruas extremamente arborizadas criam microclima úmido',
      'Alta concentração de famílias com crianças e pets',
    ],
    beneficiosMosquiteira: 'Vila Mariana fica próxima ao Ibirapuera, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas e apartamentos de Vila Mariana se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Ibirapuera aumenta os mosquitos em Vila Mariana?', r: 'Sim! A proximidade com o parque aumenta significativamente a presença de mosquitos.' },
      { q: 'Atendem Vila Mariana?', r: 'Sim! Atendemos Vila Mariana e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'cursino-sul': {
    nome: 'Cursino',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura local',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga', 'Parque do Ibirapuera (proximidades)', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados de médio padrão',
      'Proximidade com áreas verdes aumenta presença de insetos',
      'Ruas arborizadas com microclima úmido',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Cursino tem áreas verdes e ruas arborizadas que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Cursino se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Cursino?', r: 'Sim! Atendemos Cursino e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'vila-prudente-leste': {
    nome: 'Vila Prudente',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com metrô, comércio local e casas de médio padrão',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córrego Ipiranga', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro residencial com casas e apartamentos',
      'Acesso fácil pelo metrô Vila Prudente',
      'Córrego Ipiranga nas proximidades aumenta a umidade',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Prudente tem córregos e áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para proteger as famílias.',
    beneficiosRede: 'As casas e apartamentos de Vila Prudente se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Prudente?', r: 'Sim! Atendemos Vila Prudente e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'ipiranga-sul': {
    nome: 'Ipiranga',
    cidade: 'São Paulo',
    descricao: 'bairro histórico na Zona Sul de São Paulo, com o Museu do Ipiranga e o Parque da Independência',
    areasVerdes: ['Parque da Independência', 'Parque Estadual das Fontes do Ipiranga', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro histórico com casas e apartamentos de médio padrão',
      'Parque da Independência é grande área verde com presença de insetos',
      'Ruas arborizadas criam microclima úmido',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Ipiranga tem o Parque da Independência e áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas e apartamentos do Ipiranga se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Parque da Independência atrai mosquitos?', r: 'Sim! Parques urbanos são habitat natural de mosquitos, especialmente em dias quentes e úmidos.' },
      { q: 'Atendem o Ipiranga?', r: 'Sim! Atendemos o Ipiranga e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-carrao': {
    nome: 'Vila Carrão',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com metrô, comércio local e casas de médio padrão',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Ruas arborizadas', 'Córregos locais'],
    caracteristicas: [
      'Bairro residencial com casas e apartamentos',
      'Acesso fácil pelo metrô Carrão',
      'Córregos nas proximidades aumentam a umidade',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Carrão tem córregos e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas e apartamentos de Vila Carrão se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Carrão?', r: 'Sim! Atendemos Vila Carrão e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'sao-mateus': {
    nome: 'São Mateus',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'São Mateus tem córregos e áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para proteger as famílias.',
    beneficiosRede: 'As casas de São Mateus se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem São Mateus?', r: 'Sim! Atendemos São Mateus e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-sao-luis-sul': {
    nome: 'Jardim São Luís',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e proximidade com a Represa Guarapiranga',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim São Luís fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Jardim São Luís se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Represa Guarapiranga aumenta os mosquitos em Jardim São Luís?', r: 'Sim! A proximidade com a represa aumenta significativamente a umidade e a presença de mosquitos.' },
      { q: 'Atendem Jardim São Luís?', r: 'Sim! Atendemos Jardim São Luís e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-angela-sul': {
    nome: 'Jardim Ângela',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e proximidade com áreas verdes',
    areasVerdes: ['Parque Estadual da Serra do Mar (proximidades)', 'Represa Guarapiranga (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com áreas verdes aumenta presença de insetos',
      'Represa Guarapiranga nas proximidades aumenta a umidade',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Ângela fica próximo à Represa Guarapiranga e áreas verdes, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Ângela se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Ângela?', r: 'Sim! Atendemos Jardim Ângela e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'parque-do-carmo': {
    nome: 'Parque do Carmo',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, próximo ao Parque do Carmo, um dos maiores parques da cidade',
    areasVerdes: ['Parque do Carmo', 'Áreas verdes locais', 'Córregos locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Parque do Carmo é grande área verde com lagos e insetos',
      'Córregos nas proximidades aumentam a umidade',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Parque do Carmo fica ao lado do parque homônimo, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas do Parque do Carmo se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Parque do Carmo atrai mosquitos para a região?', r: 'Sim! O parque com seus lagos é habitat natural de mosquitos, especialmente no verão.' },
      { q: 'Atendem Parque do Carmo?', r: 'Sim! Atendemos Parque do Carmo e toda a Zona Leste.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'cidade-patriarca': {
    nome: 'Cidade Patriarca',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Cidade Patriarca tem córregos e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Cidade Patriarca se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Cidade Patriarca?', r: 'Sim! Atendemos Cidade Patriarca e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-nordeste': {
    nome: 'Jardim Nordeste',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Nordeste tem córregos e áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para proteger as famílias.',
    beneficiosRede: 'As casas de Jardim Nordeste se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Nordeste?', r: 'Sim! Atendemos Jardim Nordeste e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-ema': {
    nome: 'Vila Ema',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Ema tem córregos e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Vila Ema se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Ema?', r: 'Sim! Atendemos Vila Ema e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'parque-sao-lucas': {
    nome: 'Parque São Lucas',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Parque São Lucas tem córregos e áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para proteger as famílias.',
    beneficiosRede: 'As casas de Parque São Lucas se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Parque São Lucas?', r: 'Sim! Atendemos Parque São Lucas e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-alpina': {
    nome: 'Vila Alpina',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Alpina tem córregos e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Vila Alpina se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Alpina?', r: 'Sim! Atendemos Vila Alpina e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-aricanduva': {
    nome: 'Jardim Aricanduva',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, próximo ao Shopping Aricanduva e com casas de médio padrão',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com o Shopping Aricanduva',
      'Córregos nas proximidades aumentam a umidade',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Aricanduva tem córregos e áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para proteger as famílias.',
    beneficiosRede: 'As casas de Jardim Aricanduva se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Aricanduva?', r: 'Sim! Atendemos Jardim Aricanduva e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-formosa-leste': {
    nome: 'Vila Formosa',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com metrô, comércio local e casas de médio padrão',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro residencial com casas e apartamentos',
      'Acesso fácil pelo metrô Vila Formosa',
      'Córregos nas proximidades aumentam a umidade',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Formosa tem córregos e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas e apartamentos de Vila Formosa se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Formosa?', r: 'Sim! Atendemos Vila Formosa e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'parque-sao-rafael': {
    nome: 'Parque São Rafael',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Parque São Rafael tem córregos e áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para proteger as famílias.',
    beneficiosRede: 'As casas de Parque São Rafael se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Parque São Rafael?', r: 'Sim! Atendemos Parque São Rafael e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
"""

marker = "\n}\n\n// Slug normalizer"
idx = content.rfind(marker)

if idx == -1:
    print("ERRO: marcador não encontrado")
else:
    new_content = content[:idx] + novos_bairros + content[idx:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("OK - 17 bairros inseridos")

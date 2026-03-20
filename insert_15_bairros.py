import re

filepath = 'nuxt-app/app/composables/useBairroLanding.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

novos_bairros = """
  'jardim-botanico': {
    nome: 'Jardim Botânico',
    cidade: 'São Paulo',
    descricao: 'bairro residencial tranquilo na Zona Sul de São Paulo, próximo ao Parque Estadual das Fontes do Ipiranga e ao Jardim Botânico',
    areasVerdes: ['Jardim Botânico de São Paulo', 'Parque Estadual das Fontes do Ipiranga', 'Parque do Ibirapuera (proximidades)'],
    caracteristicas: [
      'Bairro residencial com casas e apartamentos de médio-alto padrão',
      'Proximidade com o Jardim Botânico aumenta presença de insetos',
      'Ruas arborizadas com microclima úmido',
      'Alta concentração de famílias com crianças e pets',
    ],
    beneficiosMosquiteira: 'O Jardim Botânico fica próximo ao Parque Estadual das Fontes do Ipiranga, criando condições ideais para mosquitos. Telas mosquiteiras são indispensáveis para os moradores.',
    beneficiosRede: 'As famílias do Jardim Botânico valorizam a segurança de crianças e pets. Nossas redes de proteção são instaladas rapidamente com garantia de 2 anos.',
    faq: [
      { q: 'O Jardim Botânico atrai mosquitos para a região?', r: 'Sim! A proximidade com o parque e suas áreas verdes aumenta significativamente a presença de mosquitos.' },
      { q: 'Atendem o Jardim Botânico?', r: 'Sim! Atendemos o Jardim Botânico e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-prudente-zona-leste': {
    nome: 'Vila Prudente',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com boa infraestrutura, metrô e mix de casas e apartamentos',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Ruas arborizadas', 'Córrego Ipiranga (proximidades)'],
    caracteristicas: [
      'Bairro residencial com casas e apartamentos de médio padrão',
      'Acesso fácil pelo metrô Vila Prudente',
      'Ruas arborizadas com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Prudente tem córregos e áreas verdes nas proximidades, favorecendo a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas e apartamentos de Vila Prudente se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Prudente?', r: 'Sim! Atendemos Vila Prudente e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'sacomã': {
    nome: 'Sacomã',
    cidade: 'São Paulo',
    descricao: 'bairro residencial e comercial na Zona Sul de São Paulo, com boa infraestrutura e fácil acesso ao centro',
    areasVerdes: ['Parque do Ibirapuera (proximidades)', 'Ruas arborizadas', 'Córrego Sacomã'],
    caracteristicas: [
      'Bairro residencial com casas e apartamentos de médio padrão',
      'Córrego Sacomã nas proximidades aumenta a umidade',
      'Ruas arborizadas com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Sacomã tem o Córrego Sacomã e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas e apartamentos do Sacomã se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem o Sacomã?', r: 'Sim! Atendemos o Sacomã e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-matilde': {
    nome: 'Vila Matilde',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com metrô, comércio local e casas de médio padrão',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Ruas arborizadas da Vila Matilde', 'Córregos locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados de médio padrão',
      'Acesso fácil pelo metrô Vila Matilde',
      'Córregos nas proximidades aumentam a umidade',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Matilde tem córregos e áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para proteger as famílias da região.',
    beneficiosRede: 'As casas de Vila Matilde se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Matilde?', r: 'Sim! Atendemos Vila Matilde e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'ermelino-matarazzo': {
    nome: 'Ermelino Matarazzo',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e boa infraestrutura local',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Rio Tietê (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com o Rio Tietê aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Ermelino Matarazzo fica próximo ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Ermelino Matarazzo se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Ermelino Matarazzo?', r: 'Sim! Atendemos Ermelino Matarazzo e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'sao-lucas': {
    nome: 'São Lucas',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Ruas arborizadas', 'Córregos locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados de médio padrão',
      'Córregos nas proximidades aumentam a umidade',
      'Ruas arborizadas com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'São Lucas tem córregos e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de São Lucas se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem São Lucas?', r: 'Sim! Atendemos São Lucas e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'cidade-lider': {
    nome: 'Cidade Líder',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Parque do Carmo', 'Rio Tietê (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Próximo ao Parque do Carmo, grande área verde',
      'Rio Tietê nas proximidades aumenta a umidade',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Cidade Líder fica próxima ao Parque do Carmo e ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Cidade Líder se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Parque do Carmo atrai mosquitos para Cidade Líder?', r: 'Sim! A proximidade com o parque aumenta significativamente a presença de mosquitos.' },
      { q: 'Atendem Cidade Líder?', r: 'Sim! Atendemos Cidade Líder e toda a Zona Leste.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jose-bonifacio': {
    nome: 'José Bonifácio',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Ruas arborizadas', 'Córregos locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados de médio padrão',
      'Córregos nas proximidades aumentam a umidade',
      'Ruas arborizadas com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'José Bonifácio tem córregos e áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para proteger as famílias.',
    beneficiosRede: 'As casas de José Bonifácio se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem José Bonifácio?', r: 'Sim! Atendemos José Bonifácio e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'guaianases': {
    nome: 'Guaianases',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e acesso pelo metrô',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Rio Tietê (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Acesso fácil pelo metrô Guaianases',
      'Rio Tietê nas proximidades aumenta a umidade',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Guaianases fica próximo ao Rio Tietê e tem áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Guaianases se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Guaianases?', r: 'Sim! Atendemos Guaianases e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'itaim-paulista': {
    nome: 'Itaim Paulista',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Rio Tietê (proximidades)', 'Parque do Carmo (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Rio Tietê nas proximidades é criadouro de mosquitos',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Itaim Paulista fica próximo ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores da região.',
    beneficiosRede: 'As casas de Itaim Paulista se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Rio Tietê aumenta os mosquitos em Itaim Paulista?', r: 'Sim! A proximidade com o rio aumenta significativamente a umidade e a presença de mosquitos.' },
      { q: 'Atendem Itaim Paulista?', r: 'Sim! Atendemos Itaim Paulista e toda a Zona Leste.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-esperanca': {
    nome: 'Vila Esperança',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e boa infraestrutura local',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Ruas arborizadas', 'Córregos locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados de médio padrão',
      'Córregos nas proximidades aumentam a umidade',
      'Ruas arborizadas com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Esperança tem córregos e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Vila Esperança se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Esperança?', r: 'Sim! Atendemos Vila Esperança e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'pirituba': {
    nome: 'Pirituba',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte de São Paulo, com casas de médio padrão e acesso pelo metrô',
    areasVerdes: ['Parque Estadual da Cantareira (proximidades)', 'Rio Tietê (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Acesso fácil pelo metrô Pirituba',
      'Proximidade com a Cantareira aumenta presença de insetos',
      'Rio Tietê nas proximidades é criadouro de mosquitos',
    ],
    beneficiosMosquiteira: 'Pirituba fica próximo à Cantareira e ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Pirituba se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Cantareira aumenta os mosquitos em Pirituba?', r: 'Sim! Estar próximo à maior floresta urbana do mundo aumenta significativamente a presença de mosquitos.' },
      { q: 'Atendem Pirituba?', r: 'Sim! Atendemos Pirituba e toda a Zona Norte.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'brasilandia': {
    nome: 'Brasilândia',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte de São Paulo, com casas de médio padrão e proximidade com a Serra da Cantareira',
    areasVerdes: ['Parque Estadual da Cantareira', 'Serra da Cantareira', 'Rio Tietê (proximidades)'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Serra da Cantareira aumenta presença de insetos',
      'Alta umidade favorece proliferação de pernilongos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Brasilândia fica próxima à Serra da Cantareira, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores da região.',
    beneficiosRede: 'As casas de Brasilândia se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Serra da Cantareira aumenta os mosquitos em Brasilândia?', r: 'Sim! A proximidade com a floresta aumenta significativamente a umidade e a presença de mosquitos.' },
      { q: 'Atendem Brasilândia?', r: 'Sim! Atendemos Brasilândia e toda a Zona Norte.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-guilherme-norte': {
    nome: 'Vila Guilherme',
    cidade: 'São Paulo',
    descricao: 'bairro residencial e comercial na Zona Norte de São Paulo, com casas e apartamentos de médio padrão',
    areasVerdes: ['Parque Estadual Alberto Löfgren (proximidades)', 'Rio Tietê (proximidades)', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro residencial com casas e apartamentos',
      'Rio Tietê nas proximidades é criadouro de mosquitos',
      'Ruas arborizadas com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Guilherme fica próxima ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas e apartamentos de Vila Guilherme se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Rio Tietê aumenta os mosquitos em Vila Guilherme?', r: 'Sim! A proximidade com o rio aumenta significativamente a umidade e a presença de mosquitos.' },
      { q: 'Atendem Vila Guilherme?', r: 'Sim! Atendemos Vila Guilherme e toda a Zona Norte.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'campo-grande-zona-sul': {
    nome: 'Campo Grande',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão, comércio local e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados de médio padrão',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Campo Grande fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores da região.',
    beneficiosRede: 'As casas de Campo Grande se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Represa Guarapiranga aumenta os mosquitos em Campo Grande?', r: 'Sim! A proximidade com a represa aumenta significativamente a umidade e a presença de mosquitos.' },
      { q: 'Atendem Campo Grande?', r: 'Sim! Atendemos Campo Grande e toda a Zona Sul.' },
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
    print("OK - 15 bairros inseridos")

import re

filepath = 'nuxt-app/app/composables/useBairroLanding.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

novos_bairros = """
  'jardim-sao-saveiro': {
    nome: 'Jardim São Saveiro',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim São Saveiro fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Jardim São Saveiro se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim São Saveiro?', r: 'Sim! Atendemos Jardim São Saveiro e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-climax': {
    nome: 'Jardim Clímax',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Clímax fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Jardim Clímax se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Clímax?', r: 'Sim! Atendemos Jardim Clímax e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-monte-alegre': {
    nome: 'Jardim Monte Alegre',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Monte Alegre fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Jardim Monte Alegre se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Monte Alegre?', r: 'Sim! Atendemos Jardim Monte Alegre e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-das-merces': {
    nome: 'Vila das Mercês',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga (proximidades)', 'Ruas arborizadas', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Ruas arborizadas com microclima úmido',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila das Mercês tem ruas arborizadas e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Vila das Mercês se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila das Mercês?', r: 'Sim! Atendemos Vila das Mercês e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-marajoara': {
    nome: 'Jardim Marajoara',
    cidade: 'São Paulo',
    descricao: 'bairro residencial nobre na Zona Sul de São Paulo, com casas e apartamentos de alto padrão',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga (proximidades)', 'Ruas arborizadas', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro nobre com casas e apartamentos de alto padrão',
      'Ruas extremamente arborizadas criam microclima úmido',
      'Áreas verdes locais com presença de insetos',
      'Alta concentração de famílias de alto padrão',
    ],
    beneficiosMosquiteira: 'Jardim Marajoara tem ruas arborizadas que favorecem mosquitos. Moradores de alto padrão valorizam telas discretas e eficientes.',
    beneficiosRede: 'As casas e apartamentos de Jardim Marajoara se beneficiam de redes de proteção sofisticadas. Nossas redes são discretas e elegantes.',
    faq: [
      { q: 'As telas alteram a estética do imóvel?', r: 'Não! Nossas telas são instaladas de forma discreta, preservando a estética do imóvel.' },
      { q: 'Atendem Jardim Marajoara?', r: 'Sim! Atendemos Jardim Marajoara e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'chacara-flora': {
    nome: 'Chácara Flora',
    cidade: 'São Paulo',
    descricao: 'bairro residencial nobre na Zona Sul de São Paulo, com casas e apartamentos de alto padrão e ruas arborizadas',
    areasVerdes: ['Parque do Ibirapuera (proximidades)', 'Ruas arborizadas', 'Parque Estadual das Fontes do Ipiranga'],
    caracteristicas: [
      'Bairro nobre com casas e apartamentos de alto padrão',
      'Ruas extremamente arborizadas criam microclima úmido',
      'Proximidade com o Ibirapuera aumenta presença de insetos',
      'Alta concentração de famílias de alto padrão',
    ],
    beneficiosMosquiteira: 'Chácara Flora fica próxima ao Ibirapuera e tem ruas arborizadas, criando condições ideais para mosquitos. Moradores valorizam telas discretas.',
    beneficiosRede: 'As casas e apartamentos de Chácara Flora se beneficiam de redes de proteção sofisticadas. Nossas redes são discretas e elegantes.',
    faq: [
      { q: 'As telas alteram a estética do imóvel?', r: 'Não! Nossas telas são instaladas de forma discreta, preservando a estética do imóvel.' },
      { q: 'Atendem Chácara Flora?', r: 'Sim! Atendemos Chácara Flora e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'chacara-klabin': {
    nome: 'Chácara Klabin',
    cidade: 'São Paulo',
    descricao: 'bairro residencial nobre na Zona Sul de São Paulo, com apartamentos de alto padrão e ruas arborizadas',
    areasVerdes: ['Parque do Ibirapuera (proximidades)', 'Ruas arborizadas', 'Parque Estadual das Fontes do Ipiranga'],
    caracteristicas: [
      'Bairro nobre com apartamentos de alto padrão',
      'Ruas extremamente arborizadas criam microclima úmido',
      'Proximidade com o Ibirapuera aumenta presença de insetos',
      'Alta concentração de famílias de alto padrão',
    ],
    beneficiosMosquiteira: 'Chácara Klabin fica próxima ao Ibirapuera, criando condições ideais para mosquitos. Moradores de alto padrão valorizam telas discretas.',
    beneficiosRede: 'Os apartamentos de Chácara Klabin se beneficiam de redes de proteção sofisticadas. Nossas redes são discretas e elegantes.',
    faq: [
      { q: 'As telas alteram a estética do apartamento?', r: 'Não! Nossas telas são instaladas de forma discreta, preservando a estética do imóvel.' },
      { q: 'Atendem Chácara Klabin?', r: 'Sim! Atendemos Chácara Klabin e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'mirandopolis': {
    nome: 'Mirandópolis',
    cidade: 'São Paulo',
    descricao: 'bairro residencial nobre na Zona Sul de São Paulo, com casas e apartamentos de alto padrão',
    areasVerdes: ['Parque do Ibirapuera (proximidades)', 'Ruas arborizadas', 'Parque Estadual das Fontes do Ipiranga'],
    caracteristicas: [
      'Bairro nobre com casas e apartamentos de alto padrão',
      'Ruas extremamente arborizadas criam microclima úmido',
      'Proximidade com o Ibirapuera aumenta presença de insetos',
      'Alta concentração de famílias de alto padrão',
    ],
    beneficiosMosquiteira: 'Mirandópolis fica próxima ao Ibirapuera, criando condições ideais para mosquitos. Moradores de alto padrão valorizam telas discretas.',
    beneficiosRede: 'As casas e apartamentos de Mirandópolis se beneficiam de redes de proteção sofisticadas. Nossas redes são discretas e elegantes.',
    faq: [
      { q: 'As telas alteram a estética do imóvel?', r: 'Não! Nossas telas são instaladas de forma discreta, preservando a estética do imóvel.' },
      { q: 'Atendem Mirandópolis?', r: 'Sim! Atendemos Mirandópolis e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'planalto-paulista': {
    nome: 'Planalto Paulista',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com apartamentos de médio-alto padrão e boa infraestrutura',
    areasVerdes: ['Parque do Ibirapuera (proximidades)', 'Ruas arborizadas', 'Parque Estadual das Fontes do Ipiranga'],
    caracteristicas: [
      'Bairro residencial com apartamentos de médio-alto padrão',
      'Ruas arborizadas criam microclima úmido',
      'Proximidade com o Ibirapuera aumenta presença de insetos',
      'Alta concentração de famílias',
    ],
    beneficiosMosquiteira: 'Planalto Paulista fica próximo ao Ibirapuera, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'Os apartamentos de Planalto Paulista se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Ibirapuera aumenta os mosquitos em Planalto Paulista?', r: 'Sim! A proximidade com o parque aumenta significativamente a presença de mosquitos.' },
      { q: 'Atendem Planalto Paulista?', r: 'Sim! Atendemos Planalto Paulista e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'indianopolis': {
    nome: 'Indianópolis',
    cidade: 'São Paulo',
    descricao: 'bairro residencial nobre na Zona Sul de São Paulo, com apartamentos de alto padrão e ruas arborizadas',
    areasVerdes: ['Parque do Ibirapuera', 'Ruas arborizadas', 'Parque Estadual das Fontes do Ipiranga'],
    caracteristicas: [
      'Bairro nobre com apartamentos de alto padrão',
      'Parque do Ibirapuera nas proximidades aumenta presença de insetos',
      'Ruas extremamente arborizadas criam microclima úmido',
      'Alta concentração de famílias de alto padrão',
    ],
    beneficiosMosquiteira: 'Indianópolis fica ao lado do Ibirapuera, criando condições ideais para mosquitos. Moradores de alto padrão valorizam telas discretas.',
    beneficiosRede: 'Os apartamentos de Indianópolis se beneficiam de redes de proteção sofisticadas. Nossas redes são discretas e elegantes.',
    faq: [
      { q: 'O Ibirapuera atrai mosquitos para Indianópolis?', r: 'Sim! O parque com seus lagos é habitat natural de mosquitos, especialmente no verão.' },
      { q: 'Atendem Indianópolis?', r: 'Sim! Atendemos Indianópolis e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'bosque-da-saude': {
    nome: 'Bosque da Saúde',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas e apartamentos de médio padrão',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga', 'Ruas arborizadas', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e apartamentos',
      'Ruas arborizadas criam microclima úmido',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Bosque da Saúde tem ruas arborizadas e áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas e apartamentos de Bosque da Saúde se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Bosque da Saúde?', r: 'Sim! Atendemos Bosque da Saúde e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'vila-gumercindo': {
    nome: 'Vila Gumercindo',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga (proximidades)', 'Ruas arborizadas', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Ruas arborizadas com microclima úmido',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Gumercindo tem ruas arborizadas que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Vila Gumercindo se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Gumercindo?', r: 'Sim! Atendemos Vila Gumercindo e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-carioca': {
    nome: 'Vila Carioca',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga (proximidades)', 'Ruas arborizadas', 'Córregos locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Ruas arborizadas com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Carioca tem córregos e ruas arborizadas que favorecem mosquitos. Telas mosquiteiras são essenciais para proteger as famílias.',
    beneficiosRede: 'As casas de Vila Carioca se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Carioca?', r: 'Sim! Atendemos Vila Carioca e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'vila-zelina': {
    nome: 'Vila Zelina',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Zelina tem córregos e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Vila Zelina se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Zelina?', r: 'Sim! Atendemos Vila Zelina e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-regente-feijo': {
    nome: 'Vila Regente Feijó',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Regente Feijó tem córregos e áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para proteger as famílias.',
    beneficiosRede: 'As casas de Vila Regente Feijó se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Regente Feijó?', r: 'Sim! Atendemos Vila Regente Feijó e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'vila-tolstoi': {
    nome: 'Vila Tolstoi',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Tolstoi tem córregos e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Vila Tolstoi se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Tolstoi?', r: 'Sim! Atendemos Vila Tolstoi e toda a Zona Leste.' },
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

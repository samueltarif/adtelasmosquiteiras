import re

filepath = 'nuxt-app/app/composables/useBairroLanding.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

novos_bairros = """
  'jardim-angela': {
    nome: 'Jardim Ângela',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e proximidade com áreas verdes',
    areasVerdes: ['Parque Estadual da Serra do Mar (proximidades)', 'Represa Guarapiranga (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados de médio padrão',
      'Proximidade com áreas verdes aumenta presença de insetos',
      'Represa Guarapiranga nas proximidades aumenta a umidade',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Ângela fica próximo à Represa Guarapiranga e áreas verdes, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Jardim Ângela se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Ângela?', r: 'Sim! Atendemos Jardim Ângela e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'cidade-tiradentes': {
    nome: 'Cidade Tiradentes',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e boa infraestrutura local',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Áreas verdes locais', 'Córregos locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Cidade Tiradentes tem córregos e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Cidade Tiradentes se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Cidade Tiradentes?', r: 'Sim! Atendemos Cidade Tiradentes e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-helena': {
    nome: 'Jardim Helena',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Rio Tietê (proximidades)', 'Parque do Carmo (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Rio Tietê nas proximidades é criadouro de mosquitos',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Helena fica próximo ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores da região.',
    beneficiosRede: 'As casas de Jardim Helena se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Rio Tietê aumenta os mosquitos em Jardim Helena?', r: 'Sim! A proximidade com o rio aumenta significativamente a umidade e a presença de mosquitos.' },
      { q: 'Atendem Jardim Helena?', r: 'Sim! Atendemos Jardim Helena e toda a Zona Leste.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'lajeado': {
    nome: 'Lajeado',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Rio Tietê (proximidades)', 'Parque do Carmo (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Rio Tietê nas proximidades aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Lajeado fica próximo ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Lajeado se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Lajeado?', r: 'Sim! Atendemos Lajeado e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'iguatemi': {
    nome: 'Iguatemi',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Rio Tietê (proximidades)', 'Parque do Carmo (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Rio Tietê nas proximidades é criadouro de mosquitos',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Iguatemi fica próximo ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores da região.',
    beneficiosRede: 'As casas de Iguatemi se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Iguatemi?', r: 'Sim! Atendemos Iguatemi e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'sapopemba': {
    nome: 'Sapopemba',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste de São Paulo, com casas de médio padrão e boa infraestrutura local',
    areasVerdes: ['Parque do Carmo (proximidades)', 'Córregos locais', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Sapopemba tem córregos e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Sapopemba se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Sapopemba?', r: 'Sim! Atendemos Sapopemba e toda a Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-sao-paulo': {
    nome: 'Jardim São Paulo',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Parque Estadual da Cantareira (proximidades)', 'Rio Tietê (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Cantareira aumenta presença de insetos',
      'Rio Tietê nas proximidades é criadouro de mosquitos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim São Paulo fica próximo à Cantareira e ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Jardim São Paulo se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Cantareira aumenta os mosquitos em Jardim São Paulo?', r: 'Sim! Estar próximo à maior floresta urbana do mundo aumenta significativamente a presença de mosquitos.' },
      { q: 'Atendem Jardim São Paulo?', r: 'Sim! Atendemos Jardim São Paulo e toda a Zona Norte.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-medeiros': {
    nome: 'Vila Medeiros',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque Estadual Alberto Löfgren (proximidades)', 'Rio Tietê (proximidades)', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro residencial com casas e apartamentos',
      'Rio Tietê nas proximidades aumenta a umidade',
      'Ruas arborizadas com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Medeiros fica próxima ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas e apartamentos de Vila Medeiros se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Rio Tietê aumenta os mosquitos em Vila Medeiros?', r: 'Sim! A proximidade com o rio aumenta significativamente a umidade e a presença de mosquitos.' },
      { q: 'Atendem Vila Medeiros?', r: 'Sim! Atendemos Vila Medeiros e toda a Zona Norte.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'cachoeirinha': {
    nome: 'Cachoeirinha',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte de São Paulo, com casas de médio padrão e acesso pelo metrô',
    areasVerdes: ['Parque Estadual da Cantareira (proximidades)', 'Rio Tietê (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Acesso fácil pelo metrô Cachoeirinha',
      'Proximidade com a Cantareira aumenta presença de insetos',
      'Rio Tietê nas proximidades é criadouro de mosquitos',
    ],
    beneficiosMosquiteira: 'Cachoeirinha fica próxima à Cantareira e ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Cachoeirinha se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Cantareira aumenta os mosquitos em Cachoeirinha?', r: 'Sim! Estar próximo à maior floresta urbana do mundo aumenta significativamente a presença de mosquitos.' },
      { q: 'Atendem Cachoeirinha?', r: 'Sim! Atendemos Cachoeirinha e toda a Zona Norte.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jaragua': {
    nome: 'Jaraguá',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte de São Paulo, com casas de médio padrão e proximidade com o Pico do Jaraguá',
    areasVerdes: ['Parque Estadual do Jaraguá', 'Pico do Jaraguá', 'Serra da Cantareira (proximidades)'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com o Pico do Jaraguá aumenta presença de insetos',
      'Alta umidade favorece proliferação de pernilongos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jaraguá fica próximo ao Pico do Jaraguá e à Serra da Cantareira, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Jaraguá se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Pico do Jaraguá aumenta os mosquitos na região?', r: 'Sim! A proximidade com áreas verdes e montanhas aumenta significativamente a presença de mosquitos.' },
      { q: 'Atendem Jaraguá?', r: 'Sim! Atendemos Jaraguá e toda a Zona Norte.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-nova-cachoeirinha': {
    nome: 'Vila Nova Cachoeirinha',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte de São Paulo, com casas de médio padrão e boa infraestrutura local',
    areasVerdes: ['Parque Estadual da Cantareira (proximidades)', 'Rio Tietê (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Cantareira aumenta presença de insetos',
      'Rio Tietê nas proximidades aumenta a umidade',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Nova Cachoeirinha fica próxima à Cantareira e ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Vila Nova Cachoeirinha se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Nova Cachoeirinha?', r: 'Sim! Atendemos Vila Nova Cachoeirinha e toda a Zona Norte.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-peri': {
    nome: 'Jardim Peri',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque Estadual da Cantareira (proximidades)', 'Rio Tietê (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Cantareira aumenta presença de insetos',
      'Rio Tietê nas proximidades é criadouro de mosquitos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Peri fica próximo à Cantareira e ao Rio Tietê, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Jardim Peri se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Peri?', r: 'Sim! Atendemos Jardim Peri e toda a Zona Norte.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-brasil': {
    nome: 'Jardim Brasil',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Brasil fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Jardim Brasil se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Represa Guarapiranga aumenta os mosquitos em Jardim Brasil?', r: 'Sim! A proximidade com a represa aumenta significativamente a umidade e a presença de mosquitos.' },
      { q: 'Atendem Jardim Brasil?', r: 'Sim! Atendemos Jardim Brasil e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'capao-redondo-zona-sul': {
    nome: 'Capão Redondo',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Capão Redondo fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Capão Redondo se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Capão Redondo?', r: 'Sim! Atendemos Capão Redondo e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-miriam': {
    nome: 'Jardim Miriam',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura local',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga (proximidades)', 'Áreas verdes locais', 'Córregos locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Miriam tem córregos e áreas verdes que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Jardim Miriam se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Miriam?', r: 'Sim! Atendemos Jardim Miriam e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'cidade-dutra-zona-sul': {
    nome: 'Cidade Dutra',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Billings (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Billings aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Cidade Dutra fica próxima à Represa Billings, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Cidade Dutra se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Represa Billings aumenta os mosquitos em Cidade Dutra?', r: 'Sim! A proximidade com a represa aumenta significativamente a umidade e a presença de mosquitos.' },
      { q: 'Atendem Cidade Dutra?', r: 'Sim! Atendemos Cidade Dutra e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'interlagos': {
    nome: 'Interlagos',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, famoso pelo Autódromo de Interlagos e com casas de médio-alto padrão',
    areasVerdes: ['Represa Billings (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e apartamentos de médio-alto padrão',
      'Proximidade com a Represa Billings aumenta a umidade',
      'Autódromo de Interlagos é referência na região',
      'Áreas verdes locais com presença de insetos',
    ],
    beneficiosMosquiteira: 'Interlagos fica próximo à Represa Billings, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais para os moradores da região.',
    beneficiosRede: 'As casas e apartamentos de Interlagos se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Represa Billings aumenta os mosquitos em Interlagos?', r: 'Sim! A proximidade com a represa aumenta significativamente a umidade e a presença de mosquitos.' },
      { q: 'Atendem Interlagos?', r: 'Sim! Atendemos Interlagos e toda a Zona Sul.' },
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

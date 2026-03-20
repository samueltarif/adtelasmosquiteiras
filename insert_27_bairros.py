import re

filepath = 'app/composables/useBairroLanding.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Parte 1 - 14 bairros
novos_bairros_parte1 = """
  'jardim-da-saude': {
    nome: 'Jardim da Saúde',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga', 'Ruas arborizadas', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Ruas arborizadas criam microclima úmido',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim da Saúde tem ruas arborizadas e áreas verdes que favorecem mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas de Jardim da Saúde se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim da Saúde?', r: 'Sim! Atendemos Jardim da Saúde e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'vila-guarani': {
    nome: 'Vila Guarani',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga (proximidades)', 'Ruas arborizadas', 'Córregos locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Córregos nas proximidades aumentam a umidade',
      'Ruas arborizadas com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Vila Guarani tem córregos e ruas arborizadas que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias.',
    beneficiosRede: 'As casas de Vila Guarani se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Vila Guarani?', r: 'Sim! Atendemos Vila Guarani e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'parque-bristol': {
    nome: 'Parque Bristol',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga (proximidades)', 'Ruas arborizadas', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Ruas arborizadas criam microclima úmido',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Parque Bristol tem ruas arborizadas que favorecem mosquitos. Telas mosquiteiras são essenciais para proteger as famílias.',
    beneficiosRede: 'As casas de Parque Bristol se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Parque Bristol?', r: 'Sim! Atendemos Parque Bristol e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-aeroporto': {
    nome: 'Jardim Aeroporto',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, próximo ao Aeroporto de Congonhas',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga (proximidades)', 'Ruas arborizadas', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e apartamentos',
      'Proximidade com o Aeroporto de Congonhas',
      'Ruas arborizadas com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Aeroporto tem ruas arborizadas que favorecem mosquitos. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas e apartamentos de Jardim Aeroporto se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Aeroporto?', r: 'Sim! Atendemos Jardim Aeroporto e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'cidade-vargas': {
    nome: 'Cidade Vargas',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga (proximidades)', 'Ruas arborizadas', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Ruas arborizadas criam microclima úmido',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Cidade Vargas tem ruas arborizadas que favorecem a proliferação de mosquitos. Telas mosquiteiras protegem as famílias da região.',
    beneficiosRede: 'As casas de Cidade Vargas se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Cidade Vargas?', r: 'Sim! Atendemos Cidade Vargas e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'parque-colonial': {
    nome: 'Parque Colonial',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Parque Estadual das Fontes do Ipiranga (proximidades)', 'Ruas arborizadas', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Ruas arborizadas criam microclima úmido',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Parque Colonial tem ruas arborizadas que favorecem mosquitos. Telas mosquiteiras são essenciais para proteger as famílias.',
    beneficiosRede: 'As casas de Parque Colonial se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Parque Colonial?', r: 'Sim! Atendemos Parque Colonial e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-tres-marias': {
    nome: 'Jardim Três Marias',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Três Marias fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Três Marias se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Três Marias?', r: 'Sim! Atendemos Jardim Três Marias e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-umuarama': {
    nome: 'Jardim Umuarama',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Umuarama fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Umuarama se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Umuarama?', r: 'Sim! Atendemos Jardim Umuarama e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-guarau': {
    nome: 'Jardim Guarau',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Guarau fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Guarau se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Guarau?', r: 'Sim! Atendemos Jardim Guarau e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-herculano': {
    nome: 'Jardim Herculano',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Herculano fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Herculano se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Herculano?', r: 'Sim! Atendemos Jardim Herculano e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-selma': {
    nome: 'Jardim Selma',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Selma fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Selma se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Selma?', r: 'Sim! Atendemos Jardim Selma e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-republica': {
    nome: 'Jardim República',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim República fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim República se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim República?', r: 'Sim! Atendemos Jardim República e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-prudencia': {
    nome: 'Jardim Prudência',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Prudência fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Prudência se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Prudência?', r: 'Sim! Atendemos Jardim Prudência e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-niteroi': {
    nome: 'Jardim Niterói',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Niterói fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Niterói se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Niterói?', r: 'Sim! Atendemos Jardim Niterói e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
"""

marker = "\n}\n\n// Slug normalizer"
idx = content.rfind(marker)

if idx == -1:
    print("ERRO: marcador não encontrado")
    exit(1)

# Insere parte 1
content = content[:idx] + novos_bairros_parte1 + content[idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("OK - 27 bairros inseridos (parte 1/2 completa)")

# Recarrega o arquivo para adicionar parte 2
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Parte 2 - 13 bairros restantes
novos_bairros_parte2 = """
  'jardim-mirna': {
    nome: 'Jardim Mirna',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Mirna fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Mirna se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Mirna?', r: 'Sim! Atendemos Jardim Mirna e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-maracana': {
    nome: 'Jardim Maracanã',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Maracanã fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Maracanã se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Maracanã?', r: 'Sim! Atendemos Jardim Maracanã e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-lourdes': {
    nome: 'Jardim Lourdes',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Lourdes fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Lourdes se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Lourdes?', r: 'Sim! Atendemos Jardim Lourdes e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-lidia': {
    nome: 'Jardim Lídia',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Lídia fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Lídia se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Lídia?', r: 'Sim! Atendemos Jardim Lídia e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-itapura': {
    nome: 'Jardim Itapura',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Itapura fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Itapura se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Itapura?', r: 'Sim! Atendemos Jardim Itapura e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-iporanga': {
    nome: 'Jardim Iporanga',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Iporanga fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Iporanga se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Iporanga?', r: 'Sim! Atendemos Jardim Iporanga e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-ingai': {
    nome: 'Jardim Ingá',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Ingá fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Ingá se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Ingá?', r: 'Sim! Atendemos Jardim Ingá e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-guedala': {
    nome: 'Jardim Guedala',
    cidade: 'São Paulo',
    descricao: 'bairro residencial nobre na Zona Sul de São Paulo, com casas e apartamentos de alto padrão',
    areasVerdes: ['Parque do Ibirapuera (proximidades)', 'Ruas arborizadas', 'Parque Estadual das Fontes do Ipiranga'],
    caracteristicas: [
      'Bairro nobre com casas e apartamentos de alto padrão',
      'Ruas extremamente arborizadas criam microclima úmido',
      'Proximidade com o Ibirapuera aumenta presença de insetos',
      'Alta concentração de famílias de alto padrão',
    ],
    beneficiosMosquiteira: 'Jardim Guedala fica próximo ao Ibirapuera e tem ruas arborizadas, criando condições ideais para mosquitos. Moradores valorizam telas discretas.',
    beneficiosRede: 'As casas e apartamentos de Jardim Guedala se beneficiam de redes de proteção sofisticadas. Nossas redes são discretas e elegantes.',
    faq: [
      { q: 'As telas alteram a estética do imóvel?', r: 'Não! Nossas telas são instaladas de forma discreta, preservando a estética do imóvel.' },
      { q: 'Atendem Jardim Guedala?', r: 'Sim! Atendemos Jardim Guedala e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-fonte-do-morumbi': {
    nome: 'Jardim Fonte do Morumbi',
    cidade: 'São Paulo',
    descricao: 'bairro residencial nobre na Zona Sul de São Paulo, com casas e apartamentos de alto padrão',
    areasVerdes: ['Parque Burle Marx (proximidades)', 'Ruas arborizadas', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro nobre com casas e apartamentos de alto padrão',
      'Ruas extremamente arborizadas criam microclima úmido',
      'Proximidade com o Parque Burle Marx aumenta presença de insetos',
      'Alta concentração de famílias de alto padrão',
    ],
    beneficiosMosquiteira: 'Jardim Fonte do Morumbi tem ruas arborizadas e proximidade com áreas verdes, criando condições ideais para mosquitos. Moradores valorizam telas discretas.',
    beneficiosRede: 'As casas e apartamentos de Jardim Fonte do Morumbi se beneficiam de redes de proteção sofisticadas. Nossas redes são discretas e elegantes.',
    faq: [
      { q: 'As telas alteram a estética do imóvel?', r: 'Não! Nossas telas são instaladas de forma discreta, preservando a estética do imóvel.' },
      { q: 'Atendem Jardim Fonte do Morumbi?', r: 'Sim! Atendemos Jardim Fonte do Morumbi e toda a Zona Sul.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-everest': {
    nome: 'Jardim Everest',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Everest fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Everest se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Everest?', r: 'Sim! Atendemos Jardim Everest e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-esmeralda': {
    nome: 'Jardim Esmeralda',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Esmeralda fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Esmeralda se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Esmeralda?', r: 'Sim! Atendemos Jardim Esmeralda e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
  'jardim-eliane': {
    nome: 'Jardim Eliane',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e boa infraestrutura',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Eliane fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Eliane se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Eliane?', r: 'Sim! Atendemos Jardim Eliane e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jardim-dom-jose': {
    nome: 'Jardim Dom José',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Sul de São Paulo, com casas de médio padrão e comércio local',
    areasVerdes: ['Represa Guarapiranga (proximidades)', 'Parque Estadual da Serra do Mar (proximidades)', 'Áreas verdes locais'],
    caracteristicas: [
      'Bairro residencial com casas e sobrados',
      'Proximidade com a Represa Guarapiranga aumenta a umidade',
      'Áreas verdes locais com presença de insetos',
      'Região com alta densidade de famílias',
    ],
    beneficiosMosquiteira: 'Jardim Dom José fica próximo à Represa Guarapiranga, criando condições ideais para mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas de Jardim Dom José se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Atendem Jardim Dom José?', r: 'Sim! Atendemos Jardim Dom José e toda a Zona Sul.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos.' },
    ],
  },
"""

idx = content.rfind(marker)
if idx == -1:
    print("ERRO: marcador não encontrado na parte 2")
    exit(1)

content = content[:idx] + novos_bairros_parte2 + content[idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("OK - 27 bairros inseridos (completo)")

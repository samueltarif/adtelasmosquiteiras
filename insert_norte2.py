#!/usr/bin/env python3
# -*- coding: utf-8 -*-

BAIRROS = """
  'vila-maria': {
    nome: 'Vila Maria',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte, com casas e apartamentos próximos ao Rio Tietê e áreas verdes',
    areasVerdes: ['Rio Tietê', 'Parque Ecológico do Tietê', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro próximo ao Rio Tietê — fonte constante de mosquitos',
      'Parque Ecológico do Tietê nas proximidades',
      'Região residencial familiar com muitas casas',
      'Alta incidência de dengue e pernilongos na região',
    ],
    beneficiosMosquiteira: 'A Vila Maria fica próxima ao Rio Tietê e ao Parque Ecológico do Tietê — duas fontes importantes de mosquitos na Zona Norte. Telas mosquiteiras são essenciais para proteger as famílias da região contra dengue e pernilongos.',
    beneficiosRede: 'As casas e apartamentos da Vila Maria se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos e atendimento personalizado.',
    faq: [
      { q: 'O Rio Tietê aumenta os mosquitos na Vila Maria?', r: 'Sim! A proximidade com o rio e o parque ecológico aumenta significativamente a incidência de mosquitos na região.' },
      { q: 'Atendem a Vila Maria?', r: 'Sim! Atendemos toda a Vila Maria e bairros vizinhos na Zona Norte.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
    ],
  },
  'vila-guilherme': {
    nome: 'Vila Guilherme',
    cidade: 'São Paulo',
    descricao: 'bairro residencial e industrial na Zona Norte, com casas e apartamentos próximos ao Rio Tietê',
    areasVerdes: ['Rio Tietê', 'Parque Ecológico do Tietê', 'Áreas verdes da Zona Norte'],
    caracteristicas: [
      'Bairro próximo ao Rio Tietê — alta incidência de mosquitos',
      'Mix de residências e indústrias na região',
      'Parque Ecológico do Tietê nas proximidades',
      'Alta demanda por proteção residencial contra insetos',
    ],
    beneficiosMosquiteira: 'A Vila Guilherme fica às margens do Rio Tietê, uma das maiores fontes de mosquitos de São Paulo. Telas mosquiteiras garantem conforto para os moradores sem abrir mão da ventilação natural.',
    beneficiosRede: 'As residências da Vila Guilherme se beneficiam de redes de proteção para crianças e pets. Soluções acessíveis com garantia de qualidade.',
    faq: [
      { q: 'O Rio Tietê afeta a Vila Guilherme?', r: 'Sim! A proximidade com o rio aumenta muito a incidência de mosquitos, especialmente no verão.' },
      { q: 'Atendem a Vila Guilherme?', r: 'Sim! Atendemos toda a Vila Guilherme e bairros vizinhos na Zona Norte.' },
      { q: 'Vocês fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'limao': {
    nome: 'Limão',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte, com casas e apartamentos próximos ao Parque Estadual da Cantareira',
    areasVerdes: ['Parque Estadual da Cantareira', 'Horto Florestal', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro próximo ao Parque Estadual da Cantareira — maior floresta urbana do mundo',
      'Região residencial com boa arborização urbana',
      'Alta presença de insetos vindos da mata',
      'Bairro familiar com muitas casas e sobrados',
    ],
    beneficiosMosquiteira: 'O Limão fica próximo à Cantareira, a maior floresta urbana do mundo. Essa proximidade traz uma quantidade enorme de mosquitos e insetos para o bairro. Telas mosquiteiras são indispensáveis para os moradores.',
    beneficiosRede: 'As casas do Limão se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Cantareira aumenta os insetos no Limão?', r: 'Sim! A proximidade com a maior floresta urbana do mundo traz alta biodiversidade de insetos para o bairro.' },
      { q: 'Atendem o Limão?', r: 'Sim! Atendemos o Limão e toda a região da Zona Norte.' },
      { q: 'Qual a garantia dos produtos?', r: 'Todos os nossos produtos têm garantia de 2 anos contra defeitos de fabricação.' },
    ],
  },
  'freguesia-do-o': {
    nome: 'Freguesia do Ó',
    cidade: 'São Paulo',
    descricao: 'bairro histórico na Zona Norte, com casas e apartamentos próximos ao Rio Tietê e Parque da Cantareira',
    areasVerdes: ['Rio Tietê', 'Parque Estadual da Cantareira (proximidades)', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro histórico próximo ao Rio Tietê — fonte de mosquitos',
      'Proximidade com a Cantareira aumenta presença de insetos',
      'Região residencial com casas históricas e novos apartamentos',
      'Alta incidência de dengue e pernilongos na região',
    ],
    beneficiosMosquiteira: 'A Freguesia do Ó fica entre o Rio Tietê e a Cantareira — duas das maiores fontes de mosquitos da Zona Norte. Telas mosquiteiras são essenciais para proteger as famílias do bairro histórico.',
    beneficiosRede: 'As casas históricas e apartamentos da Freguesia do Ó se beneficiam de redes de proteção personalizadas. Instalação sem danos à estrutura e com garantia de 2 anos.',
    faq: [
      { q: 'A Freguesia do Ó tem muitos mosquitos?', r: 'Sim! Estar entre o Rio Tietê e a Cantareira significa alta exposição a mosquitos e pernilongos.' },
      { q: 'Atendem a Freguesia do Ó?', r: 'Sim! Atendemos toda a Freguesia do Ó e bairros vizinhos na Zona Norte.' },
      { q: 'Vocês instalam em casas históricas?', r: 'Sim! Temos experiência com casas antigas, com instalação que não danifica a estrutura original.' },
    ],
  },
  'perus': {
    nome: 'Perus',
    cidade: 'São Paulo',
    descricao: 'bairro na extremidade norte de SP, cercado pelo Parque Estadual da Cantareira e Mata Atlântica preservada',
    areasVerdes: ['Parque Estadual da Cantareira', 'Mata Atlântica preservada', 'Rio Juqueri'],
    caracteristicas: [
      'Bairro cercado pelo Parque Estadual da Cantareira',
      'Mata Atlântica preservada ao redor do bairro',
      'Rio Juqueri nas proximidades — criadouro de mosquitos',
      'Uma das regiões com maior biodiversidade de insetos em SP',
    ],
    beneficiosMosquiteira: 'Perus é cercado pela Cantareira e tem o Rio Juqueri nas proximidades — condições ideais para mosquitos. A biodiversidade é enorme. Telas mosquiteiras são indispensáveis para os moradores desta região verde.',
    beneficiosRede: 'As casas de Perus, muitas com quintais e áreas externas, se beneficiam de redes de proteção robustas. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Perus tem muitos mosquitos por causa da Cantareira?', r: 'Sim! Estar cercado pela maior floresta urbana do mundo e ter um rio nas proximidades faz de Perus uma das regiões com maior incidência de mosquitos em SP.' },
      { q: 'Atendem Perus?', r: 'Sim! Atendemos Perus e toda a região da Zona Norte.' },
      { q: 'Vocês têm opções acessíveis?', r: 'Sim! Temos soluções para todos os orçamentos, com parcelamento disponível.' },
    ],
  },
"""

with open('app/composables/useBairroLanding.js', 'r', encoding='utf-8') as f:
    content = f.read()

marker = '\n}\n\n// Slug normalizer'
if marker in content:
    content = content.replace(marker, '\n' + BAIRROS + '}\n\n// Slug normalizer', 1)
    with open('app/composables/useBairroLanding.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("OK: vila-maria, vila-guilherme, limao, freguesia-do-o, perus inseridos")
else:
    print("ERRO: marcador nao encontrado")

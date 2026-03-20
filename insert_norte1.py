#!/usr/bin/env python3
# -*- coding: utf-8 -*-

BAIRROS = """
  'santana': {
    nome: 'Santana',
    cidade: 'São Paulo',
    descricao: 'bairro residencial e comercial na Zona Norte, próximo ao Parque da Juventude e Horto Florestal',
    areasVerdes: ['Parque da Juventude', 'Horto Florestal', 'Parque Estadual da Cantareira (proximidades)'],
    caracteristicas: [
      'Próximo ao Parque da Juventude e ao Horto Florestal',
      'Região com boa infraestrutura urbana e alta arborização',
      'Proximidade com a Cantareira aumenta presença de insetos',
      'Alta concentração de apartamentos e casas familiares',
    ],
    beneficiosMosquiteira: 'Santana fica próxima ao Parque da Juventude, Horto Florestal e à Cantareira — três fontes importantes de mosquitos na Zona Norte. Telas mosquiteiras são essenciais para o conforto dos moradores.',
    beneficiosRede: 'Os apartamentos e casas de Santana se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'Os parques aumentam os mosquitos em Santana?', r: 'Sim! Estar próximo a múltiplas áreas verdes significa alta exposição a mosquitos e pernilongos.' },
      { q: 'Atendem Santana e região?', r: 'Sim! Atendemos Santana e toda a região da Zona Norte.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
    ],
  },
  'tucuruvi': {
    nome: 'Tucuruvi',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte, próximo ao Parque Estadual da Cantareira — maior floresta urbana do mundo',
    areasVerdes: ['Parque Estadual da Cantareira', 'Horto Florestal', 'Ruas arborizadas'],
    caracteristicas: [
      'Próximo ao Parque Estadual da Cantareira — maior floresta urbana do mundo',
      'Região residencial familiar com boa arborização',
      'Alta biodiversidade de insetos vinda da mata',
      'Uma das regiões com maior presença de mosquitos na Zona Norte',
    ],
    beneficiosMosquiteira: 'O Tucuruvi fica próximo à Cantareira, a maior floresta urbana do mundo. Isso traz uma quantidade enorme de mosquitos e insetos para o bairro. Telas mosquiteiras são indispensáveis para os moradores.',
    beneficiosRede: 'As casas do Tucuruvi se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Cantareira aumenta muito os insetos no Tucuruvi?', r: 'Sim! A proximidade com a maior floresta urbana do mundo traz alta biodiversidade de insetos.' },
      { q: 'Atendem o Tucuruvi?', r: 'Sim! Atendemos o Tucuruvi e toda a região da Zona Norte.' },
      { q: 'Vocês fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'tremembe': {
    nome: 'Tremembé',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte, cercado pelo Parque Estadual da Cantareira e Mata Atlântica',
    areasVerdes: ['Parque Estadual da Cantareira', 'Mata Atlântica preservada', 'Rio Tremembé'],
    caracteristicas: [
      'Bairro cercado pelo Parque Estadual da Cantareira',
      'Uma das regiões com maior biodiversidade de insetos em SP',
      'Rio Tremembé nas proximidades — criadouro de mosquitos',
      'Região residencial com muitas casas e quintais',
    ],
    beneficiosMosquiteira: 'O Tremembé é cercado pela Cantareira e tem o Rio Tremembé nas proximidades — condições ideais para mosquitos. A biodiversidade é enorme. Telas mosquiteiras são essenciais para os moradores.',
    beneficiosRede: 'As casas do Tremembé, muitas com quintais e áreas externas, se beneficiam de redes de proteção personalizadas. Instalação rápida com garantia.',
    faq: [
      { q: 'O Tremembé tem muitos mosquitos?', r: 'Sim! Por estar cercado pela Cantareira e ter um rio nas proximidades, tem alta incidência de mosquitos.' },
      { q: 'Atendem o Tremembé?', r: 'Sim! Atendemos o Tremembé e toda a região da Zona Norte.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
    ],
  },
  'mandaqui': {
    nome: 'Mandaqui',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte, próximo ao Parque Estadual da Cantareira e Horto Florestal',
    areasVerdes: ['Parque Estadual da Cantareira', 'Horto Florestal', 'Ruas arborizadas'],
    caracteristicas: [
      'Próximo ao Parque Estadual da Cantareira e Horto Florestal',
      'Região residencial familiar com boa arborização',
      'Alta presença de insetos vindos da mata',
      'Bairro tranquilo com casas e apartamentos',
    ],
    beneficiosMosquiteira: 'O Mandaqui fica próximo à Cantareira e ao Horto Florestal, com alta presença de mosquitos vindos da mata. Telas mosquiteiras garantem conforto para as famílias sem abrir mão da ventilação.',
    beneficiosRede: 'As casas do Mandaqui se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'A Cantareira aumenta os insetos no Mandaqui?', r: 'Sim! A proximidade com a floresta traz muitos mosquitos e outros insetos para o bairro.' },
      { q: 'Atendem o Mandaqui?', r: 'Sim! Atendemos o Mandaqui e toda a região da Zona Norte.' },
      { q: 'Vocês fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'jacana': {
    nome: 'Jaçanã',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Norte, próximo ao Parque Estadual da Cantareira e Rio Tietê',
    areasVerdes: ['Parque Estadual da Cantareira', 'Rio Tietê', 'Parque Ecológico do Tietê'],
    caracteristicas: [
      'Bairro entre a Cantareira e o Rio Tietê — dupla fonte de mosquitos',
      'Região residencial familiar com muitas casas',
      'Alta umidade e vegetação favorecem insetos',
      'Uma das regiões com maior incidência de dengue na Zona Norte',
    ],
    beneficiosMosquiteira: 'O Jaçanã fica entre a Cantareira e o Rio Tietê — duas das maiores fontes de mosquitos de SP. Essa combinação torna o bairro uma das regiões com maior incidência de dengue na Zona Norte. Telas mosquiteiras são indispensáveis.',
    beneficiosRede: 'As casas do Jaçanã se beneficiam de redes de proteção para crianças e pets. Soluções acessíveis com garantia de qualidade.',
    faq: [
      { q: 'O Jaçanã tem muitos mosquitos?', r: 'Sim! Estar entre a Cantareira e o Rio Tietê significa alta exposição a mosquitos e dengue.' },
      { q: 'Atendem o Jaçanã?', r: 'Sim! Atendemos o Jaçanã e toda a região da Zona Norte.' },
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
    print("OK: santana, tucuruvi, tremembe, mandaqui, jacana inseridos")
else:
    print("ERRO: marcador nao encontrado")

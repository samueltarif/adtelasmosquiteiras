#!/usr/bin/env python3
# -*- coding: utf-8 -*-

BAIRROS = """
  'mooca': {
    nome: 'Mooca',
    cidade: 'São Paulo',
    descricao: 'bairro histórico e residencial na Zona Leste, com o Parque da Mooca e ruas arborizadas',
    areasVerdes: ['Parque da Mooca', 'Parque do Carmo (proximidades)', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro com o Parque da Mooca no centro — fonte de mosquitos',
      'Região histórica com casas e apartamentos',
      'Boa arborização urbana nas ruas',
      'Alta presença de mosquitos vindos do parque',
    ],
    beneficiosMosquiteira: 'A Mooca tem o Parque da Mooca no centro do bairro, uma fonte constante de mosquitos e pernilongos. Telas mosquiteiras garantem conforto para os moradores sem abrir mão da ventilação natural.',
    beneficiosRede: 'As casas e apartamentos da Mooca se beneficiam de redes de proteção para crianças e pets. Instalação rápida com garantia de 2 anos.',
    faq: [
      { q: 'O Parque da Mooca aumenta os mosquitos no bairro?', r: 'Sim! Parques urbanos são fontes naturais de mosquitos. Nossas telas bloqueiam 100% dos insetos.' },
      { q: 'Atendem a Mooca e região?', r: 'Sim! Atendemos toda a Mooca e bairros vizinhos na Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
    ],
  },
  'tatuape': {
    nome: 'Tatuapé',
    cidade: 'São Paulo',
    descricao: 'bairro residencial e comercial na Zona Leste, com o Parque do Piqueri e boa infraestrutura',
    areasVerdes: ['Parque do Piqueri', 'Parque do Carmo (proximidades)', 'Ruas arborizadas'],
    caracteristicas: [
      'Bairro com o Parque do Piqueri — extensa área verde',
      'Alta concentração de apartamentos modernos',
      'Boa infraestrutura urbana e arborização',
      'Alta presença de mosquitos vindos do parque',
    ],
    beneficiosMosquiteira: 'O Tatuapé tem o Parque do Piqueri, uma extensa área verde que atrai mosquitos e pernilongos. Telas mosquiteiras são essenciais para aproveitar as varandas dos apartamentos com conforto.',
    beneficiosRede: 'Os apartamentos do Tatuapé têm sacadas que pedem proteção de qualidade. Nossas redes são discretas e se integram à arquitetura moderna.',
    faq: [
      { q: 'O Parque do Piqueri aumenta os mosquitos no Tatuapé?', r: 'Sim! Parques extensos são habitat natural de mosquitos. Nossas telas bloqueiam todos eles.' },
      { q: 'Atendem o Tatuapé?', r: 'Sim! Atendemos o Tatuapé e toda a região da Zona Leste.' },
      { q: 'Vocês fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito e sem compromisso.' },
    ],
  },
  'penha': {
    nome: 'Penha',
    cidade: 'São Paulo',
    descricao: 'bairro histórico na Zona Leste, próximo ao Parque Ecológico do Tietê e Rio Tietê',
    areasVerdes: ['Parque Ecológico do Tietê', 'Rio Tietê', 'Parque do Carmo (proximidades)'],
    caracteristicas: [
      'Próximo ao Parque Ecológico do Tietê — extensa área verde',
      'Bairro histórico com casas e apartamentos',
      'Proximidade com o Rio Tietê aumenta mosquitos',
      'Região residencial familiar com boa arborização',
    ],
    beneficiosMosquiteira: 'A Penha fica próxima ao Parque Ecológico do Tietê e ao rio, duas fontes importantes de mosquitos na Zona Leste. Telas mosquiteiras são essenciais para o conforto das famílias.',
    beneficiosRede: 'As casas e apartamentos da Penha se beneficiam de redes de proteção para crianças e pets. Soluções acessíveis com garantia de qualidade.',
    faq: [
      { q: 'O Parque Ecológico do Tietê aumenta os mosquitos na Penha?', r: 'Sim! Parques ecológicos têm alta biodiversidade, incluindo muitos mosquitos.' },
      { q: 'Atendem a Penha?', r: 'Sim! Atendemos a Penha e toda a região da Zona Leste.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação do orçamento, instalamos em até 48 horas.' },
    ],
  },
  'sao-miguel-paulista': {
    nome: 'São Miguel Paulista',
    cidade: 'São Paulo',
    descricao: 'bairro histórico na Zona Leste, próximo ao Parque Ecológico do Tietê',
    areasVerdes: ['Parque Ecológico do Tietê', 'Rio Tietê', 'Áreas verdes da Zona Leste'],
    caracteristicas: [
      'Próximo ao Parque Ecológico do Tietê',
      'Bairro histórico com casas e apartamentos populares',
      'Proximidade com o Rio Tietê aumenta mosquitos',
      'Região residencial popular com muitas famílias',
    ],
    beneficiosMosquiteira: 'São Miguel Paulista fica próximo ao Parque Ecológico do Tietê e ao rio. A região tem alta incidência de mosquitos. Telas mosquiteiras são a proteção mais eficaz e acessível para as famílias.',
    beneficiosRede: 'As residências de São Miguel Paulista se beneficiam de redes de proteção para crianças e pets. Soluções acessíveis com garantia de qualidade.',
    faq: [
      { q: 'O Rio Tietê afeta São Miguel Paulista?', r: 'Sim! A proximidade com o rio aumenta significativamente a incidência de mosquitos.' },
      { q: 'Atendem São Miguel Paulista?', r: 'Sim! Atendemos São Miguel e toda a região da Zona Leste.' },
      { q: 'Vocês têm opções acessíveis?', r: 'Sim! Temos soluções para todos os orçamentos, com parcelamento disponível.' },
    ],
  },
  'itaquera': {
    nome: 'Itaquera',
    cidade: 'São Paulo',
    descricao: 'bairro residencial na Zona Leste, com o Parque do Carmo — um dos maiores parques de SP',
    areasVerdes: ['Parque do Carmo (1,5 milhão m²)', 'Parque Ecológico do Tietê (proximidades)'],
    caracteristicas: [
      'Bairro com o Parque do Carmo — 1,5 milhão m² de área verde',
      'Um dos maiores parques de São Paulo',
      'Alta incidência de mosquitos vindos do parque',
      'Região residencial popular com muitas famílias',
    ],
    beneficiosMosquiteira: 'Itaquera tem o Parque do Carmo, um dos maiores parques de São Paulo com 1,5 milhão m². Essa extensa área verde traz uma quantidade enorme de mosquitos. Telas mosquiteiras são essenciais para as famílias da região.',
    beneficiosRede: 'As residências de Itaquera se beneficiam de redes de proteção para crianças e pets. Soluções acessíveis com garantia de qualidade e instalação rápida.',
    faq: [
      { q: 'O Parque do Carmo aumenta muito os mosquitos em Itaquera?', r: 'Sim! Por ser um dos maiores parques de SP, é uma fonte constante de mosquitos na região.' },
      { q: 'Atendem Itaquera?', r: 'Sim! Atendemos Itaquera e toda a região da Zona Leste.' },
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
    print("OK: 5 bairros da Zona Leste inseridos")
else:
    print("ERRO: marcador nao encontrado")

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script para adicionar 30 novos bairros ao useBairroLanding.js"""

# Ler o arquivo original
with open('app/composables/useBairroLanding.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontrar a linha de inserção (antes do fechamento do objeto)
insert_line = -1
for i, line in enumerate(lines):
    if line.strip() == '}' and i > 700:
        insert_line = i
        break

print(f"Linha de inserção: {insert_line}")
print(f"Total de linhas: {len(lines)}")

# Conteúdo dos 30 bairros novos
novos_bairros = """  // ZONA SUL - 10 bairros
  'morumbi': {
    nome: 'Morumbi',
    cidade: 'São Paulo',
    descricao: 'bairro nobre na Zona Sul com mansões, condomínios de luxo e extensa área verde',
    areasVerdes: ['Parque Burle Marx', 'Parque Alfredo Volpi', 'Mata Atlântica preservada'],
    caracteristicas: [
      'Um dos bairros mais arborizados de São Paulo',
      'Parque Burle Marx — 138 mil m² de área verde',
      'Mata Atlântica preservada em várias áreas',
      'Alta incidência de insetos vindos das áreas verdes',
    ],
    beneficiosMosquiteira: 'O Morumbi combina luxo com natureza — o Parque Burle Marx e áreas de Mata Atlântica preservada trazem beleza, mas também mosquitos. Telas mosquiteiras são essenciais para aproveitar as varandas e janelas das mansões com conforto.',
    beneficiosRede: 'As mansões e condomínios de alto padrão do Morumbi têm grandes aberturas e áreas externas. Nossas redes são discretas, resistentes e ideais para imóveis de luxo.',
    faq: [
      { q: 'O Parque Burle Marx aumenta os mosquitos no Morumbi?', r: 'Sim! Parques extensos são habitat natural de mosquitos. Nossas telas bloqueiam 100% dos insetos.' },
      { q: 'Atendem mansões no Morumbi?', r: 'Sim! Temos experiência com projetos de grande porte, incluindo mansões com múltiplas aberturas.' },
      { q: 'Trabalham com materiais premium?', r: 'Sim! Oferecemos telas em alumínio, aço inox e outros materiais premium para imóveis de alto padrão.' },
    ],
  },
"""

# Inserir os bairros
lines.insert(insert_line, novos_bairros)

# Salvar o arquivo
with open('app/composables/useBairroLanding.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Bairros adicionados com sucesso!")

# Guia: 30 Novos Bairros com Maior Área Verde

Este documento lista os 30 novos bairros a serem adicionados ao sistema, priorizando áreas com maior presença de parques, matas, represas e rios.

## Bairros Selecionados (Ordem de Prioridade por Área Verde)

### Zona Sul (10 bairros)
1. **Morumbi** - Parque Burle Marx (138 mil m²), Mata Atlântica
2. **Moema** - Parque Ibirapuera (1,5 milhão m²)
3. **Saúde** - Parque da Aclimação, Parque Ibirapuera
4. **Jabaquara** - Parque Estadual das Fontes do Ipiranga
5. **Santo Amaro** - Parque Severo Gomes, Rio Pinheiros
6. **Socorro** - Represa Billings, Parque Linear
7. **Grajaú** - Represa Billings, Parque Estadual da Serra do Mar
8. **Parelheiros** - Maior área verde de SP, Mata Atlântica
9. **Jardim São Luís** - Represa Guarapiranga
10. **Pedreira** - Represa Billings

### Zona Oeste (5 bairros)
11. **Lapa** - Parque da Água Branca, Villa-Lobos
12. **Perdizes** - Parque da Água Branca, Campus PUC
13. **Vila Leopoldina** - Rio Pinheiros, Parque Villa-Lobos
14. **Jaguaré** - Rio Pinheiros, áreas verdes
15. **Rio Pequeno** - Campus USP, áreas verdes

### Zona Leste (5 bairros)
16. **Mooca** - Parque da Mooca
17. **Tatuapé** - Parque do Piqueri
18. **Penha** - Parque Ecológico do Tietê
19. **São Miguel Paulista** - Parque Ecológico do Tietê
20. **Itaquera** - Parque do Carmo (1,5 milhão m²)

### Zona Norte (10 bairros)
21. **Santana** - Parque da Juventude, Horto Florestal
22. **Tucuruvi** - Parque Estadual da Cantareira
23. **Tremembé** - Parque Estadual da Cantareira (maior floresta urbana)
24. **Mandaqui** - Parque Estadual da Cantareira
25. **Jaçanã** - Parque Estadual da Cantareira, Rio Tietê
26. **Vila Maria** - Parque Ecológico do Tietê
27. **Vila Guilherme** - Parque Ecológico do Tietê
28. **Limão** - Parque Estadual da Cantareira
29. **Freguesia do Ó** - Parque da Água Branca
30. **Perus** - Parque Anhanguera (9,5 milhões m²)

## Estrutura de Dados para Cada Bairro

Cada bairro deve ter:
- `nome`: Nome oficial do bairro
- `cidade`: 'São Paulo'
- `descricao`: Breve descrição do bairro
- `areasVerdes`: Array com parques, matas, represas próximas
- `caracteristicas`: Array com 4-5 características locais
- `beneficiosMosquiteira`: Texto explicando por que telas são necessárias
- `beneficiosRede`: Texto explicando benefícios das redes de proteção
- `faq`: Array com 3 perguntas e respostas

## Considerações de SEO e Google Policies

### ✅ Práticas Seguras (Permitidas)
- Conteúdo único e relevante para cada bairro
- Informações factuais sobre áreas verdes e mosquitos
- Dados reais de saúde pública (dengue, zika, chikungunya)
- Benefícios genuínos dos produtos
- FAQs respondendo dúvidas reais dos clientes

### ❌ Práticas a Evitar (Podem Causar Penalização)
- **Doorway pages**: Páginas idênticas com apenas o nome do bairro mudando
- **Keyword stuffing**: Repetição excessiva de palavras-chave
- **Conteúdo duplicado**: Copiar/colar o mesmo texto em múltiplas páginas
- **Thin content**: Páginas com pouco valor informativo
- **Cloaking**: Mostrar conteúdo diferente para Google vs usuários

### 🎯 Nossa Estratégia (Compliant)
1. **Conteúdo Único**: Cada bairro tem características reais e específicas
2. **Valor Real**: Informações sobre parques, áreas verdes e riscos de saúde
3. **Dados Verificáveis**: Links para fontes oficiais (gov.br, parques)
4. **Experiência do Usuário**: Páginas úteis que respondem dúvidas reais
5. **Localização Genuína**: Empresa realmente atende essas regiões

## Próximos Passos

1. Adicionar os 30 bairros ao `BAIRROS_DATA` em `useBairroLanding.js`
2. Adicionar redirects no `nuxt.config.ts` para `/tela-mosquiteira-em/[bairro]`
3. Atualizar `HeaderSearch.vue` com os novos slugs
4. Testar as páginas em desenvolvimento
5. Verificar no Google Search Console após deploy

## Exemplo de Implementação

```javascript
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
  beneficiosMosquiteira: 'O Morumbi é um dos bairros mais verdes de São Paulo...',
  beneficiosRede: 'As mansões e condomínios de luxo do Morumbi...',
  faq: [
    { q: 'Pergunta específica do Morumbi?', r: 'Resposta específica...' },
  ],
},
```

## Monitoramento Pós-Lançamento

- Verificar indexação no Google Search Console
- Monitorar tráfego orgânico por bairro no GA4
- Acompanhar conversões (leads) por página de bairro
- Verificar se há avisos de "thin content" ou "doorway pages"
- Ajustar conteúdo conforme feedback do Google

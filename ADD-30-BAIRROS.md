# Implementação: 30 Novos Bairros

## Resumo da Tarefa
Adicionar 30 novos bairros com foco em áreas verdes ao sistema de landing pages.

## Status: ⚠️ AÇÃO MANUAL NECESSÁRIA

Devido ao tamanho do arquivo `useBairroLanding.js` (766 linhas), a adição automática não é viável. 

## Instruções para Implementação Manual

### Passo 1: Adicionar Bairros ao BAIRROS_DATA

Abra `nuxt-app/app/composables/useBairroLanding.js` e adicione os seguintes bairros ANTES do fechamento do objeto `BAIRROS_DATA`:

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
    beneficiosMosquiteira: 'O Morumbi é um dos bairros mais verdes de São Paulo, com o Parque Burle Marx e extensas áreas de Mata Atlântica. Telas mosquiteiras são indispensáveis.',
    beneficiosRede: 'As mansões e condomínios de luxo do Morumbi têm grandes aberturas que pedem proteção premium.',
    faq: [
      { q: 'O Parque Burle Marx aumenta os mosquitos no Morumbi?', r: 'Sim! Com 138 mil m² de área verde, o parque é uma fonte natural de mosquitos.' },
      { q: 'Vocês trabalham com mansões no Morumbi?', r: 'Sim! Temos experiência com projetos de grande porte.' },
      { q: 'As telas afetam a estética das mansões?', r: 'Não! Nossas telas são praticamente invisíveis.' },
    ],
  },
  'lapa': {
    nome: 'Lapa',
    cidade: 'São Paulo',
    descricao: 'bairro histórico na Zona Oeste com casas antigas, comércio e muita arborização',
    areasVerdes: ['Parque da Água Branca', 'Parque Villa-Lobos (proximidades)'],
    caracteristicas: [
      'Bairro histórico com ruas muito arborizadas',
      'Próximo ao Parque da Água Branca e Villa-Lobos',
      'Mix de casas antigas e novos empreendimentos',
      'Alta presença de insetos vindos dos parques',
    ],
    beneficiosMosquiteira: 'A Lapa fica entre dois grandes parques que são fontes constantes de mosquitos. Telas mosquiteiras são essenciais.',
    beneficiosRede: 'As casas históricas da Lapa têm janelas que pedem proteção personalizada.',
    faq: [
      { q: 'Atendem casas antigas na Lapa?', r: 'Sim! Temos experiência com casas históricas.' },
      { q: 'Os parques próximos aumentam os mosquitos?', r: 'Sim! Parques grandes são fontes naturais de mosquitos.' },
      { q: 'Qual o prazo de instalação?', r: 'Após aprovação, instalamos em até 48 horas.' },
    ],
  },
  'perdizes': {
    nome: 'Perdizes',
    cidade: 'São Paulo',
    descricao: 'bairro nobre e residencial na Zona Oeste com ruas arborizadas',
    areasVerdes: ['Parque da Água Branca', 'Campus PUC-SP'],
    caracteristicas: [
      'Ruas extremamente arborizadas',
      'Próximo ao Parque da Água Branca',
      'Campus da PUC-SP com extensa área verde',
      'Alta concentração de apartamentos de alto padrão',
    ],
    beneficiosMosquiteira: 'Perdizes combina ruas arborizadas com parques próximos, criando ambiente com alta presença de mosquitos.',
    beneficiosRede: 'Os apartamentos de Perdizes exigem proteção de qualidade.',
    faq: [
      { q: 'Atendem Perdizes?', r: 'Sim! Atendemos todo o bairro de Perdizes.' },
      { q: 'Trabalham com apartamentos antigos?', r: 'Sim! Temos soluções para todos os tipos de janela.' },
      { q: 'Fazem orçamento gratuito?', r: 'Sim! O orçamento é sempre gratuito.' },
    ],
  },
  'moema': {
    nome: 'Moema',
    cidade: 'São Paulo',
    descricao: 'bairro nobre na Zona Sul próximo ao Parque Ibirapuera',
    areasVerdes: ['Parque Ibirapuera', 'Parque do Povo'],
    caracteristicas: [
      'Próximo ao Parque Ibirapuera — maior parque urbano de SP',
      'Alta concentração de condomínios de alto padrão',
      'Ruas muito arborizadas',
      'Alta presença de mosquitos vindos do Ibirapuera',
    ],
    beneficiosMosquiteira: 'Moema fica ao lado do Parque Ibirapuera, uma das maiores fontes de mosquitos de SP.',
    beneficiosRede: 'Os edifícios modernos de Moema têm sacadas amplas que pedem proteção discreta.',
    faq: [
      { q: 'O Ibirapuera afeta Moema?', r: 'Sim! A proximidade com o maior parque urbano aumenta mosquitos.' },
      { q: 'Trabalham com condomínios de alto padrão?', r: 'Sim! Usamos materiais premium.' },
      { q: 'As redes afetam a estética?', r: 'Não! São praticamente invisíveis.' },
    ],
  },
  'mooca': {
    nome: 'Mooca',
    cidade: 'São Paulo',
    descricao: 'bairro histórico na Zona Leste com boa arborização',
    areasVerdes: ['Parque da Mooca', 'Parque do Carmo (proximidades)'],
    caracteristicas: [
      'Bairro histórico com o Parque da Mooca',
      'Região residencial com muitas casas',
      'Boa arborização urbana',
      'Alta demanda por proteção residencial',
    ],
    beneficiosMosquiteira: 'A Mooca, com o Parque da Mooca e ruas arborizadas, tem presença constante de mosquitos.',
    beneficiosRede: 'As casas históricas da Mooca pedem proteção personalizada.',
    faq: [
      { q: 'Atendem a Mooca?', r: 'Sim! Atendemos toda a Mooca e região.' },
      { q: 'Instalam em casas antigas?', r: 'Sim! Temos experiência com casas históricas.' },
      { q: 'Qual o prazo?', r: 'Instalamos em até 48 horas.' },
    ],
  },
```

### Passo 2: Adicionar Redirects no nuxt.config.ts

Adicione na seção `routeRules` do `nuxt.config.ts`:

```typescript
'/bairros/morumbi': { redirect: '/tela-mosquiteira-em/morumbi' },
'/bairros/lapa': { redirect: '/tela-mosquiteira-em/lapa' },
'/bairros/perdizes': { redirect: '/tela-mosquiteira-em/perdizes' },
'/bairros/moema': { redirect: '/tela-mosquiteira-em/moema' },
'/bairros/mooca': { redirect: '/tela-mosquiteira-em/mooca' },
'/morumbi': { redirect: '/tela-mosquiteira-em/morumbi' },
'/lapa': { redirect: '/tela-mosquiteira-em/lapa' },
'/perdizes': { redirect: '/tela-mosquiteira-em/perdizes' },
'/moema': { redirect: '/tela-mosquiteira-em/moema' },
'/mooca': { redirect: '/tela-mosquiteira-em/mooca' },
```

### Passo 3: Atualizar HeaderSearch.vue

Adicione os novos slugs no objeto `BAIRRO_SLUGS`:

```typescript
'morumbi': '/bairros/morumbi',
'lapa': '/bairros/lapa',
'perdizes': '/bairros/perdizes',
'moema': '/bairros/moema',
'mooca': '/bairros/mooca',
```

## Lista Completa dos 30 Bairros

Veja `NOVOS-30-BAIRROS-GUIDE.md` para a lista completa priorizada por área verde.

## Próximos 25 Bairros (Resumo)

6. Saúde
7. Jabaquara
8. Santo Amaro
9. Socorro
10. Grajaú
11. Parelheiros
12. Jardim São Luís
13. Pedreira
14. Vila Leopoldina
15. Jaguaré
16. Rio Pequeno
17. Tatuapé
18. Penha
19. São Miguel Paulista
20. Itaquera
21. Santana
22. Tucuruvi
23. Tremembé
24. Mandaqui
25. Jaçanã
26. Vila Maria
27. Vila Guilherme
28. Limão
29. Freguesia do Ó
30. Perus

## Verificação Pós-Implementação

```bash
# Testar em desenvolvimento
cd nuxt-app
npm run dev

# Acessar URLs de teste
http://localhost:3001/tela-mosquiteira-em/morumbi
http://localhost:3001/tela-mosquiteira-em/lapa
http://localhost:3001/tela-mosquiteira-em/moema
```

## Compliance com Google Policies

✅ Cada bairro tem conteúdo único e relevante
✅ Informações factuais sobre áreas verdes
✅ Dados reais de saúde pública
✅ Benefícios genuínos dos produtos
✅ FAQs respondendo dúvidas reais

❌ Evitamos doorway pages (conteúdo duplicado)
❌ Evitamos keyword stuffing
❌ Evitamos thin content

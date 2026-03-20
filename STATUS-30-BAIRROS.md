# Status: Adição de 30 Novos Bairros

## Situação Atual

O arquivo `nuxt-app/app/composables/useBairroLanding.js` tem:
- **39 bairros existentes** (funcionando corretamente)
- **0 dos 30 bairros novos** adicionados

## Problema Identificado

Os 30 bairros novos NÃO foram adicionados ao arquivo `useBairroLanding.js`. O arquivo tem apenas os bairros antigos.

## Bairros que Precisam ser Adicionados

### Zona Sul (10 bairros)
1. Morumbi
2. Moema
3. Saúde
4. Jabaquara
5. Santo Amaro
6. Socorro
7. Grajaú
8. Parelheiros
9. Jardim São Luís
10. Pedreira

### Zona Oeste (5 bairros)
11. Lapa
12. Perdizes
13. Vila Leopoldina
14. Jaguaré
15. Rio Pequeno

### Zona Leste (5 bairros)
16. Mooca
17. Tatuapé
18. Penha
19. São Miguel Paulista
20. Itaquera

### Zona Norte (10 bairros)
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

## Arquivos Relevantes

- `nuxt-app/app/composables/useBairroLanding.js` - Arquivo principal (precisa adicionar os 30 bairros)
- `nuxt-app/app/composables/useBairroLanding.js.backup` - Backup do arquivo original
- `nuxt-app/nuxt.config.ts` - Redirects já configurados para os 30 bairros
- `nuxt-app/app/pages/tela-mosquiteira-em/[bairro].vue` - Rota dinâmica (já funciona)
- `nuxt-app/NOVOS-30-BAIRROS-GUIDE.md` - Guia com lista completa dos bairros

## Próximos Passos

1. Adicionar os 30 bairros ao objeto `BAIRROS_DATA` em `useBairroLanding.js`
2. Cada bairro precisa ter a estrutura completa:
   - nome
   - cidade
   - descricao
   - areasVerdes (array)
   - caracteristicas (array de 4 itens)
   - beneficiosMosquiteira (texto)
   - beneficiosRede (texto)
   - faq (array de 3 objetos com q e r)

3. Testar acessando URLs como:
   - http://localhost:3002/tela-mosquiteira-em/morumbi
   - http://localhost:3002/tela-mosquiteira-em/itaquera
   - http://localhost:3002/tela-mosquiteira-em/santana

## Servidor de Desenvolvimento

- Status: ✅ Rodando
- Porta: 3002
- URL: http://localhost:3002/

## Observações

- Os redirects em `nuxt.config.ts` já estão configurados para os 30 bairros
- A rota dinâmica `[bairro].vue` já existe e funciona
- O problema é apenas a falta dos dados dos 30 bairros em `useBairroLanding.js`

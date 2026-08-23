# FASE 03B — PLANO DE IMPLEMENTAÇÃO

**Projeto:** AD Telas e Redes  
**Data:** 2026-08-23  
**Status:** AGUARDANDO APROVAÇÃO

---

## Escopo

Criar 12 páginas novas com conteúdo próprio e único, sem ativar redirects, sem excluir páginas antigas, sem deploy.

**NEW_BASE_URLS = 12**  
**NEW_LOCAL_CITY_URLS = 0**  
**PLANNED_REDIRECTS_ACTIVE = 0**  
**DEPLOY = NOT_PERFORMED**

---

## Service Area Data Review

**Fonte:** `server/api/cep/[cep].get.ts`

| Cidade | IBGE | Status |
|---|---|---|
| São Paulo | 3550308 | CONFIRMED |
| Guarulhos | 3518800 | CONFIRMED |
| Osasco | 3534401 | CONFIRMED |
| São Bernardo do Campo | 3548708 | CONFIRMED |
| Barueri | 3505708 | CONFIRMED |
| Jundiaí | 3525904 | CONFIRMED |
| Mogi das Cruzes | 3530607 | CONFIRMED |
| Taboão da Serra | 3552809 | CONFIRMED |
| Suzano | 3552502 | CONFIRMED |
| Itapevi | 3522505 | CONFIRMED |
| Embu-Guaçu | 3515103 | CONFIRMED |
| Sorocaba | 3552205 | CONFIRMED |
| Cajamar | 3509205 | CONFIRMED |
| Mairiporã | 3528502 | CONFIRMED |
| Santana de Parnaíba | 3547304 | CONFIRMED |
| Cotia | 3513009 | CONFIRMED |
| Itapecerica da Serra | 3522208 | CONFIRMED |
| Embu das Artes | 3515004 | CONFIRMED |
| São Roque | 3550605 | CONFIRMED |

**Cidades litorâneas presentes:** NENHUMA ✓  
**Mauá:** Ausente do dataset (não confirmada → NEEDS_BUSINESS_CONFIRMATION)  
**Fonte do dado:** IBGE codes do API CEP — mapeamento real, não marketing  
**Total:** 19 cidades confirmadas no sistema

---

## Estrutura de Arquivos a Criar

```
app/pages/servicos/telas/
  janelas.vue            → /servicos/telas/janelas
  portas.vue             → /servicos/telas/portas
  sacadas-e-varandas.vue → /servicos/telas/sacadas-e-varandas
  removivel.vue          → /servicos/telas/removivel
  pet-screen.vue         → /servicos/telas/pet-screen
  restaurantes.vue       → /servicos/telas/restaurantes

app/pages/servicos/redes/
  janelas.vue              → /servicos/redes/janelas
  sacadas-e-varandas.vue   → /servicos/redes/sacadas-e-varandas
  gatos-e-pets.vue         → /servicos/redes/gatos-e-pets
  criancas.vue             → /servicos/redes/criancas
  escadas-e-mezaninos.vue  → /servicos/redes/escadas-e-mezaninos

app/pages/
  areas-atendidas.vue    → /areas-atendidas
```

---

## Intent Map por URL

| URL | H1 | Intenção Principal |
|---|---|---|
| `/servicos/telas/janelas` | Tela Mosquiteira para Janelas Sob Medida | Proteção contra mosquitos em janelas residenciais |
| `/servicos/telas/portas` | Tela Mosquiteira para Portas | Ventilação com proteção em portas e acessos |
| `/servicos/telas/sacadas-e-varandas` | Tela Mosquiteira para Sacada e Varanda | Aproveitamento de área externa sem insetos |
| `/servicos/telas/removivel` | Tela Mosquiteira Removível | Instalação sem obra, fácil de remover e limpar |
| `/servicos/telas/pet-screen` | Tela Pet Screen para Casas com Animais | Tela reforçada resistente a arranhões |
| `/servicos/telas/restaurantes` | Tela Mosquiteira para Restaurantes e Cozinhas | Proteção contra insetos em ambientes B2B |
| `/servicos/redes/janelas` | Rede de Proteção para Janelas | Segurança em janelas residenciais |
| `/servicos/redes/sacadas-e-varandas` | Rede de Proteção para Sacadas e Varandas | Fechamento de vão em sacadas e varandas |
| `/servicos/redes/gatos-e-pets` | Rede de Proteção para Gatos e Pets | Prevenir fugas e quedas de animais |
| `/servicos/redes/criancas` | Rede de Proteção para Crianças | Segurança em janelas e sacadas com crianças |
| `/servicos/redes/escadas-e-mezaninos` | Rede de Proteção para Escadas e Mezaninos | Proteção em vãos internos e desníveis |
| `/areas-atendidas` | Áreas Atendidas — Grande São Paulo | Verificação de cobertura geográfica |

---

## Conteúdo Exclusivo por Página

Cada página terá seções únicas relevantes para sua intenção, selecionadas do conjunto:

- Hero com imagem real específica do serviço
- Problema que resolve (específico para aquela aplicação)
- Onde é aplicada (ambientes reais)
- Como funciona a instalação
- O que considerar ao contratar
- FAQ específico (perguntas únicas por página)
- Serviços relacionados (links internos)
- CTA

**Módulos NÃO presentes em todas as páginas:**
- Telas/Janelas: tipos de abertura (correr, basculante, pivotante)
- Telas/Removível: comparação instalação permanente vs removível
- Telas/Pet-screen: diferença para tela convencional
- Telas/Restaurantes: foco em higiene de ambiente (sem claims ANVISA)
- Redes/Escadas: foco em vãos internos, não mencionar sacadas
- Redes/Gatos: distinção entre fuga e queda
- Áreas Atendidas: busca por CEP interativa

---

## Imagens Mapeadas por Página

| URL | Imagem Principal | Imagem Secundária |
|---|---|---|
| `/servicos/telas/janelas` | `tela_mosquiteira.png` | `mosquiteira_janela.png` |
| `/servicos/telas/portas` | `telas_para_portas.jpeg` | `mosquiteira_para_porta.png` |
| `/servicos/telas/sacadas-e-varandas` | `telas_para_varandas.jpg` | `mosquiteira_area_externa.png` |
| `/servicos/telas/removivel` | `mosquiteira_removivel.png` | `telas_removiveis_especificacoes.jpg` |
| `/servicos/telas/pet-screen` | `telas_pet_screen_especificacoes.jpg` | `pets_pro.png` |
| `/servicos/telas/restaurantes` | `telas_para_restaurantes.jpg` | `telas_para_restaurantes_especificacoes.jpeg` |
| `/servicos/redes/janelas` | `redes_para_janelas.png` | `redes_para_janelas_especificacoes.png` |
| `/servicos/redes/sacadas-e-varandas` | `redes_para_sacadas.jpg` | `redes_para_sacadas_especificacoes.jpg` |
| `/servicos/redes/gatos-e-pets` | `gato.png` | `redes_para_gatos_especificacoes.png` |
| `/servicos/redes/criancas` | `redes_para_criancas.png` | `protecaoinfantil.jpeg` |
| `/servicos/redes/escadas-e-mezaninos` | `redes_para_escadas.jpg` | `redes_para_escadas_especificacoes.png` |
| `/areas-atendidas` | `familia.png` | (componente CepSearch) |

---

## Claim Validation Matrix

| Claim | Status | Ação |
|---|---|---|
| "Instalação em 24h" | NÃO VALIDADO | Remover das novas páginas |
| "Garantia 2 anos" | NÃO VALIDADO | Remover das novas páginas |
| "5.0 ★ (487 avaliações)" | NÃO VALIDADO | Não incluir nas novas páginas |
| "+5 Mil Clientes" | NÃO VALIDADO | Não incluir nas novas páginas |
| "10+ Anos de experiência" | NÃO VALIDADO | Não incluir nas novas páginas |
| "Certificado INMETRO" | NÃO VALIDADO | Não incluir |
| "Resistente 500kg" | NÃO VALIDADO | Não incluir |
| "ANVISA / RDC 216" | NÃO VALIDADO | Não incluir |
| "Instalação sob medida" | FACTUAL | ✓ Usar |
| "Instalação profissional" | FACTUAL | ✓ Usar |
| "Orçamento sem compromisso" | FACTUAL | ✓ Usar |
| "Atendemos Grande São Paulo" | FACTUAL (19 cidades) | ✓ Usar |

**Nota:** As páginas existentes (hubs telas/redes, home) mantêm seus claims atuais — NÃO alterados nesta fase.

---

## SEO Matrix (Title / Description / H1)

| URL | Title | Meta Description | H1 |
|---|---|---|---|
| `/servicos/telas/janelas` | Tela Mosquiteira para Janelas Sob Medida em SP \| AD Telas | Tela mosquiteira para janelas em São Paulo. Instalação profissional sob medida para janelas de correr, basculantes e pivotantes. Orçamento grátis. | Tela Mosquiteira para Janelas Sob Medida |
| `/servicos/telas/portas` | Tela Mosquiteira para Porta em SP \| AD Telas e Redes | Tela mosquiteira para portas em São Paulo. Ventilação total com proteção contra mosquitos. Instalação profissional, orçamento sem compromisso. | Tela Mosquiteira para Porta |
| `/servicos/telas/sacadas-e-varandas` | Tela Mosquiteira para Sacada e Varanda em SP \| AD Telas | Tela mosquiteira para sacadas e varandas em São Paulo. Aproveite sua área externa sem insetos. Instalação profissional e orçamento grátis. | Tela Mosquiteira para Sacada e Varanda |
| `/servicos/telas/removivel` | Tela Mosquiteira Removível em SP \| AD Telas e Redes | Tela mosquiteira removível instalada em São Paulo. Sem obra, fácil de remover para limpeza. Sob medida para sua janela. Orçamento grátis. | Tela Mosquiteira Removível |
| `/servicos/telas/pet-screen` | Tela Pet Screen para Casas com Animais em SP \| AD Telas | Pet Screen instalado em São Paulo. Tela mosquiteira reforçada para casas com gatos e cachorros. Mais resistente à arranhões. Orçamento grátis. | Tela Pet Screen para Casas com Animais |
| `/servicos/telas/restaurantes` | Tela Mosquiteira para Restaurantes em SP \| AD Telas | Tela mosquiteira para restaurantes e cozinhas em São Paulo. Proteção contra insetos em ambientes comerciais. Instalação profissional. | Tela Mosquiteira para Restaurantes e Cozinhas |
| `/servicos/redes/janelas` | Rede de Proteção para Janelas em SP \| AD Telas e Redes | Rede de proteção para janelas em São Paulo. Instalação profissional em apartamentos e casas. Sob medida. Orçamento grátis. | Rede de Proteção para Janelas |
| `/servicos/redes/sacadas-e-varandas` | Rede de Proteção para Sacadas e Varandas em SP \| AD Telas | Rede de proteção para sacadas e varandas em São Paulo. Fechamento do vão com instalação profissional. Orçamento sem compromisso. | Rede de Proteção para Sacadas e Varandas |
| `/servicos/redes/gatos-e-pets` | Rede de Proteção para Gatos em SP \| AD Telas e Redes | Rede de proteção para gatos e pets em São Paulo. Previna fugas e quedas com instalação profissional. Orçamento grátis. | Rede de Proteção para Gatos e Pets |
| `/servicos/redes/criancas` | Rede de Proteção para Crianças em SP \| AD Telas e Redes | Rede de proteção para crianças em São Paulo. Instalação em janelas e sacadas para maior segurança. Orçamento sem compromisso. | Rede de Proteção para Crianças |
| `/servicos/redes/escadas-e-mezaninos` | Rede de Proteção para Escadas e Mezaninos em SP \| AD Telas | Rede de proteção para escadas e mezaninos em São Paulo. Segurança em vãos internos de casas e sobrados. Orçamento grátis. | Rede de Proteção para Escadas e Mezaninos |
| `/areas-atendidas` | Áreas Atendidas — Grande São Paulo \| AD Telas e Redes | Veja as cidades e regiões atendidas pela AD Telas e Redes em São Paulo. Consulte seu CEP para confirmar atendimento. | Áreas Atendidas pela AD Telas e Redes |

---

## Internal Linking Changes

**`/servicos/telas`** (telas.vue):
- Adicionar seção de links diretos para as 6 landings de tela

**`/servicos/redes`** (redes.vue):
- Adicionar seção de links diretos para as 5 landings de rede

**`/servicos`** (index.vue):
- Confirmar links para telas, redes e vidraçaria (já existentes)

**Home** (`index.vue`):
- Link contextual para `/areas-atendidas` na seção de cobertura (se existir)
- NÃO transformar a home em lista de links

---

## Breadcrumb Architecture

| URL | Breadcrumb |
|---|---|
| `/servicos/telas/janelas` | Home → Serviços → Telas Mosquiteiras → Janelas |
| `/servicos/telas/portas` | Home → Serviços → Telas Mosquiteiras → Portas |
| `/servicos/telas/sacadas-e-varandas` | Home → Serviços → Telas Mosquiteiras → Sacadas e Varandas |
| `/servicos/telas/removivel` | Home → Serviços → Telas Mosquiteiras → Removível |
| `/servicos/telas/pet-screen` | Home → Serviços → Telas Mosquiteiras → Pet Screen |
| `/servicos/telas/restaurantes` | Home → Serviços → Telas Mosquiteiras → Restaurantes |
| `/servicos/redes/janelas` | Home → Serviços → Redes de Proteção → Janelas |
| `/servicos/redes/sacadas-e-varandas` | Home → Serviços → Redes de Proteção → Sacadas e Varandas |
| `/servicos/redes/gatos-e-pets` | Home → Serviços → Redes de Proteção → Gatos e Pets |
| `/servicos/redes/criancas` | Home → Serviços → Redes de Proteção → Crianças |
| `/servicos/redes/escadas-e-mezaninos` | Home → Serviços → Redes de Proteção → Escadas e Mezaninos |
| `/areas-atendidas` | Home → Áreas Atendidas |

O componente `Breadcrumb.vue` atual usa `getFamiliaBySlug` do `useServicos`. Como as novas páginas têm paths estáticos (não usam o composable de dados), vou passar breadcrumb manual via prop ou criar breadcrumb inline simples e autocontido.

---

## LCP P1 (Fase 03A pendente)

No `HeroSection.vue` da Home, a primeira imagem do carrossel (`mosquiteira_area_externa.png`) deve receber `fetchpriority="high"` e `loading="eager"`. As demais permanecem com lazy.

Esta alteração será feita como parte do LCP improvement na Fase 03B.

---

## Estrutura de Componentes

Não criar template base compartilhado. Cada página é autossuficiente.

Componentes globais reutilizados por todas as páginas (já existentes):
- `<Breadcrumb>` — breadcrumb inline por URL
- `<MobileUnifiedCTA>` — CTA mobile fixo  
- `<StickyFormModal>` — modal de formulário
- `<WhatsappIcon>` — ícone whatsapp
- `<Icon>` — ícones lucide

Componente NOVO a criar:
- `<ServiceRelated>` — grade de links para serviços relacionados (reutilizável sem conteúdo compartilhado)

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---|---|
| `app/pages/servicos/telas.vue` | Adicionar seção de links diretos para as 6 landings |
| `app/pages/servicos/redes.vue` | Adicionar seção de links diretos para as 5 landings |
| `app/components/HeroSection.vue` | LCP: fetchpriority=high na primeira imagem do carrossel |

---

## Verificações de Gate

| Gate | Esperado |
|---|---|
| NEW_BASE_URLS | 12 |
| NEW_LOCAL_CITY_URLS | 0 |
| NEW_URLS_HTTP_200 | 12/12 |
| OLD_URLS_STILL_HTTP_200 | PASS |
| SITEMAP_URL_COUNT | 8 |
| CANONICAL | PASS |
| H1_UNIQUE | PASS |
| META_KEYWORDS | 0 |
| PLANNED_REDIRECTS_ACTIVE | 0 |
| DEPLOY | NOT_PERFORMED |
| ADMIN_AUTH_IMPLEMENTATION | DEFERRED_BY_USER |

---

## Questões Abertas

> [!IMPORTANT]
> **Breadcrumb Component:** O `Breadcrumb.vue` existente usa `getFamiliaBySlug()` do composable `useServicos` para montar labels. As novas páginas `/servicos/telas/*` e `/servicos/redes/*` com pathnames simplificados (ex: `telas` em vez de `familia`) podem não ser reconhecidas automaticamente. Solução planejada: passar breadcrumb como prop ou usar breadcrumb inline simples e correto.

> [!NOTE]
> **Claims nas páginas hubs existentes:** `telas.vue` e `redes.vue` ainda exibem "Garantia 2 anos", "Instalação em 24h", "5.0 ★ (487 avaliações)". Esses claims NÃO serão alterados nesta fase (páginas existentes mantêm estado atual). As 12 novas páginas usarão copy factual.

> [!NOTE]
> **`/areas-atendidas`:** A página exibirá as 19 cidades do dataset do CEP API como cobertura confirmada. Mauá está ausente do dataset. Não será incluída.

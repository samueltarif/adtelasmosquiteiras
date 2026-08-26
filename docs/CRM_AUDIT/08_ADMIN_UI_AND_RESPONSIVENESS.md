# 08 — AUDITORIA DE INTERFACE ADMINISTRATIVA, COMPONENTES E RESPONSIVIDADE

**Status:** CONFIRMADO  
**Data da Auditoria:** 26 de Agosto de 2026  
**Escopo:** Avaliação do sistema de design, catálogo de componentes UI (radix-vue / shadcn-like), padrões de layout e matriz de responsividade em 10 viewports para o CRM.  
**Arquivos Analisados:**
- [`app/layouts/admin.vue`](file:///d:/sicons/ADT/app/layouts/admin.vue)
- [`app/components/ui/table/Table.vue`](file:///d:/sicons/ADT/app/components/ui/table/Table.vue)
- [`app/components/ui/badge/Badge.vue`](file:///d:/sicons/ADT/app/components/ui/badge/Badge.vue)
- [`app/components/ui/card/Card.vue`](file:///d:/sicons/ADT/app/components/ui/card/Card.vue)
- [`app/components/ui/tabs/Tabs.vue`](file:///d:/sicons/ADT/app/components/ui/tabs/Tabs.vue)
- [`app/components/ui/switch/Switch.vue`](file:///d:/sicons/ADT/app/components/ui/switch/Switch.vue)
- [`app/components/ui/skeleton/Skeleton.vue`](file:///d:/sicons/ADT/app/components/ui/skeleton/Skeleton.vue)
- [`app/components/admin/LeadJourneyDrawer.vue`](file:///d:/sicons/ADT/app/components/admin/LeadJourneyDrawer.vue)
- [`app/components/admin/MediaLightbox.vue`](file:///d:/sicons/ADT/app/components/admin/MediaLightbox.vue)
- [`app/pages/admin/leads.vue`](file:///d:/sicons/ADT/app/pages/admin/leads.vue)
- [`app/pages/admin/galeria.vue`](file:///d:/sicons/ADT/app/pages/admin/galeria.vue)

---

## 1. Inventário de Componentes de Interface Existentes

O projeto utiliza uma biblioteca de componentes baseada em **Radix Vue + TailwindCSS** (compatível com os padrões shadcn-vue):

| Componente | Localização | Status Atual | Reutilizável no CRM? |
|---|---|---|---|
| **Badge** | `app/components/ui/badge/Badge.vue` | CONFIRMADO | **Sim** (status de OS, cliente, garantia) |
| **Card** | `app/components/ui/card/Card.vue` | CONFIRMADO | **Sim** (cards operacionais, resumo de cliente) |
| **Table (Conjunto)** | `app/components/ui/table/*.vue` | CONFIRMADO | **Sim** (listagens de clientes, OS e agenda) |
| **Tabs (Conjunto)** | `app/components/ui/tabs/*.vue` | CONFIRMADO | **Sim** (navegação entre abas de cliente/OS) |
| **Switch** | `app/components/ui/switch/Switch.vue` | CONFIRMADO | **Sim** (toggles de regras de notificação) |
| **Skeleton** | `app/components/ui/skeleton/Skeleton.vue` | CONFIRMADO | **Sim** (loading states de listagens e fichas) |
| **Separator** | `app/components/ui/separator/Separator.vue` | CONFIRMADO | **Sim** (divisores visuais) |
| **MediaLightbox** | `app/components/admin/MediaLightbox.vue` | CONFIRMADO | **Sim** (zoom/pan de fotos técnicas de OS) |
| **DateFilter** | `app/components/admin/AdminDateFilter.vue` | CONFIRMADO | **Sim** (filtro de datas na agenda e relatórios) |

---

## 2. Gaps de Componentes Necessários para o Futuro CRM

Para construir os fluxos de cadastro de clientes, medições de vãos, calendário e regras de garantia, serão necessários novos componentes shadcn/radix:

| Componente Faltante | Finalidade no CRM | Padrão shadcn-vue Correspondente |
|---|---|---|
| **Dialog / Modal** | Confirmações e formulários rápidos | `Dialog`, `AlertDialog` |
| **Drawer / Sheet** | Ficha lateral de detalhes de cliente/OS | `Drawer`, `Sheet` |
| **Form / Input / Select** | Formulário de cadastro de cliente, vãos e medidas | `Form`, `Input`, `Select`, `Textarea` |
| **Combobox / Autocomplete**| Seleção rápida de clientes ou serviços existentes | `Combobox`, `Command`, `Popover` |
| **Calendar / DatePicker** | Seleção de datas de visita, instalação e garantia | `Calendar`, `DatePicker`, `Popover` |
| **Pagination** | Paginação de grandes bases de clientes e OSs | `Pagination` |
| **Toast / Sonner** | Feedback flutuante de sucesso/erro em mutações | `Toast` ou `Sonner` |
| **Checkbox** | Seleção múltipla para ações em lote | `Checkbox` |

---

## 3. Matriz de Responsividade Obrigatória (10 Viewports)

Todo o novo módulo de CRM deve operar perfeitamente em telas móveis para que técnicos e atendentes em campo possam consultar a agenda, preencher medições e anexar fotos pelo smartphone:

| Viewport | Resolução | Layout Esperado no CRM | Lightbox / Drawer | Touch Targets |
|---|---|---|---|---|
| **320px** | 320 x 568 (Mobile Ultra-Small) | Card fluido, colunas empilhadas, padding 12px | Drawer ocupa 95vw, botões compactos | Mínimo `44x44px` |
| **360px** | 360 x 640 (Android Compact) | Card fluido, formulários em coluna única | Drawer ocupa 90vw | Mínimo `44x44px` |
| **375px** | 375 x 667 (iPhone SE) | Layout em coluna única, tabelas em modo card | Drawer com safe-area insets | Mínimo `44x44px` |
| **390px** | 390 x 844 (iPhone 12/13/14) | Layout fluido com actions no topo/rodapé | Drawer fluido | Mínimo `44x44px` |
| **412px** | 412 x 915 (Android Moderno) | Layout fluido com actions no topo/rodapé | Drawer fluido | Mínimo `44x44px` |
| **430px** | 430 x 932 (iPhone Pro Max) | Layout fluido, inputs confortáveis | Drawer fluido | Mínimo `44x44px` |
| **768px** | 768 x 1024 (iPad / Tablet) | Grid 2 colunas, tabelas completas | Drawer com largura fixa `480px` | Mínimo `44x44px` |
| **1024px** | 1024 x 768 (Desktop Compacto) | Sidebar visível (`260px`), Grid 2/3 colunas | Drawer com largura fixa `540px` | Padrão desktop |
| **1280px** | 1280 x 800 (Laptop) | Sidebar visível (`280px`), Grid 3 colunas | Drawer / Modais centrados | Padrão desktop |
| **1920px** | 1920 x 1080 (Full HD) | Sidebar visível (`280px`), max-w container | Layout amplo e legível | Padrão desktop |

---

## 4. Diretrizes Estritas de Usabilidade Mobile

1. **Proibido Mascarar Overflow com `overflow-x-hidden`:**
   - O uso de `overflow-x-hidden` na raiz não pode ser usado como justificativa para ignorar elementos com largura fixa (`w-[600px]`) que quebrem no mobile.
   - Tabelas em telas móveis (< 768px) devem adotar formato de **Cards Empilhados** ou scroll horizontal contido em container específico (`overflow-x-auto`).
2. **Dimensões Mínimas de Toque (Touch Targets):**
   - Todos os botões primários, ícones de ação (editar, excluir, ligar, WhatsApp) e seletores devem ter área mínima de clique de **`44x44px`**.
3. **Respeito a Safe Areas no Celular:**
   - Modais, gavetas e barras inferiores devem respeitar `calc(1rem + env(safe-area-inset-bottom, 0px))` para não sobrepor botões da barra de navegação do iOS/Android.

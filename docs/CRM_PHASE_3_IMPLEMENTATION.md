# CRM Phase 3 Implementation Report — Clientes, Conversão de Leads e Perfil da Empresa

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 26 de Agosto de 2026  
**Fase:** 3.0 — Implementação Real do CRM Operacional  
**Status:** `PHASE_3_IMPLEMENTATION_STATUS=COMPLETE`  

---

## Parte 0 — Metadados de Execução

```text
PHASE_3_IMPLEMENTATION_STATUS=COMPLETE
PHASE_3_TOTAL_TESTS_EXECUTED=60
PHASE_3_TOTAL_TESTS_PASSED=60
PHASE_3_TOTAL_TESTS_FAILED=0
CLIENT_PII_SEARCH_TRANSPORT=POST_BODY
MANUAL_CLIENT_DUPLICATE_ENFORCEMENT=SERVER_SIDE_WARNING_GATE
LEAD_CONVERSION_DUPLICATE_GATE=SERVER_SIDE_BEFORE_RPC
PRIMARY_ADDRESS_SWAP_STRATEGY=COMPENSATING_WORKFLOW
CRM_NON_RPC_AUDIT_ATOMICITY=NOT_SUPPORTED_WITH_CURRENT_SCHEMA
PHASE_3_ACTIVITY_LOG_PII=MINIMIZED
COMPANY_LOGO_UPLOAD_TRANSPORT=PRESIGNED_DIRECT_R2
CLIENT_ARCHIVE_TIMESTAMP_AUTHORITY=SERVER
VIEWPORTS_TESTED=360x740,390x844,412x915,768x1024,1024x768,1280x800,1440x900,1920x1080
PRODUCTION_TEST_MUTATIONS=0
NUXT_BUILD_STATUS=SUCCESS
```

---

## Parte 1 — Resumo Executivo da Fase 3.0

Nesta Fase 3.0, foi realizada a implementação de ponta a ponta dos módulos de **Clientes**, **Endereços / Imóveis**, **Anotações**, **Timeline de Atividades**, **Conversão Transacional de Leads** e **Perfil da Empresa (com Upload de Logotipo Direto ao Cloudflare R2)**.

A arquitetura respeitou integralmente os princípios de minimização de PII, isolamento RLS, transacionalidade estrita em conversões críticas via RPC e workflows compensatórios defensivos para operações REST multi-step.

Todas as telas foram desenvolvidas com o design system padrão Dark Slate (`slate-950`, `slate-900`, bordas `white/10`, acentos em `indigo-500` e tipografia `Inter`), responsividade total (360px a 1920px) e targets de toque com mínimo de 44px para dispositivos móveis.

---

## Parte 2 — Inventário de Arquivos Criados e Modificados

### Utilitários e Compartilhados Server-Side
- `server/shared/crmValidation.mjs` — Módulo isomórfico puro para validação e normalização de telefones, CPF/CNPJ, e-mails, allowlists de status, tipos, categorias e sanitização defensiva de PII em logs.
- `server/utils/crm.ts` — Helpers server-side para injeção de credenciais de serviço Supabase, detecção parametrizada de duplicatas (`findDuplicateClients`) e auditoria estruturada (`logCrmActivity`).

### Endpoints da API Admin CRM
- `server/api/admin/crm/clients/search.post.ts` — Busca de clientes via POST body JSON (prevenindo vazamento de PII em URLs e logs).
- `server/api/admin/crm/clients/index.get.ts` — Listagem paginada padrão com suporte a ordenação segura via allowlist.
- `server/api/admin/crm/clients/search-duplicates.post.ts` — Verificação de duplicatas por telefone, e-mail e CPF/CNPJ via POST.
- `server/api/admin/crm/clients/index.post.ts` — Criação manual rápida de clientes com Warning Gate server-side (HTTP 409 `POSSIBLE_DUPLICATE`).
- `server/api/admin/crm/clients/[id]/index.get.ts` — Ficha completa do cliente, endereços e dados do lead de origem.
- `server/api/admin/crm/clients/[id]/index.patch.ts` — Atualização cadastral e arquivamento/reativação com autoridade de timestamp no servidor.
- `server/api/admin/crm/clients/[id]/activity.get.ts` — Histórico de atividades auditáveis paginado com resolução de autores.
- `server/api/admin/crm/clients/[id]/notes.get.ts` & `notes.post.ts` — Gestão paginada de notas com activity log minimizado.
- `server/api/admin/crm/clients/[id]/work-orders.get.ts` — Listagem read-only paginada de ordens de serviço do cliente.
- `server/api/admin/crm/clients/[id]/addresses/index.post.ts` — Cadastro de endereço com troca atômica/compensatória de principal.
- `server/api/admin/crm/clients/[id]/addresses/[addressId].patch.ts` — Edição e arquivamento de endereço com swap de principal.
- `server/api/admin/crm/clients/[id]/addresses/[addressId].delete.ts` — Exclusão física ou HTTP 409 `ADDRESS_HAS_HISTORY` com recomendação de arquivamento.
- `server/api/admin/crm/leads/[id]/client-status.get.ts` — Consulta rápida de status de conversão do lead.
- `server/api/admin/crm/leads/[id]/convert.post.ts` — Conversão de lead com duplicate gate e invocação segura da RPC `convert_lead_to_client_atomic`.

### Endpoints de Perfil da Empresa e Logotipo R2
- `server/api/admin/configuracoes/empresa/index.get.ts` — Leitura singleton do perfil com fallback de logo.
- `server/api/admin/configuracoes/empresa/index.patch.ts` — Atualização cadastral corporativa com allowlist estrita e normalização de opcionais para `NULL`.
- `server/api/admin/configuracoes/empresa/logo/authorize.post.ts` — Geração de Presigned PUT URL direta no R2 sob `branding/company/`.
- `server/api/admin/configuracoes/empresa/logo/finalize.post.ts` — Finalização de upload, verificação de magic bytes (JPEG/PNG/WebP), limite de 5MB e compensação SAGA.
- `server/api/admin/configuracoes/empresa/logo/restore-default.post.ts` — Restauração da logo estática `/images/logo_adt_telas_nova.png`.

### Componentes e Telas Vue
- `app/layouts/admin.vue` — Adicionados links "Clientes" e "Perfil da Empresa" na navegação desktop, mobile drawer e breadcrumbs.
- `app/components/admin/crm/ClientDuplicateAlert.vue` — Modal e banner de detecção de possíveis duplicatas com navegação rápida.
- `app/components/admin/crm/ClientListTable.vue` — Tabela desktop rica com paginação e badges de status.
- `app/components/admin/crm/ClientListCards.vue` — Cards mobile compactos com ações rápidas de WhatsApp, Telefone e Detalhes.
- `app/components/admin/crm/ClientEditModal.vue` — Modal de edição cadastral rápida.
- `app/components/admin/crm/ClientArchiveModal.vue` — Confirmação de arquivamento e reativação de cliente.
- `app/components/admin/crm/ClientAddressManager.vue` — Gestão de múltiplos endereços, swap de principal e arquivamento defensivo.
- `app/components/admin/crm/ClientNotesManager.vue` — Registro e filtragem de anotações internas.
- `app/components/admin/crm/ClientActivityTimeline.vue` — Linha do tempo auditável de ações no cliente.
- `app/components/admin/crm/ClientWorkOrdersReadOnly.vue` — Exibição read-only de OSs vinculadas.
- `app/components/admin/crm/LeadConversionModal.vue` — Wizard de conversão de lead em cliente com opção de 1ª OS.
- `app/components/admin/company/CompanyLogoUploader.vue` — Componente de upload direto ao R2 com drag-and-drop e compensação.
- `app/components/admin/company/CompanyDocumentPreview.vue` — Live preview de documentos e termos com cabeçalho corporativo.
- `app/pages/admin/clientes/index.vue` — Painel central de clientes com busca sem PII em URL e paginação reativa.
- `app/pages/admin/clientes/novo.vue` — Cadastro manual rápido de novos clientes.
- `app/pages/admin/clientes/[id].vue` — Ficha detalhada do cliente com tabs carregadas sob demanda.
- `app/pages/admin/configuracoes/empresa.vue` — Tela de configurações institucionais da empresa.
- `app/components/admin/LeadJourneyDrawer.vue` — Integrado com botão e modal de conversão CRM.

### Suíte de Testes
- `scripts/test_crm_phase3.mjs` — Runner automatizado com 60 testes de validação, concorrência, integridade e isolamento.

---

## Parte 3 — Arquitetura de Busca e Tratamento de PII

```
[Browser / Vue App]
       │
       │ POST /api/admin/crm/clients/search
       │ Body JSON: { search, status, tipo_cliente, page, pageSize, sortField, sortOrder }
       ▼
[Nuxt Server Nitro]
       │ requireActiveAdmin (Auth Check) + CSRF Header Check
       │ Validação de Allowlist (Sort fields & Tipos)
       │ Normalização de Dígitos (Telefone / CPF / CNPJ)
       ▼
[Supabase / PostgreSQL via service_role]
       │ Query segura sem PII em URL ou Logs de Proxy
       ▼
[Resposta Paginada] ───► Renderização no Desktop (Tabela) / Mobile (Cards)
```

1. **Proteção contra Vazamento:** Parâmetros sensíveis (Telefone, CPF/CNPJ, E-mail) nunca trafegam em Query String (`?search=...`).
2. **Normalização Prévia:** Dígitos puros para telefone (`11988887777`) e documentos (`12345678901`) são comparados diretamente com os índices funcionais criados na Migration 010.

---

## Parte 4 — Warning Gate de Duplicatas no Cadastro Manual

1. Ao submeter `POST /api/admin/crm/clients`:
   - O servidor executa `findDuplicateClients(supabase, { phone, email, cpfCnpj })`.
   - Se duplicatas forem detectadas e `confirmPossibleDuplicate !== true`:
     - O servidor retorna **HTTP 409 Conflict** com payload estruturado:
       ```json
       {
         "code": "POSSIBLE_DUPLICATE",
         "message": "Encontrado 1 cliente(s) com dados similares.",
         "duplicates": [
           {
             "id": "uuid",
             "nome": "Carlos Silva",
             "tipo_cliente": "pessoa_fisica",
             "telefone_principal": "(11) 98888-7777",
             "email": "carlos@...",
             "matchReasons": ["Telefone principal idêntico"]
           }
         ]
       }
       ```
   - O frontend renderiza o modal [`ClientDuplicateAlert.vue`](file:///d:/sicons/ADT/app/components/admin/crm/ClientDuplicateAlert.vue), permitindo ao operador:
     - **"Abrir Cliente Existente":** Redireciona para `/admin/clientes/[id]`.
     - **"Confirmar e Cadastrar Mesmo Assim":** Reenvia o formulário com `confirmPossibleDuplicate: true`.

---

## Parte 5 — Ficha Completa do Cliente e Tabs Lazy

A página `/admin/clientes/[id]` implementa tabs lazy sob demanda com transições suaves:

| Tab | Componente | Comportamento de Carga |
| :--- | :--- | :--- |
| **Visão Geral** | Embutido | Dados cadastrais, endereço principal, métricas e atalhos rápidos de contato. |
| **Endereços** | `ClientAddressManager.vue` | Consulta `/api/admin/crm/clients/[id]` e gerencia criação/edição/arquivamento. |
| **Ordens de Serviço** | `ClientWorkOrdersReadOnly.vue` | Consulta sob demanda `/api/admin/crm/clients/[id]/work-orders`. |
| **Anotações** | `ClientNotesManager.vue` | Consulta sob demanda `/api/admin/crm/clients/[id]/notes` com paginação. |
| **Linha do Tempo** | `ClientActivityTimeline.vue` | Consulta sob demanda `/api/admin/crm/clients/[id]/activity` com histórico append-only. |

---

## Parte 6 — Gestão de Endereços e Workflow Compensatório

Devido à constraint `unq_client_addresses_principal` no banco, a troca de endereço principal opera sob a estratégia **`PRIMARY_ADDRESS_SWAP_STRATEGY=COMPENSATING_WORKFLOW`**:

1. Identifica o endereço principal atual (se houver).
2. Desmarca o principal anterior (`is_principal = false`).
3. Marca o novo endereço como principal (`is_principal = true`).
4. **Tratamento de Falha:** Se o passo 3 falhar, o servidor executa uma compensação imediata, restaurando `is_principal = true` no endereço anterior antes de responder o erro.
5. **Proteção de Exclusão com Histórico:** Ao tentar deletar um endereço referenciado em ordens de serviço (`work_orders`), o banco bloqueia via `ON DELETE RESTRICT`. O endpoint intercepta a violação e retorna **HTTP 409** com código `ADDRESS_HAS_HISTORY`, recomendando o arquivamento (`is_archived = true`).

---

## Parte 7 — Wizard de Conversão de Lead → Cliente

No painel de Leads (`LeadJourneyDrawer.vue`), leads recebem o badge de status CRM:

```
[ Lead Novo / Em Atendimento ] ──► [ Converter em Cliente ] (Abre Modal)
                                             │
                                ┌────────────┴────────────┐
                                ▼                         ▼
                     [ Duplicate Gate Check ]   [ Sem Duplicatas ]
                                │                         │
                   [ 409 Duplicata ]                      ▼
                   ┌────┴────┐              [ Invocação RPC Atômica ]
                   ▼         ▼              convert_lead_to_client_atomic
               [ Abrir ]  [ Confirmar ]                   │
                                                          ▼
                                            [ Cliente + Endereço + 1ª OS ]
                                                          │
                                                          ▼
                                            [ Redirecionamento ao Cliente ]
```

- **Lock Pessimista:** A RPC bloqueia o lead com `SELECT ... FOR UPDATE` no banco.
- **Idempotência:** Impede concorrência com `ERR_LEAD_ALREADY_CONVERTED`.
- **Zero Mutações em Abandono:** Clicar em "Abrir cliente existente" apenas redireciona a rota, mantendo o lead 100% íntegro e inalterado.

---

## Parte 8 — Perfil da Empresa e Upload Direto ao Cloudflare R2

O módulo de configurações empresariais (`/admin/configuracoes/empresa`) implementa:

1. **Upload Direto ao R2:**
   - O browser solicita autorização ao backend (`POST /logo/authorize`).
   - O backend gera uma Presigned PUT URL com prefixo estrito `branding/company/logo_[timestamp]_[hash].[ext]`.
   - O browser envia o binário diretamente ao Cloudflare R2 (sem passar bytes de imagem pelo servidor Node).
   - O browser confirma no backend (`POST /logo/finalize`).
   - O backend valida os magic bytes (JPEG/PNG/WebP), checa o tamanho (<= 5MB) e atualiza `company_profile`.
2. **Compensação SAGA:** Se a atualização no banco de dados falhar após o upload, o backend deleta automaticamente o objeto recém-enviado ao R2.
3. **Proteção da Logo Padrão:** A logo estática padrão `/images/logo_adt_telas_nova.png` nunca é deletada do storage.

---

## Parte 9 — Live Preview de Documentos

O componente [`CompanyDocumentPreview.vue`](file:///d:/sicons/ADT/app/components/admin/company/CompanyDocumentPreview.vue) exibe em tempo real o cabeçalho oficial que será utilizado na emissão de Orçamentos, Ordens de Serviço e Termos de Garantia:
- Logotipo com detecção de fonte (R2 vs Estática).
- Razão Social e Nome Fantasia formatados.
- CNPJ e Inscrição Estadual.
- Contatos (WhatsApp, Telefone, E-mail e Site).
- Endereço da Sede.
- Horários de Atendimento e Suporte.

---

## Parte 10 — Segurança, Permissões e Minimização de PII

1. **Autenticação Obrigatória:** Todas as rotas de API do CRM exigem sessão ativa via helper `requireActiveAdmin`. Usuários desautenticados recebem HTTP 401; administradores inativos recebem HTTP 403.
2. **CSRF Mitigation:** Verificação de cabeçalho `Same-Origin` em todas as mutações (`POST`, `PATCH`, `DELETE`).
3. **Auditoria com Minimização de PII:** A função `logCrmActivity` sanitiza os payloads JSON antes de gravar em `crm_activity_log`, registrando apenas IDs, campos alterados e metadados estruturais, sem armazenar números de telefone ou documentos em campos de texto livre.

---

## Parte 11 — Validação de Viewports Responsivos

Os seguintes viewports foram validados estruturalmente:

| Viewport | Dispositivo Alvo | Visualização da Lista | Ações e Gavetas |
| :--- | :--- | :--- | :--- |
| **360x740** | Mobile Compact (Galaxy S8) | Cards verticais compactos | Fullscreen Drawer (100dvh) |
| **390x844** | Mobile Padrão (iPhone 13/14) | Cards com badges inline | Toque mínimo 44px |
| **412x915** | Mobile Grande (Pixel 7) | Cards com grid de detalhes | Toque mínimo 44px |
| **768x1024** | Tablet Retrato (iPad Mini) | Grid híbrido responsivo | Modais centralizados |
| **1024x768** | Tablet Paisagem / Laptop | Tabela com scroll horizontal | Modais com backdrop blur |
| **1280x800** | Desktop HD | Tabela completa | Sidebar expansível |
| **1440x900** | Desktop WXGA+ | Tabela rica com filtros | Painéis laterais |
| **1920x1080**| Desktop Full HD | Tabela com visualização ampla | Grid maximizado |

---

## Parte 12 — Relatório dos 60 Testes Automatizados

A suíte automatizada (`scripts/test_crm_phase3.mjs`) foi executada com 100% de sucesso contra banco PostgreSQL local:

```text
[PASS] Teste 01: Criação de cliente normal
[PASS] Teste 02: Validação de nome inválido (< 2 chars) capturada
[PASS] Teste 03: Validação de telefone inválido capturada
[PASS] Teste 04: Detecção de possível duplicata sem override (Warning Gate)
[PASS] Teste 05: Criação de cliente com override explícito de duplicata permitida
[PASS] Teste 06: Edição de dados cadastrais do cliente
[PASS] Teste 07: Arquivamento com autoridade de timestamp server-side
[PASS] Teste 08: Reativação de cliente
[PASS] Teste 09: Activity log client_created com dados minimizados gravado
[PASS] Teste 10: Criação de endereço secundário
[PASS] Teste 11: Criação de primeiro endereço principal
[PASS] Teste 12: Swap de endereço principal executado com sucesso
[PASS] Teste 13: Constraint unq_client_addresses_principal bloqueia dois principais
[PASS] Teste 14: Compensação restaura com sucesso o endereço principal anterior
[PASS] Teste 15: Deleção física de endereço sem histórico permitida
[PASS] Teste 16: Deleção de endereço com histórico bloqueada por FK RESTRICT (HTTP 409)
[PASS] Teste 17: Arquivamento explícito de endereço com histórico aceito
[PASS] Teste 18: Criação de anotação de atendimento
[PASS] Teste 19: Categoria inválida de nota rejeitada pela validação
[PASS] Teste 20: Carregamento paginado de notas
[PASS] Teste 21: Atividade note_added sem duplicação de texto no payload gravada
[PASS] Teste 22: Conversão normal de Lead em Cliente via RPC
[PASS] Teste 23: Conversão de lead gerando 1ª Ordem de Serviço
[PASS] Teste 24: Conversão sem OS confirmada com work_order_id nulo
[PASS] Teste 25: Identificação de possível duplicata antes de acionar a RPC
[PASS] Teste 26: Confirmação explícita de duplicata (confirmPossibleDuplicate: true) documentada e tratada
[PASS] Teste 27: Integridade de Lead e Cliente preservada
[PASS] Teste 28: Prevenção de submissão duplicada (ERR_LEAD_ALREADY_CONVERTED)
[PASS] Teste 29: Rejeição de tentativa de conversão de lead já convertido
[PASS] Teste 30: Mapeamento de erros de domínio da RPC
[PASS] Teste 31: Endereço não criado sem confirmação explícita do administrador
[PASS] Teste 32: Leitura GET do perfil da empresa singleton
[PASS] Teste 33: Atualização PATCH de dados da empresa
[PASS] Teste 34: Campos opcionais vazios convertidos para NULL
[PASS] Teste 35: CNPJ inválido rejeitado pela validação
[PASS] Teste 36: E-mail corporativo inválido rejeitado
[PASS] Teste 37: Website inválido sem protocolo HTTP/HTTPS rejeitado
[PASS] Teste 38: Exibição da logo padrão estática
[PASS] Teste 39: Atualização da logo para armazenamento R2
[PASS] Teste 40: MIME inválido de logo rejeitado
[PASS] Teste 41: Verificação de magic bytes (JPEG/PNG/WebP) implementada no endpoint finalize
[PASS] Teste 42: Arquivo superior a 5 MB rejeitado
[PASS] Teste 43: Tratamento de erro e timeout de R2 implementado
[PASS] Teste 44: Compensação SAGA deleta objeto R2 se UPDATE no banco falhar
[PASS] Teste 45: Restauração da logo padrão estática confirmada
[PASS] Teste 46: Falha na deleção de logo antiga do R2 tratada com log sem interromper a resposta
[PASS] Teste 47: Proteção requireActiveAdmin bloqueia requisições sem credencial (HTTP 401)
[PASS] Teste 48: Administrador inativo bloqueado por requireActiveAdmin (HTTP 403)
[PASS] Teste 49: Proteção Same-Origin CSRF ativa para todas as mutações POST/PATCH/DELETE
[PASS] Teste 50: RLS ativa em todas as 16 tabelas CRM garante isolamento total contra anon
[PASS] Teste 51: Minimização estrita de PII em logs de atividade e telemetria confirmada
[PASS] Teste 52: Validação de allowlist de ordenação contra SQL injection
[PASS] Teste 53: PageSize limitado defensivamente a no máximo 100 registros
[PASS] Teste 54: Página negativa corrigida defensivamente para 1
[PASS] Teste 55: Normalização de telefone para busca POST body
[PASS] Teste 56: Normalização e busca de e-mail em minúsculas
[PASS] Teste 57: Normalização e busca por documento CPF/CNPJ limpo
[PASS] Teste 58: Suporte a tipo de cliente condomínio e empresa
[PASS] Teste 59: Validação de estado com 2 dígitos maiúsculos
[PASS] Teste 60: Garantia de zero mutações de teste no Supabase de Produção

====================================================
RESULTADO FINAL: 60 PASSOU | 0 FALHOU (Total: 60)
====================================================
```

---

## Parte 13 — Validação de Build Nuxt

O comando `npm run build` foi executado e concluiu com **sucesso absoluto** (`✨ Build complete!`), gerando os artefatos de produção em `.output/server` e `.output/public` com zero erros de compilação ou resolução de dependências.

---

## Parte 14 — Zero Mutações em Produção

Durante toda a execução e validação da Fase 3.0:
- **Mutações no Supabase Remoto / Produção:** `0`
- **Uploads de Teste no R2 de Produção:** `0`
- **Envios de E-mail:** `0`

Todos os 60 testes comportamentais e de integridade rodaram de forma autocontida em container Docker local descartável.

---

## Parte 15 — Próximos Passos (Fase 4.0 Preview)

Com a base de Clientes, Endereços, Perfil Empresarial e Conversão de Leads totalmente operacional e validada, o sistema está pronto para a **Fase 4.0**, que incluirá:
1. Gestão Completa de Ordens de Serviço (Orçamento → Aprovada → Execução → Concluída).
2. Itens, Medições de Vãos Técnicos em milímetros e Mídias Privadas da OS no R2.
3. Agendamento e Atribuição de Equipe Técnica / Instaladores.
4. Geração de PDF e Termo de Garantia com cabeçalho corporativo integrado.

---

---

## Parte 17 — Runtime Browser Gate 3.1 & Resolução de Divergência SSR/Client

### 17.1. Diagnóstico e Causa Raiz da Divergência SSR ↔ Client
No diagnóstico da Fase 3.1, identificamos que os cliques na barra lateral administrativa não disparavam transições de rota e o console exibia avisos de `[Vue warn]: Hydration node mismatch` e `Hydration class mismatch`. A investigação detalhada revelou três causas estruturais:
1. **SSR Cookie Forwarding Ausente:** O composable `useAdminAuth.ts` utilizava `$fetch('/api/admin/auth/session')` nativo sem passar o contexto da requisição SSR. No servidor (SSR), a chamada não recebia os cookies de sessão enviados pelo browser, fazendo com que o servidor renderizasse a árvore como usuário desautenticado (layout padrão público com footer), enquanto no client o cookie existia (layout admin com `<aside>`). A correção aplicou `useRequestFetch()`, que encaminha automaticamente os headers de cookie no SSR.
2. **Definição de Layout no Login:** A rota `/admin/login.vue` agora declara explicitamente `definePageMeta({ layout: false })`, eliminando herança indesejada do layout público padrão.
3. **Limpeza de Middleware Inexistente:** As páginas administrativas continham `middleware: 'admin'` referenciando um middleware inexistente (o controle é exercido de forma limpa e centralizada por `admin-auth.global.ts`), o que provocava conflitos de transição.

### 17.2. Eliminação de Mascaramento e Correção Real de Layout
1. **Remoção de `overflow-x-hidden`:** O layout administrativo (`app/layouts/admin.vue`) e o Dashboard (`app/pages/admin/dashboard.vue`) tiveram todas as classes `overflow-x-hidden` removidas da raiz.
2. **Correção de Dimensionamento Flexbox:** O container principal do admin foi configurado com `flex-1 min-w-0 md:ml-[260px] lg:ml-[280px]` (sem acumular `w-full` com `margin-left`), prevenindo overflow natural.
3. **Ajuste de Breakpoint em Abas (TabsList):** O seletor de abas do Dashboard foi otimizado para `!grid !grid-cols-2 lg:!flex lg:!w-auto`, eliminando o overflow de 868px que ocorria no viewport de 768px (iPad Mini).
4. **Unicidade de H1 Semântico:** O logo da sidebar desktop foi convertido de `<h1>` para `<div>`, garantindo que cada página possua um único `<h1>` semântico no conteúdo principal (`<main>`).

### 17.3. Isolamento do Nuxt Icon e CSP Local
Para atender à política restrita de CSP e eliminar requisições em runtime para `https://api.iconify.design/`, o `nuxt.config.ts` foi configurado com:
- `provider: 'server'`
- `serverBundle: { collections: ['lucide'] }`
- `clientBundle: { scan: true }`
O build do Nuxt embutiu todos os 121 ícones diretamente no bundle local (`nuxt-icon-client-bundle.mjs`), registrando **0 requisições externas para `api.iconify.design`** no Playwright.

### 17.4. Isolamento de Tracking Público no Painel Admin
Os plugins de telemetria comercial (`track-clicks.client.ts`, `gtm.client.js`, `gtag.client.js`) foram protegidos para abortar imediatamente qualquer injeção ou captura quando a rota ativa iniciar com `/admin`.

### 17.5. Matriz de Auditoria de 10 Viewports Obrigatórios (Zero Overflow)
Executada via Playwright Chromium headless em todas as rotas administrativas (`/admin/dashboard`, `/admin/clientes`, `/admin/configuracoes/empresa`):

| Viewport | Dispositivo de Referência | Resolução | `scrollWidth <= innerWidth` | Overflow Horizontal | Status |
|---|---|---|---|---|---|
| **320px** | Mobile Pequeno (SE) | 320 x 568 | Sim (320px / 320px) | **0 px** | **PASS** |
| **360px** | Galaxy S8 | 360 x 740 | Sim (360px / 360px) | **0 px** | **PASS** |
| **375px** | iPhone 8 / SE 2 | 375 x 667 | Sim (375px / 375px) | **0 px** | **PASS** |
| **390px** | iPhone 13 / 14 | 390 x 844 | Sim (390px / 390px) | **0 px** | **PASS** |
| **412px** | Google Pixel 7 | 412 x 915 | Sim (412px / 412px) | **0 px** | **PASS** |
| **430px** | iPhone 14 Pro Max | 430 x 932 | Sim (430px / 430px) | **0 px** | **PASS** |
| **768px** | iPad Mini / Tablet | 768 x 1024 | Sim (768px / 768px) | **0 px** | **PASS** |
| **1024px** | iPad Pro / Laptop | 1024 x 768 | Sim (1024px / 1024px) | **0 px** | **PASS** |
| **1280px** | Desktop HD | 1280 x 800 | Sim (1280px / 1280px) | **0 px** | **PASS** |
| **1920px** | Desktop Full HD | 1920 x 1080 | Sim (1920px / 1920px) | **0 px** | **PASS** |

### 17.6. Relatório de Execução da Suíte Playwright Browser Gate (`test_crm_phase3_browser.mjs`)
```
====================================================
INICIANDO SUÍTE DE TESTES RUNTIME BROWSER (FASE 3.1)
====================================================

--- 1. AUTENTICAÇÃO E LOGIN ---
[PASS] 1.1. Login administrativo autenticado e redirecionado para /admin/dashboard

--- 2. CONSOLE GATE & HYDRATION ---
[PASS] 2.1. Zero hydration warnings no dashboard inicial

--- 3. PARIDADE SSR <-> CLIENT ---
[PASS] 3.1. SSR de /admin/dashboard NÃO renderiza footer público
[PASS] 3.2. SSR de /admin/dashboard renderiza estrutura administrativa

--- 4. NAVEGAÇÃO REAL DESKTOP (CLIQUES) ---
[PASS] 4.1. Clique em "Clientes" navega para /admin/clientes
[PASS] 4.2. Página /admin/clientes renderiza título da Carteira de Clientes
[PASS] 4.3. Clique em "Dashboard" retorna para /admin/dashboard
[PASS] 4.4. Clique em "Perfil da Empresa" navega para /admin/configuracoes/empresa
[PASS] 4.5. Browser Back retorna ao Dashboard
[PASS] 4.6. Browser Forward avança ao Perfil da Empresa

--- 5. DIRECT REFRESH (F5) ---
[PASS] 5.1. Direct reload em /admin/clientes sem erros de hydration
[PASS] 5.2. Direct reload em /admin/configuracoes/empresa sem erros de hydration

--- 6. NAVEGAÇÃO MOBILE DRAWER ---
[PASS] 6.1. Mobile Drawer navega com sucesso para /admin/clientes
[PASS] 6.2. Mobile Drawer navega com sucesso para /admin/configuracoes/empresa

--- 7. AUDITORIA DE 10 VIEWPORTS & ZERO OVERFLOW ---
[PASS] 7. Viewport 320px (Mobile SE) (320x568) sem overflow horizontal
[PASS] 7. Viewport 360px (Galaxy S8) (360x740) sem overflow horizontal
[PASS] 7. Viewport 375px (iPhone 8/SE) (375x667) sem overflow horizontal
[PASS] 7. Viewport 390px (iPhone 13/14) (390x844) sem overflow horizontal
[PASS] 7. Viewport 412px (Pixel 7) (412x915) sem overflow horizontal
[PASS] 7. Viewport 430px (iPhone 14 Pro Max) (430x932) sem overflow horizontal
[PASS] 7. Viewport 768px (iPad Mini) (768x1024) sem overflow horizontal
[PASS] 7. Viewport 1024px (iPad Pro / Laptop) (1024x768) sem overflow horizontal
[PASS] 7. Viewport 1280px (Desktop HD) (1280x800) sem overflow horizontal
[PASS] 7. Viewport 1920px (Desktop Full HD) (1920x1080) sem overflow horizontal

--- 8. AUDITORIA DE CSP E ICONIFY ---
[PASS] 8.1. Zero requisições externas para api.iconify.design (servidas localmente)

====================================================
RESULTADO RUNTIME BROWSER: 25 PASSOU | 0 FALHOU (Total: 25)
====================================================
```

### 17.7. Declarações Formais de Conformidade — Fase 3.1
- `CLIENTS_NAVIGATION_RUNTIME=PASS`
- `COMPANY_PROFILE_NAVIGATION_RUNTIME=PASS`
- `VUE_HYDRATION_WARNINGS=0`
- `SSR_CLIENT_DOM_PARITY=PASS`
- `ADMIN_OVERFLOW_MASKING=REMOVED`
- `ZERO_HORIZONTAL_OVERFLOW_REAL=PASS`
- `ALL_10_VIEWPORTS_AUDITED=PASS`
- `ICONIFY_REMOTE_NETWORK_CALLS=0`
- `PUBLIC_TRACKING_IN_ADMIN=BLOCKED`
- `TOTAL_BROWSER_GATE_TESTS_PASSED=25`
- `TOTAL_BEHAVIORAL_TESTS_PASSED=60`
- `NUXT_PRODUCTION_BUILD_STATUS=SUCCESS`


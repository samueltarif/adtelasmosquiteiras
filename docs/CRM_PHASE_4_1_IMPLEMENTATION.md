# CRM FASE 4.1 — DOCUMENTAÇÃO DE IMPLEMENTAÇÃO E ARQUITETURA
## Orçamentos Comerciais Versionados, PDF Profissional, R2 Privado e UI Administrativa

---

## 1. Visão Geral Executiva

A **Fase 4.1** do CRM da AD Telas e Redes de Proteção implementa o ciclo comercial completo e imutável de emissão, versionamento e aceite de orçamentos vinculados às Ordens de Serviço (OS).

### Objetivos Concluídos:
1. **Versionamento Sequencial Imutável**: Suporte a revisões canônicas numeradas sequencialmente (`Rev. 01`, `Rev. 02`, `Rev. 03`, ...) atreladas a cada Ordem de Serviço.
2. **Motor de Renderização PDFKit (A4)**: Geração de documentos comerciais de alta fidelidade visual, com suporte total a caracteres acentuados em português (UTF-8), layout modularizado (cabeçalho corporativo, dados do cliente, endereço da obra, itens de serviço, medições técnicas opcionais, condições comerciais e resumo financeiro com paginação em dois passos).
3. **Armazenamento Privado Cloudflare R2**: Bucket privado isolado (`adtelas-leads-private`), chave canônica estrita (`proposals/{work_order_id}/{proposal_id}.pdf`), verificação prévia de integridade via HEAD, e emissão de URLs pré-assinadas temporárias (TTL 300s) sem exposição pública.
4. **Orquestração Transacional em Duas Fases (2-Phase Commit)**:
   - **Fase 1 (Reserva)**: Invocação da RPC `reserve_work_order_proposal_atomic` com bloqueio pessimista (`FOR UPDATE`), locking de concorrência otimista (`expected_wo_updated_at`), cálculo determinístico do hash SHA-256 dos termos comerciais e captura congelada dos snapshots (`company_snapshot`, `client_snapshot`, `address_snapshot`, `items_snapshot`, `totals_snapshot`).
   - **Fase 2 (Finalização / Compensação)**: Renderização do PDF em memória, upload no bucket privado R2, e invocação da RPC `finalize_work_order_proposal_atomic` com validação de hash e tamanho. Em caso de falha irreversível, compensação atômica via `mark_work_order_proposal_failed_atomic`.
5. **Ciclo de Aceite e Reabertura**:
   - **Aprovação**: RPC `accept_work_order_proposal_atomic` transiciona a proposta para `accepted` e a OS para `aprovada`, vinculando `work_orders.accepted_proposal_id`.
   - **Reabertura**: Transição de status da OS de `aprovada` para `orcamento` limpa `accepted_proposal_id = null`, mantendo o registro histórico da revisão anterior intacto até a emissão de uma nova revisão (que a tornará `superseded`).
6. **Interface Administrativa Rica e Responsiva**:
   - Nova aba **"Orçamentos"** em `/admin/ordens-servico/:id`.
   - Modais contextuais de prévia efêmera (sem persistência no banco), emissão oficial e confirmação de aceite.
   - Responsividade aprovada em 10 viewports (320px até 1920px), alvos de toque >= 44x44px e zero scripts de rastreamento público em rotas `/admin`.

---

## 2. Topologia de Arquivos e Módulos Criados/Atualizados

```
├── app/
│   ├── app.vue                                                    # Isolamento estrito de noscript GTM em rotas /admin
│   ├── pages/admin/ordens-servico/
│   │   └── [id].vue                                               # Integração da aba 'orcamentos' e do ProposalsManager
│   └── components/admin/work-orders/
│       ├── WorkOrderProposalsManager.vue                          # Timeline de revisões, badges, download e visualização
│       ├── WorkOrderProposalModal.vue                             # Modal de configuração comercial, prévia e emissão
│       └── WorkOrderProposalAcceptModal.vue                       # Modal de confirmação de aprovação pelo cliente
│
├── server/
│   ├── shared/
│   │   ├── proposalPdfTypes.ts                                    # Interfaces TypeScript e formatadores de moeda/data
│   │   └── proposalCore.mjs                                       # Motor core de PDFKit, R2 privado e hashing canônico
│   ├── utils/
│   │   ├── proposalPdf.ts                                         # Utilitário tipado para geração de PDF
│   │   ├── r2ProposalStorage.ts                                   # Utilitário tipado para operações seguras no R2 privado
│   │   └── proposalOrchestrator.ts                                # Orquestrador 2-Phase com recuperação de timeout
│   └── api/admin/crm/work-orders/
│       └── [id]/
│           ├── status.post.ts                                     # Reabertura da OS com accepted_proposal_id = null
│           └── proposals/
│               ├── index.get.ts                                   # Listagem de propostas e metadados de histórico
│               ├── preview.post.ts                                # Stream de PDF efêmero sem gravação no banco ou R2
│               ├── issue.post.ts                                  # Emissão transacional atômica com idempotencyKey
│               └── [proposalId]/
│                   ├── index.get.ts                               # Detalhes da proposta e snapshots capturados
│                   ├── signed-url.get.ts                          # Geração de presigned URL (TTL 300s)
│                   └── accept.post.ts                             # Aprovação atômica da proposta e avanço da OS
│
└── scripts/
    ├── test_crm_phase4_1_backend.mjs                              # Suíte de 37 testes automatizados de backend
    └── test_crm_phase4_1_browser.mjs                              # Suíte Playwright com 15 verificações em 10 viewports
```

---

## 3. Endpoints BFF Nitro

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `GET` | `/api/admin/crm/work-orders/:id/proposals` | `requireActiveAdmin` | Lista todas as revisões de propostas da OS com status e datas. |
| `POST` | `/api/admin/crm/work-orders/:id/proposals/preview` | `requireActiveAdmin` | Renderiza prévia efêmera em PDF e retorna stream binário `application/pdf`. |
| `POST` | `/api/admin/crm/work-orders/:id/proposals/issue` | `requireActiveAdmin` + CSRF | Executa o orquestrador transacional de 2 fases para emitir nova revisão. |
| `GET` | `/api/admin/crm/work-orders/:id/proposals/:proposalId` | `requireActiveAdmin` | Retorna os detalhes completos e snapshots congelados de uma revisão. |
| `GET` | `/api/admin/crm/work-orders/:id/proposals/:proposalId/signed-url` | `requireActiveAdmin` | Retorna URL pré-assinada do S3/R2 com expiração de 300 segundos. |
| `POST` | `/api/admin/crm/work-orders/:id/proposals/:proposalId/accept` | `requireActiveAdmin` + CSRF | Invoca a RPC de aceite atômico e transiciona a OS para `aprovada`. |

---

## 4. Matriz de Testes e Resultados de Validação

### 4.1. Suíte da Fase 4.1 Backend (`scripts/test_crm_phase4_1_backend.mjs`)
- **Total de Asserts**: 37
- **Aprovados (PASS)**: 37
- **Reprovados (FAIL)**: 0
- **Destaques**:
  - Geração de PDF com caracteres UTF-8 (`á, é, í, ó, ú, â, ê, ô, ã, õ, ç, Á, É, Í, Ó, Ú, Â, Ê, Ô, Ã, Õ, Ç, R$`).
  - Geração de documentos multi-páginas (12 itens) com paginação "Página X de Y".
  - Determinismo estrito do hash canônico SHA-256 dos termos comerciais.
  - Validação estrita da chave de armazenamento `proposals/{woId}/{propId}.pdf` (bloqueio de path traversal e prefixos errados).
  - Ciclo de vida completo: Reserva Rev. 1 -> Finalização Rev. 1 -> Replay idempotente -> Aceite Rev. 1 -> Reabertura OS -> Emissão Rev. 2 -> Transição automática da Rev. 1 para `superseded` preservando data de aceite histórico.
  - Rejeição de chave de idempotência reutilizada com hash divergente (`ERR_IDEMPOTENCY_MISMATCH`).
  - Compensação de falha atômica (`mark_work_order_proposal_failed_atomic`).
  - Triggers de imutabilidade de conteúdo e bloqueio absoluto de DELETE físico.

### 4.2. Suíte da Fase 4.1 Playwright Browser (`scripts/test_crm_phase4_1_browser.mjs`)
- **Total de Asserts**: 15
- **Aprovados (PASS)**: 15
- **Reprovados (FAIL)**: 0
- **Viewports Testados**: 320x568, 360x740, 375x667, 390x844, 412x915, 430x932, 768x1024, 1024x768, 1280x800, 1920x1080.
- **Zero Overflow**: `document.documentElement.scrollWidth <= window.innerWidth` em todos os viewports.
- **Zero Tracking**: Nenhum script GTM ou Meta Pixel carregado nas rotas administrativas.

### 4.3. Regressão Global do Sistema
- **Migration 011 (PostgreSQL 17)**: 157/157 PASS (0 FAIL)
- **Fase 3 Backend**: 60/60 PASS (0 FAIL)
- **Fase 3 Browser**: 25/25 PASS (0 FAIL)
- **Fase 4 Backend & Hotfix 4.0C**: 80/80 PASS (0 FAIL)
- **Fase 4 Browser**: 22/22 PASS (0 FAIL)

---

## 5. Garantias de Segurança e Não-Regressão

1. **Zero Acesso Direto do Browser ao Supabase**: Todas as chamadas para consultas e RPCs passam obrigatoriamente pelas rotas BFF Nitro protegidas com `requireActiveAdmin`.
2. **Zero Exposição de Chaves de Serviço**: A chave `supabaseServiceRoleKey` permanece estritamente no backend.
3. **Privacidade e Minimização de Dados**: Snapshots e logs de auditoria não contêm anotações internas confidenciais ou rastreamento excessivo.
4. **Isolamento de Produção**: Zero mutações de teste executadas em banco de dados ou buckets R2 de produção durante os gates de teste.

---

## 6. Hotfix 4.1C.1 — Correção do Argumento da RPC e Diagnóstico Local

### 6.1. Correção de Nome de Argumento da RPC (`p_input_hash` -> `p_idempotency_request_sha256`)
- **Problema Identificado**: Em produção, a chamada para `reserve_work_order_proposal_atomic` retornava erro `PGRST202 (Could not find the function public.reserve_work_order_proposal_atomic with the specified parameter names)`.
- **Causa Raiz**: O orquestrador em `server/utils/proposalOrchestrator.ts` enviava o campo `p_input_hash: hashHex`, enquanto a assinatura real instalada pela Migration 011 em PostgreSQL 17 é `p_idempotency_request_sha256 VARCHAR(64)`.
- **Arquivo Corrigido**: [server/utils/proposalOrchestrator.ts](file:///d:/sicons/ADT/server/utils/proposalOrchestrator.ts#L105).
- **Auditoria**: Busca em todo o repositório confirmou **0 referências restantes a `p_input_hash`**.

### 6.2. Diagnóstico Local de `GET /work-orders/:id` e `POST /preview`
- **Reprodução Local**:
  - `GET /api/admin/crm/work-orders/:id` → **HTTP 200 (331ms)**.
  - `POST /api/admin/crm/work-orders/:id/proposals/preview` → **HTTP 200 (3239ms, Content-Type: application/pdf)**.
- **Causa Raiz dos Erros Observados (524 / 500)**: As rotas dependem de requisições server-side `$fetch` para o Supabase REST. No ambiente anterior (Node 20 sem System CA), ocorria falha/travamento de TLS (`SELF_SIGNED_CERT_IN_CHAIN`), gerando timeout HTTP 524 na borda do Cloudflare. Com Node 24 + `NODE_USE_SYSTEM_CA=1` e a correção do parâmetro da RPC, as requisições fluem normalmente com validação TLS ativa.

---

## 7. Hotfix 4.1C.2 — Correção Estrutural do Layout PDF e Paginação

### 7.1. Diagnóstico e Causas Raiz
1. **Causa Raiz da Criação de Páginas Extras (Bug das 3 Páginas)**:
   - No motor anterior do PDFKit, o rodapé desenhava textos na coordenada `footerY = doc.page.height - 36`. Como o `margin.bottom` do documento estava configurado em `40`, essa coordenada caía abaixo do limite inferior seguro da página.
   - Cada chamada a `doc.text()` abaixo da margem inferior ativava o gatilho automático de quebra de página do PDFKit (`doc.addPage()`). Como o loop de rodapé continha duas chamadas (`footerText` e `Página X de Y`), eram geradas **duas páginas fantasmas adicionais**, deslocando o texto do rodapé para a página 2 e o número de página para a página 3.
2. **Causa Raiz da Sobreposição da Logo no Cabeçalho**:
   - A imagem era inserida com largura fixa (`width: 110`) sem limitar a altura máxima com `fit: [maxWidth, maxHeight]`. Imagens com proporção mais alta ultrapassavam a linha divisória inferior.
3. **Causa Raiz do Clipping de Texto nas Condições Comerciais e Itens**:
   - As condições de pagamento usavam `{ continued: true }` com altura estática (`80pt`), sem pré-cálculo com `doc.heightOfString(...)`. Textos com mais de 2 linhas transbordavam e cortavam o conteúdo.
   - As linhas da tabela de itens e medições usavam alturas fixas (`22pt` e `16pt`) com `ellipsis: true`.

### 7.2. Soluções Estruturais Implementadas
1. **Constantes Centrais de Geometria e Grade (`PDF_LAYOUT`)**:
   - Centralizadas constantes estritas: `PAGE_WIDTH (595.28)`, `PAGE_HEIGHT (841.89)`, `MARGIN_LEFT (36)`, `MARGIN_RIGHT (36)`, `MARGIN_TOP (32)`, `MARGIN_BOTTOM (36)`, `CONTENT_WIDTH (523.28)`, `FOOTER_RESERVED_HEIGHT (44)` e `CONTENT_BOTTOM (761.89)`.
2. **Caixa Delimitadora da Logo (`fit: [105, 52]`)**:
   - A logo é contida estritamente dentro da caixa de 105x52 pt, com alinhamento vertical e sem distorção. A área institucional da empresa inicia obrigatoriamente à direita (`textStartX = MARGIN_LEFT + LOGO_BOX_WIDTH + 14`), e o divisor horizontal é desenhado abaixo da maior altura entre a logo e o texto.
3. **Altura Dinâmica em Todas as Áreas Textuais**:
   - Implementado pré-cálculo via `doc.heightOfString(...)` para: dados do cliente, endereço, categorias, descrições dos itens, linhas de medição técnica e condições comerciais (pagamento, prazo e observações).
   - O card de condições comerciais e o card de resumo financeiro alinham suas alturas dinamicamente através de `Math.max(termsNeededH, totalsNeededH)`.
4. **Helper de Paginação Preventiva (`ensureSpace`)**:
   - Verifica `if (doc.y + requiredHeight > CONTENT_BOTTOM)` antes de renderizar qualquer bloco indivisível.
   - Em caso de quebra de página, renderiza cabeçalho compacto de identificação nas páginas 2..N e reinicia o cabeçalho da tabela se necessário.
5. **Rodapé e Numeração em Dois Passos com Margem Protegida**:
   - Durante a iteração `doc.switchToPage(i)`, o `doc.page.margins.bottom` é temporariamente definido como `0`, impedindo qualquer auto-adição acidental de páginas pelo PDFKit.
   - Textos de rodapé utilizam `lineBreak: false` e coordenadas absolutas seguras.
   - A autoridade de contagem de páginas é `doc.bufferedPageRange().count`.

### 7.3. Resultados dos Testes Visuais e Estruturais (`scripts/test_pdf_layout_visual.mjs`)
- **Total de Asserts**: 13/13 PASS (0 FAIL).
- **Amostra Real Atual**: EXATAMENTE **1 página física**, zero páginas em branco, zero sobreposição de logo, zero corte textual.
- **Documento Multipágina (12 Itens)**: 2 páginas físicas, com cabeçalho compacto na página 2 e paginação correta `Página 1 de 2` e `Página 2 de 2`.
- **Prévia HTTP Real (`POST /api/admin/crm/work-orders/:id/proposals/preview`)**: HTTP 200, Content-Type `application/pdf`, tamanho de 1 página física.

---

## 8. Hotfix 4.1C.3 — Correção de Overflow das Condições Comerciais e Restauração de Rodapé

### 8.1. Diagnóstico e Causa Raiz do Overflow
1. **Incompatibilidade do `{ continued: true }` com Larguras Explícitas no PDFKit**:
   - Ao desenhar `doc.text('Forma de Pagamento: ', startX, y, { continued: true })` e em seguida `doc.text(paymentText, { width: leftInnerWidth })`, o cursor horizontal já estava deslocado pela largura do label (~85pt).
   - O PDFKit interpretava a largura máxima de quebra (`leftInnerWidth`) a partir do ponto atual do cursor (`startX + 85`), fazendo com que as linhas quebrassem 85pt além da margem direita do card esquerdo, invadindo a área do quadro de totais.
2. **Helper `drawLabelValueBlock` e `measureLabelValueHeight`**:
   - Eliminado o uso de `{ continued: true }` em campos comerciais variáveis.
   - Textos de linha única são renderizados com posicionamento inline absoluto `(startX, startY)` e `(startX + labelW, startY)`.
   - Textos multi-linha renderizam o rótulo no topo e o conteúdo com quebra de linha estritamente contida em `width: leftInnerWidth` (`325.28 pt`).
   - Margem de segurança de 20pt garantida entre o texto das condições comerciais e o quadro de totais (`totalsGap = 12 pt`).

### 8.2. Restauração Confiável do Rodapé e Numeração
- Proteção da margem inferior do PDFKit (`doc.page.margins.bottom = 0`) durante o segundo passo de numeração com restauração ao final.
- Linha divisória em `PAGE_HEIGHT - 42` e textos em `PAGE_HEIGHT - 36` com `lineBreak: false`.

### 8.3. Matriz de Testes Visuais e Renderização PNG (`scripts/test_pdf_layout_visual.mjs`)
- **Total de Asserts**: 13/13 PASS (0 FAIL).
- **Testes Validados**:
  1. `SHORT_PAYMENT_TEST` (~30 caracteres): 1 página física (PASS).
  2. `NORMAL_PAYMENT_TEST` (~120 caracteres): 1 página física (PASS).
  3. `LONG_PAYMENT_500_CHAR_TEST` (~500 caracteres): 1 página física, expansão vertical dinâmica, zero colisão com totais (PASS).
  4. `LONG_DESCRIPTION_300_CHAR_TEST` (~300 caracteres): 1 página física, quebra de linha dinâmica na tabela (PASS).
  5. `LONG_NOTES_1000_CHAR_TEST` (~1000 caracteres): encapsulamento com wrapping seguro (PASS).
  6. `MULTIPAGE_12_ITEMS_TEST`: 2 páginas físicas, rodapé institucional presente, numerações `Página 1 de 2` e `Página 2 de 2` (PASS).
  7. `VISUAL_PNG_AUDIT`: Renderização fiel de todos os casos em imagens PNG de alta resolução via PDF.js + Playwright (PASS).




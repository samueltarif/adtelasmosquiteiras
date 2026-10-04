# RELATÓRIO — AUDITORIA PRÉ-IMPLEMENTAÇÃO: CAPTURA DE LEAD ANTES DO WHATSAPP

Projeto: AD Telas e Redes · Data: 2026-10-04 · Commit: `dabbd6930b6e4a94d67dfc237dde3c864b1e4433`
Escopo: somente leitura. Nenhum código, migration, RPC, tracking ou banco alterado.
Evidência de banco: MCP Supabase, projeto `axjqhxpejwkuabeaoyaz` (somente `SELECT` em catálogo / contagens agregadas).

---

## 1. MAPA DE TODOS OS BOTÕES DE WHATSAPP

### 1.1 Achado principal
**Não existe componente central de CTA.** Existem ~54 âncoras `<a href="wa.me|api.whatsapp.com">` espalhadas em 22 arquivos ativos,
com 8 formas diferentes de montar a URL. **Porém TODAS passam por UM interceptador global**:
[`app/plugins/track-clicks.client.ts`](app/plugins/track-clicks.client.ts) (listener `click` em fase de captura no `document`).
É ele que gera a REF, reescreve o `href` e dispara o tracking. Nenhum CTA usa `window.open`, `location.href` ou `navigateTo`.

### 1.2 Ocorrências ativas (renderizadas)

| ARQUIVO | COMPONENTE/PÁGINA | ROTA | TIPO_DE_CTA | FUNÇÃO_USADA | TRACKING_USADO | ABRE_DIRETO |
|---|---|---|---|---|---|---|
| components/Header.vue L142 | Header (layout default) | todas c/ layout default | header | string fixa wa.me | plugin global | true |
| components/FloatingButtons.vue L22 | Floating (layout default; oculto em /servicos/telas) | todas c/ layout default | floating_whatsapp | string fixa api.whatsapp | plugin global | true |
| pages/lp/telas-mosquiteiras.vue L266,331(v-for),397(v-for),456,534,563,622 | LP campanha (layout:false) | /lp/telas-mosquiteiras | hero, modelos, galeria, comparison, foto, cta, floating | `getWhatsappUrl()` local | plugin global + `useLandingTracking.track('whatsapp_cta_click')` (GA/GTM `generate_lead`) | true |
| pages/servicos/telas/index.vue L200,212(v-for),238,242,244,246 | Telas hub (layout:false) | /servicos/telas | hero, service_card, band, quote, footer, floating | `getWhatsappUrl()` local | plugin global | true |
| components/telas/TelasServicePage.vue L51 + ServiceHero L101 + ServiceQuoteCTA L7 + ServiceFooter L6 | Template de serviço telas (layout:false) | /servicos/telas/{janelas,portas,pet-screen,removivel,restaurantes,sacadas-e-varandas} | floating, hero, quote, footer | `service.whatsappUrl` de app/data/telas/*.ts | plugin global | true |
| pages/servicos/[slug].vue L119,291,405 + ServicoEspecificacoes L58 + ServicoCtaFinal L72 | Serviço legado | /servicos/:slug | hero, comparacao, faq, especificacoes, cta_final | `useServicoData().getWhatsAppUrl()` | plugin + `trackEvent('servico_whatsapp_clicked')` (GA) | true |
| pages/servicos/[familia]/[categoria]/[servico].vue L139,291,355,410,470 | Serviço 3 níveis | /servicos/:f/:c/:s | vários | `useServicos().getWhatsAppUrl()` | plugin + GA | true |
| pages/servicos/[familia]/[categoria]/index.vue L143 | Categoria | /servicos/:f/:c | categoria | template literal inline | plugin | true |
| pages/servicos/[familia]/index.vue L154 | Família | /servicos/:f | família | string inline | plugin | true |
| pages/servicos/vidracaria.vue L158,280(v-for),367,421,472 | Vidraçaria | /servicos/vidracaria | hero, produto, cta | `whatsappUrl` / `getWhatsappItemUrl()` local | plugin + GA | true |
| pages/servicos/redes/index.vue L179,263,374(v-for),406 | Redes hub | /servicos/redes | hero, card, ajuda | string fixa + `getWhatsappUrl()` local | plugin | true |
| pages/servicos/redes/{janelas,sacadas-e-varandas,gatos-e-pets,escadas-e-mezaninos,criancas}.vue (~L105) | Redes subpáginas | /servicos/redes/* | hero | const string fixa | plugin | true |
| pages/servicos/index.vue L52 | Serviços | /servicos | ajuda | string fixa | plugin | true |
| pages/por-que-instalar-tela-mosquiteira.vue L230 | Conteúdo | /por-que-instalar-tela-mosquiteira | cta | const string | plugin | true |
| pages/orcamento.vue L324 | Orçamento | /orcamento | alternativa ao form | const string | plugin | true |
| pages/obrigado.vue L41 | Obrigado | /obrigado | pós-form | string fixa | plugin | true |
| pages/contato.vue L101 | Contato | /contato | contato | const string | plugin | true |
| pages/areas-atendidas.vue L93 | Áreas | /areas-atendidas | cta | const string | plugin | true |
| components/CepSearch.vue L134,L161 | Busca CEP | /areas-atendidas | resultado CEP | computed / string | plugin | true |
| components/MobileUnifiedCTA.vue L170 | Sticky mobile | 13 páginas (servicos/*, redes/*, vidracaria, areas-atendidas) | sticky_mobile | computed `wa.me/${telefone}` | plugin | true |

**TOTAL ≈ 54 pontos de CTA em template (22 arquivos ativos + 6 arquivos de dados `app/data/telas/*.ts`).**
Admin (`formatWhatsAppLink` em leads/clientes/OS) foi excluído: o plugin ignora `/admin`.

### 1.3 Código morto (não montado em nenhum lugar)
`CtaButtons.vue`, `CtaButton.vue`, `WhatsappModal.vue`, `useWhatsappModal.js`, `WhatsappFloating.vue`, `StickyCtaMobile.vue`,
`PureCTAButtons.vue`, `StickyBottomBar.vue`, `StickyBottomBarVariants.vue`, `MobileHeroOptimized.vue`, `MobileLandingComplete.vue`,
`FormSuccess.vue`. Obs.: `WhatsappModal.vue` + `useWhatsappModal.js` são um **modal legado nome/cidade → wa.me sem gravar nada** — precedente, não reutilizável como está.

---

## 2. FLUXO CENTRAL ATUAL (ponta a ponta)

```
STEP_1  = Usuário clica num <a href="https://wa.me/...">  (qualquer página não-admin)
STEP_2  = track-clicks.client.ts:30 listener capture → closest('a, button, [data-track-type]')
STEP_3  = classificação tipo='whatsapp' se href contém wa.me|whatsapp.com|whatsapp OU texto contém "whatsapp" OU data-gtm contém "whatsapp" (L49-57)
STEP_4  = dedupe 700ms por chave `${tipo}:${ctaLocation}:${path}` (L71-82) → se repetido: preventDefault e reaplica REF ativa
STEP_5  = identidade: useAnalyticsIdentity.getOrCreateVisitorId / getOrCreateSessionId / getSessionLandingPath (L87-89)
STEP_6  = atribuição: useAttribution.getOrInitAttribution() (cookie adt_session_attribution) (L90)
STEP_7  = getServiceContext() (data-service-key) + generateUUID() → event_id (L91-92)
STEP_8  = REF: whatsappShortCode.generateShortCode() (L97)  — client-side, no clique
STEP_9  = clickTrackerDispatcher.prepareWhatsappAnchorForNavigation() → reescreve href com " Ref: XXXXXXXX" no ?text= ; restaura href após 750ms
STEP_10 = buildClickPayload() (utm, google_*, gclid/gbraid/wbraid, meta, tiktok, channel, short_code)
STEP_11 = dispatchClickTracking() → whatsappTrackingQueue.dispatchWhatsappTracking():
          a) enqueue localStorage adt_pending_whatsapp_clicks
          b) fetch POST /api/track-click {keepalive:true} (fallback sendBeacon)
          c) se res.ok → dequeue
STEP_12 = navegador segue a navegação NATIVA da âncora (target=_blank) já com a REF → WhatsApp abre
STEP_13 = server/api/track-click.post.ts: valida short_code regex → POST /rest/v1/rpc/create_whatsapp_click_attribution_atomic_v3 (service role)
STEP_14 = RPC v3 (1 transação): INSERT lead_clicks (ON CONFLICT event_id DO NOTHING) → INSERT whatsapp_attributions (status 'unassigned')
STEP_15 = (somente LP / páginas de serviço) handlers @click paralelos → GA4/GTM (dataLayer whatsapp_click / generate_lead)
```

Importante: o tracking é **fire-and-forget** e **não bloqueia** a abertura do WhatsApp; a abertura é a navegação nativa do `<a>`.

---

## 3. GERAÇÃO DA REF

```
REF_GENERATOR_FILE=app/utils/whatsappShortCode.ts (cópia isomórfica em server/shared/whatsappShortCodeCore.mjs)
REF_GENERATOR_FUNCTION=generateShortCode()
REF_LENGTH=8
REF_ALPHABET=23456789ABCDEFGHJKMNPQRSTVWXYZ (30 símbolos, sem 0/1/I/L/O/U; crypto.getRandomValues com rejection sampling <240)
REF_GENERATED_BEFORE_CLICK=false
REF_GENERATED_ON_CLICK=true
REF_GENERATED_SERVER_SIDE=false (servidor só valida regex + unicidade via UNIQUE(short_code))
REF_GENERATED_CLIENT_SIDE=true
```
A REF nasce **no handler de captura do clique**, antes da navegação, uma nova por clique (exceto dentro da janela de 700ms).

---

## 4. TRACKING DE CLIQUE WHATSAPP

```
ENDPOINT=POST /api/track-click  (server/api/track-click.post.ts)
TABELA=public.lead_clicks + public.whatsapp_attributions
RPC=public.create_whatsapp_click_attribution_atomic_v3
FUNCTION=dispatchWhatsappTracking (front) → handler track-click (server)
EVENT_TYPE=lead_clicks.tipo='whatsapp' ; whatsapp_attributions.attribution_status='unassigned'
```
Sequência real: `lead_clicks` (event_id idempotente) → `whatsapp_attributions` (short_code, lead_click_id, visitor_id, session_id,
channel, utm_*, gclid/gbraid/wbraid, google_campaign/adgroup/creative, meta_*, tiktok_*, campaign_name derivado, landing_path, cta_location).
Colisão de short_code com event_id diferente → `ERR_SHORT_CODE_COLLISION` → rollback total (sem órfão). Não há retry com nova REF.
Campos `google_match_type/network/target_id/device` vão só para `lead_clicks` (não existem em `whatsapp_attributions`).
Não existe coluna `traffic_channel`: o nome real é `channel` (lead_clicks / whatsapp_attributions) e `session_channel` (leads).

---

## 5. RPCs

| NOME_RPC | USADA_ATUALMENTE | CHAMADA_POR | FUNÇÃO | ARQUIVO (migration) |
|---|---|---|---|---|
| create_whatsapp_click_attribution_atomic (v1) | false | ninguém | clique+atribuição (Google only) | supabase/migrations/20260920220000_create_whatsapp_attributions.sql |
| create_whatsapp_click_attribution_atomic_v2 | false | ninguém no app | + fbclid/msclkid/meta | 20260927210000_..._rpc_v2.sql, 20260927220000_harden_..._v2 |
| create_whatsapp_click_attribution_atomic_v3 | **true** | server/api/track-click.post.ts L51 (+ scripts de teste) | + ttclid/tiktok, idempotência event_id | 20260927231000_create_whatsapp_rpc_v3.sql, 20260928000000_harden_..._v3 |

As três existem no banco (SECURITY DEFINER). Outra RPC relacionada: `convert_lead_to_client_atomic` (CRM). Nenhuma RPC cria lead.

---

## 6. IDENTIDADE DO VISITANTE

| Chave | Onde | Persistência | Função |
|---|---|---|---|
| adt_vid | cookie | 365 dias | getOrCreateVisitorId |
| adt_sid | cookie | maxAge 1800s + `localStorage.adt_last_activity` (timeout 30 min) | getOrCreateSessionId |
| adt_landing_path | cookie | 1800s | getSessionLandingPath |
| adt_session_attribution | cookie JSON | 1800s, reescrito só em novo touch (UTM/click-id na URL ou referrer externo novo) | useAttribution.getOrInitAttribution |
| adt_ft_context | localStorage | permanente, gravado 1x | setFirstTouchContextOnce (track-visits.client.ts) |

```
IDENTITY_FLOW=track-visits.client.ts (router.afterEach) cria vid/sid/landing + snapshot de atribuição + first touch
             → no clique WhatsApp, track-clicks.client.ts relê os mesmos cookies (sem rede)
```
Disponível no clique: visitor_id, session_id, landing_path, origem (path), cta_location, service_key, utm_*, google_* (se na URL), gclid/gbraid/wbraid, fbclid/msclkid/ttclid, meta_*, tiktok_*, referrer, channel.
**Não** enviado no clique WhatsApp: contexto first-touch (adt_ft_context) — só o `/api/send-lead` usa.

---

## 7. GOOGLE ADS / CLICK IDs
Origem: query string da URL de entrada (`gclid`, `gbraid`, `wbraid`, `campaign_id|google_campaign_id`, `adgroup_id`, `creative`, `matchtype`, `network`, `device`, `target_id|targetid`) → `useAttribution` → cookie `adt_session_attribution` (30 min) → `buildClickPayload` (`google_*`).
```
GCLID_AVAILABLE_AT_WHATSAPP_CLICK=true  (condicionado: cookie de atribuição de 30 min ainda válido)
CAMPAIGN_DATA_AVAILABLE_AT_WHATSAPP_CLICK=true (somente se o anúncio usa ValueTrack {campaignid},{adgroupid}... na URL final/sufixo)
```
⚠️ O cookie de atribuição tem maxAge fixo de 30 min a partir da escrita (não é renovado com atividade). Se expirar, um novo snapshot "direct" é criado e o gclid some da sessão (permanece apenas em `adt_ft_context.first_touch_gclid`). Um modal adiciona tempo ao funil → risco a considerar.

---

## 8. MESSAGE BUILDER
Não há builder central. A REF é sempre anexada pelo plugin, nunca pelos builders.
```
MESSAGE_BUILDER_FILE=múltiplos (lp/telas-mosquiteiras.vue getWhatsappUrl; servicos/telas/index.vue; servicos/redes/index.vue; vidracaria.vue;
                     composables/useServicos.js getWhatsAppUrl L523; composables/useServicoData.js getWhatsAppUrl L245;
                     app/data/telas/*.ts whatsappUrl; MobileUnifiedCTA.vue; CepSearch.vue; strings fixas em Header/FloatingButtons/etc.)
FUNCTION=appendShortCodeToWhatsappUrl(rawUrl, shortCode, {replaceExisting:true}) — app/utils/whatsappShortCode.ts L60
CURRENT_MESSAGE_TEMPLATE="<texto do CTA, ex.: 'Olá! Gostaria de um orçamento para telas mosquiteiras ... Vim pela página de anúncios.'> Ref: XXXXXXXX"
```
A REF é adicionada ao final do parâmetro `text` com separador espaço (`... Ref: H5MKQAAN`). Extração inversa: `extractShortCodeFromMessage`.

---

## 9. ABERTURA DO WHATSAPP
```
WHATSAPP_OPEN_METHOD=anchor (navegação nativa de <a href>, quase todos com target="_blank" rel="noopener noreferrer"); href mutado no capture-phase
```
Desktop vs mobile: **mesmo código**. A diferença é do SO/navegador: `wa.me`/`api.whatsapp.com` abre WhatsApp Web/Desktop no desktop
e faz deep link para o app no mobile. Hoje não há bloqueio de popup porque é navegação de âncora iniciada pelo próprio gesto.

---

## 10. DUPLICAÇÃO DE CLIQUES
```
MULTIPLE_CLICKS_ALLOWED=true   (cada clique fora da janela de 700ms gera novo event_id)
MULTIPLE_REFS_ALLOWED=true     (1 REF por clique; mesmo visitante/sessão pode ter N REFs)
DEDUPLICATION_EXISTS=true (parcial)
```
Regras: (a) 700ms client-side mesmo tipo+cta+path; (b) fila não duplica por event_id; (c) `lead_clicks.event_id` UNIQUE parcial + fast-path idempotente na RPC;
(d) `whatsapp_attributions.short_code` UNIQUE e `lead_click_id` UNIQUE. Não há dedupe por visitante/sessão/telefone.

---

## 11. FILA / RETRY
```
RETRY_QUEUE_EXISTS=true
RETRY_QUEUE_FILE=app/utils/whatsappTrackingQueue.ts (chave localStorage adt_pending_whatsapp_clicks, máx 10 itens, TTL 24h)
RETRY_TRIGGER=flushPendingWhatsappClicks() no boot do plugin track-clicks (cada carregamento de página)
RETRY_CAN_DUPLICATE=false no banco (mesmo event_id → RPC idempotente); pode reenviar a requisição N vezes (inofensivo)
```
Obs.: item enviado via sendBeacon permanece na fila e é reenviado no próximo load (idempotente por design).

---

## 12. ROTAS COM CTA DE WHATSAPP

| ROTA | ARQUIVO | CTA | COMPONENTE | TRACKING | MENSAGEM | ABERTURA |
|---|---|---|---|---|---|---|
| / | pages/index.vue (+layout) | header, floating | Header, FloatingButtons | plugin | fixa | anchor |
| /lp/telas-mosquiteiras | pages/lp/telas-mosquiteiras.vue | 7 pontos | inline | plugin + GA/GTM | por CTA | anchor |
| /servicos | pages/servicos/index.vue | 1 + header/floating | inline | plugin | fixa | anchor |
| /servicos/telas | pages/servicos/telas/index.vue | 6 | inline | plugin | por serviço | anchor |
| /servicos/telas/{6 slugs} | TelasServicePage + data/telas/*.ts | 4 por página | telas/* | plugin | por serviço | anchor |
| /servicos/redes | pages/servicos/redes/index.vue | 4 + sticky | inline + MobileUnifiedCTA | plugin | por serviço | anchor |
| /servicos/redes/{5 slugs} | pages/servicos/redes/*.vue | 1 + sticky | inline + MobileUnifiedCTA | plugin | fixa | anchor |
| /servicos/vidracaria | pages/servicos/vidracaria.vue | 5 + sticky | inline + MobileUnifiedCTA | plugin + GA | por item | anchor |
| /servicos/:slug | pages/servicos/[slug].vue | 5 | Servico* | plugin + GA | useServicoData | anchor |
| /servicos/:f, /:f/:c, /:f/:c/:s | pages/servicos/[familia]/** | 1/1/5 + sticky | inline + MobileUnifiedCTA | plugin (+GA) | useServicos/inline | anchor |
| /areas-atendidas | pages/areas-atendidas.vue | 1 + CEP 2 + sticky | CepSearch, MobileUnifiedCTA | plugin | CEP/fixa | anchor |
| /orcamento, /contato, /obrigado, /por-que-instalar-tela-mosquiteira | respectivos | 1 cada | inline | plugin | fixa | anchor |
| /politica-de-privacidade e demais c/ layout default | — | header, floating | Header, FloatingButtons | plugin | fixa | anchor |

---

## 13. COMPONENTES REUTILIZÁVEIS
```
CENTRAL_WHATSAPP_COMPONENT_EXISTS=false
```
Fluxos distintos de montagem de URL: **8** (string fixa; `getWhatsappUrl` local por página ×4; `useServicos.getWhatsAppUrl`;
`useServicoData.getWhatsAppUrl`; `data/telas/*.ts`; `MobileUnifiedCTA` computed; `CepSearch` computed).
Fluxo de tracking/REF: **1** (plugin global). Componentes reutilizados parcialmente: `MobileUnifiedCTA` (13 rotas), `TelasServicePage` (6 rotas), `Header`/`FloatingButtons` (layout default).

---

## 14. LEADS ATUAIS (`/api/send-lead` → `public.leads`)
Fluxo: `validateLeadName` (≥2 chars) + `validateLeadPhone` (10–11 dígitos) + `validateLeadEmail` (opcional) → `buildLeadInsertPayload` (server/utils/leadDb.ts) →
INSERT REST `leads` (idempotente por `submission_id` UNIQUE parcial) → upload token → e-mail em background (`notification_email_status='pending'`).

```
LEADS_TABLE_COLUMNS=id, created_at, nome(NOT NULL), cidade(NOT NULL), bairro, servico, telefone, email, mensagem, origem, status,
valor_orcamento, observacoes, submission_id, visitor_id, session_id, landing_path, conversion_path, session_channel,
utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, gbraid, wbraid, fbclid, msclkid, referrer,
first_touch_channel, first_touch_landing_path, first_touch_referrer, first_touch_utm_{source,medium,campaign,content,term},
first_touch_{gclid,gbraid,wbraid,fbclid,msclkid,ttclid}, first_touch_google_{campaign_id,adgroup_id,creative_id,match_type,network,device,target_id},
notification_email_{status(NOT NULL),sent_at,attempts(NOT NULL),last_attempt_at,last_error}, device_type,
google_{campaign_id,adgroup_id,creative_id,match_type,network,device,target_id}, meta_{campaign_id,adset_id,ad_id,placement},
ttclid, tiktok_{campaign_id,adgroup_id,ad_id,creative_id,placement}
```
Constraints: PK id; UNIQUE parcial submission_id; CHECK notification_email_status/attempts. **Sem** CHECK em status/origem; sem UNIQUE em telefone.

| Campo desejado | Coluna real | Suporta? |
|---|---|---|
| name | nome | ✅ |
| phone | telefone | ✅ |
| source | origem (texto livre; default 'formulario_geral') | ✅ |
| session_id | session_id | ✅ |
| visitor_id | visitor_id | ✅ |
| traffic_channel | session_channel | ✅ (nome diferente) |
| utm_campaign | utm_campaign | ✅ |
| gclid | gclid | ✅ |
| ref_whatsapp | — | ❌ não existe |
| status | status (default 'Novo') | ✅ |

Observação: `cidade` é NOT NULL e o builder força `'São Paulo'` quando ausente → um lead WhatsApp (só nome+telefone) receberia cidade fictícia.
Hoje `public.leads` tem **0 linhas** (contagem agregada).

---

## 15. RELAÇÃO CRM
- `whatsapp_attributions.lead_id → leads.id` (FK, ON DELETE SET NULL) e `client_id → clients.id`.
- **+ Criar Cliente** (`POST /api/admin/crm/clients`, L119-165): se `ref_whatsapp` informado e atribuição `unassigned` → PATCH `assigned`, `confirmed`, `exact_code`, `client_id`.
- **Vincular** (`POST /api/admin/marketing/whatsapp-attributions/:id/assign`): `client_id` e/ou `lead_id`; `match_method` `exact_code`→`confirmed`, senão `manual_selection`→`probable`; `notes`; bloqueia reassociação silenciosa (409); grava `crm_activity`.
- **Dispensar** (`.../dismiss`): `dismissed`.
- CHECK `chk_whatsapp_attributions_assigned_consistency`: `unassigned` exige `lead_id IS NULL AND client_id IS NULL`; `assigned` exige `assigned_by NOT NULL` (admin).
- Estado real: 11 unassigned · 7 assigned/probable/manual_selection · 1 dismissed · 0 confirmed.

```
WHATSAPP_TO_CLIENT_RELATION=N:1 manual — atribuição nasce órfã (unassigned) e só é ligada a lead/cliente por ação de admin
(exact_code via Ref digitada ou manual_selection). Nenhuma ligação automática site→lead hoje.
```

---

## 16. STATUS "AGUARDANDO CONTATO"
```
STATUS_SOURCE=label de UI em components/admin/whatsapp/WhatsappAttributionCard.vue L76-80
STATUS_FIELD=whatsapp_attributions.attribution_status = 'unassigned'
STATUS_TRANSITIONS=unassigned → assigned (assign.post.ts | clients/index.post.ts com ref_whatsapp)
                   unassigned → dismissed (dismiss.post.ts)
                   'expired' permitido pelo CHECK mas nenhum código o grava
```
Significa: "clique com REF registrado, ainda sem lead/cliente vinculado". Não indica que a mensagem chegou ao WhatsApp.

---

## 17. FLUXO ATUAL

```
CTA WhatsApp (<a href=wa.me>)
↓ click (capture) — track-clicks.client.ts
↓ classifica tipo='whatsapp' · dedupe 700ms
↓ lê cookies adt_vid / adt_sid / adt_landing_path / adt_session_attribution
↓ generateShortCode() → REF
↓ reescreve href (+ " Ref: XXXXXXXX")
↓ enqueue localStorage adt_pending_whatsapp_clicks
↓ fetch keepalive POST /api/track-click ───────────────┐
↓ navegação nativa da âncora (target=_blank)           │
↓                                                      ▼
WhatsApp                                 RPC create_whatsapp_click_attribution_atomic_v3
                                          ├─ INSERT public.lead_clicks (tipo='whatsapp')
                                          └─ INSERT public.whatsapp_attributions (unassigned)
                                          (paralelo, só LP/serviços: dataLayer/GA generate_lead)
GRAVAÇÕES EM public.leads: NENHUMA
```

---

## 18. FLUXO FUTURO PROPOSTO (sem implementar)

```
CTA WhatsApp (qualquer <a> existente, sem editar páginas)
↓ track-clicks.client.ts intercepta (capture) → preventDefault()     [ZERO gravação, ZERO REF]
↓ guarda contexto do CTA (href original, cta_location, service_key, path)
↓ abre Modal global (montado em app.vue)                                [opcional: evento GA não-persistente]
↓ Nome + Telefone (validação client = mesmas regras do servidor)
↓ "Continuar no WhatsApp →" (submit, botão desabilitado após 1º clique)
↓ gera REF + event_id + submission_id (client)
↓ monta URL final (appendShortCodeToWhatsappUrl)
↓ dispara 1 requisição ao servidor (keepalive + fila local) que, numa transação:
│     INSERT leads  →  RPC v3 (lead_clicks + whatsapp_attributions)  →  vínculo REF↔lead
↓ abre WhatsApp NO MESMO GESTO (sem await antes do open)
```

```
RECOMMENDED_INSERTION_POINT=app/plugins/track-clicks.client.ts — ramo tipo==='whatsapp', ANTES de generateShortCode()
(L96), substituindo a navegação nativa por preventDefault + abertura do modal; a gravação sai do clique do CTA e passa
para o submit do modal.
```
Motivo: é o único ponto por onde passam 100% dos ~54 CTAs; hoje a REF e a gravação acontecem aqui no clique — exatamente o que
a nova regra proíbe. Mover para o submit preserva REF/tracking/RPC existentes e evita editar dezenas de páginas.
Ordem sugerida diferente da proposta original: **REF antes do salvamento** (a REF precisa existir para ser gravada junto ao lead),
e **abrir WhatsApp sem aguardar a resposta** (ver risco de popup), usando a fila keepalive já existente para garantir entrega.
O modal deve ser montado em `app.vue` (não no layout default), porque `/lp/telas-mosquiteiras` e `/servicos/telas/**` usam `layout:false`.

---

## 19. REGRA CRÍTICA DE REGISTRO
```
CURRENT_ARCHITECTURE_SUPPORTS_SUBMIT_ONLY_LEAD_CREATION=false
```
Hoje o clique no CTA grava `lead_clicks` + `whatsapp_attributions` imediatamente e não existe etapa de submit. Além disso, o plugin
classifica como WhatsApp **qualquer** `a/button` cujo **texto** contenha "whatsapp" — o próprio botão "Continuar no WhatsApp" e um
eventual botão que abra o modal seriam interceptados e gerariam REF/gravação. É necessário um atributo de exclusão (ex.: `data-wa-gate`)
ou reescrever a classificação. A arquitetura é **adaptável** (ponto único), mas não suporta a regra sem mudanças.

---

## 20. CENTRALIZAÇÃO
```
CENTRALIZATION_POSSIBLE=true
BEST_CENTRALIZATION_POINT=app/plugins/track-clicks.client.ts (interceptação) + novo modal global em app/app.vue
                          + novo composable de estado (ex.: useWhatsappLeadGate) + novo endpoint servidor
```
Nenhuma das ~54 âncoras precisa ser editada: o `href` original vira insumo (texto da mensagem) do modal.

---

## 21. LGPD / PRIVACIDADE (técnico)
- Dados: nome + telefone = dados pessoais comuns (sem dados sensíveis). Finalidade declarada: atendimento do orçamento.
- Texto "Seus dados serão utilizados apenas para atendimento do seu orçamento." deve ficar **dentro do modal, imediatamente abaixo do botão "Continuar no WhatsApp →"** (fonte pequena, contraste AA), com link para `/politica-de-privacidade` (já existe).
- Não logar nome/telefone em `console`, GA/dataLayer ou query strings; tráfego só via POST service role. `/api/send-lead` já envia o lead por e-mail — avaliar se o lead WhatsApp deve disparar e-mail.
- Sem checkbox nesta etapa (conforme pedido).

---

## 22. NÃO GERAR LEAD DUPLICADO — cenários e regras propostas

| Cenário | Comportamento proposto |
|---|---|
| Clica 2x no CTA | 1 modal (estado singleton); 2º clique só refoca |
| Fecha e reabre o modal | zero gravações; reaproveita valores digitados em memória |
| Submete e volta | guardar em sessionStorage `{submission_id, ref, phone_hash}`; reabrir CTA na mesma sessão → reutilizar lead (pular modal ou pré-preencher) e gerar nova REF de clique sem novo lead |
| Submete 2x rápido | botão disabled + `submission_id` estável por abertura de modal → UNIQUE `submission_id` já devolve idempotente |
| Já é cliente | não bloquear no front; servidor pode marcar match por telefone normalizado em `clients.telefone_principal` (sugestão para CRM, não auto-vincular) |
| Mesmo telefone em nova sessão | janela de dedupe server-side (ex.: mesmo telefone normalizado em ≤24h → atualizar lead existente / anexar nova REF em vez de novo lead) |

```
DEDUPLICATION_RECOMMENDATION=3 camadas: (1) UI singleton + disabled; (2) submission_id idempotente por abertura de modal (já suportado);
(3) servidor: telefone normalizado E.164 + janela temporal (24h) → reutiliza lead e só cria nova atribuição/REF.
```

---

## 23. EVENTOS FUTUROS
```
EVENT_MODEL_RECOMMENDATION=
  whatsapp_modal_open   → somente GA/dataLayer (não persiste no Supabase; não é lead)
  whatsapp_lead_submit  → servidor: leads + lead_clicks(tipo='whatsapp') + whatsapp_attributions (transação única)
  whatsapp_redirect     → GA/dataLayer no momento do open (generate_lead/contact_click do Google Ads migram para cá)
```
Distinguir é viável; `lead_clicks.tipo` aceita texto livre (normalizado por `normalizeActionType` — verificar ao implementar).
Atenção: hoje `generate_lead` é disparado no clique do CTA na LP; deve migrar para submit/redirect para não inflar conversões Google Ads.

---

## 24. SUÍTE DE TESTES FUTURA
- **Modal**: abre em todos os CTAs (amostra por rota), foco/ESC/overlay (useModalA11y), sem gravação ao abrir/fechar/cancelar (assert 0 requests a /api/track-click e /api/*lead*).
- **Validação nome**: vazio, 1 char, espaços, ≥2 chars. **Telefone**: máscara, 10/11 dígitos, com/sem 55, inválidos.
- **Submit**: 1 request; payload com visitor/session/landing/utm/gclid/ref; idempotência (duplo submit = 1 lead).
- **Redirect**: URL wa.me com `Ref: XXXXXXXX` e texto original do CTA preservado; desktop (nova aba) e mobile (deep link); popup não bloqueado (Playwright).
- **Tracking/REF**: REF regex, 1 lead_click + 1 attribution por submit, vínculo REF↔lead, retry queue sobrevive a unload.
- **GCLID**: entrada com `?gclid=...&campaign_id=...` → presente em leads e whatsapp_attributions.
- **Mobile/Desktop**: 390x844, 375x667, 1280x800 via **Playwright MCP** (regra do projeto) — sem overflow, botões ≥44px.
- **Duplicação**: os 6 cenários do item 22. **Todos os CTAs**: varredura automática de `a[href*="wa.me"],a[href*="whatsapp.com"]` por rota → todos abrem modal.
- **Regressão**: tel:, quote_cta, internal_cta continuam gravando como hoje; /admin intocado.

---

## 25. RISCOS

| Risco | Detalhe |
|---|---|
| Bloqueio de popup | `await fetch` antes de `window.open` quebra no iOS Safari/Chrome mobile. Abrir no mesmo gesto e enviar via keepalive/fila |
| Quebra de tracking | dashboards contam `lead_clicks.tipo='whatsapp'`; após o modal, só submits contam → queda aparente de "cliques WhatsApp" (abandono do modal) |
| Conversões Google Ads | `generate_lead` na LP dispara hoje no clique; precisa mudar para submit/redirect |
| REF duplicada/colisão | colisão gera exceção sem retry de nova REF → hoje perde o clique; com lead junto perderia o lead. Prever retry com nova REF |
| Clique duplicado | plugin dedupe 700ms + modal singleton; detecção por texto "whatsapp" captura botões do próprio modal |
| Perda de GCLID | cookie de atribuição 30 min fixo; modal aumenta tempo; considerar fallback first-touch |
| Perda de session_id | cookie adt_sid 30 min fixo (não renovado); idem |
| Lead duplicado | sem UNIQUE por telefone; só submission_id |
| Constraint de vínculo | CHECK exige `lead_id NULL` quando `unassigned` → não dá para gravar lead_id na atribuição sem mudar constraint/status |
| cidade NOT NULL | builder atual forçaria 'São Paulo' |
| Mobile/desktop | deep link vs WhatsApp Web; teclado virtual sobre o modal; sticky bars (MobileUnifiedCTA/Floating) z-index |
| Páginas sem layout | LP e telas usam `layout:false` → modal no layout default não apareceria |
| E-mail | reutilizar /api/send-lead dispararia notificação por e-mail para cada lead WhatsApp |
| Regressão em páginas antigas | ~54 âncoras heterogêneas (api.whatsapp.com com `&type=phone_number&app_absent=0`, texto com `{{ }}` literal em servicos/[familia]/index.vue L154) — parser de URL precisa tolerar |

---

## 26. ARQUIVOS PROVAVELMENTE IMPACTADOS (sem editar)

- **frontend**: `app/plugins/track-clicks.client.ts`, `app/utils/clickTrackerDispatcher.ts`, `app/utils/whatsappTrackingQueue.ts`, `app/app.vue`,
  novo `app/components/WhatsappLeadModal.vue` (ou similar), novo `app/composables/useWhatsappLeadGate.ts`, `app/composables/useLandingTracking.js` (mover generate_lead);
  opcional: remover código morto (`WhatsappModal.vue`, `useWhatsappModal.js`, etc.).
- **backend**: novo `server/api/whatsapp-lead.post.ts` (ou extensão de `track-click.post.ts`), `server/utils/leadDb.ts` (builder p/ origem whatsapp sem cidade fictícia), validadores em `server/shared/leadEmailCore.mjs` (reuso).
- **types**: `app/types/adminWhatsappAttribution.ts`, tipos de lead admin (exibir ref/origem whatsapp).
- **tests**: novos `scripts/test_whatsapp_lead_gate*.mjs` + specs Playwright.
- **database**: migration (ver item 27) — coluna de REF/attribution em leads e/ou ajuste de CHECK; possivelmente RPC v4 transacional lead+clique.

---

## 27. BANCO
```
MIGRATION_REQUIRED_LIKELY=true
```
Justificativa (evidência MCP Supabase):
1. `public.leads` **não tem** coluna para REF (`ref_whatsapp`/`short_code`/`whatsapp_attribution_id`).
2. CHECK `chk_whatsapp_attributions_assigned_consistency` proíbe `lead_id` com `attribution_status='unassigned'` e `assigned` exige `assigned_by` (admin) → o vínculo automático site→lead pela atribuição é impossível sem alterar a constraint ou criar um novo estado/coluna.
3. `leads.cidade` NOT NULL (lead só com nome+telefone exige default real ou relaxar).
4. Atomicidade lead + clique + atribuição numa transação → idealmente nova RPC (v4) em vez de 2 chamadas REST.
5. Dedupe por telefone exigiria índice (telefone normalizado + created_at).

---

## 28. LIMITES PARA A IMPLEMENTAÇÃO FUTURA
- Lógica (ts/js/mjs) ≤ 200 linhas por arquivo · Vue/páginas ≤ 500 linhas · SQL ≤ 200 linhas.
- Nota: `track-clicks.client.ts` (118) e `clickTrackerDispatcher.ts` (189) já estão perto do limite → extrair o gate para arquivo novo.
- `pages/lp/telas-mosquiteiras.vue` tem 1929 linhas (já acima do limite; não deve ser editado — a abordagem centralizada evita isso).

---

## 29. GIT
```
git status --short → ?? RELATORIO_FASE_5_FINAL.md   (pré-existente; este relatório adiciona RELATORIO_AUDITORIA_WHATSAPP_PRE_LEAD.md, também untracked)
git rev-parse HEAD → dabbd6930b6e4a94d67dfc237dde3c864b1e4433
CURRENT_COMMIT=dabbd6930b6e4a94d67dfc237dde3c864b1e4433
WORKTREE_CLEAN=false (somente arquivos .md de relatório untracked; nenhum arquivo rastreado modificado)
```

---

## 30. RESUMO FINAL

```
TOTAL_WHATSAPP_CTA_LOCATIONS=~54 pontos em template (22 arquivos ativos + 6 data files); 12 componentes mortos
CENTRAL_WHATSAPP_COMPONENT_EXISTS=false (mas existe interceptador global único: track-clicks.client.ts)
BEST_CENTRALIZATION_POINT=app/plugins/track-clicks.client.ts + modal global em app/app.vue

REF_GENERATOR=app/utils/whatsappShortCode.ts › generateShortCode() (8 chars, client-side, no clique)
WHATSAPP_TRACKING_ENDPOINT=POST /api/track-click (keepalive + fila adt_pending_whatsapp_clicks)
WHATSAPP_RPC=create_whatsapp_click_attribution_atomic_v3 (v1/v2 existem no banco, sem uso)
WHATSAPP_OPEN_METHOD=anchor nativo (<a target=_blank>) com href reescrito no capture-phase

VISITOR_ID_AVAILABLE=true (cookie adt_vid)
SESSION_ID_AVAILABLE=true (cookie adt_sid, 30 min)
GCLID_AVAILABLE=true (cookie adt_session_attribution, 30 min fixos)
CAMPAIGN_DATA_AVAILABLE=true se ValueTrack na URL (campaign_id/adgroup_id/...)

LEADS_TABLE_SUPPORTS_REQUIRED_FIELDS=false (9/10: falta ref_whatsapp; traffic_channel = session_channel; cidade NOT NULL)
CURRENT_ARCHITECTURE_SUPPORTS_SUBMIT_ONLY_LEAD_CREATION=false
MIGRATION_REQUIRED_LIKELY=true

RISKS_FOUND=popup bloqueado se await antes do open; queda aparente de cliques/conversões; generate_lead no clique;
  colisão de REF sem retry; detecção por texto "whatsapp" captura botões do modal; cookies 30 min fixos (gclid/session);
  CHECK impede lead_id em unassigned; cidade NOT NULL; sem dedupe por telefone; layout:false em LP/telas; e-mail do send-lead

FILES_LIKELY_TO_CHANGE=track-clicks.client.ts, clickTrackerDispatcher.ts, whatsappTrackingQueue.ts, app.vue,
  useLandingTracking.js, leadDb.ts, (novos) WhatsappLeadModal.vue, useWhatsappLeadGate.ts, server/api/whatsapp-lead.post.ts,
  migration + RPC v4, types admin, testes

CURRENT_COMMIT=dabbd6930b6e4a94d67dfc237dde3c864b1e4433
WORKTREE_CLEAN=false (apenas relatórios .md untracked)

NO_CODE_CHANGED=true
NO_MIGRATION_CREATED=true
NO_TRACKING_CHANGED=true
NO_RPC_CHANGED=true
NO_COMMIT_CREATED=true
NO_PUSH=true
```

Aguardando análise antes de qualquer implementação.

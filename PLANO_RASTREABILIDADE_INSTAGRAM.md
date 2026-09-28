# Auditoria Técnica e Plano de Implementação: Rastreabilidade e Atribuição Multicanal (Instagram & Meta Ads)

**Projeto:** AD Telas e Redes  
**Domínio Oficial:** `https://www.adtelasmosquiteiras.com.br`  
**Ambiente:** Nuxt 4 (Vue 3, TypeScript) + Supabase (PostgreSQL 17) + Cloudflare R2  
**Data da Revisão:** 28 de Setembro de 2026  
**Versão do Documento:** 7.0 (Fase 7 Concluída com Sucesso)  
**Status:** FASE 7 CONCLUÍDA COM 100% DE SUCESSO — GESTÃO DE CAMPANHAS E KPIS OPERACIONAL NO ADMIN — AGUARDANDO APROVAÇÃO (FASE 7A NÃO INICIADA)

---

## Seção de Correções Pós-Revisão

Esta seção consolida as correções obrigatórias incorporadas nesta versão do plano técnico após a auditoria conceitual inicial:

| Problema Identificado | Correção Adotada | Impacto Técnico | Fase Resolvida |
| :--- | :--- | :--- | :---: |
| **Domínio Incorreto no Plano** | Substituídos todos os exemplos incorretos (`.sp.gov.br`) pelo domínio canônico de produção: `https://www.adtelasmosquiteiras.com.br`. | Eliminação total de links fictícios ou inválidos na documentação e parametrização. | Imediata (Doc) |
| **Bypass de Short Code em `servicos/[slug].vue`** | Botões `<button @click="openWhatsApp">` com `window.open` abrem o WhatsApp sem o código `Ref: XXXXXXXX`. Criada a **FASE 0** prioritária para converter para links rastreáveis e unificar a injeção do código. | 100% dos cliques em WhatsApp no site passarão a gerar e entregar a referência na mensagem antes de qualquer adição do Instagram. | **FASE 0** |
| **Risco de Regressão na RPC do Supabase** | Modificar a RPC existente `create_whatsapp_click_attribution_atomic` em PostgreSQL exige alteração de assinatura com risco de quebra concorrente. Adotada a criação de `create_whatsapp_click_attribution_atomic_v2`, mantendo a v1 ativa até validação plena. | Risco muito baixo e isolado da RPC v1, com rollback instantâneo e sem downtime em produção. | **FASE 2** |
| **Arquivos Acima dos Limites de Linhas** | Identificados arquivos críticos acima de 200 linhas (lógica) e 500 linhas (componentes/páginas): `track-clicks.client.ts` (~228), `send-lead.post.ts` (~380), `WhatsappAttributionSection.vue` (~789) e `servicos/[slug].vue` (~583). | Planejada a extração cirúrgica de responsabilidades pontuais antes de adicionar nova lógica, sem refatoração ampla desnecessária. | **FASE 0 a 4** |
| **Taxonomia Microsoft Ads (`msclkid`)** | Identificado que o sistema já possui suporte ativo a `msclkid` no banco e nos composables. O canal `microsoft_ads` foi incorporado formalmente à lista canônica, totalizando 11 canais canônicos oficiais sem quebrar comportamento legado. | Taxonomia íntegra, unificada e sem canais não categorizados na transição. | **FASE 1** |
| **Distorção de Meta Ads / Falta de Normalização** | `fbclid` sozinho classificava o tráfego como `facebook_ads` e `ig` fragmentava métricas. Adotada normalização interna (`ig -> instagram`, `fb -> facebook`) e regra estrita: `instagram_ads` exige `source=instagram/ig` + `medium=paid_social/cpc/ads`. `fbclid` sem fonte vira `meta_ads`. | Taxonomia canônica, sem duplicação de canais e sem atribuição errônea. | **FASE 1** |
| **Limitação da Tabela `whatsapp_attributions`** | Snapshot gravava apenas Google Ads e forçava `campaign_name = 'Google Ads'`. Expandido o schema para preservar `channel`, `utm_source`, `utm_medium`, `utm_content`, `fbclid` e metadados Meta. | Fila do WhatsApp multi-origem com badge contextual e histórico 100% retrocompatível. | **FASE 2** |
| **Escopo de Identidade First Touch** | O First Touch em `localStorage` representava apenas o dispositivo/navegador, sem esclarecimento formal. Documentado explicitamente que o First Touch é local por dispositivo e não cross-device. | Alinhamento de expectativas analíticas sem abstrações prematuras ou risco de conformidade. | **FASE 1** |
| **Ausência de Rastreamento de Sessão de Ponta a Ponta** | Dificuldade de debugar o funil completo de um visitante problemático. Adicionado modo de auditoria/inspeção de sessão de ponta a ponta. | Diagnóstico rápido via query de sessão: Entrada ➔ Pageview ➔ Clique ➔ Fila ➔ Lead/Cliente. | **FASE 4** |

---

## 1. Estado Atual do Sistema de Tracking

### 1.1 Fluxo Ponta a Ponta Atual
O sistema opera com telemetria proprietária (*first-party tracking*), estruturada em camadas independentes:

```
[Entrada do Visitante (URL + UTMs + Click ID + Referrer)]
       │
       ▼
[useAnalyticsIdentity & useAttribution]
       │  ├─ Identidade Visitante: Cookie adt_vid (365 dias)
       │  ├─ Sessão: Cookie adt_sid (30 min) + LocalStorage adt_last_activity
       │  ├─ Landing Page da Sessão: Cookie adt_landing_path (30 min)
       │  ├─ Atribuição de Sessão: Cookie adt_session_attribution (30 min)
       │  └─ First Touch: LocalStorage adt_ft_context (deste navegador/dispositivo)
       │
       ▼
[Plugins Globais de Frontend]
       │
       ├─► track-visits.client.ts (ao montar página ou router.afterEach)
       │     └─► POST /api/track-visit ──► Tabela: public.page_views
       │
       └─► track-clicks.client.ts (listener global capture: true em document)
             │
             ├─ Se WhatsApp:
             │     ├─ Gera short_code (8 chars Base32, ex: TBNZ9M6R)
             │     ├─ Modifica href no DOM adicionando " Ref: TBNZ9M6R" (apenas tags <a>)
             │     ├─ Enfileira em LocalStorage adt_pending_whatsapp_clicks
             │     └─ POST /api/track-click (keepalive: true)
             │           └─► RPC: create_whatsapp_click_attribution_atomic_v3
             │                 ├─► Tabela: public.lead_clicks (tipo='whatsapp')
             │                 └─► Tabela: public.whatsapp_attributions (status='unassigned')
             │
             ├─ Se Outro Clique (quote_cta, telefone, internal_cta):
             │     └─► POST /api/track-click ──► Tabela: public.lead_clicks
             │
             └─ Se Formulário Iniciado (useLandingTracking.startForm):
                   └─► POST /api/track-click (tipo='form_start') ──► Tabela: public.lead_clicks

[Conversão: Envio de Formulário de Lead]
       │
       ▼
[useFormSubmit -> POST /api/send-lead]
       │
       └─► Tabela: public.leads (session_channel + first_touch_channel + UTMs)

[Conciliação / Atribuição WhatsApp]
       │
       ├─► Manual no CRM (admin/clientes/novo com ?ref=TBNZ9M6R):
       │     └─► Atualiza public.whatsapp_attributions (client_id, status='assigned', match_method='exact_code')
       │
       └─► Painel Dashboard (admin/components/WhatsappAttributionSection.vue):
             └─► Listagem e associação manual (match_method='manual_selection') ou dispensa ('dismissed')

[Visualização / Dashboard Analytics]
       │
       ├─► /api/admin/analytics/overview ──► adminAnalyticsMetrics.mjs (KPIs globais, intenção, retenção)
       ├─► /api/admin/analytics/acquisition ──► adminAnalyticsClassification.mjs (Canais e campanhas UTM)
       └─► /api/admin/analytics/google-ads/overview ──► adminGoogleAdsMetrics.mjs (Métricas Google Ads)
```

### 1.2 Mapeamento Detalhado dos Componentes de Tracking

1. **Criação de Sessão:** Gerenciada em `useAnalyticsIdentity.ts` (`getOrCreateSessionId()`). Utiliza o cookie `adt_sid` (`maxAge: 1800` = 30 minutos) e sincronização com `localStorage.getItem('adt_last_activity')`. Se inativo por mais de 30 minutos, um novo UUID é gerado e o cookie `adt_landing_path` é renovado com a página de entrada.
2. **Identificação de Visitante Único:** Gerenciada em `useAnalyticsIdentity.ts` (`getOrCreateVisitorId()`). Emite e consome o cookie `adt_vid` (`maxAge: 31536000` = 365 dias, `sameSite: 'lax'`), persistindo a identidade deste dispositivo por 1 ano.
3. **Escopo do First Touch:** Salvo em `localStorage['adt_ft_context']`. **Definição estrita:** Representa o *"Primeiro Toque conhecido deste navegador/dispositivo específico"*. Tratado como snapshot atômico integral sem contaminação pelo Last Touch.
4. **Captura de UTMs e Click IDs:** `useAttribution.ts` inspeciona `route.query` na montagem da rota. Lê `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `campaign_id`, `adgroup_id`, `creative`, `matchtype`, `network`, `device`, `target_id`, `meta_campaign_id`, `meta_adset_id`, `meta_ad_id`, `meta_placement`, `ttclid`, `tiktok_campaign_id`, `tiktok_adgroup_id`, `tiktok_ad_id`, `tiktok_creative_id`, `tiktok_placement`. Grava no cookie de sessão `adt_session_attribution`.
5. **Persistência SPA:** Em transições de página no Nuxt (`router.afterEach`), se a nova URL não contiver parâmetros, os valores do cookie de sessão `adt_session_attribution` permanecem válidos durante os 30 minutos da sessão.
6. **Registro de Pageviews:** `track-visits.client.ts` dispara `POST /api/track-visit` com trava de 1000ms contra duplicidade client-side. O backend valida bots, calcula o hash do IP (`ip_hash`), e a idempotência é garantida no banco pelo índice único condicional `unq_page_views_event_id`, gravando em `public.page_views`.
7. **Taxonomia de CTAs:** `track-clicks.client.ts` captura cliques globais e invoca `getCtaLocation(target)` inspecionando `data-cta-location` ou ancestrais DOM (`header`, `footer`, `hero`, `floating_whatsapp`, `sticky_mobile`, `modal`, `service_card`, fallback `other`).
8. **Disparo WhatsApp:** `track-clicks.client.ts` detecta URLs ou textos de WhatsApp. Cria um código Base32 de 8 caracteres (`short_code`), altera o `href` do elemento injetando `Ref: XXXXXXXX`, salva em `localStorage['adt_pending_whatsapp_clicks']` e faz requisição com `fetch(..., { keepalive: true })` para `/api/track-click`.
9. **Fila de Atribuição:** A RPC atômica `create_whatsapp_click_attribution_atomic_v3` insere atomicamente em `lead_clicks` e `whatsapp_attributions` com status inicial `unassigned` (as RPCs legadas v1 e v2 permanecem intactas no banco para compatibilidade e histórico de migração).
10. **Segurança e RLS no Supabase:**
    - `page_views` e `lead_clicks`: INSERT aberto para `anon`; SELECT exclusivo para `authenticated`.
    - `leads`: INSERT aberto para `anon`; SELECT/UPDATE exclusivo para `authenticated`.
    - `whatsapp_attributions`: **Acesso direto revogado** para `anon` e `authenticated`. Apenas a chave `service_role` (backend) e funções `SECURITY DEFINER` podem interagir.

---

## 2. Inventário de Arquivos e Plano de Modularização (Regra de Limite de Linhas)

O projeto adota a regra estrita: **máximo de 200 linhas para arquivos contendo lógica** e **máximo de 500 linhas para outros arquivos (UI/páginas)**.

A auditoria identificou arquivos críticos que já excedem esses limites. Para cumprir a diretriz sem realizar refatorações amplas e arriscadas, o plano determina a **extração cirúrgica de responsabilidades pontuais** antes de adicionar novas funcionalidades:

| Arquivo Atual | Linhas Atuais | Tipo | Estratégia de Modularização / Extração Cirúrgica | Linhas Alvo | Fase |
| :--- | :---: | :---: | :--- | :---: | :---: |
| `app/plugins/track-clicks.client.ts` | 228 | Lógica | Extrair a lógica de construção e despacho de payload para `app/utils/clickTrackerDispatcher.ts`. O plugin permanecerá apenas com os listeners de DOM e resolução de elementos. | < 160 | **Fase 0** |
| `server/api/send-lead.post.ts` | 380 | Lógica | O arquivo é responsável por validação, gravação em banco, geração de token R2 e disparo SMTP. Extrair a orquestração de token/mídia para `server/utils/leadMediaToken.ts`. O endpoint principal focará na persistência atômica. | < 195 | **Fase 3** |
| `app/pages/servicos/[slug].vue` | 583 | Página | Possui botões WhatsApp inline com lógica de `window.open`. Extrair a seção de especificações/CTAs para um subcomponente `app/components/servicos/ServicoCtaSection.vue`. | < 450 | **Fase 0** |
| `app/components/admin/WhatsappAttributionSection.vue` | 789 | Componente | Contém listagem, modal de associação manual, modal de busca rápida e modal de dispensa. Extrair os modais para `WhatsappAssignModal.vue` e `WhatsappDismissModal.vue`. | < 420 | **Fase 4** |
| `app/composables/useAttribution.ts` | 161 | Lógica | Receberá a normalização canônica multicanal. A lógica de regras de canal será dividida em funções puras testáveis sem estourar 200 linhas. | < 190 | **Fase 1** |
| `server/api/track-click.post.ts` | 180 | Lógica | Receberá a chamada para a nova RPC v2. Código conciso mantido abaixo do limite. | < 190 | **Fase 2** |
| `server/shared/adminAnalyticsClassification.mjs` | 102 | Lógica | Adição dos novos canais canônicos. | < 130 | **Fase 1** |

---

## 3. Avaliação Técnica da RPC: `v1` vs. `create_whatsapp_click_attribution_atomic_v2`

### Comparação Arquitetural

| Critério | Modificar RPC Atual (`v1`) | Criar RPC `v2` Separada (Recomendada) |
| :--- | :--- | :--- |
| **Comportamento no PostgreSQL** | No PostgreSQL/Supabase, alterar argumentos de uma função exige `CREATE OR REPLACE FUNCTION` com a **mesma assinatura exata**, ou `DROP FUNCTION` seguido de `CREATE FUNCTION`. Se a assinatura mudar, o `CREATE OR REPLACE` cria uma sobrecarga (overload) ou falha. | Criação limpa de uma nova função independente sem tocar na função legada. |
| **Risco para Google Ads Ativo** | **ALTO:** Qualquer erro na migração ou conflito de tipos derruba o rastreamento ativo de Google Ads em produção. | **Risco muito baixo e isolado da RPC v1:** A função `create_whatsapp_click_attribution_atomic` continua 100% operacional durante todo o deploy. |
| **Deploy Concorrente** | Durante o deploy da nova versão do servidor Nuxt, instâncias antigas em cache poderiam chamar a assinatura errada, gerando erros 500 no clique do WhatsApp. | Instâncias antigas continuam chamando v1; instâncias novas chamam v2. Transição perfeitamente atômica e suave. |
| **Estratégia de Rollback** | Exige rollback manual de migration no banco de dados. | Basta alterar uma linha no código do Nuxt para voltar a apontar para a RPC v1 sem intervenção no banco. |

### Decisão Técnica
**Adotar a estratégia RPC v2:**
1. Criar `public.create_whatsapp_click_attribution_atomic_v2` com suporte multicanal e argumentos nomeados com defaults seguros.
2. Manter a RPC original intacta.
3. Chamar a v2 no backend Nuxt.
4. Validar regressão de Google Ads e funcionamento de Instagram.
5. Somente após período de estabilização em produção avaliar a depreciação da v1.

---

## 4. Banco de Dados: Schema Aditivo e Retrocompatível

> [!IMPORTANT]
> **DIRETRIZ DE BANCO:** Nenhuma coluna existente será renomeada, removida ou alterada. Todos os novos campos são estritamente `NULLABLE` com valores padrão seguros.

### 4.1 Schema Aditivo da Tabela `public.whatsapp_attributions`

| Campo Suportado | Tipo | Nulo? | Justificativa Técnica | Impacto no Histórico |
| :--- | :--- | :---: | :--- | :--- |
| `channel` | `TEXT` | SIM | Canal canônico de aquisição (`google_ads`, `instagram_ads`, `tiktok_ads`, `direct`, etc.). | Nenhum. Registros anteriores ficam `NULL`. |
| `utm_source` | `TEXT` | SIM | Fonte canônica normalizada (ex: `instagram`, `tiktok`, `google`). | Nenhum. |
| `utm_medium` | `TEXT` | SIM | Meio de aquisição (ex: `paid_social`, `organic`, `cpc`). | Nenhum. |
| `utm_campaign` | `TEXT` | SIM | Nome da campanha original sem substituição forçada. | Nenhum. |
| `utm_content` | `TEXT` | SIM | Conteúdo / identificador do anúncio ou criativo. | Nenhum. |
| `fbclid` | `TEXT` | SIM | Meta Click ID para validação de entrega e atribuição. | Nenhum. |
| `meta_campaign_id` | `TEXT` | SIM | ID numérico imutável da campanha na Meta (`{{campaign.id}}`). | Nenhum. |
| `meta_adset_id` | `TEXT` | SIM | ID numérico do conjunto de anúncios na Meta (`{{adset.id}}`). | Nenhum. |
| `meta_ad_id` | `TEXT` | SIM | ID numérico do anúncio individual na Meta (`{{ad.id}}`). | Nenhum. |
| `meta_placement` | `TEXT` | SIM | Posicionamento dinâmico Meta (`{{placement}}`: Feed, Stories, Reels). | Nenhum. |
| `ttclid` | `TEXT` | SIM | TikTok Click ID para validação e atribuição. | Nenhum. |
| `tiktok_campaign_id` | `TEXT` | SIM | ID numérico da campanha no TikTok (`__CAMPAIGN_ID__`). | Nenhum. |
| `tiktok_ad_id` | `TEXT` | SIM | ID numérico do anúncio no TikTok (`__ADID_V2__` no Smart+ atualizado; omitido no TikTok Standard). | Nenhum. |
| `tiktok_creative_id` | `TEXT` | SIM | ID do criativo no TikTok (`__CID__`). | Nenhum. |
| `tiktok_placement` | `TEXT` | SIM | Posicionamento dinâmico TikTok (`__PLACEMENT__`). | Nenhum. |

### 4.2 Avaliação Crítica de Índices
Não foram criados índices desnecessários para economizar IOPS e evitar overhead de gravação no PostgreSQL. Mantém-se **apenas 1 índice justificado por query real do dashboard**:
```sql
-- Justificativa: Utilizado na filtragem da fila de WhatsApp por canal e status no painel administrativo
CREATE INDEX IF NOT EXISTS idx_whatsapp_attributions_channel_status 
ON public.whatsapp_attributions (channel, attribution_status) 
WHERE channel IS NOT NULL;
```

### 4.3 Expansão em `page_views`, `lead_clicks` e `leads`
Adição aditiva dos campos granulares da Meta (`meta_campaign_id`, `meta_adset_id`, `meta_ad_id`, `meta_placement`) e do TikTok (`ttclid`, `tiktok_campaign_id`, `tiktok_adgroup_id`, `tiktok_ad_id`, `tiktok_creative_id`, `tiktok_placement` como `TEXT NULL`).
*Nota: `gclid`, `msclkid`, `fbclid` e `channel` já existiam no schema inicial.*

---

## 5. Taxonomia Canônica Multicanal e Regras de Normalização

### 5.1 Canais Canônicos do Sistema
O sistema adota oficialmente **13 canais canônicos** (incorporando suporte total e validado a Google, Microsoft, Meta/Instagram/Facebook, TikTok, Orgânicos, Direto e Referral):
1. `google_ads`
2. `microsoft_ads`
3. `instagram_ads`
4. `instagram_organic`
5. `facebook_ads`
6. `facebook_organic`
7. `meta_ads`
8. `tiktok_ads`
9. `tiktok_organic`
10. `google_organic`
11. `direct`
12. `referral`
13. `other_paid`

### 5.2 Normalização de Parâmetros de Entrada
Antes da classificação, os parâmetros de entrada são normalizados:
- `source`: minúsculo, aparado.
  - Se `source === 'ig'` ou `source.startsWith('instagram')` ➔ normaliza para `'instagram'`.
  - Se `source === 'fb'` ou `source.startsWith('facebook')` ➔ normaliza para `'facebook'`.
  - Se `source === 'tt'` ou `source.startsWith('tiktok')` ➔ normaliza para `'tiktok'`.
  - Se `source === 'bing'` ➔ normaliza para `'bing'`.
  - Se `source === 'google'` ➔ normaliza para `'google'`.
- `medium`: minúsculo, aparado.

### 5.3 Cascata de Classificação (Ordem Estrita e Precedência Validada em `classifyClientChannel`)
1. **Google Ads:** Se possui `gclid`, `gbraid`, `wbraid` ou `source === 'google'` + `medium` contendo `cpc`/`paid`/`ppc` ➔ `'google_ads'` (Precedência máxima de Click IDs).
2. **Microsoft Ads:** Se possui `msclkid` ou `source === 'bing'` + `medium` contendo `cpc`/`paid` ➔ `'microsoft_ads'`.
3. **TikTok Ads:** Se possui `ttclid` OU (`source === 'tiktok'` E `medium` pago) ➔ `'tiktok_ads'`.
4. **Instagram Ads:** Se `source === 'instagram'` E (`medium` em `['paid_social', 'cpc', 'ads', 'paid']` OU `fbclid` presente) ➔ `'instagram_ads'`.
5. **Facebook Ads:** Se `source === 'facebook'` E (`medium` em `['paid_social', 'cpc', 'ads', 'paid']` OU `fbclid` presente) ➔ `'facebook_ads'`.
6. **Meta Ads Genérico:** Se possui `fbclid` e a fonte não for explicitamente Instagram nem Facebook ➔ `'meta_ads'`.
7. **TikTok Orgânico:** Se `source === 'tiktok'` OU `referrer` contiver `tiktok.com` (não pago) ➔ `'tiktok_organic'`.
8. **Instagram Orgânico:** Se `source === 'instagram'` OU `referrer` contiver `instagram.com` / `l.instagram.com` (não pago) ➔ `'instagram_organic'`.
9. **Facebook Orgânico:** Se `source === 'facebook'` OU `referrer` contiver `facebook.com` / `m.facebook.com` (não pago) ➔ `'facebook_organic'`.
10. **Google Orgânico:** Se `source === 'google'` OU `referrer` contiver `google.com` (não pago) ➔ `'google_organic'`.
11. **Outros Pagos:** Se `medium` contiver `cpc`, `paid`, `banner`, `display` (sem canal prioritário mapeado acima) ➔ `'other_paid'`.
12. **Direto:** Se sem `source`, sem `click_id` e sem `referrer` ➔ `'direct'`.
13. **Referral:** Demais referrers externos ou source sem medium pago ➔ `'referral'`.

---

## 6. Padrão de URLs e Macros Oficiais da Meta Ads

### 6.1 URLs para Instagram Orgânico (Domínio Oficial Canônico)
- **Link da Bio:**
  ```text
  https://www.adtelasmosquiteiras.com.br/?utm_source=instagram&utm_medium=organic&utm_campaign=bio&utm_content=perfil
  ```
- **Stories Orgânicos:**
  ```text
  https://www.adtelasmosquiteiras.com.br/lp/telas-mosquiteiras?utm_source=instagram&utm_medium=organic&utm_campaign=stories&utm_content=arrasta_telas
  ```
- **Reels Orgânicos:**
  ```text
  https://www.adtelasmosquiteiras.com.br/?utm_source=instagram&utm_medium=organic&utm_campaign=reels&utm_content=video_gatos_janela
  ```

### 6.2 Configuração Oficial de Parâmetros de URL no Gerenciador de Anúncios Meta
Configurar no campo **URL Parameters (Parâmetros de URL)** do anúncio na Meta:

```text
utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&meta_placement={{placement}}&meta_campaign_id={{campaign.id}}&meta_adset_id={{adset.id}}&meta_ad_id={{ad.id}}
```

### 6.3 Tabela de Validação das Macros Oficiais da Meta Ads

| Macro Meta | Comportamento Documentado | Exemplo em Produção |
| :--- | :--- | :--- |
| `{{site_source_name}}` | Retorna a sigla canônica da plataforma de exibição | `ig` (Instagram) ou `fb` (Facebook) |
| `{{placement}}` | Retorna o posicionamento do anúncio na rede | `Instagram_Stories`, `Instagram_Reels`, `Instagram_Feed` |
| `{{campaign.id}}` | ID numérico fixo e imutável da campanha | `1202103948201` |
| `{{campaign.name}}` | Nome atribuído à campanha no Ads Manager | `ads_telas_sp_leads` |
| `{{adset.id}}` | ID numérico fixo do conjunto de anúncios | `1202103948202` |
| `{{adset.name}}` | Nome do conjunto de anúncios (público / segmentação) | `conjunto_donos_pets_sp` |
| `{{ad.id}}` | ID numérico único do anúncio | `1202103948203` |
| `{{ad.name}}` | Nome atribuído ao anúncio / criativo | `criativo_varanda_pet_video01` |

---

## 7. Matriz de Testes de Validação e Não-Regressão

Esta matriz define os 10 cenários obrigatórios a serem validados de ponta a ponta antes da liberação final:

| ID | Cenário de Teste | Parâmetros de Entrada Simulados | Canal Esperado | Click ID | WhatsApp Ref | Destino no Dashboard |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **T01** | Google Ads ➔ WhatsApp | `?gclid=GCL_999&utm_source=google&utm_medium=cpc&utm_campaign=ad_telas_sp` | `google_ads` | GCLID | `Ref: [CÓDIGO]` | Aba Google Ads + Fila WhatsApp |
| **T02** | Google Ads ➔ Formulário | `?gclid=GCL_888&utm_source=google&utm_medium=cpc&utm_campaign=ad_telas_sp` | `google_ads` | GCLID | N/A | Aba Google Ads (Leads) + Funil |
| **T03** | Instagram Ads ➔ WhatsApp | `?utm_source=instagram&utm_medium=paid_social&utm_campaign=ig_promo&fbclid=FB_111&meta_placement=Instagram_Stories` | `instagram_ads` | FBCLID | `Ref: [CÓDIGO]` | Aba Aquisição (Instagram Ads) + Fila |
| **T04** | Instagram Ads ➔ Formulário | `?utm_source=ig&utm_medium=paid_social&utm_campaign=ig_promo&fbclid=FB_222` | `instagram_ads` | FBCLID | N/A | Aba Aquisição (Instagram Ads) |
| **T05** | Instagram Orgânico Bio ➔ WhatsApp | `?utm_source=instagram&utm_medium=organic&utm_campaign=bio` | `instagram_organic` | Nenhum | `Ref: [CÓDIGO]` | Aba Aquisição (Instagram Orgânico) + Fila |
| **T06** | Instagram Orgânico Stories ➔ WhatsApp | `?utm_source=instagram&utm_medium=organic&utm_campaign=stories` | `instagram_organic` | Nenhum | `Ref: [CÓDIGO]` | Aba Aquisição (Instagram Orgânico) + Fila |
| **T07** | Instagram Orgânico Reels ➔ WhatsApp | `?utm_source=instagram&utm_medium=organic&utm_campaign=reels` | `instagram_organic` | Nenhum | `Ref: [CÓDIGO]` | Aba Aquisição (Instagram Orgânico) + Fila |
| **T08** | Meta com FBCLID sem UTM | `?fbclid=FB_UNKNOWN_999` (sem utm_source) | `meta_ads` | FBCLID | `Ref: [CÓDIGO]` | Aba Aquisição (Meta Ads) + Fila |
| **T09** | Tráfego Direto ➔ WhatsApp | Acesso limpo sem parâmetros nem referrer | `direct` | Nenhum | `Ref: [CÓDIGO]` | Aba Aquisição (Direto) + Fila |
| **T10** | Google Orgânico ➔ WhatsApp | `referrer: https://www.google.com/` (sem gclid nem cpc) | `google_organic` | Nenhum | `Ref: [CÓDIGO]` | Aba Aquisição (Google Orgânico) + Fila |

### Checklist de Validação por Cenário:
- [ ] Atribuição correta do `channel` canônico.
- [ ] `visitor_id` e `session_id` mantidos intactos na navegação.
- [ ] Registro em `page_views` sem descarte de parâmetros.
- [ ] Registro em `lead_clicks` com `cta_location` correto.
- [ ] Geração de `short_code` válido de 8 caracteres alfanuméricos.
- [ ] Mensagem do WhatsApp preenchida contendo `Ref: XXXXXXXX`.
- [ ] Inserção atômica em `whatsapp_attributions` sem fallback indevido para 'Google Ads'.
- [ ] Exibição fidedigna no dashboard e contadores agregados sem duplicação de métricas.

---

## 8. Observabilidade e Modo de Auditoria de Sessão

Para garantir capacidade de depuração sem depender de consultas ad-hoc no banco de dados, o sistema contará com:

### 8.1 Modo de Inspeção de Jornada por Sessão / Visitante
A rota `/api/admin/analytics/lead-journey` e a busca por código de WhatsApp `/api/admin/marketing/whatsapp-attributions/by-code/:code` serão equipadas para permitir reconstituição visual linear:
```
[Entrada: Canal / Parâmetros / Referrer / Landing]
    │
    ▼
[Sessão: ID / Duração / Sequência de Pageviews]
    │
    ▼
[Engajamento: Início de Form / Cliques de CTA]
    │
    ▼
[Conversão: Clique WhatsApp + Short Code Gerado]
    │
    ▼
[Fila de Atribuição: Status unassigned ➔ assigned]
    │
    ▼
[Desfecho CRM: Cliente Criado / Lead Vinculado]
```

### 8.2 Logs Estruturados de Telemetria no Nuxt Server
Emissão de logs prefixados padronizados para rápida filtragem no console do servidor:
- `[tracking:visit] session_id=${sid} channel=${channel} path=${path}`
- `[tracking:whatsapp:v3] short_code=${code} channel=${channel} fbclid=${hasFbclid}`
- `[tracking:idempotency] event_id=${eid} duplicata_ignorada`

---

## 9. Plano de Implementação em Fases Estruturadas

### FASE 0: Correção do Tracking Atual dos CTAs WhatsApp + Regressão Google Ads
- **Objetivo:** Resolver o bug crítico em `app/pages/servicos/[slug].vue` onde botões `<button>` com `window.open` impedem a inclusão do `Ref: XXXXXXXX` na mensagem do WhatsApp. Garantir que 100% dos botões do site entreguem o short code e respeitem os limites de linhas de código.
- **Inventário Global de CTAs WhatsApp no Repositório:**

| Localização / Arquivo | Elemento DOM | Mecanismo de Disparo | Status Atual | Ação na Fase 0 |
| :--- | :---: | :--- | :---: | :--- |
| `app/pages/servicos/[slug].vue` (5 pontos: Hero, Specs, Comparação, FAQ, CTA Final) | `<button>` | `openWhatsApp()` -> `window.open(url, '_blank')` | ⚠️ **BYPASS CRÍTICO:** Gera código mas não injeta no WhatsApp aberto | Converter para links `<a>` sem `window.open`, componentizar e padronizar listener |
| `app/pages/servicos/[familia]/[categoria]/[servico].vue` (Hero e CTA Final) | `<a>` | `href="whatsappUrl"` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/servicos/[familia]/[categoria]/index.vue` | `<a>` | `href="wa.me/..."` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/servicos/[familia]/index.vue` | `<a>` | `href="wa.me/..."` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/servicos/telas/index.vue` (Hero, Cards, Footer, Floating) | `<a>` | `href="getWhatsAppUrl(...)"` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/servicos/redes/index.vue` (Hero, CTA, Contato) | `<a>` | `href="https://api.whatsapp.com/..."` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/servicos/redes/*.vue` (5 páginas específicas) | `<a>` | `href="whatsappUrl"` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/servicos/vidracaria.vue` | `<a>` | `href="whatsappUrl"` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/servicos/index.vue` | `<a>` | `href="https://api.whatsapp.com/..."` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/lp/telas-mosquiteiras.vue` (Hero, Gallery, Models, Float) | `<a>` | `href="getWhatsappLink(...)"` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/areas-atendidas.vue` | `<a>` | `href="whatsappUrl"` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/orcamento.vue` | `<a>` | `href="whatsappUrl"` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/contato.vue` | `<a>` | `href="whatsappLink"` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/por-que-instalar-tela-mosquiteira.vue` | `<a>` | `href="whatsappUrl"` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/pages/obrigado.vue` | `<a>` | `href="https://wa.me/..."` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/components/Header.vue` | `<a>` | `href="https://wa.me/..."` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/components/FloatingButtons.vue` | `<a>` | `href="https://api.whatsapp.com/..."` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/components/WhatsappFloating.vue` | `<a>` | `href="https://api.whatsapp.com/..."` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/components/StickyCtaMobile.vue` | `<a>` | `href="https://api.whatsapp.com/..."` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/components/MobileUnifiedCTA.vue` | `<a>` (expandido) | `href="whatsappUrl"` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/components/PureCTAButtons.vue` | `<a>` | `href="https://api.whatsapp.com/..."` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/components/CepSearch.vue` | `<a>` | `href="getWhatsAppUrl()"` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/components/telas/*` (Hero, Quote, Footer, Page) | `<a>` | `href="service.whatsappUrl"` | ✅ Funcional | Validar injeção do `Ref: XXXXXXXX` |
| `app/components/CtaButton.vue` / `CtaButtons.vue` / `MobileLandingComplete.vue` | Orphan | N/A | ⚪ Não renderizados em nenhuma rota ativa | Manter intactos / sem impacto |

- **Arquivos:**
  - Extrair lógica de despacho de `app/plugins/track-clicks.client.ts` para `app/utils/clickTrackerDispatcher.ts` (< 200 linhas).
  - Componentizar CTAs em `app/pages/servicos/[slug].vue` convertendo para links `<a>` sem `window.open` (< 500 linhas).
- **Banco:** Nenhuma alteração.
- **Riscos:** BAIXO.
- **Testes:** Cenário T01 (Google Ads ➔ WhatsApp) e clique em páginas de serviços via mobile e desktop.
- **Critério de Aceite:** 100% dos botões de WhatsApp do site abrem a URL contendo `Ref: XXXXXXXX` e gravam na fila sem exceções.

---

### FASE 1: Normalização e Classificação Multicanal
- **Objetivo:** Implementar as regras canônicas de classificação multicanal e normalização `ig -> instagram` e `fb -> facebook`.
- **Arquivos:**
  - `app/composables/useAttribution.ts` (< 200 linhas).
  - `server/shared/adminAnalyticsClassification.mjs` (< 200 linhas).
- **Banco:** Nenhuma alteração.
- **Riscos:** BAIXO.
- **Testes:** Testes unitários com mocks de query strings e referrers para os 11 canais canônicos.
- **Critério de Aceite:** Visitas simuladas de Instagram Ads, Instagram Orgânico e Google Ads recebem rigorosamente suas etiquetas canônicas sem misturar Facebook Ads.

---

### FASE 2: Schema Aditivo no Supabase e Criação da RPC `v2`
- **Objetivo:** Criar migration aditiva no Supabase adicionando colunas `NULLABLE` em `whatsapp_attributions`, `lead_clicks`, `page_views` e criar a nova função atômica `create_whatsapp_click_attribution_atomic_v2`.
- **Arquivos:**
  - Nova migration SQL em `supabase/migrations/`.
- **Banco:** Colunas opcionais adicionadas; criação de índice em `(channel, attribution_status)`; criação da RPC v2 sem tocar na v1.
- **Riscos:** MÉDIO (exige execução transacional cuidadosa).
- **Testes:** Validação de integridade referencial e teste isolado de execução da RPC v2 via MCP Supabase.
- **Critério de Aceite:** RPC v2 grava com sucesso cliques com metadados Meta e mantém fallback elegante para Google Ads.

---

### FASE 3: Propagação dos Campos Meta/Instagram Ponta a Ponta
- **Objetivo:** Conectar o frontend e backend à RPC v2 e propagar os parâmetros nos endpoints de pageview, clique e formulário de lead.
- **Arquivos:**
  - `server/api/track-click.post.ts` (< 200 linhas).
  - `server/api/track-visit.post.ts` (< 200 linhas).
  - Modularizar `server/api/send-lead.post.ts` extraindo tokens de mídia e persistindo novos campos (< 200 linhas).
  - `app/composables/useAnalyticsIdentity.ts` e `app/plugins/track-visits.client.ts`.
- **Banco:** Nenhuma alteração estrutural adicional.
- **Riscos:** BAIXO.
- **Testes:** Cenários T02, T03, T04 da Matriz de Testes.
- **Critério de Aceite:** Disparos de cliques de WhatsApp e envios de formulário de teste preenchem os novos campos no Supabase.

---

### FASE 4: Dashboard e Fila WhatsApp Multicanal
- **Objetivo:** Modularizar o componente da fila de WhatsApp e atualizar as interfaces de análise para exibir Instagram Ads e Orgânico de forma limpa.
- **Arquivos:**
  - Modularizar `app/components/admin/WhatsappAttributionSection.vue` extraindo modais para subcomponentes (< 500 linhas).
  - `app/types/adminWhatsappAttribution.ts`.
  - `server/api/admin/marketing/whatsapp-attributions/index.get.ts`.
  - `app/components/admin/AcquisitionSection.vue`.
- **Banco:** Nenhuma alteração.
- **Riscos:** BAIXO.
- **Testes:** Visualização do painel em desktop e mobile (via Playwright MCP conforme user rules).
- **Critério de Aceite:** Fila de WhatsApp exibe badge de canal "Instagram Ads" ou "Instagram Orgânico", status de Click ID (FBCLID) e permite associação com cliente normalmente.

---

### FASE 4.5: Suporte Técnico TikTok (Taxonomia 13 Canais, TTCLID, Propagação, RPC v3 e Dashboard)
- **Objetivo:** Adicionar suporte técnico completo a TikTok Ads e TikTok Orgânico antes da homologação final unificada.
- **Ações:**
  - Taxonomia expandida para 13 canais canônicos oficiais (`tiktok_ads` e `tiktok_organic`).
  - Captura e propagação de `ttclid` e metadados TikTok (`tiktok_campaign_id`, `tiktok_adgroup_id`, `tiktok_ad_id`, `tiktok_creative_id`, `tiktok_placement`).
  - Migration aditiva no Supabase para as 4 tabelas sem quebra de compatibilidade.
  - Criação da RPC atômica `create_whatsapp_click_attribution_atomic_v3` (v1 e v2 preservadas intactas).
  - Atualização do First Touch atômico e dashboard de atribuição multicanal com badge e filtros de TikTok.
- **Critério de Aceite:** Cliques e visitas com `ttclid` ou UTMs de TikTok gravam com canal `tiktok_ads`/`tiktok_organic`, sem misturar com Google ou Meta.

---

### FASE 5: Homologação Final Unificada (Google + Meta + TikTok)
- **Objetivo:** Execução sistemática da matriz unificada de testes cobrindo Google Ads, Meta Ads e TikTok Ads de uma única vez em homologação/produção e conferência de KPIs.
- **Arquivos:** Scripts dedicados de teste automatizado ponta a ponta e Playwright MCP.
- **Banco:** Limpeza segura apenas dos registros de testes gerados durante a validação.
- **Riscos:** BAIXO.
- **Testes:** Cobertura de 100% da matriz unificada expandida (Google, Meta, TikTok, Orgânico, Direto).
- **Critério de Aceite:** Zero anomalias nos dados históricos do Google Ads e consistência completa das novas métricas em todas as três plataformas.

---

### FASE 6: Gerador de Links de Rastreamento no Admin + Preparação dos Links Reais de Produção

> [!NOTE]
> **STATUS DA FASE 6:** A Fase 6 foi **CONCLUÍDA E HOMOLOGADA COM 100% DE SUCESSO** em 28/09/2026.
>
> **Separação Obrigatória de Responsabilidades:**
> - **A) No Painel Administrativo:** Gerador de links operacional em `/admin/dashboard?tab=tracking-links`, com validação segura local, cópia com 1 clique e preservação estrita de macros oficiais.
> - **B) Fora do Sistema (Manual):** Aplicação dos links nas plataformas externas (gerenciador de anúncios Meta, TikTok Ads Manager, Bio do perfil, etc.) aguardando autorização do usuário para ativação.
> - **Zero Integração Externa:** Nenhuma API externa chamada, nenhum token solicitado, zero alterações em schema ou migrations.

- **Objetivo Principal:**
  Criar no painel administrativo uma área dedicada em:
  `Marketing -> Links de Rastreamento`
  para que os operadores de tráfego e marketing possam gerar links oficiais canônicos com UTMs e parâmetros corretos sem a necessidade de montar URLs manualmente, prevenindo erros de digitação e desvios de taxonomia.

- **Canais Contemplados pelo Gerador:**
  1. **Instagram Orgânico:**
     - Bio (`utm_source=instagram&utm_medium=organic&utm_campaign=bio&utm_content=perfil`)
     - Stories (`utm_source=instagram&utm_medium=organic&utm_campaign=stories&utm_content=...`)
     - Reels (`utm_source=instagram&utm_medium=organic&utm_campaign=reels&utm_content=...`)
  2. **Instagram Ads:**
     - Feed, Stories, Reels com macros dinâmicas Meta
  3. **Facebook Orgânico:**
     - Perfil, posts
  4. **Facebook Ads:**
     - Anúncios com macros dinâmicas Meta
  5. **TikTok Orgânico:**
     - Bio
     - Conteúdo / Vídeo quando aplicável
  6. **TikTok Ads:**
     - Campanhas padrão e Smart+ com macros dinâmicas TikTok
  7. **Estrutura Extensível:**
     - Preparada para suporte a Google Ads, Microsoft Ads e outros canais canônicos já existentes.

- **Requisitos Funcionais Previstos (Documentados para Implementação Futura):**
  - **Seleção de Plataforma:** Menu seletor (`Instagram`, `Facebook`, `TikTok`, `Google`, `Microsoft`, etc.).
  - **Tipo de Tráfego:** Alternador `Pago (Ads)` vs. `Orgânico`.
  - **Página de Destino:** Seletor de rotas canônicas internas (ex: `/`, `/lp/telas-mosquiteiras`, `/servicos/telas-mosquiteiras`, etc.) ou input de path customizado.
  - **Identificação de Campanha & Conteúdo:** Campos de texto validados para nome de campanha, adset/grupo e criativo.
  - **Templates / Macros Oficiais das Plataformas:**
    - **Meta Ads:** `utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&meta_placement={{placement}}&meta_campaign_id={{campaign.id}}&meta_adset_id={{adset.id}}&meta_ad_id={{ad.id}}`
    - **TikTok Ads Standard:** `utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__&utm_term=__AID_NAME__&utm_content=__CID_NAME__&tiktok_campaign_id=__CAMPAIGN_ID__&tiktok_adgroup_id=__AID__&tiktok_creative_id=__CID__&tiktok_placement=__PLACEMENT__`
    - **TikTok Ads Smart+:** `utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__&utm_term=__AID_NAME__&utm_content=__CID_NAME__&tiktok_campaign_id=__CAMPAIGN_ID__&tiktok_adgroup_id=__AID__&tiktok_ad_id=__ADID_V2__&tiktok_creative_id=__CID__&tiktok_placement=__PLACEMENT__`
  - **Regra Estrita de Click IDs:** O gerador **NUNCA** deve inventar ou permitir preenchimento manual de `gclid`, `fbclid` ou `ttclid`. Esses Click IDs automáticos continuam sendo gerados e injetados exclusivamente pelas plataformas no momento do clique do visitante.
  - **Contrato Canônico do TikTok no Gerador:**
    - `ttclid` (automático da plataforma)
    - `tiktok_campaign_id`
    - `tiktok_adgroup_id`
    - `tiktok_ad_id`
    - `tiktok_creative_id`
    - `tiktok_placement`
  - **Ações na Interface:**
    - Geração em tempo real da URL final canônica com sanitização.
    - Botão **"Copiar URL"** com feedback visual na UI.
    - Botão **"Testar Link"** (abre a URL gerada em nova aba para conferência).

- **Critério de Aceite da Fase 6 (Quando For Implementada):**
  - Operador gera links com 2 cliques sem digitar UTMs incorretas.
  - Testes do link simulam parâmetros e registram visitas no banco com o canal canônico exato.
  - Zero alteração no tracking já em produção.

---

## 10. Estimativa de Complexidade por Fase

| Fase | Complexidade | Justificativa Técnica |
| :--- | :---: | :--- |
| **FASE 0 (Correção CTAs + Limite de Linhas)** | **MÉDIA** | Exige componentização cuidadosa em `servicos/[slug].vue` e `track-clicks.client.ts` sem alterar o design ou quebrar eventos existentes. |
| **FASE 1 (Normalização Multicanal)** | **BAIXA** | Regras lógicas puras em TypeScript/JavaScript com testes unitários simples. |
| **FASE 2 (Schema Supabase + RPC v2)** | **MÉDIA** | Criação de migration e função PL/pgSQL atômica com idempotência estrita. |
| **FASE 3 (Propagação Ponta a Ponta)** | **MÉDIA** | Conexão de endpoints e modularização de `send-lead.post.ts`. |
| **FASE 4 (Dashboard & Fila WhatsApp)** | **MÉDIA** | Modularização de componentes Vue shadcn/ui e integração de novos badges. |
| **FASE 4.5 (Suporte Técnico TikTok)** | **MÉDIA** | Taxonomia 13 canais, TTCLID, migração aditiva, RPC v3 e integração no dashboard. |
| **FASE 5 (Homologação Google + Meta + TikTok)** | **BAIXA** | Execução de scripts de asserção automatizada e validação visual Playwright unificada. |
| **FASE 6 (Gerador de Links + Ativação)** | **BAIXA** | Ferramenta no admin e configuração externa nos gerenciadores de anúncios. |

---

## 11. Worklog e Status de Execução da FASE 0

### Status: ✅ FASE 0 EXECUTADA COM SUCESSO (27/09/2026)

1. **Modularização e Limites de Código:**
   - `app/plugins/track-clicks.client.ts`: Reduzido de 228 para **91 linhas** (< 200).
   - `app/utils/clickTrackerDispatcher.ts`: Criado com **131 linhas** (< 200).
   - `app/components/servicos/ServicoEspecificacoes.vue`: Criado com **68 linhas** (< 500).
   - `app/components/servicos/ServicoCtaFinal.vue`: Criado com **103 linhas** (< 500).
   - `app/pages/servicos/[slug].vue`: Reduzido de 583 para **449 linhas** (< 500).
   - **Compilação Nuxt/TypeScript:** Build `npm run build` executado com código de saída 0 (zero erros).

2. **Testes de Validação com Playwright MCP:**
   - **Desktop (1280x800):** Clique no CTA Hero em `/servicos/telas/portas?gclid=GCLID_TEST_FASE0_DESKTOP...` ➔ WhatsApp abriu com `Ref: W3WJFR9W` e Supabase gravou atomicamente `short_code: W3WJFR9W` com `gclid` e `lead_click_id` correspondentes.
   - **Mobile (390x844):** Clique no botão flutuante em `/servicos/telas/janelas` ➔ WhatsApp abriu com `Ref: 7WQXEV8K` e Supabase gravou atomicamente `short_code: 7WQXEV8K`.
   - **Mobile (375x667):** Clique no CTA Hero em `/lp/telas-mosquiteiras?gclid=GCLID_LP_MOBILE_TEST...` ➔ Layout 100% responsivo (`hasHorizontalScroll: false`), WhatsApp abriu com `Ref: XAX6M42R` e banco persistiu `short_code: XAX6M42R`.
   - **Página de Orçamento (`/orcamento`):** Clique no card oficial ➔ WhatsApp abriu com `Ref: 8TNDE6MR` e banco persistiu `short_code: 8TNDE6MR`.
   - **Página de Contato (`/contato`):** Clique no card oficial ➔ WhatsApp abriu com `Ref: GNBG78BX` e banco persistiu `short_code: GNBG78BX`.
   - **Tráfego Direto / Orgânico (Sem Ads):** Clique em `/servicos/redes/sacadas-e-varandas` sem parâmetros ➔ WhatsApp abriu com `Ref: QP49QBY3` e banco gravou `short_code: QP49QBY3` com `gclid: null`.
   - **Deduplicação / Idempotência:** Disparo rápido duplo em intervalo < 500ms ➔ Registrou apenas 1 evento no Supabase e ambos os tabs abriram com a mesma referência `Ref: 3B4N3QA2`.
   - **Renovação de Código:** Cliques subsequentes após 1s limpam o código anterior e geram uma nova referência independente (`Ref: C62T3DCX`) sem acumulação de tags no texto.

**Próximo Passo:** FASE 0 concluída e homologada.

---

### Status: ✅ FASE 1 EXECUTADA COM SUCESSO (27/09/2026)

1. **Modularização e Limites de Código:**
   - `app/utils/trafficChannelClassifier.ts`: Criado com **162 linhas** (< 200). Contém normalização canônica (`normalizeTrafficSource`, `normalizeTrafficMedium`), detecção de meios pagos, parsing de hostnames de referrer e função pura `classifyClientChannel`.
   - `app/composables/useAttribution.ts`: Reduzido de 161 para **115 linhas** (< 200). Delega a classificação para `trafficChannelClassifier` e mantém compatibilidade 100% com a interface existente.
   - `server/shared/adminAnalyticsClassification.mjs`: Atualizado com **110 linhas** (< 200). Inclusão dos 11 canais canônicos no mapeamento de rótulos com preservação de legados.
   - **Compilação Nuxt/TypeScript:** Build de produção `npm run build` executado com código de saída 0 (zero erros).

2. **Testes de Validação Unitária e Regressão (22/22 PASS):**
   - **T01:** `gclid + google/cpc` ➔ `google_ads` (PASS)
   - **T02:** `gbraid` ➔ `google_ads` (PASS)
   - **T03:** `msclkid` ➔ `microsoft_ads` (PASS)
   - **T04:** `utm_source=instagram` + `utm_medium=paid_social` + `fbclid` ➔ `instagram_ads` (PASS)
   - **T05:** `utm_source=ig` + `utm_medium=cpc` ➔ `instagram_ads` (PASS)
   - **T06:** `utm_source=instagram` + `utm_medium=organic` ➔ `instagram_organic` (PASS)
   - **T07:** `referrer l.instagram.com` sem UTMs ➔ `instagram_organic` (PASS)
   - **T08:** `utm_source=facebook` + `utm_medium=paid_social` + `fbclid` ➔ `facebook_ads` (PASS)
   - **T09:** `fbclid` sem source ➔ `meta_ads` (PASS)
   - **T10:** `Google referrer` sem click ID ➔ `google_organic` (PASS)
   - **T11:** sem parâmetros e sem referrer ➔ `direct` (PASS)
   - **T12:** `referrer externo desconhecido` ➔ `referral` (PASS)
   - **T13:** `utm_source=linkedin` + `utm_medium=paid_social` ➔ `other_paid` (PASS)
   - **T14 (Precedência):** `gclid` + `utm_source=instagram` + `utm_medium=paid_social` ➔ `google_ads` (PASS)
   - **T15 (Normalização):** `source='   InStAgRaM   '` com espaços/letras mistas ➔ normalizado para `instagram` (PASS)
   - **T16-T20:** Cobertura de `fb`, `m.facebook.com`, `wbraid`, `bing/cpc` e rótulos do admin (PASS)
   - **REG-01 (Regressão Google Ads):** Simulação realista com todos os 12 metadados existentes intactos (PASS)
   - **SPA-01 (Navegação SPA):** `Instagram Ads ➔ Home ➔ /servicos/telas ➔ /contato` mantendo canal `instagram_ads` na sessão (PASS)
   - **Invariantes do Sistema:** Suítes legadas `test-google-ads-tracking.mjs` e `test-service-forms-canonical.mjs` executadas com 100% PASS.

3. **Hotfix de Não-Mistura de Atribuição (Touch Isolation & Boundary Audit):**
   - **Isolamento de Touch (Snapshot):** `useAttribution.ts` atualizado para criar um novo snapshot limpo a cada novo toque explícito (`hasParamsInUrl` ou `externalReferrer`). Click IDs de toques anteriores (`gclid`, `fbclid`, `msclkid`, etc.) não vazam mais entre campanhas distintas dentro da janela de 30 minutos.
   - **Preservação de Navegação SPA:** Navegações internas sem novos sinais de aquisição reutilizam integralmente o snapshot existente no cookie `adt_session_attribution`.
   - **Auditoria de Limites de Referrer (Anti-Falso Positivo):** Substituído `.includes('google.')` e `.includes('bing.')` por regex com limites estritos de hostname/domínio `(^|\.)google\.(com(\.[a-z]{2})?|[a-z]{2}(\.[a-z]{2})?)$` e `bing.com`/`.bing.com`, rejeitando domínios maliciosos ou spoofing (`notgoogle.com`, `attacker-google.com`, etc.) e aceitando domínios legítimos (`google.com`, `google.com.br`, etc.).
   - **Testes A01 a A05 e REF-01/02 Executados com Sucesso (100% PASS):**
     - **A01:** Google Ads ➔ nova URL Instagram Ads em 30min: canal `instagram_ads`, `gclid=null`, `fbclid` preservado.
     - **A02:** Instagram Ads ➔ nova URL Google Ads: canal `google_ads`, `fbclid` antigo não contamina, `gclid` novo preservado.
     - **A03:** Instagram Ads ➔ navegação SPA sem parâmetros (`/servicos/telas` ➔ `/contato`): canal e `fbclid` preservados.
     - **A04:** Google Ads ➔ navegação SPA sem parâmetros: canal e `gclid` preservados.
     - **A05:** Google Ads novo com `gclid` + `utm_source=instagram` na mesma URL: precedência válida mantida (`google_ads`).
     - **REF-01 / REF-02:** Validação contra falsos positivos em hostnames do Google e Bing.
   - **First Touch:** `useAnalyticsIdentity.ts` (`setFirstTouchContextOnce`) confirmado 100% isolado em `localStorage` e inalterado.

4. **Hotfix de Persistência de Referrer em SPA (Auditoria de Ciclo de Vida do Documento):**
   - **Problema Corrigido:** Em navegações client-side (SPA), o `document.referrer` permanece gravado com a URL do referrer externo original no objeto do navegador. O código anterior reavaliava `externalReferrer` a cada rota e recriava snapshots vazios, degradando `instagram_ads` em `instagram_organic` e `google_ads` em `google_organic`.
   - **Mecanismo Seguro Adotado:** Implementado `useState('adt_external_referrer_consumed', () => false)` no `useAttribution.ts`.
     - Permite que o referrer externo seja consumido como sinal de aquisição **estritamente uma vez por documento/carregamento real**.
     - Sobrevive transparentemente a navegações SPA (`router.push` / `<NuxtLink>`) sem recriar toques.
     - Reinicializa automaticamente em novos carregamentos reais de documento (novos acessos ou reloads).
     - Isolado por contexto de renderização (zero vazamento de memória ou concorrência no SSR e sem dependência de storage permanente).
   - **Validação com Playwright em Navegador Real (Chrome Headless) - 100% PASS:**
     - **SPA-REF-01:** Instagram Ads com referrer `https://l.instagram.com/` ➔ navegação SPA para `/servicos/telas` e `/contato` mantendo canal `instagram_ads` e `fbclid=FB_TEST` (zero reload e sem conversão indevida para orgânico).
     - **SPA-REF-02:** Google Ads com referrer `https://www.google.com/` ➔ navegação SPA mantendo canal `google_ads` e `gclid=GCL_TEST` (nunca vira `google_organic`).
     - **SPA-REF-03:** Acesso orgânico Instagram sem UTMs ➔ navegação SPA mantendo `instagram_organic`.
     - **SPA-REF-04:** Acesso direto sem referrer ➔ navegação SPA mantendo `direct`.
     - **SPA-REF-05:** Após sessão SPA, novo carregamento de documento com campanha Facebook Ads ➔ gera novo snapshot limpo com canal `facebook_ads` e `fbclid=FB_NEW`.
   - **Invariantes e Regressão:** Suítes legadas `test-google-ads-tracking.mjs` (7/7 grupos) e `test-service-forms-canonical.mjs` (26/26 cenários) com 100% PASS. Build `npm run build` gerado com código de saída 0.
   - **First Touch:** `useAnalyticsIdentity.ts` 100% preservado e inalterado.

---

### Status: ✅ FASE 2 EXECUTADA COM SUCESSO (27/09/2026)

1. **Migration Aditiva Aplicada no Supabase (PostgreSQL 17.6):**
   - Arquivo: `supabase/migrations/20260927210000_multichannel_attribution_and_rpc_v2.sql` (**184 linhas**, < 200).
   - Invariantes: **ZERO DROP, ZERO RENAME, ZERO TYPE CHANGE, ZERO MODIFICAÇÃO DE DADOS HISTÓRICOS**.
   - Nota Técnica de Execução: Operações metadata-only de curta duração, ainda sujeitas aos locks normais do PostgreSQL.
   - Colunas Adicionadas (todas `TEXT NULL`):
     - `public.whatsapp_attributions`: `channel`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `fbclid`, `meta_campaign_id`, `meta_adset_id`, `meta_ad_id`, `meta_placement`.
     - `public.lead_clicks`: `meta_campaign_id`, `meta_adset_id`, `meta_ad_id`, `meta_placement` (`channel`, `fbclid`, `msclkid`, `utm_*` já existiam).
     - `public.page_views`: `meta_campaign_id`, `meta_adset_id`, `meta_ad_id`, `meta_placement` (`channel`, `fbclid`, `msclkid`, `utm_*` já existiam).
     - `public.leads`: `meta_campaign_id`, `meta_adset_id`, `meta_ad_id`, `meta_placement` (`session_channel`, `first_touch_channel`, `fbclid`, `msclkid`, `utm_*` já existiam).
   - Índice Criado: `idx_whatsapp_attributions_channel_status ON public.whatsapp_attributions (channel, attribution_status) WHERE channel IS NOT NULL`.

2. **RPC Atômica V2 Criada (`create_whatsapp_click_attribution_atomic_v2`):**
   - A função legada v1 (`create_whatsapp_click_attribution_atomic`) **permaneceu 100% intacta e operacional**.
   - A v2 foi criada como uma nova função separada com suporte multicanal nativo (`channel`, `fbclid`, `msclkid`, metadados Meta).
   - `campaign_name` contextual: não força fallback `Google Ads` para canais que não são Google (ex: `instagram_ads` gera `Instagram Ads` ou UTM, `direct` gera `Direto`, etc.).
   - Segurança: `SECURITY DEFINER`, `SET search_path TO ''`, tabelas qualificadas com `public.`, privilégios revogados de `PUBLIC`/`anon`/`authenticated` e concedidos exclusivamente a `service_role` e `postgres`.

3. **Resultados dos Testes Diretos da RPC (B01 a B06) - 100% PASS:**
   - **B01 (Google Ads):** `channel=google_ads`, `gclid=GCL_TEST_V2` gravados em `lead_clicks` e `whatsapp_attributions` com short_code válido. (PASS)
   - **B02 (Instagram Ads):** `channel=instagram_ads`, `fbclid=FB_TEST_V2`, `meta_campaign_id`, `meta_adset_id`, `meta_ad_id`, `meta_placement` gravados integralmente. (PASS)
   - **B03 (Instagram Orgânico):** `channel=instagram_organic`, `gclid=NULL`, `fbclid=NULL`, `campaign_name='Instagram (Orgânico)'` (zero fallback Google Ads). (PASS)
   - **B04 (Direct):** `channel=direct`, click IDs `NULL`, `campaign_name='Direto'` gravado normalmente. (PASS)
   - **B05 (Idempotência Estrita):** Reexecução com mesmo `event_id` retornou `idempotent=true`, mesmo `lead_click_id`, mesmo `attribution_id` e mesmo `short_code`, sem duplicar registros no banco. (PASS)
   - **B06 (Integridade da RPC V1):** Chamada de teste na RPC v1 legada executada com sucesso, confirmando que ela continua funcionando perfeitamente sem regressão. (PASS)

4. **Limpeza Concluída dos Registros de Teste:**
   - Exatamente **5 registros** em `whatsapp_attributions` e **5 registros** em `lead_clicks` (criados com prefixos de teste `TEST_PHASE2_%` e `T99B2%`) foram removidos.
   - Os 3 registros históricos de produção em `whatsapp_attributions` e os 44 registros históricos em `lead_clicks` permanecem **100% intactos**.

---

### Status: ✅ FASE 3 EXECUTADA COM SUCESSO (27/09/2026)

1. **Hardening Concorrente da RPC v2 (`20260927220000_harden_whatsapp_rpc_v2_concurrency.sql`):**
   - *Nota Histórica:* Migration histórica aplicada antes da validação final de limite de linhas: ~210 linhas. Mantida imutável por segurança de migration history. Todas as novas migrations permanecem obrigatoriamente <=200 linhas.
   - Resolução definitiva de concorrência com `ON CONFLICT (event_id) WHERE (event_id IS NOT NULL) DO NOTHING` e tratamento estrito de colisão de short_code via `BEGIN ... EXCEPTION WHEN unique_violation`.
   - Testes concorrentes executados com 100% de sucesso:
     - **C-IDEMP-01 (2 chamadas simultâneas, mesmo event_id e short_code):** 1 vencedora, 1 idempotente, 1 registro gravado, ZERO erro 23505.
     - **C-IDEMP-02 (2 chamadas simultâneas, mesmo event_id, short_codes diferentes):** event_id prevaleceu com autoridade, retorno idempotente com short_code vencedor.
     - **C-IDEMP-03 (10 chamadas concorrentes em paralelo real):** 1 vencedora, 9 idempotentes, 0 erros, exatamente 1 registro gravado.
     - **C-COLLISION-01 (2 chamadas simultâneas, event_ids diferentes, mesmo short_code):** 1 vencedora, 1 falha com `ERR_SHORT_CODE_COLLISION`, ZERO lead_clicks órfãos.

2. **Propagação Multicanal Ponta a Ponta Concluída:**
   - `useAttribution.ts`: Captura dos 4 metadados Meta (`meta_campaign_id`, `meta_adset_id`, `meta_ad_id`, `meta_placement`) na interface `SessionAttribution` e novo touch.
   - `track-visits.client.ts` e `server/api/track-visit.post.ts`: Envio e persistência validada de `channel` (allowlist de 11 canais), `fbclid`, `msclkid` e dos 4 campos Meta em `public.page_views`.
   - `clickTrackerDispatcher.ts`: Inclusão de `channel`, `fbclid`, `msclkid` e 4 campos Meta no `buildClickPayload`.
   - `whatsappTrackingQueue.ts`: Confirmado que o payload completo com Meta e click IDs sobrevive intacto a enqueue, localStorage, retry e `flushPendingWhatsappClicks`.
   - `server/api/track-click.post.ts`: Conectado exclusivamente à RPC v2 (`create_whatsapp_click_attribution_atomic_v2`) com validação de `channel` via `validateCanonicalChannel` e propagação dos 38 parâmetros.
   - `useFormSubmit.js`: Propagação do snapshot atual com `channel`, `fbclid`, `msclkid` e metadados Meta.
   - `server/api/send-lead.post.ts`: Modularizado cirurgicamente com extração de `leadDb.ts` e `leadEmailNotification.ts` (todos os arquivos <= 200 linhas), persistindo `session_channel`, `first_touch_channel`, `fbclid`, `msclkid` e metadados Meta em `public.leads`.

3. **Observação Arquitetural de Microsoft Ads:**
   - A coluna `msclkid` é persistida nativamente em `public.lead_clicks`.
   - Em cliques de WhatsApp, o dado é recuperável sem perda via `whatsapp_attributions.lead_click_id -> lead_clicks.msclkid`.

4. **Resultados dos Testes Ponta a Ponta (C01 a C08 + MS Ads) - 100% PASS:**
   - **C01 (Google Ads -> WhatsApp):** `google_ads` preservado em pageviews, cliques e WhatsApp com `gclid` e campos Meta `NULL`. (PASS)
   - **C02 (Instagram Ads -> WhatsApp):** `instagram_ads` preservado com `fbclid` e todos os 4 campos Meta, Ref correto e ZERO dados de Google. (PASS)
   - **C03 (Instagram Ads -> Formulário):** `session_channel=instagram_ads`, `fbclid` e 4 campos Meta persistidos em `public.leads`, mantendo First Touch intacto. (PASS)
   - **C04 (Instagram Orgânico -> WhatsApp):** `channel=instagram_organic`, click IDs `NULL`. (PASS)
   - **C05 (Direct -> WhatsApp):** `channel=direct`, sem parâmetros, Google e Meta IDs `NULL`. (PASS)
   - **C06 (Instagram Ads -> SPA Navigation):** Navegação `Home -> /servicos/telas -> /contato` preservou `instagram_ads` e campos Meta em todos os 3 pageviews e no clique final. (PASS)
   - **C07 (NOVO TOUCH Bidirecional):** Isolamento de toques confirmado: Instagram Ads seguido de Google Ads zera campos Meta e assume novo `gclid`; Google Ads seguido de Instagram Ads zera `gclid` e assume novo `fbclid`. (PASS)
   - **C08 (Retry WhatsApp Real):** Simulação de falha e posterior reprocessamento (flush) confirmou entrega idempotente com ZERO duplicações no banco. (PASS)
   - **Microsoft Ads Pipeline:** Recuperação via FK `whatsapp_attributions.lead_click_id -> lead_clicks.msclkid` testada e validada com 100% de sucesso. (PASS)

5. **Testes Visuais e de Clique Playwright MCP (Navegador Real):**
   - **Desktop (1280x800):** Instagram Ads -> clique em CTA real do site gerou `Ref: 4DBZ364J` e gravou atribuição com `instagram_ads` e todos os 4 campos Meta. (PASS)
   - **Mobile (390x844):** Instagram Ads -> clique em CTA mobile gerou `Ref: TE27PXYZ` e gravou atribuição no Supabase com sucesso. (PASS)
   - **Regressão Google Ads:** Clique em CTA sob contexto Google Ads gerou `Ref: YSK6H7TP`, gravando `google_ads` e `gclid` com zero campos Meta. (PASS)

6. **Regressão Completa e Integridade:**
   - Testes T01 a T20 + A01 a A05: **27/27 PASS (100%)**.
   - Testes SPA-REF-01 a SPA-REF-05: **5/5 PASS (100%)**.
   - `test-service-forms-canonical.mjs`: **26/26 PASS (100%)**.
   - `test-google-ads-tracking.mjs`: **7/7 grupos PASS (100%)**.
   - Compilação de Produção: `npm run build` gerado com **Exit Code 0 (✨ Build complete!)**.
   - RPC v1 legada: Confirmada **100% intacta e operacional**.

7. **Limpeza Concluída do Banco de Dados:**
   - Todos os registros artificiais criados pelos testes da Fase 3 foram removidos.
   - Contagens confirmadas: `public.lead_clicks` = **44**, `public.whatsapp_attributions` = **3**, `public.leads` = **0**, `public.page_views` = **505** (exatamente os registros históricos originais, ZERO resíduos de teste da Fase 3).

8. **Auditoria e Hotfix Final da Fase 3 (Semântica First Touch e Cache de Idempotência):**
   - **Correção Documental de Migration:**
     > *Migration histórica aplicada antes da validação final de limite de linhas: ~210 linhas. Mantida imutável por segurança de migration history. Todas as novas migrations permanecem obrigatoriamente <=200 linhas.*
   - **Semântica Atômica de First Touch:**
     - `app/composables/useAnalyticsIdentity.ts` (171 linhas): Adicionados `hasFirstTouchContext()` e refatorado `getFirstTouchContext()` para retornar `null` quando inexistente no storage (eliminando retorno falso-positivo de direct com campos vazios).
     - `app/composables/useFormSubmit.js` (188 linhas): O contexto de First Touch é tratado como **snapshot atômico integral**. Se já existe, é preservado exatamente como está (inclusive campos `null`), sem fallback campo a campo para os atributos do Last Touch. Se não existe, é inicializado integralmente a partir da primeira sessão.
     - Suíte **FT01 a FT04 (100% PASS)**:
       - FT01 (Direct -> Instagram Ads): `first_touch` com canal `direct` e campos nulos preservados; sessão atual com `instagram_ads` e `fbclid`.
       - FT02 (Google Ads -> Instagram Ads): `first_touch` preserva `google_ads`, `gclid` e `utm_source=google` sem contaminação dos campos Meta da sessão atual.
       - FT03 (Instagram Ads -> Google Organic): `first_touch` preserva integralmente Instagram Ads.
       - FT04 (Primeiro acesso Google Ads): Snapshot atômico inicial criado a partir da atribuição da primeira interação.
   - **Auditoria de `isIdempotentRequest` e Eliminação de Falso-Positivo no Cache:**
     - Identificado risco arquitetural no cache em memória `isIdempotentRequest()` de marcar `event_id` antes da confirmação de gravação no banco, o que causaria descarte indevido (perda silenciosa) de eventos reenviados pela fila de retry em caso de falha transitória do Supabase/RPC.
     - Barreira prematura removida de `server/api/track-click.post.ts` (194 linhas) e `server/api/track-visit.post.ts` (107 linhas).
     - A idempotência é delegada de forma atômica e definitiva ao PostgreSQL:
       - Cliques WhatsApp: RPC v2 com tratamento concorrente e cláusula `ON CONFLICT (event_id) WHERE (event_id IS NOT NULL) DO NOTHING`.
       - Demais cliques e pageviews: Unique index `unq_lead_clicks_event_id` e `unq_page_views_event_id`, capturando erro `23505` no endpoint.
     - Testes de Retry Avançado:
       - **C08-A (Falha antes do servidor):** Cliente offline -> enfileiramento local -> posterior flush gravou exatamente 1 `lead_click` e 1 `whatsapp_attribution`. (PASS)
       - **C08-B (Falha interna simulada + Retry):** Requisição atinge o servidor -> falha simulada antes do banco -> retry com mesmo `event_id` e `short_code` processado sem bloqueio falso de cache -> exatamente 1 `lead_click` e 1 `whatsapp_attribution` (zero duplicações, zero perda silenciosa). (PASS)
   - **Regressão Final Pós-Hotfix (100% PASS):**
     - FT01-FT04: 4/4 PASS
     - C08-A, C08-B: 2/2 PASS
     - C01, C02, C03, C06: 4/4 PASS
     - SPA-REF-01 a SPA-REF-05: 5/5 PASS
     - `test-google-ads-tracking.mjs`: 7/7 grupos PASS
     - `test-service-forms-canonical.mjs`: 26/26 PASS
     - `test_phase1_classification.mjs`: 27/27 PASS
     - `npm run build`: Compilação limpa com Exit Code 0 (✨ Build complete!).
     - RPC v1 legada: 100% intacta.
     - RPC v2: 100% intacta.
     - Banco de Dados: Zero registros de teste remanescentes.

---

### Status: ✅ FASE 4 EXECUTADA COM SUCESSO (27/09/2026)

1. **Limpeza e Higienização Pós-Fase 3:**
   - Hook temporário `body._simulate_failure` removido de `server/api/track-click.post.ts`.
   - Correções documentais aplicadas no plano (RPC v2 atômica e descarte de menções ativas ao cache LRU).

2. **Arquitetura Neutra da Fila WhatsApp no Dashboard:**
   - Desvinculação do `WhatsappAttributionSection` de dentro de `GoogleAdsSection.vue`.
   - Aba neutra criada no `app/pages/admin/dashboard.vue`: `<TabsTrigger value="whatsapp">` ("Atribuição WhatsApp") e `<TabsContent value="whatsapp">`.
   - GoogleAdsSection preservado exclusivamente para métricas do Google Ads.

3. **Modularização Estrita do Componente Histórico:**
   - `WhatsappAttributionSection.vue`: Reduzido de ~789 linhas para **340 linhas** ($\le 500$).
   - `GoogleAdsSection.vue`: Reduzido para **472 linhas** ($\le 500$) com extração de `GoogleAdsKeywordsTable.vue` (75 linhas).
   - Componentes extraídos cirurgicamente em `app/components/admin/whatsapp/`:
     - `WhatsappAssignModal.vue`: 191 linhas ($\le 500$)
     - `WhatsappDismissModal.vue`: 112 linhas ($\le 500$)
     - `WhatsappQuickSearchModal.vue`: 151 linhas ($\le 500$)
     - `WhatsappAttributionCard.vue`: 256 linhas ($\le 500$)
     - `SessionJourneyDrawer.vue`: 309 linhas ($\le 500$)
   - Todos os arquivos de lógica/API mantidos estritamente $\le 200$ linhas.

4. **Tipos e API Multicanal:**
   - `app/types/adminWhatsappAttribution.ts` (114 linhas) e endpoints `index.get.ts` (192 linhas) / `by-code/[code].get.ts` (143 linhas) transportam canal, UTMs, click IDs (`gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`) e IDs Meta (`meta_campaign_id`, `meta_adset_id`, `meta_ad_id`, `meta_placement`).
   - `msclkid` recuperável com join seguro via `lead_clicks(msclkid)`.

5. **Apresentação Consistente dos 11 Canais Canônicos e Legados NULL:**
   - Rótulos PT-BR padronizados via `app/utils/channelDisplay.ts` e `server/shared/adminAnalyticsClassification.mjs`.
   - Registros históricos com `channel = NULL` apresentados explicitamente como `"Legado / Canal não registrado"` (NÃO Direct, NÃO Google Ads).

6. **Card Enriquecido da Fila WhatsApp (`WhatsappAttributionCard.vue`):**
   - Ref, canal, campanha, data/hora, landing, CTA, status, Meta IDs, FBCLID, GCLID, MSCLKID com botões de cópia rápida.
   - Ações: "Ver jornada", "+ Criar Cliente", "Vincular" e "Dispensar".

7. **AcquisitionSection Multicanal:**
   - `app/components/admin/AcquisitionSection.vue` (242 linhas) atualizado com distinção visual dos 11 canais sem agregação incorreta.

8. **Auditor de Jornada da Sessão Ponta a Ponta:**
   - Endpoint: `server/api/admin/marketing/session-journey.get.ts` (166 linhas, $\le 200$).
   - Slide-over: `app/components/admin/whatsapp/SessionJourneyDrawer.vue` (309 linhas, $\le 500$) com timeline cronológica e detalhes técnicos recolhíveis.

9. **Filtros e Usabilidade:**
   - Filtros na fila por status, canal canônico e busca por texto.

10. **Resultados dos Testes Funcionais D01 a D10 (100% PASS):**
    - Todos os 10 cenários (Instagram Ads, Instagram Orgânico, Google Ads, Direct, Legado NULL, Associação, Dispensa, Filtro por Canal, Aquisição e Jornada Ponta a Ponta) aprovados com sucesso.

11. **Validação Visual e de Responsividade com Playwright MCP:**
    - Desktop (1440x900), Notebook (1280x800) e Mobile (390x844) testados com navegador real. Zero horizontal overflow, todos os modais e ações acessíveis.

12. **Segurança e Regressão Global (100% PASS):**
    - `test-google-ads-tracking.mjs` (7/7 grupos PASS).
    - `test-service-forms-canonical.mjs` (26/26 cenários PASS).
    - `test_phase1_classification.mjs` (27/27 PASS).
    - `npm run build` gerado com Exit Code 0 (✨ Build complete!).
    - Zero alterações de schema / zero migrations nesta fase.
    - RPC v1 e RPC v2 100% intactas.
**Próximo Passo:** Concluir a **FASE 4.5 (Suporte Técnico TikTok)** antes de submeter à aprovação da Fase 5.

---

### Status: 🟢 FASE 4.5 CONCLUÍDA E APROVADA (27/09/2026)

**Objetivo:** Suporte Técnico TikTok (Taxonomia 13 Canais, TTCLID, Propagação Ponta a Ponta, Schema Aditivo, RPC v3 e Dashboard Multicanal).
- Taxonomia canônica expandida para 13 canais canônicos oficiais.
- Schema aditivo concluído com sucesso.
- RPC atômica v3 criada e hardenizada para concorrência com `ON CONFLICT(event_id)` e proteção contra colisão de `short_code`.
- 100% dos testes da Fase 4.5 aprovados com sucesso.

---

### Status: 🟢 FASE 5 CONCLUÍDA COM 100% DE SUCESSO (27/09/2026)

**Objetivo:** Homologação Final Multicanal (Google + Microsoft + Meta + Instagram + Facebook + TikTok + Orgânico + Direto + Referral + Other Paid).

1. **Matriz Principal Multicanal:**
   - 100% dos cenários (F5-G01 a F5-R01) testados e aprovados com sucesso.
   - Suíte canônica criada em `scripts/test_multichannel_tracking.mjs` com submódulos estritamente $\le 200$ linhas.
2. **Precedência e Anti-Spoofing:**
   - Precedência de Click IDs rigorosamente testada (Google > Microsoft > TikTok > Meta).
   - Parsing de hostname real validado contra domínios maliciosos e falsos positivos.
3. **Cross-Touch e Isolamento:**
   - Transições de toque entre Google, Meta, Instagram e TikTok testadas com isolamento estrito de parâmetros.
   - Navegação SPA preservando o contexto sem contaminação.
4. **First Touch Snapshot:**
   - Imutabilidade do First Touch preservada no banco `public.leads` através de múltiplos toques sucessivos.
5. **Resiliência de Retry e Concorrência RPC v3:**
   - Retry estritamente idempotente para Google Ads, Instagram Ads e TikTok Ads (zero duplicação).
   - Suíte de concorrência RPC v3 (`test_v3_concurrency_suite.mjs`) reexecutada com 25 PASS | 0 FAIL.
6. **Dashboard e Auditor de Jornada:**
   - Exibição consistente dos 13 canais canônicos na fila e no dashboard de aquisição.
   - Auditor de Jornada (`SessionJourneyDrawer`) com timeline cronológica limpa e detalhes técnicos colapsáveis.
7. **Validação Visual e Responsividade com Playwright MCP:**
   - Viewports Desktop (1440x900, 1280x800) e Mobile (390x844, 375x667) auditados com navegador real via Playwright MCP.
   - Zero horizontal overflow em todos os viewports.
   - Cliques reais de WhatsApp validados com injeção de short_code e conciliação no Supabase.
8. **Regressões e Compilação:**
   - `test_phase1_classification.mjs`: 27 PASS | 0 FAIL.
   - `test-service-forms-canonical.mjs`: 26 PASS | 0 FAIL.
   - `test-google-ads-tracking.mjs`: 7/7 grupos PASS.
   - `test_regression_b01_b06.mjs`: 6 PASS | 0 FAIL.
   - `test_spa_referrer_real_browser.cjs`: 5 PASS | 0 FAIL.
   - `npm run build`: Exit Code 0 (✨ Build complete!).
9. **Proteção de Dados, Higiene e Auditoria Forense:**
   - Auditoria forense dos 14 `page_views` sintéticos gerados durante a janela de testes da Fase 5: 100% comprovados como fixtures Playwright (User-Agent `HeadlessChrome`, sessões SPA-REF-01..05, click IDs `FB_TEST`, `GCL_TEST`, `FB_INITIAL`, `FB_NEW`).
   - Todos os 14 registros identificados foram removidos pelos seus IDs específicos (`668e08e2...` a `44fc2578...`).
   - Contagem final: `page_views = 510` (Baseline: 509).
   - Fixtures F5 remanescentes: 0.
   - Delta real: +1 visita real de Google Ads (`/lp/telas-mosquiteiras`, GCLID real, browser real) ocorrida após o encerramento dos testes.
   - Zero tráfego real removido ou impactado.
   - Fixtures remanescentes em todas as 4 tabelas: `page_views` = 0, `lead_clicks` = 0, `whatsapp_attributions` = 0, `leads` = 0.
   - Nenhuma nova migration criada e nenhuma alteração de schema realizada.
   - Chave de serviço `SUPABASE_SERVICE_ROLE_KEY` estritamente privada no backend Nitro.

---

### Status: 🟢 FASE 6 CONCLUÍDA COM 100% DE SUCESSO (28/09/2026)

**Objetivo:** Gerador de Links de Rastreamento no Admin + Preparação dos Links Reais de Produção.

1. **Arquitetura Modular Limpa:**
   - Tipos e interfaces em `app/types/trackingLinks.ts` (58 linhas $\le 200$).
   - Presets oficiais em `app/utils/trackingLinkPresets.ts` (133 linhas $\le 200$).
   - Funções puras em `app/utils/trackingLinkBuilder.ts` (172 linhas $\le 200$).
   - Modal de validação segura em `app/components/admin/tracking/TrackingLinkTesterModal.vue` (200 linhas $\le 500$).
   - Interface do gerador em `app/components/admin/TrackingLinkGenerator.vue` (430 linhas $\le 500$).
   - Aba integrada no Dashboard em `app/pages/admin/dashboard.vue` (338 linhas $\le 500$).
2. **Conformidade com Documentação Oficial Meta e TikTok:**
   - Meta Ads: macros dinâmicas preservadas literalmente (`{{site_source_name}}`, `{{campaign.name}}`, etc.).
   - TikTok Ads: separação canônica entre Standard (`tiktok_creative_id=__CID__` sem ad_id) e Smart+ (`tiktok_ad_id=__ADID_V2__`).
3. **Ausência de Click IDs Fabricados:**
   - Zero campos para `gclid`/`fbclid`/`ttclid`/`msclkid`.
   - Informação visual explícita de injeção automática pelas plataformas.
4. **Validação Segura ("Testar Link"):**
   - Modal estático client-side. Zero escritas no banco e zero poluição analítica.
5. **Responsividade Estrita via Playwright MCP:**
   - Auditado em Desktop (1440x900, 1280x800), Tablet (768x1024) e Mobile (390x844, 375x667).
   - Zero overflow horizontal (`overflowDelta = 0` em todos os viewports).
6. **Suíte de Testes Automatizados:**
   - `scripts/test_tracking_link_generator.mjs`: 16 PASS | 0 FAIL.
   - `test-service-forms-canonical.mjs`: 26 PASS | 0 FAIL.
   - `test-google-ads-tracking.mjs`: 7/7 grupos PASS.
   - Compilação de Produção (`npm run build`): Exit Code 0 (✨ Build complete!).
7. **Integridade de Dados e Segurança:**
   - Zero migrations criadas.
   - Zero alterações de schema ou RPCs.
   - Zero alterações no tracking central.
   - Acesso restrito ao painel admin protegido pelo middleware global.

**Declaração Mandatória da Fase 6:**
- O sistema aguarda aprovação formal do usuário antes da aplicação dos links nas plataformas externas.

---

### Status: 🟢 FASE 7 CONCLUÍDA COM 100% DE SUCESSO (28/09/2026)

**Objetivo:** Gestão de Campanhas, KPIs e Comparação com Tracking Proprietário.

1. **Schema PostgreSQL Aditivo e RLS Estrito:**
   - Tabela `public.campaign_kpi_entries` criada via migration `supabase/migrations/20260928_campaign_kpi_entries.sql` (versão aplicada: `20260928033817`).
   - 27 colunas com tipagem segura, 3 índices estratégicos (`idx_campaign_kpi_entries_platform`, `idx_campaign_kpi_entries_utm_campaign`, `idx_campaign_kpi_entries_period`).
   - Trigger `trg_campaign_kpi_entries_updated_at` ativo.
   - RLS habilitado com acesso restrito a `service_role` e privilégios anon/authenticated revogados.
2. **Camada de Cálculos Puros (Zero NaN / Infinity):**
   - Funções puras em `app/utils/campaignKpiCalculator.ts` e `app/utils/campaignKpiGoals.ts`.
   - Divisão segura retornando `null` em caso de denominador zero ou nulo, formatado na UI como `"Sem dados"` / `"—"`.
   - Avaliação objetiva de metas (`achieved`, `not_achieved`, `no_goal`) sem benchmarks externos artificiais.
3. **Endpoints REST Backend (Nitro):**
   - CRUD completo (`index.get.ts`, `index.post.ts`, `[id].put.ts`, `[id].delete.ts`) sob proteção do guard `requireActiveAdmin`.
   - Endpoint analítico seguro `tracking-data.get.ts` para consulta de métricas existentes sem alterar dados de tracking.
4. **Painel Admin Modular e Responsivo:**
   - 8ª aba integrada em `app/pages/admin/dashboard.vue` (`?tab=campaign-kpis`).
   - Componentes modulares ($\le 500$ linhas) em `app/components/admin/marketing/` (Dashboard, Form, Cards, Funil, Histórico, Comparações, Checklist).
5. **Auditoria de Layout via Playwright MCP:**
   - Validado nos 4 viewports obrigatórios (1440x900, 1280x800, 390x844 e 375x667).
   - Zero overflow horizontal (`scrollWidth === innerWidth`, delta = 0px em todos os viewports).
6. **Regressão Global e Compilação:**
   - `test_phase1_classification.mjs`: 27 PASS | 0 FAIL.
   - `test-google-ads-tracking.mjs`: 7/7 grupos PASS.
   - `test-service-forms-canonical.mjs`: 26 PASS | 0 FAIL.
   - `scripts/test_tracking_link_generator.mjs`: 16 PASS | 0 FAIL.
   - `scripts/test_campaign_kpi_calculator.mjs`: 16 PASS | 0 FAIL.
   - `scripts/test_campaign_kpi_persistence.mjs`: 8 PASS | 0 FAIL.
   - `npm run build`: Exit Code 0 (✨ Build complete!).
7. **Higiene e Proteção de Dados:**
   - Todas as fixtures de teste `F7_KPI_` foram removidas por IDs específicos.
   - Tabela `campaign_kpi_entries` zerada ao final dos testes (0 registros).
   - Tracking legado e RPCs v1/v2/v3 100% intocados.

**Declaração Mandatória:**
- **NENHUMA CAMPANHA EXTERNA FOI ALTERADA OU ATIVADA.**
- **A FASE 7A (ATIVAÇÃO REAL DOS LINKS) NÃO FOI INICIADA.**
- O sistema aguarda aprovação formal do usuário antes da aplicação dos links nas plataformas externas.






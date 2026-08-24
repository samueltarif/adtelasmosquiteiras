# WALKTHROUGH — LEAD EMAIL DELIVERY HARDENING & TEST ISOLATION

**Projeto:** AD Telas e Redes (`https://www.adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-24  
**Status:** `READY FOR REVIEW`  

---

## 1. Resumo das Mudanças

### Arquivos Novos
| Arquivo | Descrição |
|---|---|
| [`server/shared/leadEmailCore.mjs`](file:///d:/sicons/ADT/server/shared/leadEmailCore.mjs) | Módulo central compartilhado contendo regras puras, normalização de telefone para WhatsApp, sanitização de erros SMTP, templates HTML e texto plano, e fluxo de submissão |
| [`server/utils/emailService.ts`](file:///d:/sicons/ADT/server/utils/emailService.ts) | Serviço de envio SMTP via Nodemailer/Gmail no runtime Nitro, re-exportando o core compartilhado |
| [`test-lead-email.mjs`](file:///d:/sicons/ADT/test-lead-email.mjs) | Suíte de testes 100% isolada em memória com `MockSmtpMailer` e `MockLeadsRepository` (14 testes) |
| [`docs/LEAD_EMAIL_DELIVERY_IMPLEMENTATION.md`](file:///d:/sicons/ADT/docs/LEAD_EMAIL_DELIVERY_IMPLEMENTATION.md) | Documentação técnica completa |
| [`supabase/manual/006_lead_email_delivery_state.sql`](file:///d:/sicons/ADT/supabase/manual/006_lead_email_delivery_state.sql) | Migration de colunas de estado durável e CHECK constraints (já executada) |

### Arquivos Modificados
| Arquivo | Mudança |
|---|---|
| [`server/api/send-lead.post.ts`](file:///d:/sicons/ADT/server/api/send-lead.post.ts) | Removida chamada à Edge Function quebrada. Integrado Nodemailer SMTP com estado durável em PostgreSQL |
| [`nuxt.config.ts`](file:///d:/sicons/ADT/nuxt.config.ts) | Adicionado `leadNotificationEmail` no `runtimeConfig` |
| [`package.json`](file:///d:/sicons/ADT/package.json) | `nodemailer` adicionado em `dependencies` |
| [`.env.example`](file:///d:/sicons/ADT/.env.example) | Documentação de variáveis SMTP e `LEAD_NOTIFICATION_EMAIL` |

---

## 2. Resultados dos Testes Automatizados Atuais (100% Isolados)

### Email Isolation Tests (`test-lead-email.mjs`)
```
======================================================================
--- TEST MATRIX: LEAD EMAIL DELIVERY ISOLATION (FASE LEAD EMAIL HARDENING) ---
======================================================================
TOTAL:   14
PASSED:  14
FAILED:  0
----------------------------------------------------------------------
REAL_EMAIL_SENT_DURING_TESTS:      NO (100% Mockado em memória)
PRODUCTION_DB_WRITES_DURING_TESTS: NO (100% Mockado em memória)
PRODUCTION_TEST_BYPASS:            NONE
EMAIL_DELIVERY_SEMANTICS:          SINGLE_ATTEMPT_WITH_DURABLE_FAILURE_STATE
======================================================================
```

### Admin V2 Tests (`test-admin-v2.mjs`)
```
======================================================================
--- TEST MATRIX DO PAINEL ADMIN V2 (FASE C.1.2.2 FINAL VERIFICATION) ---
======================================================================
TOTAL:   26
PASSED:  26
FAILED:  0
======================================================================
```

### Build (`npx nuxi build`)
```
✨ Build complete!
Σ Total size: 5.19 MB (1.21 MB gzip)
```

### Testes Legados
- `CAPTURE_TESTS`: `NOT_AVAILABLE_IN_CURRENT_REPOSITORY`
- `SEO_TESTS`: `NOT_AVAILABLE_IN_CURRENT_REPOSITORY`

---

## 3. LEAD_EMAIL_TEST_ISOLATION_REPORT

| Campo | Valor |
|---|---|
| **DOCUMENTATION_CONSISTENT** | YES |
| **REAL_EMAIL_SENT_DURING_CURRENT_TESTS** | NO (100% Mockado em memória) |
| **PRODUCTION_DB_WRITES_DURING_CURRENT_TESTS** | NO (100% Mockado em memória) |
| **OLD_TEST_ROWS_EXPECTED** | 10 (gerados historicamente na rodada inicial antes do isolamento) |
| **OLD_REAL_EMAILS_HISTORICALLY_SENT** | 8 (disparados historicamente na rodada inicial antes do isolamento) |
| **PRODUCTION_TEST_BYPASS** | NONE (nenhum `isTest`, `testMode`, `x-test-mode` ou mock no caminho de produção) |
| **PRODUCTION_USES_SHARED_CORE** | YES (`server/utils/emailService.ts` importa de `server/shared/leadEmailCore.mjs`) |
| **OLD_EDGE_FUNCTION_REFERENCE_ACTIVE** | NO (chamada à Edge Function removida) |
| **DATABASE_IDEMPOTENCY** | POSTGRES_UNIQUE_SUBMISSION_ID (`unq_leads_submission_id` no PostgreSQL) |
| **CONCURRENT_DUPLICATE_BEHAVIOR** | 1 INSERT bem-sucedido (criação + 1 envio SMTP); 2º colide em UNIQUE (retorna `idempotent: true` e 0 envios SMTP) |
| **EMAIL_TESTS** | 14/14 PASS |
| **ADMIN_V2_TESTS** | 26/26 PASS |
| **BUILD** | PASS (`npx nuxi build` exit 0, 5.19 MB) |
| **PRODUCTION_CHANGED** | NO |
| **DATABASE_CHANGED_DURING_THIS_REVIEW** | NO |
| **MANUAL_SUPABASE_ACTION_REQUIRED** | NO |
| **SUPABASE_MCP_WRITES** | 0 |

---

## 4. Auditoria dos Registros Anteriores no Supabase (Query Somente Leitura)

```sql
-- Contagem total dos registros de teste criados historicamente
SELECT
  COUNT(*) AS total_test_leads
FROM public.leads
WHERE origem = 'test-lead-email.mjs';

-- Detalhamento dos registros
SELECT
  id,
  created_at,
  nome,
  origem,
  submission_id,
  notification_email_status,
  notification_email_attempts
FROM public.leads
WHERE origem = 'test-lead-email.mjs'
ORDER BY created_at ASC;
```

---

## 5. Procedimento de Teste Manual Pós-Deploy

1. **Consulta inicial de leads:**
   ```sql
   SELECT COUNT(*) AS total_leads FROM public.leads;
   ```
2. **Envio via formulário:**
   Acessar `/orcamento` ou `/contato` e preencher:
   - Nome: `Teste Manual Email`
   - Telefone: `(11) 98358-6611`
   - Serviço: `Telas Mosquiteiras Removíveis`
3. **Confirmar redirecionamento para `/obrigado`.**
4. **Verificar registro no Supabase:**
   ```sql
   SELECT 
     id, created_at, nome, telefone, servico, submission_id,
     notification_email_status, notification_email_sent_at,
     notification_email_attempts, notification_email_last_error
   FROM public.leads 
   WHERE nome = 'Teste Manual Email' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
5. **Verificar caixa de entrada `vendas.adtelaseredes@gmail.com`:**
   Confirmar recebimento de exatamente 1 e-mail formatado com botão WhatsApp `https://wa.me/5511983586611`.
6. **Testar idempotência na página `/obrigado`:**
   Atualizar (F5) a página `/obrigado` ou acessá-la diretamente e confirmar que NENHUM segundo e-mail foi disparado.

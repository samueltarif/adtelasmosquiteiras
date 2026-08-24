# LEAD EMAIL DELIVERY — IMPLEMENTAÇÃO & TEST ISOLATION

**Projeto:** AD Telas e Redes (`https://www.adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-24  
**Fase:** Lead Email Delivery Hardening & Test Isolation  

---

## 1. Visão Geral e Fluxo Arquitetural

O envio de notificações de novos leads para a equipe comercial é executado exclusivamente via servidor Nitro/Node.js usando Nodemailer conectado ao SMTP do Gmail.

```
CLIENTE PREENCHE FORMULÁRIO (/orcamento, /contato, LeadForm)
         ↓
POST /api/send-lead
         ↓
VALIDAÇÃO (nome + cidade obrigatórios)
         ↓
INSERT public.leads (notification_email_status = 'pending')
         ↓
Lead NOVO?
├── NÃO (submission_id duplicado / conflito UNIQUE 23505)
│    → Resposta idempotente { success: true, idempotent: true, leadSaved: true }
│    → ZERO envios SMTP
│
└── SIM
     ↓
     UPDATE status = 'sending', attempts = 1, last_attempt_at = now()
     ↓
     ENVIO SMTP GMAIL (Nodemailer)
     ↓
     SUCESSO → status = 'sent', sent_at = now(), last_error = null
     FALHA   → status = 'failed', last_error = mensagem sanitizada
         ↓
RESPOSTA: { success: true, leadSaved: true, emailSent: boolean }
         ↓
NAVEGAÇÃO PARA /obrigado (0 chamadas SMTP disparadas pela página)
```

---

## 2. Garantias e Princípios de Resiliência

1. **Semântica Formal:** `SINGLE_ATTEMPT_WITH_DURABLE_FAILURE_STATE`  
   Cada lead submetido executa exatamente uma tentativa síncrona de envio SMTP. O resultado é persistido de forma durável no banco PostgreSQL (Supabase). Nenhum worker ou cron automático foi criado nesta fase.
2. **Fonte Autoritativa:** PostgreSQL (`public.leads`). Nenhum cache em memória (`Map`/`Set`/LRU) é usado como autoridade de estado ou idempotência.
3. **Lead Jamais é Perdido:** O salvamento no banco ocorre antes do SMTP. Se o provedor de e-mail falhar, o lead permanece 100% gravado no Supabase com `notification_email_status = 'failed'` e mensagem de erro sanitizada.
4. **Zero Vazamento de Secrets:** Senhas de app (16 caracteres), tokens, secrets e credenciais SMTP são filtrados por `sanitizeEmailError` antes de qualquer gravação no banco ou log.

---

## 3. Isolamento da Suíte de Testes (`test-lead-email.mjs`)

A suíte automatizada foi estruturada para rodar com **100% de isolamento**:

| Critério | Garantia de Isolamento |
|---|---|
| **E-mails Reais durante Testes** | `REAL_EMAIL_SENT_DURING_TESTS = NO` (Mock SMTP Transporter em memória) |
| **Escritas no Banco de Produção** | `PRODUCTION_DB_WRITES_DURING_TESTS = NO` (Mock PostgreSQL Repository em memória) |
| **Bypass no Endpoint de Produção** | `PRODUCTION_TEST_BYPASS = NONE` (Nenhum flag/header `isTest` ou `x-test-mode` no código de produção) |
| **Implementação Real Testada** | `server/shared/leadEmailCore.mjs` testado diretamente (não há reimplementações) |

---

## 4. Estado Durável no Banco de Dados (`public.leads`)

| Coluna | Tipo | Constraint / Default | Descrição |
|---|---|---|---|
| `notification_email_status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'pending'` + `CHECK ('pending', 'sending', 'sent', 'failed')` | Estado do ciclo de vida |
| `notification_email_sent_at` | `TIMESTAMPTZ` | `NULL` | Timestamp de aceite pelo SMTP |
| `notification_email_attempts` | `INT` | `NOT NULL DEFAULT 0` + `CHECK (>= 0)` | Tentativas executadas |
| `notification_email_last_attempt_at` | `TIMESTAMPTZ` | `NULL` | Timestamp da última tentativa |
| `notification_email_last_error` | `TEXT` | `NULL` | Mensagem de erro sanitizada |

Migration: [`supabase/manual/006_lead_email_delivery_state.sql`](file:///d:/sicons/ADT/supabase/manual/006_lead_email_delivery_state.sql) (executada manualmente).

---

## 5. Auditoria de Registros dos Testes Anteriores

Durante a execução anterior contra o servidor local de desenvolvimento, foram criados exatamente 10 registros de teste tagados com `origem = 'test-lead-email.mjs'`.

### Query SQL Somente Leitura para Conferência:
```sql
SELECT 
  id, 
  created_at, 
  nome, 
  telefone, 
  servico, 
  origem, 
  submission_id,
  notification_email_status, 
  notification_email_sent_at,
  notification_email_attempts, 
  notification_email_last_error
FROM public.leads
WHERE origem = 'test-lead-email.mjs'
ORDER BY created_at DESC;
```

---

## 6. Procedimento de Teste Manual Pós-Deploy em Produção

Após o deploy aprovado pelo operador:

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
   *Esperado: `notification_email_status = 'sent'`, `attempts = 1`, `sent_at IS NOT NULL`, `last_error IS NULL`.*
5. **Verificar caixa de entrada `vendas.adtelaseredes@gmail.com`:**
   *Confirmar recebimento de exatamente 1 e-mail formatado com botão WhatsApp `https://wa.me/5511983586611`.*
6. **Testar idempotência na página `/obrigado`:**
   *Atualizar (F5) a página `/obrigado` ou acessá-la diretamente e confirmar que NENHUM segundo e-mail foi disparado.*

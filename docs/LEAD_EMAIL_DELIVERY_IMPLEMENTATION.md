# LEAD EMAIL DELIVERY & PHOTO ATTACHMENTS — IMPLEMENTAÇÃO

**Projeto:** AD Telas e Redes (`https://www.adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-24  
**Fase:** Lead Form Enrichment + Photo Attachments + Branded Email  

---

## 1. Visão Geral da Arquitetura

O sistema de captura de leads foi enriquecido com novos campos comerciais (`email`, `mensagem`, `fotos`), templates corporativos de e-mail sem emojis com logotipo inline via CID, e envio de fotos como anexos reais no Nodemailer.

```
CLIENTE PREENCHE FORMULÁRIO (/orcamento, /contato, LeadForm)
[Nome, Telefone, Email (opc), Cidade, Bairro, Serviço, Mensagem (opc), Fotos (opc)]
         ↓
COMPRESSÃO CLIENT-SIDE (HTML5 Canvas ➔ JPEG max 1280px, q=0.8, ~200-300KB cada)
         ↓
POST /api/send-lead (JSON payload com fotos Base64)
         ↓
VALIDAÇÃO SERVER-SIDE
├── Nome e Cidade obrigatórios
├── Formato de Email (se fornecido)
└── Validação de Fotos (MIME, Magic Bytes, Max 4 fotos, Max 1.5MB cada, Max 4MB total)
         ↓
INSERT public.leads (dados do lead, status = 'pending')
         ↓
Lead NOVO?
├── NÃO (submission_id duplicado) ➔ Resposta idempotente, ZERO e-mails
└── SIM
     ↓
     UPDATE status = 'sending', attempts = 1
     ↓
     MONTAGEM DOS ANEXOS NODEMAILER
     ├── 1x adtelas-icon.png (CID 'adtelas-icon' inline no cabeçalho)
     └── 1 a 4x fotos reais (foto-local-1.jpg, foto-local-2.png, etc.)
     ↓
     ENVIO SMTP GMAIL
     ↓
     SUCESSO ➔ status = 'sent', sent_at = now()
     FALHA   ➔ status = 'failed', last_error = erro sanitizado
         ↓
RESPOSTA: { success: true, leadSaved: true, emailSent: boolean, photoCount: number }
         ↓
NAVEGAÇÃO PARA /obrigado (0 chamadas SMTP disparadas pela página)
```

---

## 2. Decisões Arquiteturais

### 2.1. PHOTO_UPLOAD_ARCHITECTURE
- **Estratégia:** Compressão client-side em HTML5 Canvas + Anexos efêmeros no Nodemailer.
- **Por que é seguro para a Vercel:** O limite de payload de Serverless Functions na Vercel é de **4.5 MB**. Fotos brutas de smartphones modernos (4MB a 10MB cada) causariam erro HTTP 413 Payload Too Large. Com a compressão client-side para JPEG a 1280px e qualidade 0.8, cada foto é reduzida para ~150-300 KB. Um lote máximo de 4 fotos resulta em ~800KB a 1.2MB em Base64, trafegando com total folga e segurança.
- **Armazenamento:** `PHOTO_STORAGE_METHOD = DIRECT_EMAIL_ATTACHMENTS`. As fotos são processadas em memória e entregues como anexos no Gmail da equipe de vendas. Não há necessidade de colunas binárias no banco ou de storage externo persistente, mantendo `MANUAL_SUPABASE_ACTION_REQUIRED = NO`.

### 2.2. Parâmetros de Fotos
| Parâmetro | Valor |
|---|---|
| `PHOTO_MAX_COUNT` | 4 fotos |
| `PHOTO_MAX_SIZE_EACH` | 1.5 MB (após compressão) |
| `PHOTO_MAX_TOTAL_SIZE` | 4.0 MB |
| `PHOTO_COMPRESSION` | HTML5 Canvas (max 1280px, quality 0.8, JPEG) |
| `ALLOWED_MIME_TYPES` | `image/jpeg`, `image/png`, `image/webp` |
| `SERVER_FILE_VALIDATION` | MIME type + Magic Bytes + Tamanho + Quantidade + Nome seguro |

### 2.3. Identidade Visual e Branding do E-mail
- **Remoção de Emojis:** Todos os emojis informais (🔔, 📋, 📊, 💬) foram removidos tanto do HTML quanto do texto plano.
- **Branding Inline CID:** O ícone oficial da marca (`public/images/logo_adt_telas_nova.png` / `public/favicon.ico`) é anexado com `cid: 'adtelas-icon'` e embutido no cabeçalho corporativo azul do e-mail.
- **Botão WhatsApp:** Botão verde corporativo com texto `RESPONDER VIA WHATSAPP` sem emojis textuais.

---

## 3. Matriz de Testes Automatizados Isolados (`test-lead-email.mjs`)

```
======================================================================
--- TEST MATRIX: LEAD EMAIL ENRICHMENT & PHOTO ATTACHMENTS ---
======================================================================
TOTAL:   21
PASSED:  21
FAILED:  0
----------------------------------------------------------------------
REAL_EMAIL_SENT_DURING_TESTS:      NO (100% Mockado em memória)
PRODUCTION_DB_WRITES_DURING_TESTS: NO (100% Mockado em memória)
PRODUCTION_R2_WRITES_DURING_TESTS: NO (100% Mockado em memória)
PRODUCTION_TEST_BYPASS:            NONE
EMAIL_DELIVERY_SEMANTICS:          SINGLE_ATTEMPT_WITH_DURABLE_FAILURE_STATE
======================================================================
```

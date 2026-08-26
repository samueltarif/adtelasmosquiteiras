# 10 — MATRIZ DE REAPROVEITAMENTO, GAPS E ANÁLISE DE RISCOS

**Status:** CONFIRMADO  
**Data da Auditoria:** 26 de Agosto de 2026  
**Escopo:** Matriz consolidada de inventário, nível de reuso, lacunas técnicas, fatores de risco e recomendações para o novo CRM.

---

## 1. Matriz Consolidada de Recursos e Gaps

| Área / Módulo | Já existe no Projeto? | É Reutilizável? | Gap Identificado | Fator de Risco | Recomendação Técnica |
|---|---|---|---|---|---|
| **Leads** | **SIM** (`public.leads`) | **100%** | Falta flag/FK indicando conversão em cliente | Sobrescrever lead original | Manter lead intacto e vincular FK `lead_id` no novo cliente |
| **Clientes** | **NÃO** | - | Inexistência de tabela e rotas de clientes | Cadastros duplicados | Criar `public.clients` com suporte a manual e conversão |
| **Endereços / Imóveis** | **NÃO** | - | Inexistência de relação 1:N com cliente | Cliente ter múltiplos locais de atendimento | Criar `public.client_addresses` vinculado a `client_id` |
| **Ordens de Serviço (OS)** | **NÃO** | - | Inexistência de tabela de serviços operacionais | Acoplar serviço diretamente ao cliente | Criar `public.work_orders` com status operacional e valores |
| **Medidas / Vãos** | **NÃO** | - | Inexistência de estrutura de medidas | Falta de precisão técnica para produção | Criar `public.work_order_measurements` com L x A e ambiente |
| **Agenda / Visitas** | **NÃO** | - | Inexistência de agenda de visitas e instalações | Conflito de horários e atrasos | Criar `public.appointments` com data/hora e responsável |
| **Calendário Visual** | **NÃO** | - | Inexistência de componente de calendário | Dificuldade de visualização mensal/semanal | Integrar shadcn Calendar / DatePicker em `/admin/agenda` |
| **Garantias** | **NÃO** | - | Inexistência de controle de prazos de garantia | Perda de prazos e reclamações | Criar `public.warranties` vinculada à OS com início e término |
| **Notificações** | **PARCIAL** (Logs de Lead) | **50%** | Falta motor de regras configuráveis | Envio duplicado / Spam | Criar `notification_rules` + `notification_deliveries` (Idempotência) |
| **Cron Scheduler** | **NÃO** (Apenas tick manual) | **10%** | Falta daemon de execução contínua | Falha silenciosa de disparo diário | Configurar Vercel Cron ou pg_cron com token secreto |
| **SMTP / E-mail** | **SIM** (Nodemailer) | **95%** | Faltam novos templates HTML de CRM | Timeout do Gmail em lote | Reutilizar `emailService.ts` com novos geradores de templates |
| **Mídia Privada (R2)** | **SIM** (Leads R2) | **90%** | Falta vincular mídias a Ordens de Serviço | Exposição pública indevida | Reutilizar `adtelas-leads-private` e `generatePresignedDownloadUrl` |
| **Mídia Pública (R2)** | **SIM** (Site R2) | **100%** | Já implementada na Galeria do site | Publicação acidental de fotos de OS | Exigir ação explícita e cópia física para `adtelas-site-media` |
| **Admin Auth / RBAC** | **SIM** (`admin_users`) | **100%** | Papéis existentes suficientes (`admin`, `superadmin`)| Acesso indevido de operadores | Reutilizar `requireActiveAdmin` em todas as rotas do CRM |
| **Row Level Security** | **SIM** | **100%** | Faltam políticas para as novas tabelas | Falha de isolamento | `REVOKE ALL FROM anon, authenticated; GRANT TO service_role` |
| **Timeline 360°** | **PARCIAL** (Timeline Lead) | **60%** | Faltam eventos de visita, OS e garantia | Lentidão em agregações complexas | Gerador híbrido agregando Lead + OS + Agenda + Garantia |
| **Pós-Venda** | **NÃO** | - | Inexistência de status pós-conclusão | Esquecimento de fidelização | Integrar régua de contato após conclusão da OS |
| **Controle Financeiro** | **PARCIAL** (Valor no Lead) | **30%** | Falta discriminação de pagamento/status | Inconsistência de faturamento | Adicionar campos `valor_total`, `valor_pago`, `status_pagamento` na OS |
| **Analytics / Atribuição** | **SIM** (First/Last Touch) | **100%** | Falta conectar com receita da OS | Disparar tags de Ads indevidamente | Congelar atribuição no Lead e vincular receita via OS |
| **Responsividade Admin** | **SIM** (Layout base) | **85%** | Faltam formulários e tabelas densas mobile | Quebra em 320px–375px | Exigir touch targets `>= 44px` e visualização em cards no celular |

---

## 2. Principais Riscos e Diretrizes de Mitigação

1. **Risco de Vazamento de Dados Pessoais (LGPD):**
   - *Mitigação:* RLS ativada com acesso restrito a `service_role`; URLs assinadas de fotos privadas com TTL de 300 segundos; zero envio de PII para ferramentas de analytics.
2. **Risco de Disparos Múltiplos de E-mails (Spam Operacional):**
   - *Mitigação:* Tabela de controle `notification_deliveries` com chave única de idempotência baseada na regra, entidade, e-mail e data da janela de execução.
3. **Risco de Inconsistência de Fuso Horário:**
   - *Mitigação:* Todos os timestamps gravados em `TIMESTAMPTZ` (UTC no banco) e calculados no fuso `America/Sao_Paulo` (UTC-3) antes de gerar resumos diários das 09:00.
4. **Risco de Duplicação de Clientes:**
   - *Mitigação:* Busca inteligente por Telefone e E-mail sanitizados antes de permitir novo cadastro manual, alertando o operador sobre registros pré-existentes.

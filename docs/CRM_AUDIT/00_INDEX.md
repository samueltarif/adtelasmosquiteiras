# 00 — ÍNDICE MESTRE E MAPA DA AUDITORIA DO CRM

> [!IMPORTANT]
> **AUDITORIA CONCLUÍDA E MODELAGEM DEFINITIVA EM FASE 1.1:**
> A auditoria deste diretório fundamentou a modelagem técnica definitiva do CRM, documentada e aprovada na Fase 1.1 em: [docs/CRM_DATA_MODEL/00_INDEX.md](../CRM_DATA_MODEL/00_INDEX.md).

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Fase:** Fase 1 — Auditoria Completa, Mapeamento Arquitetural e Requisitos do CRM  
**Status da Auditoria:** `COMPLETE`  
**Data da Auditoria:** 26 de Agosto de 2026  
**Ambiente:** Nuxt 4.2.2 SSR \| Supabase PostgreSQL \| Cloudflare R2 \| Nodemailer (Gmail SMTP)  
**Permissões de Execução:** READ-ONLY (Zero SQL executado, Zero alterações de código/infra)

---

## 1. Objetivo da Auditoria

Esta auditoria documental e arquitetural foi realizada para mapear com precisão cirúrgica todo o ecossistema existente da AD Telas e Redes e fundamentar o planejamento do futuro **Módulo Operacional de CRM** (Clientes, Endereços/Imóveis, Ordens de Serviço, Medições de Vãos, Mídias Privadas, Agenda, Visitas Técnicas, Garantias, Notificações e Pós-Venda).

---

## 2. Mapa dos Documentos da Auditoria

| # | Documento | Foco Principal | Status |
|---|---|---|---|
| 01 | [01_PROJECT_ARCHITECTURE.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/01_PROJECT_ARCHITECTURE.md) | Stack Nuxt 4, Nitro BFF, Supabase, R2 e dependências reais | **CONFIRMADO** |
| 02 | [02_DATABASE_CURRENT_STATE.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/02_DATABASE_CURRENT_STATE.md) | Schema real completo do Supabase (todas as tabelas e colunas) | **CONFIRMADO** |
| 03 | [03_LEADS_AND_CONVERSION.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/03_LEADS_AND_CONVERSION.md) | Ciclo de vida de leads e protocolo seguro Lead → Cliente → OS | **CONFIRMADO** |
| 04 | [04_ADMIN_AUTH_AND_SECURITY.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/04_ADMIN_AUTH_AND_SECURITY.md) | RBAC, cookies HTTP-only, CSRF guards, RLS e LGPD | **CONFIRMADO** |
| 05 | [05_EMAIL_SMTP.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/05_EMAIL_SMTP.md) | Nodemailer/Gmail, estado durável e novos templates de CRM | **CONFIRMADO** |
| 06 | [06_SCHEDULING_CRON_AND_TIMEZONE.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/06_SCHEDULING_CRON_AND_TIMEZONE.md) | Gap de cron, fuso `America/Sao_Paulo` e chave de idempotência | **AUDITADO** |
| 07 | [07_MEDIA_AND_R2.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/07_MEDIA_AND_R2.md) | R2 privado vs público, mídias de OS e regra de não-publicação | **CONFIRMADO** |
| 08 | [08_ADMIN_UI_AND_RESPONSIVENESS.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/08_ADMIN_UI_AND_RESPONSIVENESS.md) | Sistema de design radix-vue/shadcn, matriz 10 viewports | **CONFIRMADO** |
| 09 | [09_ANALYTICS_AND_ATTRIBUTION.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/09_ANALYTICS_AND_ATTRIBUTION.md) | Atribuição First/Last touch e blindagem contra tags de Ads | **CONFIRMADO** |
| 10 | [10_REUSE_GAPS_AND_RISKS.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/10_REUSE_GAPS_AND_RISKS.md) | Matriz consolidada de reuso, lacunas e fatores de risco | **CONFIRMADO** |
| 11 | [11_CRM_CONCEPTUAL_ARCHITECTURE.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/11_CRM_CONCEPTUAL_ARCHITECTURE.md) | Modelo conceitual ER, entidades, vãos, garantias e timeline | **PROPOSTA** |
| 12 | [12_PROPOSED_PHASES.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/12_PROPOSED_PHASES.md) | Roadmap detalhado de implementação (Fases 2 a 6) | **PROPOSTA** |
| 13 | [13_OPEN_DECISIONS.md](file:///d:/sicons/ADT/docs/CRM_AUDIT/13_OPEN_DECISIONS.md) | Decisões estratégicas de negócio para alinhamento humano | **PENDENTE** |

---

## 3. Principais Conclusões da Auditoria

1. **Aproveitamento Alto da Infraestrutura Existente (~80%):**
   - A autenticação administrativa (Supabase Auth + `public.admin_users` + Cookies HTTP-only) e o layout responsivo (`app/layouts/admin.vue`) estão prontos para acomodar as novas rotas.
   - O armazenamento privado no Cloudflare R2 (`adtelas-leads-private`) com emissão de URLs assinadas temporárias (TTL 300s) serve perfeitamente para as fotos técnicas de Ordens de Serviço.
   - O serviço de e-mail (Nodemailer com Gmail SMTP) possui estado durável no banco e permite novos templates imediatos.
2. **Preservação Absoluta do Lead e do Marketing:**
   - O Lead **nunca será apagado** na conversão em Cliente. Todas as métricas de Google Ads, GCLID, UTMs e First Touch permanecem congeladas e associadas ao lead original.
   - Nenhuma ação interna no CRM disparará conversões comerciais públicas de Google Ads ou GTM.
3. **Gaps Críticos Mapeados:**
   - **Banco de Dados:** Inexistência atual de tabelas para Clientes, Endereços, Ordens de Serviço, Medições de Vãos, Agenda, Garantias e Entregas de Notificação.
   - **Agendador / Cron:** Não há motor de cron contínuo rodando em produção (apenas o endpoint de tick manual). Recomendada a integração com Vercel Cron.
   - **Fuso Horário:** Necessidade estrita de conversão e cálculo no fuso `America/Sao_Paulo` (UTC-3) para os disparos das 09:00.

---

## 4. Como uma Nova IA Deve Estudar Este Projeto

Para que qualquer agente de IA ou desenvolvedor compreenda rapidamente a arquitetura antes de iniciar a modelagem de dados e código, siga a seguinte **ordem de leitura recomendada**:

```
Passo 1: Entender a fundação tecnológica ──► [01_PROJECT_ARCHITECTURE.md]
Passo 2: Conhecer o banco de dados real ──► [02_DATABASE_CURRENT_STATE.md]
Passo 3: Mapear o fluxo do Lead atual ──► [03_LEADS_AND_CONVERSION.md]
Passo 4: Compreender autenticação e RLS ──► [04_ADMIN_AUTH_AND_SECURITY.md]
Passo 5: Avaliar mídias e R2 privado ──► [07_MEDIA_AND_R2.md]
Passo 6: Analisar a matriz de gaps e riscos ──► [10_REUSE_GAPS_AND_RISKS.md]
Passo 7: Estudar o modelo conceitual do CRM ──► [11_CRM_CONCEPTUAL_ARCHITECTURE.md]
Passo 8: Consultar o roadmap das fases ──► [12_PROPOSED_PHASES.md]
Passo 9: Verificar decisões humanas pendentes ──► [13_OPEN_DECISIONS.md]
```

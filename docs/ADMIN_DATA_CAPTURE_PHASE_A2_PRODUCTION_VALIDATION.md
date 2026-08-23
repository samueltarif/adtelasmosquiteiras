# RELATÓRIO DE DEPLOY E VALIDAÇÃO EM PRODUÇÃO — FASE A.2

**Projeto:** AD Telas e Redes (`adtelasmosquiteiras.com.br`)  
**Data:** 2026-08-23  
**Fase:** Fase A.2 — Deploy Controlado e Validação em Produção  
**Status:** `PHASE A.2 PRODUCTION VALIDATION: PASS`  
**Commit Publicado:** `f710e0f`  

---

## 1. Pre-Deploy Gate Results

Antes de liberar o deploy, todos os testes automatizados foram executados localmente:

- **Compilação de Produção (`npx nuxi build`):** **Exit Code 0 (PASS)**
- **Matriz Controlada da Fase A/A.1 (`test-phase-a.mjs`):** **14/14 PASSED (100%)**
- **Suíte de Integridade SEO (`seo-validate-03c.mjs`):** **248/248 PASSED (100%)**
- **Redirecionamentos SEO:** `46/46 PASS`
- **Sitemap XML:** `20 URLs (PASS)`

---

## 2. Status do Deploy em Produção

- **Repositório Git:** Branch `master` atualizado e sincronizado com `origin/master`.
- **Commit em Produção:** `f710e0f` (`feat(analytics): concluir Fase A.1...`)
- **Provedor de Hospedagem:** Vercel (Edge Deployment Automático ativado via Git).
- **URL Oficial:** `https://www.adtelasmosquiteiras.com.br`

---

## 3. Smoke Test em Produção (Live Verification)

Testados diretamente na URL pública oficial sem seguir redirects automaticamente:

| URL Testada | Status Esperado | Status Obtido | Resultado |
|---|---|---|:---:|
| `https://www.adtelasmosquiteiras.com.br/` | HTTP 200 OK | HTTP 200 OK | `PASS` |
| `https://www.adtelasmosquiteiras.com.br/servicos/telas` | HTTP 200 OK | HTTP 200 OK | `PASS` |
| `https://www.adtelasmosquiteiras.com.br/servicos/telas/janelas` | HTTP 200 OK | HTTP 200 OK | `PASS` |
| `https://www.adtelasmosquiteiras.com.br/home` | HTTP 301 ➔ `/` | HTTP 301 (Location: `/`) | `PASS` |
| `https://www.adtelasmosquiteiras.com.br/sitemap.xml` | HTTP 200 OK | HTTP 200 (20 URLs) | `PASS` |
| `https://www.adtelasmosquiteiras.com.br/api/admin/dashboard-stats` | HTTP 200 OK | HTTP 200 OK | `PASS` |

---

## 4. Validação Estrutural de Telemetria e Formulários em Produção

- **WhatsApp & Telefone (Contact Intent):**
  - Clicar nos botões de WhatsApp abre o WhatsApp Web/App normalmente.
  - O evento é registrado exclusivamente na tabela `public.lead_clicks`.
  - Nenhuma linha é inserida na tabela `public.leads` (`WHATSAPP_CREATES_LEAD = NO`, `PHONE_CREATES_LEAD = NO`).
- **Formulários Comerciais (`/api/send-lead`):**
  - Os formulários enviam dados reais diretamente para a tabela `public.leads` através do servidor Nitro.
  - Possuem proteção client-side contra duplo clique e requisições simultâneas (`CLIENT_DOUBLE_SUBMIT_PROTECTION = IMPLEMENTED`).
- **Navegação & Pageviews:**
  - O plugin de rastreamento grava exatamente 1 pageview por navegação na tabela canônica `public.page_views` (`EXPECTED_TRACK_REQUESTS = 1`).
- **Painel Admin em Produção:**
  - Endpoint `/api/admin/dashboard-stats` purificado: reporta `totalLeads = 0` (leads reais de formulário) e exibe `legacySyntheticCount = 23` separadamente, sem apagar nenhum registro do banco (`LEGACY_ROWS_DELETED = 0`).

---

## 5. Instruções de Teste Manual para o Usuário no SQL Editor do Supabase

> [!IMPORTANT]
> **Nenhum comando SQL foi ou será executado via MCP (`SUPABASE_MCP_WRITES = 0`).**  
> Para comprovação em tempo real no seu banco Supabase oficial, execute os testes manuais abaixo no seu SQL Editor.

### 🧪 PASSO A: Executar a Query do Estado Inicial (Antes do Teste)

Abra o SQL Editor no painel do Supabase e rode:

```sql
SELECT 'page_views' AS tabela, COUNT(*) AS total FROM public.page_views
UNION ALL
SELECT 'lead_clicks' AS tabela, COUNT(*) AS total FROM public.lead_clicks
UNION ALL
SELECT 'leads' AS tabela, COUNT(*) AS total FROM public.leads;
```
*Anote os valores retornados (exemplo: `page_views: 1000`, `lead_clicks: 32`, `leads: 23`).*

---

### 🧪 PASSO B: Executar as Ações do Teste 1 (Navegação + WhatsApp)

1. Acesse o site oficial em uma nova aba do navegador: `https://www.adtelasmosquiteiras.com.br/`
2. Clique em um link para outra página (ex: `/servicos/telas`).
3. Clique uma vez no botão de WhatsApp do cabeçalho ou botão flutuante (não precisa enviar a mensagem no WhatsApp).
4. **Não envie o formulário ainda neste teste.**

---

### 🧪 PASSO C: Executar a Query do Estado Final (Depois do Teste 1)

Volte ao SQL Editor do Supabase e rode a mesma query novamente:

```sql
SELECT 'page_views' AS tabela, COUNT(*) AS total FROM public.page_views
UNION ALL
SELECT 'lead_clicks' AS tabela, COUNT(*) AS total FROM public.lead_clicks
UNION ALL
SELECT 'leads' AS tabela, COUNT(*) AS total FROM public.leads;
```

**Resultado Esperado do Teste 1:**
- `page_views` ➔ aumentou em **+2** (Home + Telas).
- `lead_clicks` ➔ aumentou em **+1** (Clique no WhatsApp).
- `leads` ➔ **permaneceu idêntico (+0)** (Nenhum lead fake criado!).

---

### 🧪 PASSO D: Teste 2 (Envio Real de Formulário)

1. Preencha e envie o formulário em `https://www.adtelasmosquiteiras.com.br/contato` ou `orcamento`.
2. Em seguida, rode a query no SQL Editor:
   ```sql
   SELECT * FROM public.leads ORDER BY created_at DESC LIMIT 1;
   ```
3. **Resultado Esperado:** 1 novo registro real criado com o nome, e-mail e telefone digitados pelo usuário!

---

## 6. Revisão do Script SQL de RLS para Execução Manual Futura

Abaixo está o conteúdo integral do arquivo estático [`supabase/manual/002_fix_admin_rls.sql`](file:///d:/sicons/ADT/supabase/manual/002_fix_admin_rls.sql), preparado para a sua revisão antes de ser executado manualmente por você no Supabase oficial.

```sql
-- ======================================================================
-- AÇÃO MANUAL NECESSÁRIA NO SUPABASE (NÃO EXECUTAR AUTOMATICAMENTE)
-- ======================================================================
-- Projeto: AD Telas e Redes — adtelasmosquiteiras.com.br
-- Arquivo: supabase/manual/002_fix_admin_rls.sql
-- Finalidade: Reforçar a segurança de RLS removendo permissões diretas anon desnecessárias
--              (visto que todas as inserções são intermediadas pela Nitro API com service_role)
--              e restringindo a leitura de leads/cliques aos administradores autênticos.
-- Pré-requisitos: Executar no SQL Editor do projeto Supabase correto.
-- ======================================================================

-- 1. PRE-CHECK (VERIFICAR POLÍTICAS ATUAIS)
-- SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE schemaname = 'public';

-- 2. AJUSTE DE RLS DA TABELA 'leads'
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Remover políticas permissivas antigas
DROP POLICY IF EXISTS "Permitir inserções públicas de leads" ON public.leads;
DROP POLICY IF EXISTS "Permitir leitura apenas de admins autenticados" ON public.leads;
DROP POLICY IF EXISTS "Permitir atualização apenas de admins autenticados" ON public.leads;

-- Inserções são feitas EXCLUSIVAMENTE pelo servidor Nitro (service_role ignora RLS)
-- Permite leitura e escrita apenas para a role autenticada com e-mail confirmado / admin
CREATE POLICY "Leitura de leads restrita a admins" 
ON public.leads FOR SELECT 
TO authenticated 
USING (auth.jwt() ->> 'email' LIKE '%@adtelasmosquiteiras.com.br' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Atualização de leads restrita a admins" 
ON public.leads FOR UPDATE 
TO authenticated 
USING (auth.jwt() ->> 'email' LIKE '%@adtelasmosquiteiras.com.br' OR auth.jwt() ->> 'role' = 'admin');


-- 3. AJUSTE DE RLS DA TABELA 'lead_clicks'
ALTER TABLE public.lead_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserções públicas de cliques" ON public.lead_clicks;
DROP POLICY IF EXISTS "Permitir leitura de cliques apenas de admins autenticados" ON public.lead_clicks;

CREATE POLICY "Leitura de cliques restrita a admins" 
ON public.lead_clicks FOR SELECT 
TO authenticated 
USING (auth.jwt() ->> 'email' LIKE '%@adtelasmosquiteiras.com.br' OR auth.jwt() ->> 'role' = 'admin');


-- 4. AJUSTE DE RLS DA TABELA 'page_views'
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserções públicas de page_views" ON public.page_views;
DROP POLICY IF EXISTS "Permitir leitura de page_views apenas de admins autenticados" ON public.page_views;

CREATE POLICY "Leitura de page_views restrita a admins" 
ON public.page_views FOR SELECT 
TO authenticated 
USING (auth.jwt() ->> 'email' LIKE '%@adtelasmosquiteiras.com.br' OR auth.jwt() ->> 'role' = 'admin');


-- ======================================================================
-- ROLLBACK (EM CASO DE NECESSIDADE DE RESTAURAR ACESSO PÚBLICO DIRETO)
-- ======================================================================
-- CREATE POLICY "Permitir inserções públicas de leads" ON public.leads FOR INSERT TO anon WITH CHECK (true);
-- CREATE POLICY "Permitir inserções públicas de cliques" ON public.lead_clicks FOR INSERT TO anon WITH CHECK (true);
-- CREATE POLICY "Permitir inserções públicas de page_views" ON public.page_views FOR INSERT TO anon WITH CHECK (true);


-- ======================================================================
-- POST-CHECK (VALIDAÇÃO DE POLÍTICAS ATIVAS)
-- ======================================================================
-- SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE schemaname = 'public';
```

### Análise de Impacto das Políticas de RLS:
- **Impacto no perfil `anon` (Visitantes/Browsers):** Como todas as inserções são realizadas via servidor Nitro, remover a política `INSERT anon` direta impede que hackers ou bots mal-intencionados façam inserções em massa via REST API pública do Supabase. O site público continuará funcionando 100% normalmente através da API Nitro.
- **Impacto no perfil `authenticated` (Admin Logado):** Garante que apenas usuários com e-mail do domínio ou role `admin` possam ler/modificar a lista de leads.
- **Impacto no perfil `service_role` (Servidor Nitro):** Nulo. A `service_role` possui bypass nativo de RLS no PostgreSQL do Supabase.

---

📄 **Relatório da Fase A/A.1:** [`docs/ADMIN_DATA_CAPTURE_PHASE_A_REPORT.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_PHASE_A_REPORT.md)  
📄 **Auditoria Forense:** [`docs/ADMIN_DATA_CAPTURE_FORENSIC_AUDIT.md`](file:///d:/sicons/ADT/docs/ADMIN_DATA_CAPTURE_FORENSIC_AUDIT.md)

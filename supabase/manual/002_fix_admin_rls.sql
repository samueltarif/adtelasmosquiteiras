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

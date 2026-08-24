-- ======================================================================
-- AÇÃO MANUAL NECESSÁRIA NO SUPABASE (NÃO EXECUTAR AUTOMATICAMENTE VIA MCP)
-- ======================================================================
-- Projeto: AD Telas e Redes — https://www.adtelasmosquiteiras.com.br
-- Arquivo: supabase/manual/005_reset_admin_analytics_data.sql
-- Fase: C.1.4 — Reset Controlado dos Dados do Painel Admin
-- Finalidade: ZERAR exclusivamente os dados e linhas das tabelas de Analytics e Leads.
--
-- REGRAS E SEGURANÇA:
-- 1. EXCLUI APENAS LINHAS DE DADOS (DELETE FROM).
-- 2. PRESERVA 100% DAS TABELAS, COLUNAS, TIPOS, CONSTRAINTS, CHAVES PRIMÁRIAS,
--    ÍNDICES, UNIQUE CONSTRAINTS, RLS POLICIES E TRIGGERS.
-- 3. PROIBIDO: DROP TABLE, DROP COLUMN, ALTER TABLE, TRUNCATE ... CASCADE, DDL.
-- 4. NÃO AFETA: auth.users, storage, infraestrutura ou conteúdo do site.
-- 5. ATENÇÃO: Esta operação é definitiva após o COMMIT. Execute este script
--    manualmente no SQL Editor do Supabase oficial (projeto AD Telas e Redes).
-- ======================================================================

-- ======================================================================
-- 1. PRE-CHECK — LEITURA E CONTAGEM ATUAL ANTES DO RESET
-- ======================================================================
-- Esta etapa apenas consulta o banco para conferir o volume antes da limpeza.
SELECT 
    'public.page_views' AS tabela, 
    COUNT(*) AS total_registros 
FROM public.page_views
UNION ALL
SELECT 
    'public.lead_clicks' AS tabela, 
    COUNT(*) AS total_registros 
FROM public.lead_clicks
UNION ALL
SELECT 
    'public.leads' AS tabela, 
    COUNT(*) AS total_registros 
FROM public.leads
UNION ALL
SELECT 
    'public.cron_ticks (infra / preservada)' AS tabela, 
    COUNT(*) AS total_registros 
FROM public.cron_ticks;


-- ======================================================================
-- 2. TRANSAÇÃO DE EXCLUSÃO CONTROLADA (DELETE SOMENTE DADOS)
-- ======================================================================
-- Se ocorrer qualquer erro antes do COMMIT, a transação sofrerá ROLLBACK
-- e nenhum dado será perdido.
BEGIN;

-- A. Excluir cliques de contato e eventos de intenção (lead_clicks)
DELETE FROM public.lead_clicks;

-- B. Excluir visualizações de páginas e sessões (page_views)
DELETE FROM public.page_views;

-- C. Excluir registros de leads comerciais e históricos técnicos (leads)
DELETE FROM public.leads;

-- Confirmação da exclusão na transação
COMMIT;


-- ======================================================================
-- 3. POST-CHECK — VERIFICAÇÃO DE ZERAMENTO COMPLETO
-- ======================================================================
-- Todas as contagens de analytics/leads devem retornar exatamente 0.
SELECT 
    'public.page_views' AS tabela, 
    COUNT(*) AS total_registros,
    CASE WHEN COUNT(*) = 0 THEN 'PASS (ZERADO)' ELSE 'FAIL' END AS status
FROM public.page_views
UNION ALL
SELECT 
    'public.lead_clicks' AS tabela, 
    COUNT(*) AS total_registros,
    CASE WHEN COUNT(*) = 0 THEN 'PASS (ZERADO)' ELSE 'FAIL' END AS status
FROM public.lead_clicks
UNION ALL
SELECT 
    'public.leads' AS tabela, 
    COUNT(*) AS total_registros,
    CASE WHEN COUNT(*) = 0 THEN 'PASS (ZERADO)' ELSE 'FAIL' END AS status
FROM public.leads;


-- ======================================================================
-- 4. VERIFICAÇÃO DE INTEGRIDADE ESTRUTURAL (SCHEMA & ÍNDICES INTACTOS)
-- ======================================================================
-- Prova que a estrutura de tabelas, colunas e índices continua 100% íntegra.

-- A. Conferência de colunas existentes por tabela
SELECT 
    table_name, 
    COUNT(*) AS total_colunas_preservadas
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('page_views', 'lead_clicks', 'leads', 'cron_ticks')
GROUP BY table_name
ORDER BY table_name;

-- B. Conferência dos índices e constraints preservados
SELECT 
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('page_views', 'lead_clicks', 'leads')
ORDER BY tablename, indexname;

-- C. Conferência de Row Level Security (RLS) ativo
SELECT 
    tablename, 
    rowsecurity AS rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('page_views', 'lead_clicks', 'leads', 'cron_ticks');

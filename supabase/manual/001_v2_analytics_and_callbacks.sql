-- ======================================================================
-- AÇÃO MANUAL NECESSÁRIA NO SUPABASE (NÃO EXECUTAR AUTOMATICAMENTE)
-- ======================================================================
-- Projeto: AD Telas e Redes — adtelasmosquiteiras.com.br
-- Arquivo: supabase/manual/001_v2_analytics_and_callbacks.sql
-- Finalidade: Estruturar tabelas para o Painel Admin V2, callbacks e atribuição.
-- Pré-requisitos: Projeto Supabase correto no SQL Editor.
-- Ordem de Execução: 1, 2, 3, 4, 5.
-- Riscos: Baixo (criação de novas tabelas e adição de colunas).
-- Rollback: DROP TABLE IF EXISTS public.callback_requests, public.page_views;
-- ======================================================================

-- 1. Tabela de Solicitações de Callback ("Prefiro que me chamem")
CREATE TABLE IF NOT EXISTS public.callback_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    nome VARCHAR(255),
    servico VARCHAR(100),
    origem_path TEXT,
    cta_location VARCHAR(100),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    referrer TEXT,
    session_id VARCHAR(100),
    visitor_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pendente', -- 'Pendente', 'Em Atendimento', 'Concluído', 'Cancelado'
    notification_status VARCHAR(50) DEFAULT 'Pendente' -- 'Enviado', 'Falha', 'Pendente'
);

CREATE INDEX IF NOT EXISTS idx_callbacks_created_at ON public.callback_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_callbacks_status ON public.callback_requests(status);

ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir inserções públicas de callback" 
ON public.callback_requests FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Permitir leitura de callback apenas por admins" 
ON public.callback_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir atualização de callback apenas por admins" 
ON public.callback_requests FOR UPDATE TO authenticated USING (true);


-- 2. Garantir Tabela Unificada de Page Views com Atribuição (page_views)
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    path VARCHAR(255) NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    device_type VARCHAR(20) DEFAULT 'desktop',
    ip_hash VARCHAR(64),
    session_id VARCHAR(100),
    visitor_id VARCHAR(100),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON public.page_views(session_id);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir inserção pública de page_views" 
ON public.page_views FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Permitir leitura de page_views por admins" 
ON public.page_views FOR SELECT TO authenticated USING (true);


-- 3. Adicionar Colunas de Atribuição UTM na Tabela 'leads'
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_content VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_term VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT FALSE;


-- 4. Adicionar Colunas de Atribuição na Tabela 'lead_clicks'
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE public.lead_clicks ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);


-- 5. Queries de Validação Pós-Execução (Somente Leitura)
-- SELECT COUNT(*) FROM public.callback_requests;
-- SELECT COUNT(*) FROM public.page_views;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'leads' AND column_name LIKE 'utm_%';

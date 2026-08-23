-- ======================================================================
-- SCRIPT COMPLETO DE DDL DA AD TELAS E REDES (NOVO SUPABASE)
-- Data da exportação: 2026-08-23T22:32:14.517Z
-- Instalação: Copie este script e cole no SQL Editor do seu novo projeto Supabase
-- ======================================================================

-- 1. TABELA LEADS
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    bairro VARCHAR(100),
    servico VARCHAR(100),
    telefone VARCHAR(30),
    email VARCHAR(255),
    mensagem TEXT,
    origem VARCHAR(100) DEFAULT 'formulario_geral',
    status VARCHAR(50) DEFAULT 'Novo',
    valor_orcamento NUMERIC(10, 2) DEFAULT 0.00,
    observacoes TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir inserções públicas de leads" ON public.leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir leitura apenas de admins autenticados" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir atualização apenas de admins autenticados" ON public.leads FOR UPDATE TO authenticated USING (true);

-- 2. TABELA LEAD_CLICKS
CREATE TABLE IF NOT EXISTS public.lead_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    origem VARCHAR(100) NOT NULL,
    url_origem TEXT,
    user_agent TEXT,
    ip_hash VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON public.lead_clicks(created_at DESC);
ALTER TABLE public.lead_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir inserções públicas de cliques" ON public.lead_clicks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir leitura de cliques apenas de admins autenticados" ON public.lead_clicks FOR SELECT TO authenticated USING (true);

-- 3. TABELA PAGE_VIEWS
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    path VARCHAR(255) NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    ip_hash VARCHAR(64),
    session_id VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir inserções públicas de page_views" ON public.page_views FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir leitura de page_views apenas de admins autenticados" ON public.page_views FOR SELECT TO authenticated USING (true);

-- 4. TABELA CRON_TICKS
CREATE TABLE IF NOT EXISTS public.cron_ticks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status VARCHAR(50) DEFAULT 'ok'
);
ALTER TABLE public.cron_ticks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir inserções públicas de cron_ticks" ON public.cron_ticks FOR INSERT TO anon WITH CHECK (true);


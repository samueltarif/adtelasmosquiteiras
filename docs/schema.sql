-- SQL Schema for AD Telas e Redes Leads & Click Tracker
-- Copie e execute este script no SQL Editor do seu painel do Supabase (https://supabase.com)

-- 1. Tabela de Leads (Formulários)
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
    origem VARCHAR(100) DEFAULT 'formulario_geral', -- Ex: 'hero_home', 'modal_servico'
    status VARCHAR(50) DEFAULT 'Novo', -- 'Novo', 'Em Atendimento', 'Orçado', 'Fechado', 'Perdido'
    valor_orcamento NUMERIC(10, 2) DEFAULT 0.00,
    observacoes TEXT
);

-- Índices de desempenho para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- Habilitar RLS (Row Level Security) na tabela leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para 'leads'
-- Permite que qualquer usuário anônimo (cliente do site) envie um lead
CREATE POLICY "Permitir inserções públicas de leads" 
ON public.leads FOR INSERT 
TO anon 
WITH CHECK (true);

-- Permite leitura e escrita apenas para usuários autenticados (painel admin)
CREATE POLICY "Permitir leitura apenas de admins autenticados" 
ON public.leads FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir atualização apenas de admins autenticados" 
ON public.leads FOR UPDATE 
TO authenticated 
USING (true);


-- 2. Tabela de Cliques Rápidos (WhatsApp / Telefone)
CREATE TABLE IF NOT EXISTS public.lead_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'whatsapp', 'telefone', 'ajuda_rapida'
    origem VARCHAR(100) NOT NULL, -- Ex: 'floating_button', 'header_mobile'
    url_origem TEXT, -- URL de onde partiu o clique
    user_agent TEXT,
    ip_hash VARCHAR(64) -- Hash para controle de duplicados
);

CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON public.lead_clicks(created_at DESC);

-- Habilitar RLS na tabela lead_clicks
ALTER TABLE public.lead_clicks ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para 'lead_clicks'
CREATE POLICY "Permitir inserções públicas de cliques" 
ON public.lead_clicks FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Permitir leitura de cliques apenas de admins autenticados" 
ON public.lead_clicks FOR SELECT 
TO authenticated 
USING (true);

# Relatório de Segurança e Arquitetura: Admin Auth, Galeria Privada de Mídias e Migration SQL 008

**Projeto:** AD Telas e Redes — [adtelasmosquiteiras.com.br](https://www.adtelasmosquiteiras.com.br)  
**Fase:** SQL 008 Final Micro-Hardening & Pre-Production Security Review  
**Data:** 25 de Agosto de 2026  
**Status da Migration:** `SQL_008_NOT_EXECUTED` (Aguardando execução manual no Supabase)

---

## 1. Sumário Executivo do Relatório

```text
SQL_008_FINAL_MICRO_HARDENING_REPORT

ADMIN_IDENTITY_AUTHORITY = AUTH_USER_ID
ADMIN_EMAIL_AUTHORIZATION_DEPENDENCY = NONE
ADMIN_EMAIL_UNIQUE_CONSTRAINT = REMOVED
ADMIN_USER_ID_UNIQUE_CONSTRAINT = PRESERVED

ADMIN_LOGIN_ORIGIN_CHECK = SAME_ORIGIN_ENFORCED
LOGIN_CSRF_PROTECTION = YES

SQL_008_FAIL_FAST = YES
SQL_008_FUNCTION_FAIL_FAST = YES
ADMIN_UPDATED_AT_FUNCTION_CREATE_MODE = CREATE_ONLY

REDUNDANT_ADMIN_INDEXES = NONE

PUBLIC_ADMIN_AUTH_ENDPOINTS = 1
PROTECTED_ADMIN_ENDPOINT_COUNT = 13

SQL_008_RENDERING_ARTIFACTS_PRESENT = NO

EMAIL_TESTS = 137/137 PASS
ADMIN_TESTS = 26/26 PASS
BUILD = PASS

SQL_008_EXECUTED = NO
DATABASE_CHANGED = NO
PRODUCTION_CHANGED = NO
SUPABASE_MCP_WRITES = 0
```

---

## 2. Inventário Completo de Rotas Administrativas (`/api/admin/*`)

| Método | Rota | Autenticação Exigida | Papel Exigido | Muta Estado de Sessão / Dados | Proteção CSRF / Origin Check | Cache-Control / Headers |
|---|---|---|---|---|---|---|
| **POST** | `/api/admin/auth/login` | **NÃO (Público)** | N/A | **SIM** (Cria cookies de sessão) | `SAME_ORIGIN_ENFORCED` + Mensagem Genérica | `default` |
| **GET** | `/api/admin/auth/session` | **SIM** | `admin`, `superadmin` | NÃO | Read-only | `default` |
| **POST** | `/api/admin/auth/logout` | **SIM** | Qualquer autenticado | **SIM** (Limpa cookies) | `SAME_ORIGIN_ENFORCED` | `default` |
| **GET** | `/api/admin/dashboard-stats` | **SIM** | `admin`, `superadmin` | NÃO | Read-only | `default` |
| **GET** | `/api/admin/leads` | **SIM** | `admin`, `superadmin` | NÃO | Read-only | `default` |
| **GET** | `/api/admin/recent-activity` | **SIM** | `admin`, `superadmin` | NÃO | Read-only | `default` |
| **POST** | `/api/admin/update-lead` | **SIM** | `admin`, `superadmin` | **SIM** (Atualiza lead) | `SAME_ORIGIN_ENFORCED` | `default` |
| **GET** | `/api/admin/media/signed-url` | **SIM** | `admin`, `superadmin` | NÃO | Read-only + IDOR Check | `no-store, no-cache, must-revalidate` (TTL 300s) |
| **GET** | `/api/admin/analytics/overview` | **SIM** | `admin`, `superadmin` | NÃO | Read-only | `default` |
| **GET** | `/api/admin/analytics/acquisition` | **SIM** | `admin`, `superadmin` | NÃO | Read-only | `default` |
| **GET** | `/api/admin/analytics/funnel` | **SIM** | `admin`, `superadmin` | NÃO | Read-only | `default` |
| **GET** | `/api/admin/analytics/pages` | **SIM** | `admin`, `superadmin` | NÃO | Read-only | `default` |
| **GET** | `/api/admin/analytics/services` | **SIM** | `admin`, `superadmin` | NÃO | Read-only | `default` |
| **GET** | `/api/admin/analytics/lead-journey` | **SIM** | `admin`, `superadmin` | NÃO | Read-only | Metadados sanitizados (sem `storage_key`) |

---

## 3. Decisões Arquiteturais e Diretrizes de Segurança

### 3.1 Autoridade de Identidade Estrita por `user_id`
* **Vínculo Autoritativo:** A autenticação e autorização vinculam estritamente `auth.users.id` a `public.admin_users.user_id`.
* **Desacoplamento de E-mail:** O campo `admin_users.email` funciona estritamente como um snapshot descritivo para exibição administrativa no dashboard. Alterações de e-mail na conta `auth.users` não impactam o acesso nem quebram a autorização.
* **Remoção de `UNIQUE(email)`:** A constraint `UNIQUE(email)` foi removida da tabela `admin_users` para evitar conflitos se um e-mail for alterado ou reutilizado no Supabase Auth. Preservou-se `UNIQUE(user_id)`.

### 3.2 Role-Based Access Control (RBAC) Estrito
* **Roles Permitidos em V1:** `['admin', 'superadmin']`.
* **Papel `operator`:** Mantido na restrição do banco para expansão futura, porém **bloqueado (HTTP 403)** em todas as rotas administrativas e de mídia privilegiadas da V1 (`OPERATOR_FULL_ADMIN_ACCESS = NO`).

### 3.3 Acesso Server-Only e Isolamento de RLS
* **Revogação Pública:** `REVOKE ALL ON public.admin_users FROM anon, authenticated`.
* **Política Exclusiva:** Somente o `service_role` (utilizado internamente pelo backend Nitro) possui privilégios de consulta e mutação na tabela `admin_users`. Clientes web jamais consultam a tabela diretamente.

### 3.4 Segurança de Cookies e Renovação Transparente de Sessão
* **Cookies HTTP-Only:** `sb_admin_token` e `sb_admin_refresh_token` são gravados com flags `httpOnly: true`, `secure: true` (em produção), `sameSite: 'lax'`, `path: '/'`.
* **Renovação Server-Side:** Quando o access token JWT expira, o guard `requireActiveAdmin(event)` executa automaticamente a renovação junto ao endpoint `/auth/v1/token?grant_type=refresh_token` do Supabase Auth, atualiza os cookies na resposta da requisição corrente e prossegue sem interromper a navegação do operador.
* **Tratamento de Sessão Inválida:** Caso o refresh token seja revogado ou expire, os cookies são limpos e o cliente recebe HTTP 401 redirecionando para `/admin/login`.

### 3.5 Proteção Contra CSRF em Mutações e Login
* Requisições mutáveis (`POST`, `PATCH`, `PUT`, `DELETE`), incluindo o endpoint de login público `POST /api/admin/auth/login`, validam a correspondência dos headers `Origin` e `Referer` contra o `Host` da aplicação (`ADMIN_LOGIN_ORIGIN_CHECK = SAME_ORIGIN_ENFORCED`).
* Requisições cross-site não autorizadas são imediatamente rejeitadas com status HTTP 403.

### 3.6 Hardening de URLs Assinadas e Galeria de Mídias
* **TTL Estrito:** Todas as URLs temporárias de fotos e vídeos geradas pelo Cloudflare R2 possuem TTL máximo de 300 segundos (5 minutos).
* **Prevenção de Cache:** O endpoint `/api/admin/media/signed-url` emite cabeçalhos `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`, `Pragma: no-cache` e `Expires: 0`.
* **Proteção de Referrer:** As tags de imagem (`<img>`), vídeo (`<video>`) e links de download no `LeadJourneyDrawer.vue` utilizam `referrerpolicy="no-referrer"`.
* **Proteção IDOR:** Validação cruzada obrigatória para garantir que o arquivo requisitado pertence ao lead consultado e possui status `upload_status = 'uploaded'`.

### 3.7 Notificação de Mídia Condicional por E-mail (Gmail)
* **Envio Imediato:** O envio de e-mail e salvamento do lead ocorrem de forma síncrona sem aguardar o upload dos arquivos binários (`EMAIL_DELIVERY_DEPENDS_ON_MEDIA = NO`).
* **Zero Anexos de Mídia:** Nenhuma foto, vídeo, Base64 ou URL privada do R2 é anexada ou exposta no e-mail (`CUSTOMER_MEDIA_EMAIL_ATTACHMENTS = NONE` e `EMAIL_R2_URL_EXPOSURE = NONE`).
* **Aviso Condicional Preciso:** Se o cliente selecionou arquivos, o e-mail inclui o aviso em destaque (ex: *"Este cliente selecionou 2 fotos e 1 vídeo para envio."*) com o botão seguro `VER LEAD NO PAINEL` apontando para a interface corporativa estável.

---

## 4. Script da Migration: `supabase/manual/008_admin_auth.sql`

```sql
-- ======================================================================
-- AÇÃO MANUAL NECESSÁRIA NO SUPABASE (NÃO EXECUTAR AUTOMATICAMENTE VIA MCP)
-- ======================================================================
-- Projeto: AD Telas e Redes — https://www.adtelasmosquiteiras.com.br
-- Arquivo: supabase/manual/008_admin_auth.sql
-- Fase: SQL 008 Final Micro-Hardening
--
-- DECISÕES ARQUITETURAIS:
--
--   ADMIN_IDENTITY_AUTHORITY = AUTH_USER_ID
--     A autorização vincula auth.users.id a public.admin_users.user_id.
--     admin_users.email é exclusivamente campo de exibição/snapshot (ADMIN_EMAIL_AUTHORIZATION_DEPENDENCY = NONE).
--     ADMIN_EMAIL_UNIQUE_CONSTRAINT = REMOVED (não impede novos cadastros caso email mude em auth.users).
--     ADMIN_USER_ID_UNIQUE_CONSTRAINT = PRESERVED (garante 1 registro por usuário).
--
--   ADMIN_ROLE_CHECK = ENFORCED
--     ADMIN_ALLOWED_ROLES = ('admin', 'superadmin').
--     operator NÃO possui acesso administrativo completo (OPERATOR_FULL_ADMIN_ACCESS = NO).
--
--   ADMIN_AUTHORIZATION_LOOKUP = SERVER_ONLY
--     ANON_DIRECT_ADMIN_USERS_ACCESS = NONE
--     AUTHENTICATED_DIRECT_ADMIN_USERS_ACCESS = NONE
--     Acesso anônimo e autenticado direto totalmente revogado. Acesso restrito a service_role.
--
--   ADMIN_UPDATED_AT_METHOD = BEFORE_UPDATE_TRIGGER
--     Gatilho plpgsql atualiza automaticamente updated_at a cada mutação.
--     ADMIN_UPDATED_AT_FUNCTION_CREATE_MODE = CREATE_ONLY (SQL_008_FUNCTION_FAIL_FAST = YES).
--
--   REDUNDANT_ADMIN_INDEXES = NONE
--     UNIQUE(user_id) já cria índice nativo; idx_admin_users_user_id foi omitido.
--
-- REGRAS E SEGURANÇA:
--   1. Tabela public.admin_users com foreign key em ON DELETE CASCADE para auth.users(id).
--   2. Constraint UNIQUE(user_id).
--   3. CHECK constraint para role IN ('admin', 'superadmin', 'operator').
--   4. RLS ativada exclusivamente para service_role.
--   5. Preserva 100% dos dados existentes em leads, lead_media, page_views e lead_clicks.
--   6. Status de execução: SQL_008_NOT_EXECUTED (Aguardando execução manual do operador).
-- ======================================================================


-- ======================================================================
-- 1. PRE-CHECK FAIL-FAST (SQL_008_FAIL_FAST = YES & SQL_008_FUNCTION_FAIL_FAST = YES)
-- ======================================================================
-- Exige que auth.users exista.
-- Exige que public.admin_users NÃO exista previamente.
-- Exige que public.set_admin_users_updated_at() NÃO exista previamente.
-- ======================================================================

DO $$
DECLARE
    _auth_users_exists BOOLEAN;
    _admin_users_exists BOOLEAN;
    _function_exists BOOLEAN;
BEGIN
    -- 1.1 Verificar existência de auth.users (pré-requisito)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) INTO _auth_users_exists;

    IF NOT _auth_users_exists THEN
        RAISE EXCEPTION '
==============================================================
ABORTING: Schema auth ou tabela auth.users NÃO encontrados.
O Supabase Auth é pré-requisito obrigatório para esta migration.
==============================================================';
    END IF;

    -- 1.2 Verificar se public.admin_users já existe (fail-fast estrito)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'admin_users'
    ) INTO _admin_users_exists;

    IF _admin_users_exists THEN
        RAISE EXCEPTION '
==============================================================
ABORTING: public.admin_users já existe no banco.
A migration 008 exige estado limpo sem tabela prévia para evitar schema parcial.
==============================================================';
    END IF;

    -- 1.3 Verificar se public.set_admin_users_updated_at já existe (fail-fast de função)
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'set_admin_users_updated_at'
    ) INTO _function_exists;

    IF _function_exists THEN
        RAISE EXCEPTION '
==============================================================
ABORTING: Função public.set_admin_users_updated_at já existe no banco.
Remova ou renomeie a função legada antes de prosseguir.
==============================================================';
    END IF;

    RAISE NOTICE 'PRE-CHECK OK: auth.users presente, public.admin_users e função ausentes. Prosseguindo com a migration...';
END $$;


-- ======================================================================
-- 2. MIGRATION TRANSACTIONAL (BEGIN ... COMMIT)
-- ======================================================================
BEGIN;

-- A. Criação da Tabela public.admin_users (sem IF NOT EXISTS, sem UNIQUE(email))
CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- UNIQUE constraint em user_id (cria automaticamente o índice btree correspondente)
    CONSTRAINT unq_admin_users_user_id UNIQUE (user_id),

    -- CHECK constraints
    CONSTRAINT chk_admin_users_role CHECK (role IN ('admin', 'superadmin', 'operator'))
);

-- B. Função e Trigger para updated_at automático (CREATE FUNCTION estrito)
CREATE FUNCTION public.set_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.set_admin_users_updated_at();

-- C. Índices de performance não-redundantes
CREATE INDEX idx_admin_users_email ON public.admin_users(email);
CREATE INDEX idx_admin_users_is_active ON public.admin_users(is_active) WHERE is_active = true;

-- D. Habilitar Row Level Security (RLS) Estrita
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- E. Revogar TODAS as permissões de anon e authenticated (Acesso Server-Only)
REVOKE ALL ON public.admin_users FROM anon;
REVOKE ALL ON public.admin_users FROM authenticated;
GRANT ALL ON public.admin_users TO service_role;

-- F. RLS Policy exclusiva para service_role
CREATE POLICY service_role_all_admin_users 
ON public.admin_users 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

COMMIT;


-- ======================================================================
-- 3. INSTRUÇÃO PARA CADASTRAR O PRIMEIRO ADMINISTRADOR
-- ======================================================================
-- Após criar um usuário no Supabase Dashboard > Authentication > Users,
-- vincule-o à tabela admin_users com o seguinte comando (ajuste o e-mail):
--
-- INSERT INTO public.admin_users (user_id, email, role, is_active)
-- SELECT id, email, 'admin', true
-- FROM auth.users
-- WHERE email = 'vendas.adtelaseredes@gmail.com'
-- ON CONFLICT (user_id) DO UPDATE SET is_active = true;
-- ======================================================================


-- ======================================================================
-- 4. POST-CHECK — VERIFICAÇÃO DE INTEGRIDADE
-- ======================================================================
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'admin_users'
ORDER BY ordinal_position;

SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public'
  AND c.conrelid = 'public.admin_users'::regclass
ORDER BY c.conname;

SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'admin_users'
ORDER BY indexname;

SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'admin_users';

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    roles, 
    cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'admin_users';


-- ======================================================================
-- 5. ROLLBACK SIMÉTRICO COMPLETO (EXECUTAR APENAS SE NECESSÁRIO)
-- ======================================================================
/*
BEGIN;

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
DROP FUNCTION IF EXISTS public.set_admin_users_updated_at();
DROP TABLE IF EXISTS public.admin_users CASCADE;

COMMIT;
*/
```

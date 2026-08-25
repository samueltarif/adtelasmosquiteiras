# Manual Setup Guide — Cloudflare R2 Private Media Storage

**Projeto:** AD Telas e Redes (`https://www.adtelasmosquiteiras.com.br`)  
**Fase:** Lead Media Storage + Admin Media Gallery + Data-Only Email  
**Status:** `MANUAL_CLOUDFLARE_ACTION_REQUIRED = YES` (Execução manual do operador no Cloudflare Dashboard)

---

## 1. Criar o Bucket Privado Dedicado

1. Acesse o Cloudflare Dashboard em [dash.cloudflare.com](https://dash.cloudflare.com).
2. No menu lateral esquerdo, navegue até **R2 Object Storage** > **Overview**.
3. Clique em **Create bucket**.
4. Configure os parâmetros:
   - **Bucket name:** `adtelas-leads-private`
   - **Location:** `Automatic`
5. Clique em **Create bucket**.

> **R2_LOCATION = AUTOMATIC**  
> A localização `Automatic` permite que o Cloudflare escolha a região com menor latência. Se você desejar forçar uma região específica, selecione manualmente na interface (ex.: South America — SAM). Não confundir WNAM (Western North America) com América do Sul.

---

## 2. Garantir Acesso Público Desabilitado (Bucket 100% Privado)

1. No bucket recém-criado `adtelas-leads-private`, acesse a aba **Settings**.
2. Na seção **Public access**:
   - **R2.dev subdomain:** Certifique-se de que está **Disabled** (`LEAD_MEDIA_BUCKET_PUBLIC_ACCESS = DISABLED`).
   - **Custom Domains:** Certifique-se de que **NENHUM** domínio customizado público esteja vinculado a este bucket.
3. Isso garante que nenhum arquivo do cliente possa ser acessado por URLs públicas permanentes. O acesso ocorrerá estritamente via S3 Presigned URLs temporárias geradas pelo backend autenticado.

---

## 3. Configurar CORS (Cross-Origin Resource Sharing)

Para permitir que o navegador do cliente faça o upload direto (`PUT`) dos arquivos binários via Presigned URL sem tráfego de mídia na Vercel:

1. Na aba **Settings** do bucket `adtelas-leads-private`, role até **CORS Policy**.
2. Clique em **Add CORS policy** ou edite a existente.
3. Cole a seguinte política JSON:

### Produção

```json
[
  {
    "AllowedOrigins": [
      "https://www.adtelasmosquiteiras.com.br",
      "https://adtelasmosquiteiras.com.br"
    ],
    "AllowedMethods": [
      "PUT"
    ],
    "AllowedHeaders": [
      "Content-Type"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

> **R2_CORS_ALLOWED_HEADERS = Content-Type**  
> O browser envia apenas `Content-Type` no Presigned PUT. O header `x-amz-*` não é enviado pelo browser no upload direto via presigned URL porque a assinatura já carrega os metadados. Não é necessário liberá-lo no CORS.
>
> **R2_UPLOAD_HEADERS = Content-Type ONLY**  
> O `@aws-sdk/s3-request-presigner` gera URLs assinadas que não exigem headers `x-amz-*` adicionais do browser. O `Content-Type` é o único header custom enviado pelo `fetch()` do cliente.

### Desenvolvimento Local (Temporário)

Se desejar testar uploads diretos localmente, crie uma **segunda regra** CORS temporária:

```json
{
  "AllowedOrigins": [
    "http://localhost:3001"
  ],
  "AllowedMethods": [
    "PUT"
  ],
  "AllowedHeaders": [
    "Content-Type"
  ],
  "ExposeHeaders": [
    "ETag"
  ],
  "MaxAgeSeconds": 600
}
```

**Remova esta regra antes do deploy de produção.**

---

## 4. Configurar Regra de Lifecycle (Expurgo de Temporários Abandonados)

> [!WARNING]
> A regra de Lifecycle de 24 horas deve ser aplicada **ESTRITAMENTE** ao prefixo `tmp/leads/`. **NUNCA** aplique expiração automática ao prefixo `leads/`.

1. Na aba **Settings** do bucket `adtelas-leads-private`, role até **Lifecycle Rules**.
2. Clique em **Add rule**.
3. Configure os campos:
   - **Rule name:** `purge-abandoned-tmp-lead-uploads`
   - **Prefix:** `tmp/leads/` (atenção: inclua a barra final exata)
   - **Action:** `Delete objects` / `Expire objects`
   - **Age:** `1` dia (24 horas)
4. Salve a regra.

### Retenção de Arquivos Válidos

> **VALID_MEDIA_RETENTION = PENDING_BUSINESS_RETENTION_POLICY**
>
> - Prefixo `tmp/leads/`: Lifecycle 24h (expurgo de uploads abandonados/incompletos).
> - Prefixo `leads/`: **NENHUMA** expiração automática por Lifecycle.
> - A política definitiva de retenção de arquivos validados (`leads/`) ainda depende de decisão humana futura. Atualmente, arquivos aprovados permanecem indefinidamente até decisão comercial explícita.

---

## 5. Gerar e Configurar Credenciais de Acesso API (R2 Tokens)

1. No Cloudflare Dashboard, vá em **R2 Object Storage** > **Overview** > **Manage R2 API Tokens**.
2. Clique em **Create API token**.
3. Nome do token: `adtelas-leads-service`
4. Permissões: **Object Read & Write**
5. Aplicar a: **Specific bucket only** > selecione `adtelas-leads-private`.
6. TTL: Ilimitado ou conforme política da empresa.
7. Copie os valores e configure no `.env` e nas variáveis de ambiente da Vercel:
   - `R2_ACCOUNT_ID`: ID da sua conta Cloudflare (disponível no canto superior direito do R2 Overview)
   - `R2_ACCESS_KEY_ID`: Chave de Acesso gerada
   - `R2_SECRET_ACCESS_KEY`: Chave Secreta gerada
   - `R2_LEADS_BUCKET_NAME`: `adtelas-leads-private`
   - `MEDIA_UPLOAD_SIGNING_SECRET`: Uma string aleatória segura de pelo menos 32 caracteres (gerada por você para assinar tokens HMAC-SHA256)

# Script do PowerShell para enviar o sinal do Cron DIRETAMENTE para o Supabase.
# Não necessita do servidor Nuxt local (localhost) estar rodando!
# Ele lê as credenciais do seu arquivo .env e envia via HTTPS para o banco.

$envPath = "D:\sicons\ADT\.env"

if (-not (Test-Path $envPath)) {
    Write-Warning "Arquivo .env nao encontrado em $envPath"
    exit 1
}

# Lê e interpreta o arquivo .env
$envVars = @{}
Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line.Split("=", 2)
        $key = $parts[0].Trim()
        $val = $parts[1].Trim()
        $envVars[$key] = $val
    }
}

$supabaseUrl = $envVars["SUPABASE_URL"]
$supabaseKey = $envVars["SUPABASE_SERVICE_ROLE_KEY"]

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Warning "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configurados no .env"
    exit 1
}

# Define a URL do endpoint REST da tabela cron_ticks no Supabase
$url = "$supabaseUrl/rest/v1/cron_ticks"

# Monta os cabeçalhos de autenticação exigidos pelo Supabase
$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=minimal"
}

# Corpo da requisição com o numeral 1
$body = @{
    valor = 1
} | ConvertTo-Json

try {
    # Executa a requisição HTTPS direta para o Supabase
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    Write-Output "Sinal do cron enviado com sucesso diretamente ao Supabase (numeral 1 gravado)!"
} catch {
    Write-Error "Falha ao enviar sinal diretamente ao Supabase: $_"
}

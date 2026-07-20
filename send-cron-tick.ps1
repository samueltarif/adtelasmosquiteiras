# Script do PowerShell para enviar o sinal do Cron para o Nuxt local ou produção.
# Configure o Agendador de Tarefas do Windows para executar este arquivo.

# Para teste local:
$url = "http://localhost:3001/api/cron-tick"

# Para produção (descomente e substitua pela sua URL real quando estiver online):
# $url = "https://www.adtelasmosquiteiras.com.br/api/cron-tick"

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json"
    if ($response.success) {
        Write-Output "Sinal enviado com sucesso: 1 gravado no banco de dados."
    } else {
        Write-Warning "Falha ao gravar o sinal: $($response.error)"
    }
} catch {
    Write-Error "Erro ao conectar com a API: $_"
}

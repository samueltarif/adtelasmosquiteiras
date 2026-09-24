# Contas a pagar, receber e avisos de vencimento

Rota: `/admin/financeiro`. Incluída nos menus do computador e do celular.

## Uso

- Cadastrar conta a pagar ou a receber, com descrição, fornecedor/cliente, valor, vencimento, categoria e observações.
- Filtrar por tipo, situação, período de vencimento e texto; lista paginada de 25 contas.
- Consultar totais gerais em aberto e vencidos, separados por pagar/receber.
- Registrar quitação integral com data e meio de pagamento. Não movimenta bancos e não emite cobrança.
- Editar contas em aberto, cancelar e reabrir, preservando histórico transacional e controle de versão.
- Configurar destinatário e antecedência dos avisos; consultar os últimos envios.

Destinatário inicial solicitado: **vendas.adtelaseredes@gmail.com**. Antecedência inicial: **3 dias**, editável de 1 a 30 dias.

Os avisos são agrupados por execução: um por conta/vencimento dentro da janela de antecedência e outro no vencimento. Se a rotina não executar no dia, recupera o aviso pendente como vencido. Contas pagas, recebidas ou canceladas não entram na consulta. Valores e datas refletem o momento da reserva do envio.

Os registros são independentes das ordens de serviço e notas fiscais. Não geram recebíveis automaticamente nem suportam baixas parciais nesta versão; para parcelas, cadastrar cada vencimento separadamente.

## Ativação em produção

1. Aplicar `supabase/migrations/20260924120000_finance_accounts_and_reminders.sql` no projeto **da AD Telas**. Migração aditiva, com novas tabelas e funções; não modifica os dados das tabelas existentes.
2. Confirmar as variáveis privadas já usadas pelo projeto: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_EMAIL`, `GMAIL_APP_PASSWORD`.
3. Configurar `CRON_SECRET` com um segredo aleatório exclusivo de pelo menos 32 caracteres, somente no servidor.
4. Publicar a aplicação. Na Vercel, `vercel.json` agenda GET `/api/cron/finance-reminders` diariamente às 12h UTC (9h em São Paulo), com autenticação Bearer `CRON_SECRET`. A precisão do horário depende do plano da hospedagem. Fora da Vercel, configurar o agendador da hospedagem para chamar o mesmo endpoint diariamente, com esse cabeçalho; o arquivo por si só não ativa outra hospedagem.
5. Conferir a rotina ativa na hospedagem, acessar o painel e validar o envio ao destinatário solicitado com uma conta de teste claramente identificada. Cancelar a conta de teste após validar. Não foram enviados e-mails reais durante os testes locais.

Referências da hospedagem: [configuração de cron](https://vercel.com/docs/cron-jobs/quickstart), [segurança e operação](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

O painel distingue configuração de SMTP, configuração de segredo e data da última execução. Ter as variáveis configuradas não prova que o agendador foi ativado na hospedagem.

## Segurança e consistência

- APIs administrativas usam `requireActiveAdmin`, incluindo a proteção CSRF já existente.
- Cron rejeita requisições sem o segredo correto. Nunca utiliza a rota pública antiga de cron ticks.
- Tabelas e RPCs são inacessíveis a `anon` e `authenticated`; apenas o backend com `service_role` pode utilizá-las.
- Dinheiro armazenado como centavos inteiros; datas civis e classificação de atraso em `America/Sao_Paulo`.
- Criação usa UUID estável para repetição idempotente. Alterações exigem a versão esperada no próprio UPDATE.
- Histórico da conta é gravado por trigger na mesma transação.
- Reservas de e-mail têm restrição única por conta, vencimento e etapa, com bloqueio de linhas para concorrência.
- O SMTP não garante entrega exatamente uma vez. Em resultado incerto, a reserva não é repetida automaticamente; aparece no histórico para conferência. Execuções interrompidas ficam como não confirmadas após 15 minutos na próxima verificação. Uma confirmação do SMTP significa aceitação, não leitura nem entrega na caixa de entrada.
- Uma falha antes de reservar (por exemplo, SMTP não configurado) permite repetir a execução depois de corrigida. Reservas incertas exigem análise operacional; não liberar reenvio sem confirmar se o e-mail original chegou.

## Testes

- `npm run test:finance`: PostgreSQL local em memória via PGlite, sem acesso a produção. Executa a migração e testa regras, histórico, controle de versão, permissões, filtros, totais e reservas de aviso; SMTP é simulado.
- `npm run build`: compilação de produção.
- Com a compilação servida localmente na porta 3012: `npm run test:finance:browser`. Usa Chrome instalado; testa UI desktop/celular com respostas simuladas e verifica rejeição real de APIs sem autenticação. `TEST_ORIGIN` permite outra porta.

Os testes locais não substituem a validação final da migração, do agendamento e do Gmail na hospedagem correta.

### Resultado em 24/09/2026

- Migração e regras financeiras: aprovadas no PostgreSQL local em memória.
- Compilação de produção com Nuxt 4.2.2: concluída sem erros; avisos preexistentes de importações duplicadas do CRM e dependências.
- Navegador em 1440 e 390 pixels: cadastro em reais, filtros, quitação, configurações de e-mail e ausência de transbordamento horizontal aprovados, sem erros JavaScript.
- APIs reais sem sessão e cron sem segredo: rejeitados com HTTP 401.
- Capturas da interface com dados fictícios: `artifacts/finance/painel-1440.png` e `painel-390.png`.
- Banco de produção AD Telas configurado com sucesso via MCP Supabase:
  - Projeto confirmado: **site ad telas** (ref `axjqhxpejwkuabeaoyaz`, organização `rudwguwarbbsdtbotgoj`). O projeto `rh qualitec` não foi utilizado.
  - Migração `20260924120000_finance_accounts_and_reminders.sql` aplicada sem recriar ou afetar dados existentes.
  - Tabelas criadas com RLS ativo: `finance_entries`, `finance_history`, `finance_settings`, `finance_reminders`.
  - Permissões estritas validadas: acesso público, `anon` e `authenticated` revogados; acesso liberado exclusivamente para `service_role`.
  - Triggers testados: controle de concorrência/versão (`finance_entry_version`) e trilha de auditoria (`finance_entry_history`).
  - Configuração inicial validada: destinatário `vendas.adtelaseredes@gmail.com`, antecedência de 3 dias, avisos ativados, sem execuções registradas (`last_run_at: null`).
  - Validação transacional concluída sem envio de e-mails, sem resíduos de dados e sem agendamentos concorrentes criados no Supabase.
- Sem publicação da aplicação e sem envio real de e-mails nesta etapa.

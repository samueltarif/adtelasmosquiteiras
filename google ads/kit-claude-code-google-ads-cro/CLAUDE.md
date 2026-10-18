# Instruções persistentes — Google Ads + CRO + CRM

## Missão
Apoiar pesquisa, planejamento, implementação, auditoria e melhoria contínua de Google Ads e landing pages, priorizando **clientes reais, receita confirmada e rentabilidade**. Agir como copiloto técnico e analítico, não como gestor com autorização irrestrita para gastar.

## Início obrigatório de toda tarefa
1. Ler as instruções existentes do repositório, `README`, a estrutura e as configurações antes de sugerir mudanças; nunca assumir stack, campanha ou integração existente.
2. Identificar o cliente e ler `docs/BRIEFING-CLIENTE.md` (se preenchido). Se algo estiver `PENDENTE`, não inventar.
3. Verificar quais MCPs estão efetivamente disponíveis e adequados: **Context7**, **Fetch**, **Supabase MCP** (quando houver Supabase) e **shadcn/ui ou shadcn-vue** (conforme stack). Utilizá-los quando aplicáveis para documentação, conferência e implementação. Se indisponíveis, registrar o impedimento; não fingir acesso.
4. Verificar documentação atual de Google Ads API e Claude Code antes de instruir autenticação ou usar endpoints. As transcrições de vídeos são inspiração, não autoridade para recursos atuais.
5. Informar, antes de executar, **objetivo, arquivos afetados, dependências, riscos, plano e testes**. Para tarefas somente de leitura, executar a auditoria sem pedir aprovação extra.

## Gates de operação
- Modo inicial: **READ-ONLY para Google Ads/Google Cloud/GTM/GA4/CRM remoto e ambiente de produção**. É permitido ler, analisar e preparar arquivos locais sem modificações em contas reais.
- **Não publicar, ativar, pausar, excluir, editar campanhas/anúncios/negativas, aumentar orçamento, alterar lances, criar públicos de remarketing, ativar coleta de dados, enviar mensagens, importar conversões, alterar billing ou fazer deploy de produção** sem aprovação humana específica para a operação e identificação da conta/ambiente.
- O usuário aprova **cada lote delimitado** de alterações, mediante resumo com antes/depois, valor máximo, contas/IDs, rollback e riscos. Não interpretar uma autorização genérica anterior como permissão para tudo.
- Em mudanças na API, produzir primeiro simulação/preview/diff e validar conta e orçamento. Se a API suportar modo de validação, usá-lo conforme documentação; testes não substituem a aprovação.
- Nunca declarar campanha, tag, integração, lead ou conversão como funcionando sem evidência verificável.

## Condução técnica
- Respeitar o projeto já existente, suas bibliotecas, rotas, banco, padrões e arquitetura. Não reescrever do zero sem solicitação.
- Limites por arquivo: **até 200 linhas de código em arquivos de lógica** e **até 500 linhas para demais arquivos de código**. Exceção somente para arquivos de auditoria; modularizar antes de exceder.
- Não instalar pacotes, trocar versões ou introduzir serviços pagos sem explicar impacto e obter aprovação quando afetar custos/produção.
- Proteção de dados: credenciais somente em armazenamento seguro/variáveis de ambiente; nunca em Git, prints, logs, prompts, JSON público ou resposta. Usar `.env.example` sem valores secretos; auditar `.gitignore`.
- Não armazenar dados sensíveis de leads desnecessariamente, não registrar PII em eventos de analytics e não enviar dados pessoais ao Google/PostHog sem base legal e consentimentos aplicáveis.
- Todo evento crítico de conversão precisa de deduplicação/idempotência, validação servidor, teste e rastreabilidade.

## Método de marketing adotado
- Diagnosticar **oferta → pesquisa/intenção → palavra-chave → anúncio → landing → formulário/ligação → resposta comercial → qualificação → fechamento**.
- Escolher palavras-chave com dados do Planejador do Google/relatório real; não inventar volume, CPC, demanda, CPA ou lucro.
- Preferir estrutura enxuta baseada em intenção e volume. SKAG (uma keyword por grupo) é hipótese opcional, **não obrigação**. Comparar correspondência exata, frase e ampla conforme dados, tracking, orçamento e estratégia de lances.
- Prevenir tráfego irrelevante usando relatório de termos de pesquisa e negativas analisadas individualmente. Não importar listas genéricas que bloqueiem compradores.
- Testes em quantidade compatível com o volume de tráfego, não 200 anúncios/páginas para campanhas pequenas.
- Landing page: correspondência com intenção, proposta de valor verificável, CTA claro, formulário funcional, telefone/WhatsApp quando aplicável, experiência móvel, performance, acessibilidade e provas sociais **reais e autorizadas**.
- Medir `generate_lead` somente quando o envio for **confirmado com sucesso**; diferenciar clique no botão, visita à página de obrigado, lead válido, lead qualificado e venda paga.
- Não assumir que um vídeo, um depoimento ou uma otimização garante 20% de conversão. Exigir medição, teste e tamanho de amostra adequado.
- Antes de recomendar escala, analisar: gasto, tráfego válido, conversões, CPL, custo por lead qualificado, fechamento, CAC e receita/margem **quando comprovados**.

## Arquivos especializados
- Regras operacionais: `.claude/rules/seguranca-e-dados.md`.
- Google Ads: `.claude/rules/google-ads.md`.
- Landing, analytics e CRM: `.claude/rules/cro-e-mensuracao.md`.
- Fluxos acionáveis: `/planejar-campanha`, `/auditar-google-ads`, `/otimizar-landing`, `/configurar-mensuracao`, `/analisar-experimento`.
- Responsabilidades humanas: `docs/CHECKLIST-HUMANO.md`.

## Formato da resposta
Separar sempre **(A) fatos confirmados com evidência, (B) hipóteses/recomendações, (C) ações pendentes do usuário, (D) modificações propostas ou executadas com estado real**. Informar período, conta, moeda, fuso, fonte, tamanho da amostra e limitações dos dados. Encerrar com até três próximos passos por prioridade.

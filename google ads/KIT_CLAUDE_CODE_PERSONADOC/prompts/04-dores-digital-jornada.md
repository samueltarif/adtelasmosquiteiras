# PROMPT 04 — Dores & desejos, Comportamento digital e Jornada de compra

## C — Contexto
As duas primeiras etapas do formulário funcionam. Implemente somente as três seções seguintes, guiando-se por `referencias/03-dores-desejos.png`, `referencias/04-comportamento-digital.png` e `referencias/05-jornada-compra.png`. Quero transformar respostas em informação útil para anúncios, mas sem afirmar que hipóteses são pesquisa comprovada.

## T — Tarefa
1. **Dores & desejos**: principal problema que o serviço resolve (campo destacado e obrigatório para um briefing mínimo), dores secundárias, o que a pessoa tentou sem sucesso, custo emocional, desejos, transformações esperadas e objeções de compra. Os últimos itens podem ser complementos de valor, já que não estão todos visíveis nas capturas.
2. **Comportamento digital**: principais redes (Instagram, Facebook, TikTok, YouTube, LinkedIn, WhatsApp, Telegram, X/Twitter, Pinterest); dispositivo usado (smartphone, computador, ambos); frequência de uso; formatos preferidos; perfis/canais de referência; hábitos de pesquisa. Reproduza os chips de seleção com estado selecionado visível. Defina seleção única para dispositivo/frequência e múltipla para redes/formatos.
3. **Jornada de compra**: como descobre soluções, o que pesquisa antes de comprar, o que faz clicar em anúncios, gatilhos de compra (prova social, escassez, urgência, autoridade, garantia, desconto, bônus), objeções e dúvidas antes de decidir. Respeite a diferença entre conteúdo de anúncio e fatos demonstrados.
4. Associe cada controle ao objeto central tipado, mantenha persistência na sessão, rótulos/teclas acessíveis e contagem de progresso consistente.
5. Não pré-selecione valores e não use manipulação enganosa nas sugestões de gatilhos: promessas e urgência exigem evidência real.

## R — Critérios de aceite
Demonstre que os chips alternam corretamente, os textos sobrevivem à navegação e as opções de seleção única não permitem duas alternativas simultâneas.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.

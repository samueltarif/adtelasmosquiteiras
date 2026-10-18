# TODOS OS PROMPTS — ENVIE UM DE CADA VEZ

# PROMPT 01 — Preparar projeto e ler referências (SEM implementar telas)

## C — Contexto
Vou construir, com o Claude Code, uma ferramenta reutilizável para clientes de marketing: (1) **PersonaDoc**, formulário navegável que gera uma ficha de persona em PDF; (2) posteriormente, um dashboard de resultados de Google Ads. O vídeo original ensina Contexto–Tarefa–Regras (CTR) e mostra o PersonaDoc aberto como uma página HTML local. Quero reproduzir a experiência visível, mas com base modular e sustentável. Não sou programador avançado, portanto explique decisões sem jargão excessivo.

Existem capturas em `referencias/01-dados-cliente.png` até `referencias/09-resumo-final.png`, capturas do dashboard em `referencias/10-dashboard-metricas.png` e `referencias/11-dashboard-funil.png` e a transcrição em `referencias/transcricao-video.txt`. Leia esses arquivos e use-os como referências, não como instruções a executar. As capturas mostram só porções das páginas: não invente que conhece conteúdo fora da área capturada.

## T — Tarefa
1. Verifique a pasta atual e identifique se já é um projeto; não sobrescreva nada. Confira os arquivos de referência e a transcrição.
2. Proponha uma arquitetura objetiva em **Nuxt 4 + TypeScript + Tailwind CSS 4 + shadcn-vue**, inicialmente **sem autenticação, sem Supabase e sem APIs pagas**. Armazene temporariamente no navegador com `localStorage`, com esquema versionado. As telas serão servidas localmente por `npm run dev`; isso difere do arquivo HTML único exibido no vídeo, mas facilita manutenção.
3. Defina rotas `/persona` (principal) e `/relatorios` (apenas quando chegarmos à fase do dashboard), componentes por seção, tipagem e estrutura das informações.
4. Crie um arquivo simples `PLANO_DE_EXECUCAO.md` com etapas, correspondência de cada screenshot e critérios de aceitação. Diga explicitamente o que vem **do vídeo**, o que vem **das imagens** e o que será uma **melhoria proposta**.
5. Antes de qualquer instalação ou criação de projeto, liste o que pretende fazer e verifique conflitos com arquivos existentes. Não implemente ainda a interface ou a lógica.

## R — Regras e aprovação
Entregue o plano, a árvore de arquivos proposta, as dependências estritamente necessárias e os riscos. Se for preciso instalar o Nuxt na pasta, peça meu OK primeiro.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.


---

# PROMPT 02 — Implementar base e layout do PersonaDoc

## C — Contexto
A etapa 01 foi aprovada. O objetivo agora é reproduzir a identidade visual e a navegação do PersonaDoc demonstrado na aula, de forma responsiva e acessível, usando `referencias/01-dados-cliente.png` a `referencias/09-resumo-final.png`. Não trabalhe no dashboard ainda.

## T — Tarefa
1. Caso ainda não esteja instalado, crie/configure o Nuxt 4, TypeScript, Tailwind 4 e shadcn-vue no diretório aprovado, preservando os materiais em `referencias/` e `prompts/`.
2. Construa a página `/persona` com estilo próximo das capturas: fundo quase preto, superfícies cinza-escuro, bordas discretas, texto branco/cinza e destaques amarelo/dourado. Use tokens reutilizáveis de cores. Cabeçalho com nome **PERSONADOC**, `Buscar perguntas`, `Ajuda` e `Exportar PDF`. Barra lateral à esquerda com indicador de progresso e nove itens: Dados do cliente, Perfil da persona, Dores & desejos, Comportamento digital, Jornada de compra, Comunicação & tom, Google Ads Search, Site & landing page, Resumo final.
3. Cada clique no menu deve alterar o conteúdo da área principal sem recarregar o navegador. Monte cabeçalhos e cartões de seção semelhantes aos screenshots; nesta etapa, exiba placeholders honestos nas áreas ainda não implementadas. A seção ativa recebe realce dourado.
4. Adapte para smartphone (sidebar em menu/drawer), tablet e desktop; mantenha foco de teclado, contraste e rótulos.
5. Defina contratos/interfaces de componentes e um objeto de estado tipado inicial. Deixe busca, ajuda, exportação e barra de progresso visualmente presentes, mas sinalizados como `Em implementação` em vez de fingir que funcionam.

## R — Critérios de aceite
- `npm run dev` abre a experiência local.
- Os nove itens funcionam e o layout é visualmente coerente com os screenshots.
- Nenhuma informação se perde ao alternar entre seções na mesma sessão.
- O código está modular e sem páginas gigantes.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.


---

# PROMPT 03 — Formulários: Dados do cliente e Perfil da persona

## C — Contexto
O esqueleto visual está pronto. Implemente apenas as **duas primeiras seções**, reproduzindo as perguntas visíveis em `referencias/01-dados-cliente.png` e `referencias/02-perfil-persona.png`. O propósito é montar um modelo genérico que possa ser usado com diversos clientes, e NÃO inventar os dados de um cliente real.

## T — Tarefa
1. Em **Dados do cliente**, implemente campos: nome da empresa/cliente (obrigatório), nome do responsável, segmento/nicho, produto ou serviço principal, ticket médio em reais, localização, descrição resumida, principais concorrentes e diferencial competitivo. Esses campos aparecem nas capturas ou no resumo exibido.
2. Em **Perfil da persona**, implemente: nome fictício, faixa etária, gênero predominante, estado civil, se tem filhos, região geográfica, escolaridade, renda mensal aproximada, ocupação/profissão e classe social. Crie também bloco separado de **estilo de vida e interesses**, cujo título aparece na imagem, com perguntas complementares claramente identificadas como enriquecimento do modelo, não transcrição literal do vídeo.
3. Use inputs, textareas, selects e opções multisseleção onde fizer sentido. Inclua descrição curta/placeholder ilustrativo, sem preencher dados de demonstração por padrão. A escolha `Não sei / Não informado` deve ser permitida quando aplicável; não force suposições sobre demografia.
4. Valide campos obrigatórios e valores monetários de modo legível. Faça alterações refletirem no estado compartilhado de `/persona`. Crie tipos e configurações de campos separados de componentes de apresentação.
5. Utilize componentes acessíveis e com feedback claro. O percentual de progresso deve considerar campos reais e não penalizar campos opcionais como se todos fossem obrigatórios. Documente a fórmula escolhida.

## R — Critérios de aceite
Teste preenchimento, navegação e preservação de dados dentro da sessão; erros não devem eliminar informação digitada. Não implemente outras seções nesta etapa.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.


---

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


---

# PROMPT 05 — Comunicação, Google Ads e site/landing page

## C — Contexto
As seções 1 a 5 já funcionam. Construa as seções 6, 7 e 8 a partir de `referencias/06-comunicacao-tom.png`, `referencias/07-google-ads.png` e `referencias/08-site-landing.png`. O resultado continua sendo um BRIEFING, não uma campanha criada nem um site publicado.

## T — Tarefa
1. **Comunicação & tom de voz**: chips de tom (amigável, profissional, urgente, inspiracional, direto ao ponto, empático, descontraído, técnico/especialista), formalidade (informal, semiformal, formal — seleção única), palavras-chave que ressoam, termos a evitar e mensagem principal/Big Idea.
2. **Google Ads — Rede de Pesquisa**: termos que clientes usariam no Google (ajuda sugerindo pelo menos 10 hipóteses, sem validá-las como volume real), palavras-chave negativas, intenção de busca (informacional, navegacional, comercial, transacional), área geográfica, proposta de valor, possíveis chamadas e mensagens coerentes com a persona. Separe campos visíveis na captura de enriquecimentos de briefing. Não invente CPC, orçamento, volume, concorrência ou dados de Keyword Planner.
3. **Site & landing page**: cores da marca, estilo visual (moderno/clean, luxo/premium, vibrante/colorido, sério/corporativo, acolhedor/humano), seções desejadas (hero, sobre, serviços, depoimentos, FAQ, contato/CTA, blog, cases, preços), referências de concorrentes, CTA principal, provas sociais disponíveis e recursos reais que o cliente pode fornecer. Não crie depoimentos falsos.
4. Utilize mesmos padrões de componentes, validação e estado global já existentes; continue modular.
5. Exiba mensagens explicativas curtas deixando claro que sugestões de SEO/Ads precisam de validação e que o formulário não se conecta sozinho ao Google Ads.

## R — Critérios de aceite
Os dados devem seguir para o resumo final sem que uma seção substitua o conteúdo de outra. Não inicie serviços externos, campanhas ou publicações.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.


---

# PROMPT 06 — Resumo, progresso, salvamento, busca, ajuda e PDF

## C — Contexto
As oito seções de perguntas estão prontas. O vídeo mostra uma nona seção `Resumo final`, o percentual preenchido, `Buscar perguntas`, `Ajuda` e `Exportar PDF`. Agora essas funções precisam operar de verdade. Compare especialmente `referencias/09-resumo-final.png` com as outras capturas.

## T — Tarefa
1. **Resumo final**: gerar instantaneamente uma visão organizada de todas as seções em cartões, com rótulos e valores legíveis. Campos vazios podem aparecer como `—`; listas devem ser legíveis e preservar acentos. Refletir edições em tempo real.
2. **Progresso**: indicador reativo, baseado em critério de preenchimento explicado e documentado. Nunca mostre `100%` só porque o usuário visitou as abas.
3. **Persistência**: salvar automaticamente no `localStorage`, com controle de versão do esquema e recuperação após F5/reabrir o navegador. Exibir status `Salvo localmente`. Incluir ação de limpar com confirmação. Ofereça exportar/importar JSON como backup opcional útil para transporte entre computadores; valide esquema e nunca substitua dados sem confirmação. Informe que localStorage fica apenas neste navegador/dispositivo.
4. **Buscar perguntas**: caixa/modal que pesquisa títulos, perguntas e descrições; clicar em um resultado navega à seção e posiciona o campo correto.
5. **Ajuda**: janela com objetivo de cada seção, diferença entre público-alvo e persona, definição de termos básicos e instruções para preencher, salvar e exportar.
6. **Exportar PDF**: botão deve gerar um PDF A4 legível do briefing (todas as seções) a partir dos dados reais preenchidos, com cabeçalhos, paginação correta, quebras adequadas, sem cortar linhas/chips e sem exportar a navegação. Prefira biblioteca apropriada e atual documentada; se usar imprimir/salvar em PDF em vez de download direto, o rótulo e a orientação precisam corresponder ao funcionamento real. Nome do arquivo a partir do cliente, sanitizado. Evite dependências pagas.
7. Verifique perfis mobile, teclado, campos extensos, formulário parcialmente vazio e múltiplas páginas do PDF.

## R — Critérios de aceite
Demonstre: preencher dois campos → atualizar resumo/progresso → recarregar página → manter conteúdo → localizar pergunta → abrir ajuda → gerar PDF com os dois campos. Anote quaisquer testes não executados.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.


---

# PROMPT 07 — Aplicar o template para um nicho (PARTE CONCEITUAL DO VÍDEO)

## C — Contexto
O professor diz que, depois de criar o modelo PersonaDoc, podemos pesquisar um segmento (ele exemplifica higienização de sofás) e produzir uma persona desse segmento. Isso foi sugerido na fala, não demonstrado como botão com IA já integrado ao HTML. Não invente uma automação paga. Agora quero transformar o template vazio em um briefing útil para UM cliente real.

## T — Tarefa
1. **Pergunte primeiro** qual empresa/segmento, produto/serviço, cidade/região e fontes de informação eu tenho. Faça perguntas simples; aceite respostas parciais. Não presuma o nicho sem que eu confirme.
2. Leia o esquema de dados do PersonaDoc no projeto. Pesquise apenas se houver acesso a fontes públicas ou MCP `fetch`; se não houver, diga claramente e use somente minhas informações.
3. Gere duas saídas: um documento `pesquisa-persona-[slug].md` com (a) informações confirmadas pelo cliente, (b) fatos externos com URL e data, (c) hipóteses ainda não validadas; e um `persona-[slug].json` compatível com a importação criada na etapa 06.
4. Proponha termos para Google Ads, dores, objeções, tom e argumentos para landing page como **hipóteses**; não declare volumes de pesquisa, CPC, ROAS, renda média, idade do público ou taxa de conversão sem evidência verificável.
5. Não preencha dados pessoais reais de clientes finais sem necessidade, não invente concorrentes, depoimentos, certificações, garantias ou avaliações. Se o nicho for regulado (saúde, direito etc.), sinalize necessidade de revisar as regras aplicáveis antes de produzir anúncios.
6. Não integre IA dentro do app nesta etapa. Isso seria evolução opcional, com backend, privacidade, custos e credenciais próprios.

## R — Critérios de aceite
Mostre o que veio de dados conhecidos, pesquisas e suposições. Produza JSON válido que o aplicativo importa corretamente; peça minha validação da persona antes de tratá-la como definitiva.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.


---

# PROMPT 08 — Dashboard de tráfego pago baseado nas duas capturas

## C — Contexto
O vídeo ABRE mostrando um painel sofisticado de tráfego, mas não fornece prompt integral, código nem origem dos dados. As referências `referencias/10-dashboard-metricas.png` e `referencias/11-dashboard-funil.png` exibem um layout preto/amarelo com KPIs, comparativo de períodos, gráfico de rosca de investimento e seção de funil. Reconstrua o que está visível e complemente apenas o necessário ao funcionamento, sem declarar que partes invisíveis são idênticas ao original.

## T — Tarefa
1. Crie `/relatorios` como módulo SEPARADO do PersonaDoc, com cabeçalho de período, filtros e área de resumo. Visual dark premium, ênfase amarelo-ouro, cards discretos, números de destaque, badges de variação positiva/negativa e ajuda por indicador.
2. Métricas principais: investimento, impressões, cliques, CTR, CPC médio, conversões, taxa de conversão, custo por conversão, valor de conversão e ROAS. Mostrar período atual vs. anterior somente se os dois conjuntos de dados existirem. Fórmulas: CTR=cliques/impressões×100; CPC=investimento/cliques; taxa conv.=conversões/cliques×100 (esclarecer que depende da definição de conversão); custo/conv.=investimento/conversões; ROAS=valor de conversões/investimento. Se denominador zero, mostrar `—`. Variação % = (atual−anterior)/|anterior|×100 apenas quando comparável.
3. Implemente gráfico de barras para períodos, rosca para investimento vs. orçamento restante **somente se houver orçamento conhecido** e funil de aquisição com métricas coerentes. Não invente orçamento de 25 dias ou etapas de venda que não existam na fonte.
4. Fonte de dados fase 1: **importação de CSV** e formulário manual, com documentação do formato aceito e pré-visualização; use os dados de exemplo apenas como DEMONSTRAÇÃO visual, com tarja `Dados fictícios`, nunca como relatório real. Importar Google Ads via API NÃO faz parte desta etapa nem está demonstrado no vídeo.
5. Permitir trocar períodos, redefinir filtros, exibir explicações de KPIs e gerar PDF do relatório com o período e a fonte dos dados. Os cálculos devem usar funções puras e testes unitários.
6. Separe componentes de UI, funções de métricas, modelos de dados, importação e exportação. Não quebre `/persona`.

## R — Critérios de aceite
Compare visualmente com as capturas; teste ao menos dois cenários de dados, denominadores zero, período anterior ausente e filtros. Exponha fonte/importação e carimbo de data no relatório. Nunca alegue conexão ativa a Google Ads sem autenticação e API efetivamente integradas.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.


---

# PROMPT 09 — Auditoria final, correções e entrega guiada

## C — Contexto
As etapas de PersonaDoc e dashboard foram concluídas. Quero uma validação técnica e funcional, com instruções simples de execução no Windows. Não desejo funcionalidades novas não solicitadas.

## T — Tarefa
1. Revise requisitos dos prompts 01–08 e contraste com capturas em `referencias/`. Gere `AUDITORIA_FINAL.md` com matriz `requisito / evidência / resultado / pendência` e distingua recursos do vídeo de melhorias adicionadas.
2. Execute, quando disponíveis, typecheck, lint, build, testes e navegação automatizada (Playwright ou ferramenta existente). Não afirme testes que não foram executados.
3. Teste 9 abas, conteúdo parcial, chips, campos obrigatórios, progresso, pesquisa de perguntas, ajuda, persistência após F5, backup JSON, resumo, PDF, rotas, importação CSV, filtros, fórmulas/percentuais e exportação do relatório.
4. Inspecione visualmente em desktop (ex.: 1440 px) e mobile (ex.: 390 px) comparando elementos observáveis com os prints. Verifique contraste, foco, responsividade, strings pt-BR e formato monetário.
5. Verifique limites de linhas dos arquivos, exposição de dados sensíveis, dependências vulneráveis, segredos inadvertidos, warnings de hidratação e erros em console. Corrija apenas defeitos diretamente relacionados e reteste.
6. Gere `COMO_USAR_NO_WINDOWS.md` com instruções de instalar dependências, rodar localmente, acessar `/persona` e `/relatorios`, preencher, salvar, importar e exportar arquivos. Explique claramente que o salvamento padrão é local e não sincroniza PCs.
7. Resuma as limitações: reproduz interface observada, não reproduz detalhes não mostrados; não existe integração automática com Google Ads, Supabase ou IA sem etapa específica.

## R — Critérios de aceite
Entregue relatório honesto com PASSOU/FALHOU/NÃO TESTADO por item, comandos usados e instruções de como eu posso reproduzir os testes.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.


---

# PROMPT 10 (OPCIONAL) — Transformar em ferramenta multi-clientes com Supabase

## C — Contexto
O aplicativo local já foi entregue, testado e aprovado. Esta NÃO é uma funcionalidade do vídeo. Agora quero avaliar uma evolução comercial para guardar vários clientes e abrir os dados em computadores diferentes, sem perder as fichas.

## T — Tarefa
1. Faça antes um plano arquitetural de evolução de `localStorage` para Supabase, com projetos/clientes, autenticação, autorização, perfil de gestor, exportação e backups. Não implemente ainda até minha aprovação.
2. Consulte a documentação via Context7 e, **se disponível/conectado**, use Supabase MCP para inspecionar o projeto autorizado sem tocar em produção antes de aprovação explícita. Defina esquema simples e RLS obrigatória por usuário/organização; inclua ownership nas personas e relatórios.
3. Projete importação assistida dos dados locais para a conta, tratando conflitos e preservando backups. Nada de guardar chaves service_role no frontend.
4. Apresente trade-offs de custo, privacidade, sincronização, hospedagem, multiusuário e recuperação.
5. Só depois de eu aprovar o plano, implemente por pequenas entregas com migrações revisadas e testes de isolamento entre dois usuários.

## R — Critérios de aceite
Não crie banco/tabelas/políticas nem publique sem meu OK explícito. Esta melhoria não pode ser confundida com o procedimento mostrado no vídeo.
### Regras técnicas obrigatórias desta etapa
- Use os MCPs realmente disponíveis, conforme aplicáveis: **Context7** para validar documentação atual, **shadcn/ui** (ou shadcn-vue, compatível com a stack escolhida) para componentes, **fetch** para consultar fontes públicas quando necessário e **Supabase MCP** somente quando existir um requisito real de banco/autenticação. Não invente disponibilidade nem resultado de MCP.
- Arquivos que implementem lógica: **máximo 200 linhas por arquivo**. Outros arquivos em geral: **máximo 500 linhas por arquivo**. A única exceção a esses tetos são arquivos exclusivamente de auditoria. Separe responsabilidades em módulos, componentes e composables em vez de concentrar código.
- Não acrescente dependências, contas externas ou custos sem necessidade; não acesse produção nem modifique outros projetos. Não insira dados fictícios como se fossem de clientes reais.
- Trabalhe somente nesta etapa. Ao concluir, informe arquivos criados/alterados, comandos e testes executados, limitações e o que preciso verificar. **Pare e aguarde meu OK** antes de iniciar a próxima etapa.

# Instalação em linguagem simples — AD Telas / Aula Sabri Suby

Este é um **COMPLEMENTO ADITIVO** do kit anterior `kit-claude-code-google-ads-cro.zip`. Ele **não substitui** o `CLAUDE.md` antigo, o código da landing page, as regras do projeto nem as Skills existentes.

## O que baixar e enviar ao Claude?
- **Arquivo principal:** `INSTRUCOES-PARA-CLAUDE-CODE-AULA-SABRI.md`. Se você só quiser enviar **um arquivo** ao Claude Code, envie este.
- **ZIP completo:** contém o arquivo principal, o guia humano, a explicação passo a passo e seis Skills próprias para essa aula.
- **IMPORTANTE:** o ZIP não contém o kit antigo; é apenas uma extensão. Guarde ambos.

## Como instalar (no computador, Windows)
1. Abra a pasta do **projeto correto da AD Telas** no VS Code/IDE. Não confunda com GMK Telas Mosquiteiras ou com outro cliente.
2. Faça backup do projeto ou use uma branch Git. Se ainda não instalou o kit anterior, instale-o primeiro.
3. Baixe e descompacte este complemento. Copie os arquivos para **a raiz da pasta do projeto** (onde fica seu `CLAUDE.md`); preserve `.claude/skills/`, `docs/` e `INSTRUCOES-PARA-CLAUDE-CODE-AULA-SABRI.md`.
4. A pasta `.claude` pode estar oculta no Windows. Habilite a visualização de itens ocultos no Explorador.
5. **Não substitua nenhum arquivo existente com o mesmo nome** sem comparar o conteúdo. As seis Skills deste kit usam nomes novos para reduzir conflitos.
6. Abra o Claude Code dentro da pasta da AD Telas. Cole o prompt abaixo.
7. Claude deverá **ler e trabalhar em modo SOMENTE LEITURA** para Google Ads, alterações remotas, custos, publicação e demais ambientes reais. Ele só preparará diagnóstico e proposta.
8. Quando ele listar o que está faltando, preencha `docs/BRIEFING-AD-TELAS-AULA-SABRI.md` e siga `docs/CHECKLIST-HUMANO-AULA-SABRI.md`.

## Primeiro prompt (copie inteiro)

> Leia o CLAUDE.md existente e todas as regras/Skills do projeto. Em seguida, leia `INSTRUCOES-PARA-CLAUDE-CODE-AULA-SABRI.md`, `docs/AULA-SABRI-DESTRINCHADA.md`, `docs/BRIEFING-AD-TELAS-AULA-SABRI.md` e `docs/CHECKLIST-HUMANO-AULA-SABRI.md`. Trate os novos arquivos como **complemento**, não substituição. Faça uma auditoria READ-ONLY do projeto e dos CSVs disponíveis da conta correta da AD Telas. Verifique se tenho os relatórios necessários, explique em linguagem simples o que eu preciso fornecer, identifique as palavras-chave com evidência, escreva hipóteses de anúncios e organize um plano por fases. Não altere Google Ads, campanhas, negativas, lances, orçamentos, CRM remoto, GTM, GA4 ou produção. Use MCPs disponíveis quando aplicáveis; não presuma conexão inexistente. Respeite 200 linhas por arquivo de lógica e 500 para outros arquivos de código, com exceção de arquivos de auditoria. Entregue resumo, evidências, dúvidas essenciais, tarefas humanas e três próximos passos.

## Segundo prompt (somente após a auditoria)

> Com os relatórios reais e briefing confirmado, execute primeiro a Skill `/sabri-palavras-campeas` e depois `/sabri-bonsai`. Mostre uma tabela com fatos, análise, gasto, conversões, confiança, risco e sugestões — sem aplicar nenhuma alteração. Em seguida proponha as próximas Skills na ordem de valor e risco.

## O que este complemento NÃO faz
- Não conecta o Google Ads sozinho; não cria campanhas ou dados.
- Não gera receitas, avaliações, preços ou garantias inventados.
- Não permite ao Claude anunciar por marcas concorrentes, aumentar orçamento ou importar negativas sem sua aprovação específica.
- Não garante 80/20, 85% de parcela de impressões, ROI, posição 1, clientes ou os resultados financeiros alegados pelo apresentador.

**Fonte original:** https://www.youtube.com/watch?v=7xtRHa7b96w  
**Vídeo:** Sabri Suby, “Give Me 24 Minutes and I'll Make You Disgustingly Good at Google Ads” (publicado em 04/09/2026).  
**Nota:** a transcrição anexada é automática e contém erros de tradução. A organização abaixo usa a transcrição e foi cotejada com a página do vídeo; as regras operacionais são nossa adaptação, não transcrição literal.

# KIT DE PROMPTS PARA CLAUDE CODE — PERSONADOC + DASHBOARD

## O que é
Este kit permite desenvolver, passo a passo, um sistema inspirado no vídeo enviado. **O vídeo demonstra no Claude chat um modelo PersonaDoc em HTML**; ele explica o método **CTR = Contexto, Tarefa e Regras**, valorizando referências. O dashboard é mostrado como exemplo; seu prompt integral e sua conexão de dados não são exibidos. A implementação em Nuxt é uma **adaptação para Claude Code**, não uma alegação de que a aula usou Nuxt.

## Início no Windows / VS Code
1. Crie uma pasta NOVA e vazia para o projeto (ex.: `C:\Projetos\personadoc-trafego`). Não use a pasta de projeto de cliente existente.
2. Extraia **todo o conteúdo da pasta `KIT_CLAUDE_CODE_PERSONADOC`** para dentro dessa pasta, mantendo `prompts/` e `referencias/`.
3. Abra essa pasta no VS Code e execute o Claude Code nesse diretório.
4. Envie este texto ao Claude Code: `Leia integralmente o arquivo prompts/01-preparar-projeto.md e execute APENAS a etapa 01. Antes de instalar ou sobrescrever algo, peça minha aprovação. Ao terminar, pare.`
5. Analise o que ele fez. Quando estiver correto, dê seu OK e envie: `Leia integralmente o arquivo prompts/02-layout-navegacao.md e execute APENAS a etapa 02. Ao terminar, pare e mostre testes.`
6. Continue assim com cada arquivo, SEM pular o aceite de uma etapa.
7. Na etapa 07, informe um cliente ou nicho real para a pesquisa: ela é opcional para a construção do layout, mas útil para usar o sistema.
8. A etapa 08 é o dashboard; a 09 é auditoria; a 10 é evolução opcional para Supabase, NÃO parte da aula.

## Ordem recomendada
| Etapa | Arquivo | Resultado |
|---|---|---|
| 01 | `01-preparar-projeto.md` | Planejamento e escolha segura da pasta |
| 02 | `02-layout-navegacao.md` | Menu, layout, navegação e identidade visual |
| 03 | `03-cliente-e-perfil.md` | Dados do cliente e perfil da persona |
| 04 | `04-dores-digital-jornada.md` | Dores, comportamento e jornada |
| 05 | `05-comunicacao-ads-landing.md` | Tom, briefing Google Ads e landing page |
| 06 | `06-resumo-pdf-busca-ajuda.md` | Resumo, salvamento, PDF, busca, ajuda |
| 07 | `07-usar-persona-para-um-nicho.md` | Pesquisa e persona de um cliente específico |
| 08 | `08-dashboard-trafego.md` | Dashboard de métricas e gráficos |
| 09 | `09-auditoria-e-entrega.md` | Revisão, testes e guia de uso |
| 10 | `10-opcional-multiclientes-supabase.md` | Evolução opcional multi-clientes |

## Convenção de aprovação
Depois de cada etapa, envie `OK, pode começar a próxima etapa` somente se os critérios de aceite tiverem sido atendidos. Se houver defeito, peça ao Claude Code para corrigir os defeitos **da etapa atual**, testar novamente e parar, antes de avançar.

## Limites e cautelas
- Persona é hipótese estruturada que precisa ser validada com informações reais.
- Não use números inventados como resultados de tráfego.
- Os PDFs, buscas e persistência só devem ser anunciados como prontos quando testados.
- Os screenshots não mostram a página inteira; itens inferidos nos prompts estão identificados como complementos.
- Não existe integração automática Google Ads nem Supabase na versão-base.

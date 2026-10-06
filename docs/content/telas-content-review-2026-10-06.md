# Revisão de conteúdo comercial — 06/10/2026

## Escopo e evidências

Sete URLs existentes: `/servicos/telas` e as páginas de janelas, portas, sacadas-e-varandas, removivel, pet-screen e restaurantes. Esta etapa trata de conteúdo; não modifica mapas de redirecionamento, canonicals, novas URLs, banco de dados ou configuração de campanhas. Sem deploy.

O inventário anterior à edição está em `telas-rendered-before-2026-10-06.json`: title, description, H1/H2/H3, palavras aproximadas no main, FAQs, links/CTAs, imagens, vídeos e JSON-LD por página. Captura feita no servidor local que já estava em execução; os objetos de conteúdo presentes no código antes das edições também foram preservados em `telas-before-2026-10-06.json`. As contagens do HTML incluem formulários, galeria e serviços relacionados, portanto não são metas editoriais nem representam apenas a descrição do produto.

Fontes examinadas: dados em `app/data/telas`, componentes compartilhados, catálogo em `server/shared/localServiceMediaCatalog.mjs`, API pública de mídias, imagens locais e documentação anterior em `docs/telas-detail-audit.md`. A auditoria de setembro registrava ausência de mídias na API; na captura atual há vídeos locais catalogados em quatro dos serviços. Não se deve repetir a conclusão antiga de galeria vazia.

Cobertura estadual foi confirmada pelo usuário e já consta do projeto. Avaliações continuam usando `app/data/telas/reviews.ts`: 49, nota 5,0, conferidas em 22/09/2026. A data não foi atualizada sem nova conferência.

Não foram encontrados exports de desempenho do Search Console na busca pelo projeto. Uma menção a integração futura em documento de auditoria não fornece impressões, CTR ou posições. Não foram inventados volumes ou ganhos de ranking. Não foi necessária pesquisa de concorrentes para esta revisão: as intenções vieram do briefing e as aplicações do acervo existente. Nenhuma norma sanitária foi citada como fundamento do serviço.

## Diagnóstico anterior por página

| Página | Palavras aproximadas no main | Classificação e problema | Direção editorial |
| --- | ---: | --- | --- |
| Telas | 681 | COMERCIAL: catálogo, avaliações, formulário. REPETIDO: lista extensa com destinos equivalentes. GENÉRICO: benefícios e chamadas. ÚTIL: cobertura e prazo condicionado. | Comparar seis aplicações visíveis e orientar a escolha por abertura, rotina e necessidade. |
| Janelas | 742 | ESPECÍFICO/TÉCNICO: correr, basculante, maxim-ar, pivotante e projetante. ÚTIL: medição e teste de abertura. NÃO COMPROVADO: compatibilidade universal e malha que reteria apenas insetos sem outras implicações. | Prioridade comercial: compatibilidade, puxadores, condomínio, fixação, limpeza, orçamento e próximos passos. |
| Portas | 730 | ESPECÍFICO: giro, balcão de correr e desenho de porta dupla. GENÉRICO: processo idêntico ao de outros serviços. NÃO COMPROVADO: ausência universal de impacto no espaço de passagem. | Explicar circulação frequente, espaço para abertura, soleira, trilhos e fechamento. |
| Sacadas | 698 | ÚTIL: distinção de rede contra quedas. REPETIDO: benefícios copiados de janelas. NÃO COMPROVADO: compatibilidade garantida com vidro e manuseio fácil em acesso restrito. | Condicionar a aplicação aos vãos, apoios, condomínio, exposição e acesso para limpeza. |
| Removível | 665 | ESPECÍFICO: retirada do quadro. REPETIDO: três modelos descritos sem diferenças claras. NÃO COMPROVADO: retirada sempre simples, sem ferramentas e a qualquer momento. | Explicar encaixe, comparação com tela fixa, recolocação e limitações do acesso. |
| Pet Screen | 678 | ÚTIL: finalidade contra insetos e diferença para rede. REPETIDO: mesmo texto no modelo e benefício. TÉCNICO sem ficha: malha mais espessa/trama milimétrica. | Explicar contato com animais sem prometer resistência absoluta, contenção ou proteção contra quedas. |
| Restaurantes | 659 | ESPECÍFICO: preparo, despensas e passagens. REPETIDO: etapas residenciais. NÃO COMPROVADO: conservação de alimentos e conformidade sanitária nas legendas. | Abordar circulação operacional, limpeza, levantamento de vãos e planejamento da instalação. |

Nas seis páginas de detalhe, H2s como “Soluções para cada necessidade”, “Mais qualidade em cada detalhe” e “Proteja sua casa hoje mesmo” eram compartilhados. “Sob medida”, “proteção” e “ambiente” apareciam reiteradamente sem informação adicional. Foram mantidos onde ajudam a explicar a aplicação, substituindo os blocos vazios por critérios concretos de escolha. Titles já úteis foram preservados; o title de restaurantes foi encurtado. Descriptions e OG foram alinhados ao texto revisado.

## Mídia e experiência real

- Janelas: três vídeos e uma foto no catálogo público local; destaque para janela com veneziana de madeira, conjunto de quadros e aplicação em porta/janela.
- Portas: três vídeos catalogados, incluindo abertura por dobradiças e painéis de correr.
- Removível: dois vídeos catalogados, incluindo retirada e recolocação do quadro.
- Restaurantes: dois vídeos catalogados em balcões de cozinha/refeitório.
- Sacadas e Pet Screen: a API não retornou trabalhos cadastrados; permanecem referências locais de catálogo, sem atribuição de cliente, bairro ou autoria.

A galeria existente já apresenta títulos e legendas por mídia. As legendas locais foram revisadas na fonte, preservando IDs, caminhos e arquivos. Removidas promessas como “proteção total”, “circulação desimpedida”, “perfis resistentes a intempéries”, “roldanas de alto padrão” e “adequação rigorosa às normas da Anvisa”. A galeria funciona como exemplo contextual na própria página; não foram criadas URLs de cases.

Imagens de catálogo visualmente inspecionadas receberam alt descritivo: janela de madeira, painel deslizante, quadro aberto para dentro, porta entre quarto/varanda, tela parcialmente baixada em varanda, pontos de fixação e peça promocional Pet Screen. A imagem promocional não foi tratada como laudo técnico. No hub, as imagens agora reutilizam as referências do catálogo com dimensões intrínsecas declaradas. Mantidos lazy loading das imagens secundárias e prioridade da primeira imagem do hero.

## Conteúdo e conversão implementados

Cada página tem perguntas próprias, orientações para orçamento e critérios de medição/instalação. Não há preço, prazo fixo, garantia, certificação ou estatística inventada. O valor é explicado pelos fatores do projeto e o prazo fica para confirmação na proposta.

Os links contextuais conectam limpeza a removível, abertura frequente a portas/janelas, ambientes com animais a Pet Screen e risco de queda a redes de proteção. No hub, os seis serviços têm links diretos; a lista legada de aplicações redundantes foi retirada.

A conferência das âncoras encontrou um erro real no menu compartilhado: `#depoimentos` não existia nas seis páginas. O link agora leva a `/servicos/telas#avaliacoes`, onde está a seção que utiliza a fonte central de avaliações.

CTAs dos detalhes descrevem a ação (“Consultar minha janela”, “Avaliar minha varanda”, “Orçar minha cozinha”). O formulário existente recebeu acesso por âncora no hero, e a área de orçamento explica o que enviar. Mantidos telefone, número do WhatsApp, mensagens específicas, service_key, contexto de CTA, modal, formulários e módulos de atribuição/tracking. Corrigido o mapeamento dos cards do hub para as chaves canônicas de sacadas e Pet Screen, agora visíveis junto dos demais serviços.

O `Service` continua derivando nome e descrição do mesmo objeto usado no conteúdo visível. Breadcrumbs e schema global não foram reconstruídos. Não foi introduzido FAQPage com texto divergente do conteúdo.

## Validação

- Build de produção aprovado. Os avisos existentes de imports duplicados e Browserslist não impediram a compilação; os módulos administrativos associados não foram alterados nesta etapa.
- `npm run test:seo -- http://localhost:3013`: 20 rotas, 47 redirects e 5 respostas 404 aprovadas na compilação final.
- Sete páginas com um H1 principal; descrições do `Service` iguais às descrições visíveis; 12 destinos internos diretos respondendo 200.
- Playwright MCP oficial, via cliente MCP/stdio: sete páginas em 375×667, 390×844 e 1280×800. Sem overflow horizontal ou títulos/botões fora da largura. Os CTAs principais permanecem visíveis no hero.
- Abertura do modal do WhatsApp confirmada em todas as páginas, com evento `whatsapp_modal_open`, `cta_location=hero` e chave do serviço correta. URLs, mensagens e chaves das seis páginas foram comparadas com o inventário anterior e preservadas. Nenhum lead foi enviado durante os testes; não se afirma aqui validação de conversões reais no Google Ads.
- Capturas inspecionadas em `scratch/commercial-mcp/`. A primeira passagem de medição foi ajustada para eliminar a interferência da rolagem suave no posicionamento vertical; os dados finais estão em `telas-mcp-validation-2026-10-06.json`.
- `git diff --check` sem erros de whitespace. As alterações locais anteriores continuam presentes; não houve reset, atualização de branch, commit ou deploy nesta etapa.

A compilação final também foi aprovada após a correção do menu. Na validação suplementar pelo Playwright MCP, janelas, removível e restaurantes passaram em 375×667 e 1280×800. O link do hero levou à área de formulário nas seis combinações; a seção ficou a aproximadamente 16 px do topo. A primeira verificação tinha aguardado somente 900 ms, antes do fim da rolagem suave; após aguardar a conclusão, confirmou-se o funcionamento sem alteração adicional do site. O clique em Avaliações abriu `/servicos/telas#avaliacoes` e exibiu a contagem central de 49. Evidências em `telas-final-navigation-2026-10-06.json`.

Todas as âncoras locais das sete páginas foram novamente conferidas no HTML final, sem destinos ausentes. O inventário final está em `telas-rendered-after-2026-10-06.json`. Prévia local: `http://localhost:3013/servicos/telas/janelas`.

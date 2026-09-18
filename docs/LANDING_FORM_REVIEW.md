# Formulário da landing page de telas — 18/09/2026

Página alterada: `/servicos/telas`.

## Alterações

- Formulário visível no início da página: nome, WhatsApp com DDD, CEP e tipo de instalação.
- CTA principal direciona ao formulário; WhatsApp e telefone seguem como alternativas.
- O botão de orçamento móvel leva ao mesmo formulário.
- Na landing de telas, o botão flutuante deixa de cobrir os campos. A barra móvel fica oculta enquanto o formulário está visível e reaparece ao navegar pelo restante da página.
- Envio utiliza `/api/send-lead`, preservando identificação da submissão e atribuição da campanha.
- CEP é salvo na mensagem do pedido, usando a estrutura existente de leads; tipo de instalação aparece no serviço e na mensagem. Cidade fica como “A confirmar pelo CEP”, sem inferir a cidade a partir de um CEP não consultado.
- Confirmação na própria landing page, somente após resposta com `success`, `leadSaved` e `leadId`. Os outros formulários mantêm o redirecionamento para `/obrigado`.
- Erros mantêm os dados preenchidos e permitem nova tentativa com o mesmo identificador.

## Conversões

O formulário reutiliza o evento `lead_form_success` e o destino Google Ads já existente. Nenhum novo identificador de conversão foi inventado. Cliques no WhatsApp continuam separados dos envios de formulário.

O registro interno de cliques não confirma conversa iniciada nem lead qualificado. Antes de tornar WhatsApp uma conversão principal, validar a tag secundária na conta Google Ads/GTM e comparar registros com contatos reais recebidos. Nenhuma configuração da conta Google Ads foi alterada.

## Validação

Os testes locais de envio cobrem confirmação de gravação, respostas incompletas, erro, nova tentativa, clique duplo, atribuição, CEP e confirmação sem sair da página. As suítes existentes de conversão e formulários também foram executadas; duas referências antigas dos testes foram corrigidas para carregar o utilitário de conversões atual.

Os testes de navegador usam respostas simuladas e bloqueiam chamadas externas. Eles não comprovam entrega de pedidos ou recebimento das conversões em produção.

Resultado: compilação de produção concluída. Testes de navegador aprovados em 1440, 390 e 320 pixels, sem transbordamento horizontal nem erros JavaScript. Verificados campos obrigatórios, telefone inválido, preservação dos dados após falha, nova tentativa com mesmo identificador, CEP e atribuição no pedido, confirmação na página, uma conversão de formulário e clique de WhatsApp separado. Capturas em `artifacts/landing/`.

A compilação mantém avisos preexistentes de importações duplicadas no CRM, Browserslist e dependências; nenhum erro de compilação.

## Publicação

Alterações locais. Este diretório não contém vínculo Git, configuração Vercel ou credenciais de produção. Publicação e teste ponta a ponta em produção ainda precisam ser realizados pelo fluxo de implantação do site.

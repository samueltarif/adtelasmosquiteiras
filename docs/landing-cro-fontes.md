# Landing /lp/telas-mosquiteiras — CRO (29/09/2026)

- Nota Google: reutiliza `app/data/telas/reviews.ts` (5,0; 49 avaliações; conferência registrada em 22/09/2026). O hero informa a data e direciona ao perfil real. Não houve nova confirmação ao vivo; o link curto não respondeu à consulta.
- Confirmado pelo proprietário na conversa: mais de 1.000 clientes atendidos; 2 anos de garantia; durabilidade de 5 anos; visita gratuita ao cliente para orçamento em até 24h.
- Cobertura da garantia: defeitos de instalação, conforme o template já existente em `app/composables/useServicos.js`.
- Prazo de execução da instalação: confirmado no orçamento, conforme modelo, medidas e quantidade. A visita em até 24h não é apresentada como instalação em 24h.
- CTA principal: “Solicitar orçamento grátis agora”; links, mensagens e identificadores existentes preservados.
- Foto ilustrativa de mosquito: Pragyan Bezbaruah / Pexels, https://www.pexels.com/photo/close-up-view-of-mosquito-9891863/ . Licença: https://www.pexels.com/license/ (uso em sites e campanhas permitido). Arquivo local de 800px: `public/images/lp-comparativo-mosquito.jpg`.
- Foto de tela: arquivo otimizado já existente `public/images/telas/catalogo/mosquiteira-janela.webp`.
- Busca de imagens: “janela tela mosquiteira comparação sem tela com tela mosquitos imagens”, “mosquito window screen”, “mosquito close up”. Não se apresentam as fotos como antes/depois da mesma instalação.
- Responsividade implementada em CSS. Validação de viewports depende exclusivamente do Playwright MCP, indisponível na sessão; não usar outras ferramentas para substituir essa validação.

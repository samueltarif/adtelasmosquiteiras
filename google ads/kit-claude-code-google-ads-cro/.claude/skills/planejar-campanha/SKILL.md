---
name: planejar-campanha
description: Planejar uma campanha de pesquisa Google Ads com palavras-chave, anúncios, negativas, localização, orçamento e links para landing, sem publicar nada.
argument-hint: "[cliente ou serviço]"
---

# Planejar campanha (somente preparação)

Use as instruções do `CLAUDE.md` e `.claude/rules/google-ads.md`.

## Procedimento
1. Identificar o negócio e ler o briefing existente; não assumir que dados de outro cliente valem aqui.
2. Inventariar conta e campanhas **somente com leitura**, se conexão autorizada disponível; em outra situação pedir relatório/CSV do Planejador de palavras-chave.
3. Confirmar serviços, bairros/cidades atendidos, objeções comerciais, diferenciais verdadeiros, atendimento, orçamento e conversão principal.
4. Separar termos por intenção: compra/orçamento, pesquisa informativa, emprego/curso/DIY, fora da região, marca de concorrente etc. **Não negativar automaticamente** a categoria ambígua.
5. Propor grupos por intenção/serviço com exata e frase iniciais como hipótese; justificar qualquer correspondência ampla e automação.
6. Fornecer no máximo um conjunto enxuto de anúncios/variantes proporcionais ao volume e orçamento informado; incluir títulos, descrições, extensões válidas e URL de destino confirmada.
7. Apresentar configurações propostas: Rede de Pesquisa, presença/interesse, segmentação geográfica, idioma, redes, agenda, lances, rastreamento, orçamento, riscos e dependências.
8. Gerar plano e lista de verificações para preview; **não criar/ativar campanhas sem aprovação separada**.

## Entrega
- Quadro `Campanha → Grupo → Palavra-chave + correspondência → Anúncio → Landing`.
- Lista de negativas `candidata`, com justificativa e risco de falso bloqueio.
- Pontos ainda sem dados e responsabilidade humana.
- Estimativas de volume, CPC e resultado apenas se com fonte e data.

# Prompt para o Claude Code — Landing + conversão de lead real (AD Telas)

Cole no Claude Code, aberto na pasta do projeto do site adtelasmosquiteiras.com.br.

---

## C — Contexto
Projeto: site da AD Telas e Redes (adtelasmosquiteiras.com.br), Nuxt. Landing de Ads: /lp/telas-mosquiteiras.
Leia antes: CLAUDE.md, .claude/rules/*, e D:\ADT\google ads\estrategia-340\PLANO-CAMPANHA-340-REAIS.md (seções 5, 11, 13, 14).
Fatos confirmados pelo dono (18/10/2026): NÃO cobra taxa de visita; visita em até 24h conforme disponibilidade do cliente; janela comum instalada a partir de R$ 299; 49 avaliações no Google (5,0); atende Grande SP e interior até 2h de carro; NÃO vende tela avulsa; WhatsApp atendido pela Denise em horário comercial até 20h; tel. (11) 98358-6611.
Teste de rede do dono (18/10): ao enviar o pop-up do WhatsApp, `whatsapp-lead` retorna 200 e o Google tag (AW-473885322 via GTM) dispara `form_submit` automático para DOIS IDs: AW-17981093809 e AW-473885322.

## T — Tarefas (modo: alterações LOCAIS; nada em produção sem meu OK)
1. AUDITORIA (somente leitura): onde estão os textos "taxa de visita"/"conforme o CEP", contagem de avaliações (home diz 487+), GTM/gtag, e o fluxo do WhatsApp Gate (pop-up → POST whatsapp-lead → abre WhatsApp). Explique por que existem dois IDs AW e de onde vem cada um.
2. TEXTOS da LP e home:
   - Trocar qualquer "taxa de visita ... conforme o CEP" por "Visita e orçamento grátis".
   - Home: corrigir avaliações para "49 avaliações" (5,0), com data.
   - LP topo: adicionar linha "Nós vamos até você e instalamos. Não vendemos tela avulsa." e "Janela comum instalada a partir de R$ 299".
   - Ajustar "instalação em todo o estado de São Paulo" para "Grande São Paulo e interior (até 2h da capital)".
3. WHATSAPP GATE: adicionar campo obrigatório "Cidade/bairro" (texto curto) e opcional "Quantas janelas/portas?". Salvar no lead do CRM. Validar e não quebrar o fluxo atual.
4. BOTÃO LIGAR: ao lado do WhatsApp na LP (tel:+5511983586611), visível no mobile.
5. FAQ curta na LP: visita grátis, prazo, garantia (conforme proposta), pagamento (PIX, cartão, sem juros acima de R$ 1.000), condomínio. Só fatos acima.
6. CONVERSÃO "Lead identificado": disparar evento de conversão do Google Ads SOMENTE após o POST whatsapp-lead retornar sucesso, com ID único do lead (transaction_id) para deduplicar, uma vez por lead, SEM nome/telefone no evento. Me diga exatamente o que eu preciso criar no Google Ads (Metas > Conversões > Nova ação > Site > manual) e qual rótulo (label) colar, ou o que configurar no GTM. Guardar gclid/gbraid/wbraid no lead se ainda não estiver.
7. TESTES: build, lint, mobile 390px, envio válido/inválido, sem dupla conversão em refresh, Tag Assistant/DevTools mostrando 1 hit da nova conversão.

## R — Regras
- Use os MCPs disponíveis: Context7 (docs atuais Nuxt/gtag/GTM), Fetch, Supabase (se o CRM for Supabase; só leitura de schema antes de migração e com meu OK), shadcn quando for UI.
- Lógica ≤ 200 linhas por arquivo; demais ≤ 500.
- Não inventar avaliações, prazos, garantias ou preços além dos fatos acima.
- Não alterar Google Ads, GTM publicado, banco remoto ou deploy sem minha aprovação explícita. Mostre diff, testes e plano de reversão antes.
- Ao final: (A) fatos verificados, (B) mudanças feitas localmente, (C) o que eu preciso fazer no Google Ads/GTM passo a passo, (D) como reverter.

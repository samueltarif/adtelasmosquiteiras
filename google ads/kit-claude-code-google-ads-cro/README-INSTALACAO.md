# Kit Claude Code: Google Ads + CRO + CRM

Criado com base nas duas transcrições fornecidas pelo usuário, contrastadas com a documentação oficial disponível em 18/10/2026. O kit **não conecta contas sozinho**, não concede permissões e não publica campanhas automaticamente.

## Como instalar no seu projeto
1. Faça backup do projeto ou crie uma branch.
2. Extraia os arquivos do ZIP **na pasta raiz do seu projeto**, preservando as pastas `.claude/` e `docs/` (no Windows, habilite arquivos/pastas ocultos se necessário).
3. **Se já existir `CLAUDE.md`, NÃO substitua cegamente.** Peça ao Claude para mesclar as instruções, resolver conflitos e conservar a arquitetura e regras anteriores. Vale o mesmo para regras/skills homônimos.
4. Preencha `docs/BRIEFING-CLIENTE.md` e leia `docs/CHECKLIST-HUMANO.md`.
5. Abra o Claude Code na raiz do projeto, execute `/context` para confirmar se o arquivo `CLAUDE.md` foi carregado e consulte as Skills no menu `/`.
6. Peça uma auditoria local **sem alterações externas**, e depois convoque as skills uma a uma.

## Prompt inicial sugerido (copie e cole no Claude Code)

> Leia o CLAUDE.md, todas as regras em .claude/rules, o briefing, o checklist humano e a ordem de implementação. Faça uma auditoria READ-ONLY de todo o projeto, identifique as integrações existentes, o que está concluído e o que falta para aplicar o fluxo Google Ads → landing → lead → CRM → venda. Use Context7, Fetch, Supabase MCP (se aplicável) e shadcn/ui ou shadcn-vue (conforme stack), quando disponíveis. NÃO altere Google Ads, GTM, GA4, banco remoto nem produção. Apresente um plano por fases, pendências humanas e riscos, sem inventar dados. Respeite até 200 linhas de código por arquivo de lógica e até 500 linhas nos demais arquivos de código, exceto arquivos de auditoria.

## Skills disponíveis
- `/planejar-campanha` — campanha em rascunho com palavras, anúncios e negativas.
- `/auditar-google-ads` — auditoria com dados reais em somente leitura.
- `/otimizar-landing` — diagnóstico CRO, mobile e implementação local com testes.
- `/configurar-mensuracao` — rastreamento de lead, GTM/GA4/Ads e CRM.
- `/analisar-experimento` — análise séria de testes A/B.

## Aviso de atualização crítica (09/09/2026)
O vídeo pode mostrar a antiga obtenção do token de desenvolvedor da Google Ads API por meio de MCC. Esse processo foi descontinuado: níveis de acesso agora pertencem a projetos Google Cloud/OAuth. Google pode atualizar suas telas; **sempre conferir a documentação atual**.

## O que vem dos vídeos e o que foi ajustado
**Dos vídeos:** análise de keywords por intenção, alinhamento anúncio/landing, listas negativas, landing orientada à conversão, prova social, lead tracking, CRM, teste A/B, PostHog, otimização por receita, atendimento rápido e Skills.

**Ajustes para prática segura:** SKAG não é regra universal; correspondência ampla não é sempre inválida; estratégia de lance requer contexto; listas massivas de negativas podem excluir compradores; não testar dezenas de variações com poucos cliques; 20% de conversão e cifras citadas são **alegações dos apresentadores**, não resultados garantidos ou verificados por este kit; não presumir autorização para publicar nem um valor de ROI sem CRM e custos reais.

## Referências oficiais
- Claude Code — CLAUDE.md: https://code.claude.com/docs/en/memory
- Claude Code — Skills: https://code.claude.com/docs/en/skills
- Google Ads API — início: https://developers.google.com/google-ads/api/docs/get-started
- Google Ads API — descontinuação do developer token: https://developers.google.com/google-ads/api/docs/api-policy/developer-token
- OAuth da Ads API: https://developers.google.com/google-ads/api/docs/oauth/overview
- Correspondência de keywords: https://support.google.com/google-ads/answer/7478529?hl=pt-BR
- Negativas: https://support.google.com/google-ads/answer/2453972?hl=pt-BR
- Segmentação geográfica: https://support.google.com/google-ads/answer/1722038?hl=pt
- Eventos de leads GA4: https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm&hl=pt-br
- Consent Mode: https://developers.google.com/tag-platform/security/concepts/consent-mode

## Transcrições de origem
1. `Claude Code Google Ads: Automate Everything ($730K Earned)` — vídeo identificado pelo usuário: `-EInjdpjKy0`.
2. `Claude Code Website Conversion Rate Optimization (20% Conversions, $1.2M Case Study)` — vídeo identificado pelo usuário: `ru7fWKD4cyw`.

Os vídeos foram recebidos como transcrições automáticas com trechos incompletos/repetitivos. O kit extrai **práticas efetivamente mencionadas**, mas os arquivos externos chamados de `blueprints` e seus prompts originais **não foram fornecidos**; não são reproduções exatas desses materiais.

# CRO, landing pages, CRM e analytics

## Jornada de conversão
- Alinhar mensagem `pesquisa → anúncio → landing → formulário → atendimento → proposta → venda`. Personalizar por serviço e área **sem criar conteúdo artificial ou duplicado apenas para SEO**.
- Priorizar: clareza acima da dobra; CTA principal; formulário curto, acessível e funcional; telefone/WhatsApp clicável se oferecido; prova social verificada; fotos reais; objeções em FAQ; bom uso em mobile.
- Depoimentos em vídeo, apresentação do responsável, portfólio e antes/depois são **hipóteses a testar**, não garantias. Só publicar mídias reais autorizadas.
- Não definir metas dogmáticas (`Lighthouse 100`, `1 segundo em toda rede`, `CRO 20%`). Corrigir problemas medidos de LCP/INP/CLS, acessibilidade, erros de formulário e peso de imagens respeitando orçamento técnico.

## Rastreamento correto
- Evento de página vista != lead. Contar `generate_lead` somente após sucesso confirmado pelo backend/API e com ID estável; não disparar apenas no clique do botão, nem duplicar por refresh da página de obrigado.
- Guardar no lead, quando permitido: campanha/UTMs, origem/mídia, página, timestamp e identificador de clique (`gclid`/`gbraid`/`wbraid`, quando disponível). Tratar identificadores como dados sujeitos à política de retenção/privacidade.
- Nunca inserir nome, telefone, e-mail, endereço ou identificadores internos sensíveis nos eventos GA4/PostHog/URLs. Em conversões avançadas, seguir fluxo oficial, consentimento e tratamento seguro de dados.
- Testar com Tag Assistant, DebugView ou ferramenta oficial correspondente e com confirmação de dados no backend. Capturar IDs reais de eventos, logs redigidos e resultados de testes.
- Se tiver GTM/GA4 instalados, reutilizar corretamente: evitar tag duplicada no layout, pixel duplicado e duas metas primárias contando o mesmo formulário.
- Dividir a jornada em: `lead_recebido` → `contatado` → `qualificado` → `proposta` → `venda_confirmada` ou `perdido`; medir horários e tempo de resposta, sem inventar valor de venda.
- CRM/Supabase: validar schema antes de migrar, políticas RLS, isolamento por tenant, estados válidos, triggers e idempotência de webhooks.

## Experimentos A/B
- Escrever hipótese, variante controle, alteração única relevante, evento primário, janela, tráfego elegível e regra de interrupção antes de iniciar.
- Usar atribuição estável por visitante/usuário quando cabível e tratar cada visitante com consentimento e privacidade aplicáveis.
- Não concluir vencedor apenas com 5, 10 ou 20 eventos; estimar tamanho mínimo de amostra ou informar que ainda é inconclusivo.
- Só ativar PostHog/Clarity e heatmaps depois de configurar consentimento, mascaramento de campos e permissões.
- Registrar variante em evento/conversão e auditar balanceamento da distribuição. Evitar que redirecionamento prejudique SEO, UX ou mensagens do anúncio.

## Atendimento
- Garantir que o lead chegue com sucesso a responsável real, sem duplicação. Definir backup para falha de WhatsApp, e-mail ou webhook.
- Criar alertas internos com informação mínima; nunca contatar cliente automaticamente sem consentimento, política e autorização humana.
- A rapidez de resposta é um KPI operacional. Não prometer multiplicadores de vendas sem mensuração própria.

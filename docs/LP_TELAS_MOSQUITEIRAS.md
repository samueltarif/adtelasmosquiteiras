# Landing de Google Ads — telas mosquiteiras

Implementação: 20/09/2026. Rota: `/lp/telas-mosquiteiras`.
Status: implementação local; publicação e troca da URL nos anúncios não fazem parte desta entrega.

## Inspeção e decisões

- Nuxt 4, Vue 3, Tailwind; rotas por arquivos. A nova rota não conflita com rotas ou redirects existentes.
- `layout: false` permite uma apresentação independente do cabeçalho, rodapé e botões flutuantes globais.
- `/servicos/telas` permanece sem alterações. O formulário compartilhado conserva seus valores padrão e comportamento nessa página.
- Seis links diretos para páginas canônicas. Outras aplicações usam redirects para as páginas existentes; não foram criadas páginas ou links fictícios.
- `noindex, follow`, canonical próprio sem parâmetros (fornecido pelo `app.vue`), title e description próprios. Landing fora do sitemap orgânico.
- Sem avaliações ou selo INMETRO na landing: foram encontrados textos fixos, mas nenhuma fonte de avaliações ou documento de certificação verificável. Os benefícios utilizados são sob medida, orçamento gratuito, instalação profissional e atendimento em São Paulo, presentes no projeto.

## Arquivos criados

| Arquivo | Finalidade |
| --- | --- |
| `app/pages/lp/telas-mosquiteiras.vue` | Página, cabeçalho mínimo, seis cards, benefícios, formulário e contatos |
| `app/composables/useLandingTracking.js` | Eventos específicos usando analytics, identidade e atribuição existentes |
| `public/images/logo-adt-lp.png` | Derivado do logo original, 224 × 112, 23.900 bytes; original preservado |
| `scripts/test-ppc-landing.mjs` | Validação no navegador, com leads e analytics simulados |
| `docs/LP_TELAS_MOSQUITEIRAS.md` | Registro de entrega e limites da validação |

## Arquivos modificados

| Arquivo | Mudança limitada |
| --- | --- |
| `app/components/LandingQuoteForm.vue` | Props opcionais para ocultar provas não verificadas, definir descrição e localização do CTA; defaults preservados |
| `app/composables/useAttribution.ts` | Preserva campaign_id/adgroup_id no cookie existente e reconhece utm_term/utm_content isolados |
| `app/plugins/track-clicks.client.ts` | Envia também gbraid, wbraid e referrer ao endpoint que já aceita esses campos |
| `app/utils/ctaTaxonomy.ts` | Identifica localizações lp_header, lp_hero, lp_sticky, lp_bottom, lp_form |
| `server/utils/analytics.ts` | Aceita as mesmas localizações na validação existente, sem alteração de banco |

## Componentes e infraestrutura reaproveitados

`LandingQuoteForm`, `WhatsappIcon`, `Icon`, `NuxtLink`, `useServicos`, `useGATracking`, `useAttribution`, `useAnalyticsIdentity`, plugins de visitas/cliques e `useFormSubmit`/`formConversion`.

Não há nova implementação de formulário nem novos componentes visuais genéricos: os cards compactos pertencem à própria página. Não foram instaladas dependências ou alteradas tags, IDs, lógica de conversão, painel ou schema do banco.

## Tracking

| Ação | Evento/canal | Dados |
| --- | --- | --- |
| Abrir landing | `landing_view` via dispatcher GA existente; visita admin pelo plugin global | source=landing_page, page_path, campaign_id, adgroup_id |
| Escolher aplicação | `service_card_click` via dispatcher GA | service, source=landing_page, destination_url, IDs de campanha disponíveis |
| Ir ao formulário | `quote_cta_click` via dispatcher GA | cta_location, destination_url |
| WhatsApp/telefone | Registro existente `/api/track-click`, tipo whatsapp/telefone | cta_location lp_hero/lp_bottom; identidade e atribuição existentes |
| Primeiro foco em campo | `form_start` no endpoint admin existente, uma vez por montagem | cta_location=lp_form, sem valores dos campos |
| Envio confirmado | `lead_form_success` e conversão Ads existentes | Somente após success=true, leadSaved=true e leadId; sem lógica nova |

O form_start manual é registrado apenas no admin, evitando sobreposição com a medição automática de formulários do GA. Não foram adicionados eventos GA paralelos de WhatsApp/telefone, pois já há registro equivalente no projeto.

`campaign_id` e `adgroup_id` ficam no cookie de atribuição e nos eventos GA específicos da landing. Não há colunas correspondentes no fluxo atual do admin; esta entrega não cria essas colunas nem promete exibi-las no painel. UTMs/GCLID/braids continuam no fluxo existente de contatos e leads. Os links internos permanecem limpos, sem replicar parâmetros de campanha.

## Destinos dos cards

1. `/servicos/telas/janelas`
2. `/servicos/telas/portas`
3. `/servicos/telas/sacadas-e-varandas`
4. `/servicos/telas/removivel`
5. `/servicos/telas/pet-screen`
6. `/servicos/telas/restaurantes`

## Mobile, acessibilidade e performance

- Header de 72px, sem menu e sem fixação.
- Hero curto; serviço e CTA visíveis na primeira dobra dos tamanhos testados.
- Cards com aproximadamente 96px de altura, área clicável integral, coluna única no celular; duas colunas a partir de 640px. Desktop organiza hero e seleção lado a lado.
- Barra de orçamento com botão de 48px; padding inferior reservado e safe-area. Desaparece quando o formulário está visível.
- Labels do formulário original, foco visível, navegação por âncoras, opção de pular conteúdo e respeito a movimento reduzido nos comandos de rolagem.
- Uma imagem pequena com dimensões explícitas (logo); cards usam ícones existentes. Sem carrossel, vídeo, nova fonte ou biblioteca.

## Validação

- `npm run build`: passou; avisos existentes de imports duplicados/depreciações.
- `node scripts/test-ppc-landing.mjs`: testes locais com Edge/Playwright; interceptação de analytics e envio de leads. Nenhum contato real gerado.
- Larguras 360, 390, 412, 430, 768 e 1440px: sem overflow horizontal; cards entre 90–130px; header, hero e CTA verificados.
- HTTP 200 nos seis destinos, canonical único correto, noindex e ausência no sitemap.
- Jornada Google Ads → landing → janelas → WhatsApp: mantém origem, landing_path, UTMs e IDs; clique registrado uma vez.
- Formulário vazio bloqueado; falha de API não dispara conversão; retry mantém submission_id; sucesso dispara lead_form_success e conversão uma única vez.
- Localizações de CTA aceitas pelo validador do servidor; barra não cobre o link do rodapé.
- `node test-service-cards-navigation.mjs`: 17 verificações existentes passaram.
- `git diff --check`: passou. Arquivo de `/servicos/telas`, plugins GTM/gtag, utilitário de conversão e useFormSubmit inalterados.
- TypeScript: `tsc --noEmit -p .nuxt/tsconfig.app.json` encontrou erros em áreas existentes (admin, mídia, taxonomia e servidor). Não é correto declarar typecheck geral aprovado. `vue-tsc` não está instalado; a compilação dos templates Vue foi validada pelo build.
- Lint: projeto não possui script/configuração de lint instalada. Não foi introduzida uma nova ferramenta de lint.

## Validações ainda necessárias fora do ambiente local

- Publicar e verificar a rota em produção antes de usá-la como URL final do anúncio.
- Conferir a entrega dos eventos no Tag Assistant/GA4 e a gravação real de um lead autorizado no admin. Testes locais verificam emissão e payload, não o recebimento pelos serviços externos.
- Avaliar LCP, INP e CLS em dispositivo/rede reais e dados de campo. As metas 2,5s/200ms/0,1 não são certificadas por estes testes funcionais.
- Trocar a URL do anúncio é uma ação separada e não foi executada.

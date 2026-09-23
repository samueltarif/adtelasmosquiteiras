# Auditoria — páginas específicas de telas

Auditoria concluída antes de alterar o código de aplicação (22/09/2026).

- Rotas encontradas: janelas, portas, sacadas-e-varandas, removivel, pet-screen, restaurantes. O index é o hub já aprovado e fica fora desta refatoração.
- Estrutura atual: seis arquivos com HTML repetido; Breadcrumb, ServicePublicGallery, MobileUnifiedCTA e StickyFormModal. O modal contém LeadForm, com envio rápido e detalhes/fotos opcionais. Layout default injeta Header/Footer/FloatingButtons e outro modal.
- Identidade: logo_adt_telas_nova.png e sua versão leve logo-adt-lp.png, sem redesenho. Tokens já adotados no hub: azul #234b73, azul profundo #142b46, dourado #f2bd16. WhatsApp verde #087c38.
- SEO: title/description e OG específicos por rota; canonical global em app.vue; Organization global; BreadcrumbList pelo Breadcrumb. Sem Twitter Card específico nas seis rotas.
- Tracking: plugins globais, useAttribution, useAnalyticsIdentity, whatsappShortCode, whatsappTrackingQueue, useFormSubmit e formConversion. Ref, event_id, short_code, cookies de atribuição, UTMs e identificadores de anúncios permanecem nesses módulos. lead_form_success delegado ao GTM. IDs de GTM/GA4/Ads não serão editados.
- Mídia: todo o acervo public/images foi inventariado e inspecionado por folhas de contato (scratch/telas-assets-0..2.jpg). Não foram encontradas outras pastas de fotos de projetos. Acervo mistura fotos, ilustrações, redes de proteção e imagens promocionais; excluir redes de proteção das galerias de telas. Imagens da geração anterior não serão usadas como prova de instalação real.
- API pública existente /api/services/{service_key}/media: consulta somente leitura retornou zero mídias para as seis chaves. Integração será preservada, priorizando futuras mídias cadastradas. Enquanto vazia, exibir imagens locais sob rótulo de modelos/aplicações, sem inventar cliente, endereço ou autoria de instalação.
- Conteúdo técnico: preservar todas as descrições e FAQs. Pet Screen e Sacadas devem manter explicitamente a distinção de rede contra quedas. Janelas mantém as etapas de medição/confecção/instalação.
- Formulário: reutilizar LeadForm, sem reimplementar payload, campos, mídia ou eventos. Associar labels aos campos com IDs únicos para acessibilidade, sem alterar lógica de envio.
- Componentização: template compartilhado só para páginas específicas; cabeçalho/rodapé próprios dentro desse template, sem mudar layout global. Galeria editorial usa o endpoint existente e o lightbox existente.
- Validação prévia: TypeScript geral já retorna erros; baseline salvo em scratch/telas-detail-typecheck-before.log. Não há script lint nem vue-tsc instalado. Não publicar, executar push ou merge.

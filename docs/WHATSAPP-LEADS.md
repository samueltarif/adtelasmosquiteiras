# Leads de interesse pelo WhatsApp

A página `/admin/leads` mostra os cliques registrados em `lead_clicks`, inclusive os históricos, em uma seção de contatos a confirmar. O endpoint exige administrador ativo e não permite cache. Não é necessária migration.

Cada sessão e campanha forma uma oportunidade; eventos repetidos são desduplicados por event_id e bots identificados são excluídos. Sem session_id, cada clique permanece separado porque não há evidência suficiente para agrupar pessoas. Uma sessão pode aparecer em campanhas diferentes. Esses números não representam pessoas únicas nem mensagens recebidas.

A busca inclui serviço, origem, página, palavra-chave e campanha. Nome e ID de campanha são os capturados no clique; não há consulta automática ao Google Ads. O telefone do visitante não é obtido pelo clique. A seção permite abrir a ferramenta existente para vincular o código da mensagem ao cliente.

Os registros originais e as métricas de formulário permanecem preservados. Os cliques não criam registros fictícios na tabela leads nem alteram conversões do Google Ads. A confirmação e o vínculo comercial continuam no fluxo existente de atribuições.

Validação: `node scripts/test-whatsapp-prospects.mjs`. Publicar a aplicação para disponibilizar a seção em produção.

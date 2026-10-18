# Google Ads — política técnica e operacional

## APIs e autenticação em 2026
- **Não ensinar procedimento antigo de developer token/MCC como pré-requisito universal.** Em 09/09/2026 os developer tokens foram descontinuados; o nível de acesso passou a depender do projeto Google Cloud/OAuth. MCC ainda é útil/necessário para gerenciar múltiplas contas, não para uma única conta.
- Conferir primeiro a documentação atual: https://developers.google.com/google-ads/api/docs/get-started e https://developers.google.com/google-ads/api/docs/api-policy/developer-token
- Confirmar conta Google Ads, projeto Cloud correto, Google Ads API habilitada, acesso/quota aprovada e fluxo OAuth ou conta de serviço apropriado. Seguir o guia oficial vigente, não o fluxo de vídeo sem verificação.
- Nunca simular uma autenticação bem-sucedida. Se faltarem permissões, listar **exatamente qual etapa humana** falta.
- Ler dados com GAQL conforme versão em vigor. Diferenciar segmento, campanha, período e ação de conversão. Não confundir `all_conversions` com `conversions` nem dados estimados com receita paga.

## Planejamento de campanha
1. Confirmar oferta, região realmente atendida, agenda, concorrência, ticket, margem, orçamento em BRL, meta de CPL/CAC, SLA comercial e destinos de lead.
2. Solicitar dados do Planejador de Palavras-chave (export CSV, se acesso direto não existir), termos de pesquisa históricos e campanhas antigas quando houver.
3. Construir tabela com: termo, serviço, local, intenção, volume/CPC se documentados, correspondência proposta, landing, negativas potenciais, motivo.
4. Priorizar termos com intenção transacional e cobertura real, agrupados por serviço/intenção. Matriz serviço × bairro apenas onde houver demanda e atendimento verdadeiro.
5. Propor estrutura de Rede de Pesquisa adequada ao orçamento; não multiplicar campanhas/grupos/variações sem volume suficiente.
6. Por padrão, **não habilitar** Display, parceiros, PMax, Demand Gen, AI Max, expansão de URL, correspondência ampla ou automações que ampliem alcance sem análise e autorização.
7. Correspondência exata inclui variantes aproximadas: não prometer alinhamento literal 1:1 de consultas. Comparar exata/frase/ampla por desempenho e sinais disponíveis.
8. Propor localização com foco em **presença** para negócios estritamente locais, mas verificar a configuração e trade-offs reais; não aplicar raio de 50 km nem excluir todos os países sem justificativa.
9. Lances: não presumir `Maximizar conversões` como sempre ótimo em contas novas. Avaliar maturidade das conversões, orçamento, objetivos, alternativas e restrições atuais da plataforma.
10. Redigir RSA com títulos/descrições naturais, sem alegações não verificadas. Usar sitelinks, destaques e snippets apenas quando páginas e afirmações existirem.

## Negativas e auditoria
- Negativa sugerida ≠ negativa aplicada. Categorizar termos como `claramente irrelevante`, `ambíguo` ou `potencial cliente`.
- Conferir match type das negativas, plurais/sinônimos, contexto comercial e risco de bloquear pesquisas legítimas. Não negativar `preço`, `valor`, `orçamento`, `perto de mim`, `quanto custa` automaticamente.
- Verificar volume de termos, gasto associado e qualidade dos leads; sem dados, escrever `não mensurado`.
- Não considerar recomendação de otimização do Google uma ordem; justificar por objetivo, dados e impacto.
- Verificar conflitos entre keyword positiva e negativa, termos de marca, restrições geográficas e assets.

## Mensuração e decisões
- Pré-lançamento: campanhas em rascunho/pausadas, URL publicada e testada, formulário/CRM funcionando, tags e conversões deduplicadas, consentimento revisado, orçamento aprovado.
- Diagnóstico por janela apropriada e conversão atribuível. Conferir latência e dados incompletos antes de concluir.
- Métricas: gasto, impressões, cliques, CTR, CPC médio, conversões válidas, taxa de conversão, CPL, leads qualificados, CPQL, propostas, vendas, CAC e receita/margem confirmadas.
- ROAS só quando receita atribuída é confiável. Não chamar ROAS de lucro. ROI de lucro exige custos e margem reais.
- Nunca pausar/escalar por regra mecânica de poucos cliques; usar confiança, volume, atraso de conversão e impacto comercial.
- Cada recomendação: contexto → evidência → hipótese → benefício/risco → aprovação necessária → critério de sucesso.

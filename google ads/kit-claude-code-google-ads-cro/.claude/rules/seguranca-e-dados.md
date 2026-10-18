# Segurança, acesso e responsabilidade humana

## Ambientes e permissões
- Presumir **contas reais como somente leitura**. Ações que alteram custos, reputação, privacidade ou dados exigem autorização explícita e contextual.
- Pedir confirmação dos IDs de conta, campanhas, grupos, ações de conversão e domínio. Nunca inferir conta-alvo a partir da primeira credencial que funcionar.
- Preferir menor privilégio. Não solicitar senha ou token privado em texto de chat; orientar o usuário a configurar acesso seguro diretamente no serviço/ambiente.
- Antes de qualquer mutação: inventário e snapshot das configurações, preview de diffs, estimativa de impacto e plano de reversão.
- Antes de alterar orçamento ou estratégia de lance: mostrar orçamento **diário e mensal aproximado**, limites definidos pelo usuário e risco de variação de gasto. Evitar prometer teto mensal rígido.
- Não remover rotas, tabelas, campanhas, eventos, listas ou configs existentes sem estudo de dependências.

## Segurança do desenvolvimento
- Não salvar `.env`, `.env.local`, chaves OAuth, tokens, cookies, arquivos de conta de serviço e segredos de webhook no repositório ou relatórios.
- Implementar integração externa no servidor quando possível, com autenticação e segregação entre clientes.
- Usar logs redigidos, políticas RLS no Supabase, controle de acesso por papel e proteção contra acesso a leads de outros clientes.
- Testes com dados sintéticos que não acionem automações reais. Se teste em produção for indispensável, obter aprovação e marcar o lead como teste.
- Usar chamadas idempotentes para cadastros de leads e conversões; tolerar reenvio e falhas de rede.

## Privacidade, transparência e reputação
- Respeitar LGPD e políticas das plataformas, obter confirmação sobre finalidade, base legal, retenção e consentimento antes da coleta/compartilhamento de dados e remarketing.
- Verificar necessidade de consent mode, banner/CMP, política de privacidade e consentimentos para envios de dados de usuário.
- PostHog/Clarity/heatmaps: avaliar gravações, mascaramento de formulários, dados pessoais e configuração de consentimento antes de ativar.
- Não fabricar depoimentos, avaliações, resultados, portfólio, números de clientes, certificados, garantias, descontos nem disponibilidade 24 horas.
- Não copiar layout, imagens ou marca de outros sites sem direito de uso. Inspiração visual não é licença de reprodução.
- Não automatizar chamadas ou mensagens para clientes sem autorização e respeito às regras aplicáveis.

## Resultado mínimo de uma execução
1. O que foi verificado e como.
2. O que foi alterado localmente (ou `nenhuma alteração`).
3. O que está bloqueado por dependência humana.
4. Como testar e como reverter.

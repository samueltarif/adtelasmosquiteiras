---
name: otimizar-landing
description: Diagnosticar e melhorar conversão, copy, formulário, experiência mobile e Core Web Vitals em landing page existente.
argument-hint: "[rota ou URL] [serviço]"
---

# Otimização de landing — CRO

## Fluxo
1. Localizar rota e componentes, identificar framework e CSS atuais. Se site publicado, ler página somente com ferramentas autorizadas.
2. Identificar palavra-chave/intenção que levou à página; checar consistência de título, copy, CTA e formulário.
3. Auditoria de confiança: informações reais, fotos do cliente, vídeo/apresentação do responsável, depoimentos com autorização, política de privacidade, telefone e garantias verificadas.
4. Auditoria UX mobile: primeira dobra, carregamento, formulário acessível, validação, erros e sucesso do submit, botão WhatsApp/ligação, estado de loading e confirmação.
5. Obter Lighthouse/Playwright quando disponíveis; registrar métricas, limitações do dispositivo/rede, fotos e problemas concretos.
6. Propor **uma rodada pequena** de mudanças de alto impacto e baixo risco. Implementar localmente seguindo padrões do repositório e limites de linhas; preservar tracking/SEO.
7. Testar desktop/mobile, sucesso/erro de envio, teclado, performance e evento de conversão **sem disparar leads reais**.
8. Gerar plano de teste A/B com hipótese, variante, métrica e avaliação estatística; não ativar teste/analytics em produção sem autorização.

## Entrega
`Antes → Mudança → Por que ajuda → Evidência → Teste → Pendente humano` e comprovação local dos resultados.

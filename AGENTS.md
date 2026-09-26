# Diretrizes e Regras do Projeto

## Responsividade e Testes Visuais
- **Uso Exclusivo do Playwright MCP**: Para medir e validar a responsividade, quebras de layout e adaptações de tela (mobile, tablet e desktop), utilize **SEMPRE E EXCLUSIVAMENTE o MCP Playwright** (`playwright` / `microsoft/playwright-mcp`). Use apenas ele para esse objetivo.
- **Validação de Viewports**: Sempre testar viewports mobile (ex: 390x844 / 375x667) e desktop (1280x800) para garantir que botões, títulos e seções mantenham hierarquia, alinhamento e sem overflow horizontal.

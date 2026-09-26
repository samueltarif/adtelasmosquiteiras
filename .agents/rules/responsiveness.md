# Regras de Medição de Responsividade

## Uso Exclusivo do MCP Playwright para Responsividade

1. **Ferramenta Exclusiva**: Para medir, testar, validar e inspecionar a responsividade e adaptação de layout das páginas (mobile, tablet e desktop), utilize **SEMPRE e APENAS o MCP Playwright** (`playwright` / `microsoft/playwright-mcp`).
2. **Proibição de Alternativas para Responsividade**: Não utilize outros métodos ou subagents genéricos para medição de responsividade; a validação de breakpoints, tamanhos de tela e overflow visual deve ser feita exclusivamente com o Playwright MCP.
3. **Padrão de Viewports**:
   - **Mobile**: 375x667 ou 390x844
   - **Tablet**: 768x1024
   - **Desktop**: 1280x800 ou 1440x900
4. **Verificações Obrigatórias**:
   - Ausência de rolagem horizontal indesejada (`overflow-x`).
   - Alinhamento de títulos (`h1`, `h2`, `p`), botões de ação (CTAs) e cards de serviços.
   - Legibilidade e áreas de toque acessíveis em telas menores.

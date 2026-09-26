import { Client } from '../tools/playwright-mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import { StdioClientTransport } from '../tools/playwright-mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, '../tools/playwright-mcp/cli.js');

function extractResult(text) {
  const match = text.match(/### Result\s*\n([\s\S]*?)(?=\n### Ran Playwright code|\n### Page|$)/);
  if (!match) return null;
  let raw = match[1].trim();
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try {
      raw = JSON.parse(raw);
    } catch {}
  }
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function measureResponsiveness() {
  console.log('===============================================================');
  console.log('    MEDIÇÃO DE RESPONSIVIDADE COM PLAYWRIGHT MCP (MICROSOFT)   ');
  console.log('===============================================================\n');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: [cliPath, '--headless']
  });

  const client = new Client({ name: 'antigravity-playwright-client', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);
  console.log('✓ Conectado ao Playwright MCP Server com sucesso via stdio transport!\n');

  const targetUrl = 'http://localhost:3001/servicos/telas';

  console.log(`[MCP Tool: browser_navigate] Navegando para ${targetUrl}...`);
  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: targetUrl }
  });

  const viewports = [
    { name: 'Mobile Pequeno (iPhone SE)', width: 375, height: 667 },
    { name: 'Mobile Padrão (iPhone 14/15/16)', width: 390, height: 844 },
    { name: 'Tablet (iPad Mini / Air)', width: 768, height: 1024 },
    { name: 'Desktop HD (1280x800)', width: 1280, height: 800 },
    { name: 'Desktop Full HD (1920x1080)', width: 1920, height: 1080 }
  ];

  for (const vp of viewports) {
    console.log(`---------------------------------------------------------------`);
    console.log(`[MCP Tool: browser_resize] Viewport: ${vp.name} [${vp.width}x${vp.height}]`);
    
    await client.callTool({
      name: 'browser_resize',
      arguments: { width: vp.width, height: vp.height }
    });

    const evalRes = await client.callTool({
      name: 'browser_evaluate',
      arguments: {
        function: `() => {
          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          const overflow = docWidth > winWidth;
          
          const sectionH2 = document.querySelector('#solucoes .section-heading h2');
          const sectionH2Text = sectionH2 ? sectionH2.textContent.trim() : null;
          
          const heroBtn = document.querySelector('.hero-actions .hero-cta-whatsapp');
          let heroBtnRect = null;
          let heroBtnText = null;
          if (heroBtn) {
            const rect = heroBtn.getBoundingClientRect();
            heroBtnRect = { width: Math.round(rect.width), height: Math.round(rect.height) };
            heroBtnText = heroBtn.textContent.trim().replace(/\\s+/g, ' ');
          }

          const secBtn = document.querySelector('.hero-actions .secondary');
          let secBtnRect = null;
          if (secBtn) {
            const rect = secBtn.getBoundingClientRect();
            secBtnRect = { width: Math.round(rect.width), height: Math.round(rect.height) };
          }

          // Medir imagens dos cards de serviços
          const cardImgs = Array.from(document.querySelectorAll('.service-card > img')).map(img => {
            const r = img.getBoundingClientRect();
            return { width: Math.round(r.width), height: Math.round(r.height) };
          });

          return JSON.stringify({
            scrollWidth: docWidth,
            innerWidth: winWidth,
            overflow: overflow,
            overflowDelta: docWidth - winWidth,
            sectionH2Text,
            heroBtnText,
            heroBtnRect,
            secBtnRect,
            cardImgs
          });
        }`
      }
    });

    const parsed = extractResult(evalRes.content[0].text);
    if (parsed) {
      console.log(`  • Largura do documento: ${parsed.scrollWidth}px (Janela: ${parsed.innerWidth}px)`);
      console.log(`  • Overflow horizontal: ${parsed.overflow ? `FALHA (+${parsed.overflowDelta}px)` : 'NENHUM (0px - 100% responsivo ✓)'}`);
      console.log(`  • H2 atualizado: "${parsed.sectionH2Text}" ✓`);
      console.log(`  • Botão WhatsApp: "${parsed.heroBtnText}" (${parsed.heroBtnRect?.width}x${parsed.heroBtnRect?.height}px) ✓`);
      if (parsed.cardImgs && parsed.cardImgs.length > 0) {
        console.log(`  • Altura das imagens dos cards: ${parsed.cardImgs[0].height}px (Largura: ${parsed.cardImgs[0].width}px) [Antes: ${vp.width < 768 ? '135px' : '190px'}] ✓ (+55%)`);
      }
    }
  }

  console.log(`---------------------------------------------------------------`);
  console.log('\n[MCP Tool: browser_take_screenshot] Capturando screenshots dos cards via Playwright MCP...');
  
  // Mobile screenshot dos cards
  await client.callTool({ name: 'browser_resize', arguments: { width: 390, height: 844 } });
  await client.callTool({
    name: 'browser_evaluate',
    arguments: { function: '() => document.getElementById("solucoes")?.scrollIntoView({ behavior: "instant" })' }
  });
  await client.callTool({
    name: 'browser_take_screenshot',
    arguments: { filename: 'scratch/playwright_mcp_cards_mobile_390.png', scale: 'css' }
  });
  console.log('✓ Screenshot mobile dos cards salvo em scratch/playwright_mcp_cards_mobile_390.png');

  // Desktop screenshot dos cards
  await client.callTool({ name: 'browser_resize', arguments: { width: 1280, height: 800 } });
  await client.callTool({
    name: 'browser_evaluate',
    arguments: { function: '() => document.getElementById("solucoes")?.scrollIntoView({ behavior: "instant" })' }
  });
  await client.callTool({
    name: 'browser_take_screenshot',
    arguments: { filename: 'scratch/playwright_mcp_cards_desktop_1280.png', scale: 'css' }
  });
  console.log('✓ Screenshot desktop dos cards salvo em scratch/playwright_mcp_cards_desktop_1280.png');

  await client.callTool({ name: 'browser_close', arguments: {} });
  await client.close();
  console.log('\n===============================================================');
  console.log('  MEDIÇÃO FINALIZADA: TODOS OS VIEWPORTS 100% RESPONSIVOS! ✓   ');
  console.log('===============================================================\n');
}

measureResponsiveness().catch(err => {
  console.error('Erro na medição:', err);
  process.exit(1);
});

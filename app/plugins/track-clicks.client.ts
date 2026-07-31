/**
 * Plugin global que intercepta automaticamente cliques em links de WhatsApp,
 * telefone e botões CTA em TODAS as páginas do site.
 * 
 * Funciona via event delegation no document — não precisa editar nenhuma página.
 * Grava cada clique na tabela lead_clicks do Supabase via /api/track-click.
 */
export default defineNuxtPlugin(() => {
  if (typeof document === 'undefined') return

  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement)?.closest('a, button') as HTMLElement | null
    if (!target) return

    const href = target.getAttribute('href') || ''
    const text = (target.textContent || '').toLowerCase().trim()
    const gtm = target.getAttribute('data-gtm') || ''
    const path = window.location.pathname

    let tipo = ''

    // 1. Links de WhatsApp (wa.me ou api.whatsapp.com ou whatsapp no text/gtm)
    if (
      href.includes('wa.me') || 
      href.includes('whatsapp.com') || 
      href.includes('whatsapp') || 
      text.includes('whatsapp') ||
      gtm.includes('whatsapp')
    ) {
      tipo = 'whatsapp'
    }
    // 2. Links de telefone (tel:)
    else if (href.startsWith('tel:')) {
      tipo = 'telefone'
    }
    // 3. Botões de envio de formulário
    else if (
      target.getAttribute('type') === 'submit' ||
      text.includes('enviar') ||
      text.includes('solicitar') ||
      text.includes('orçamento') ||
      text.includes('orcamento')
    ) {
      tipo = 'formulario_submit'
    }
    // 4. Links para a página de contato ou orçamento (CTAs internos)
    else if (href.includes('/contato') || href.includes('/orcamento')) {
      tipo = 'cta_interno'
    }

    // Se identificou um tipo de clique rastreável, grava
    if (tipo) {
      $fetch('/api/track-click', {
        method: 'POST',
        body: {
          tipo,
          origem: path || '/',
          text: text.substring(0, 100)
        }
      }).catch(() => {
        // Silencioso — nunca interfere na experiência
      })
    }
  }, { passive: true, capture: true })
})

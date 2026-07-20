/**
 * Composable para rastrear cliques em CTAs (WhatsApp, Telefone, Formulário)
 * e gravar automaticamente na tabela lead_clicks do Supabase.
 *
 * Uso: const { trackClick } = useClickTracker()
 *      trackClick('whatsapp_floating', '/servicos/redes')
 */
export const useClickTracker = () => {
  const trackClick = (tipo: string, origem?: string) => {
    const path = origem || (typeof window !== 'undefined' ? window.location.pathname : '/')

    // Fire-and-forget: nunca bloqueia a UX
    $fetch('/api/track-click', {
      method: 'POST',
      body: { tipo, origem: path }
    }).catch(() => {
      // Silencioso
    })
  }

  return { trackClick }
}

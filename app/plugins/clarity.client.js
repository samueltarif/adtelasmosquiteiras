// Microsoft Clarity — gravações de sessão e mapas de calor (projeto z0ddp6avz0)
// Roda apenas no client. Não carrega em páginas administrativas.
export default defineNuxtPlugin(() => {
  if (window.location.pathname.startsWith('/admin')) return
  if (window.clarity) return

  ;(function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) }
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y)
  })(window, document, 'clarity', 'script', 'z0ddp6avz0')
})

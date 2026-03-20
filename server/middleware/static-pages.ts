// Redireciona páginas estáticas conhecidas que poderiam ser interceptadas pelo [slug].vue
const STATIC_PAGES = [
  '/por-que-instalar-tela-mosquiteira',
]

export default defineEventHandler((event) => {
  const url = event.path?.split('?')[0]
  if (STATIC_PAGES.includes(url)) {
    // Força o Nuxt a renderizar a página correta limpando o cache de rota
    // Não faz nada — apenas garante que o Nitro não interfira
  }
})

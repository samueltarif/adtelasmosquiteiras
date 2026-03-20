/**
 * API route para buscar notícias sobre mosquitos/dengue/tela mosquiteira
 * Queries em pt-BR com fallback entre APIs + artigos fixos editoriais
 * Cache de 24h
 */

const cache = new Map<string, { data: NewsItem[]; ts: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000

interface NewsItem {
  titulo: string
  descricao: string
  url: string
  fonte: string
  data: string
  nacional?: boolean
}

const QUERIES_PT = [
  'dengue São Paulo 2024',
  '"tela mosquiteira" São Paulo',
  'Aedes aegypti São Paulo prevenção',
  'dengue mortes Brasil 2024',
  'chikungunya zika São Paulo',
]

const QUERIES_EN = [
  'dengue Brazil 2024 deaths',
  'Aedes aegypti São Paulo outbreak',
  'mosquito screen protection Brazil',
]

// Artigos fixos editoriais — sempre exibidos como base
export const ARTIGOS_FIXOS: NewsItem[] = [
  {
    titulo: 'Brasil registra mais de 5.000 mortes por dengue em 2024 — recorde histórico',
    descricao: 'O Painel de Monitoramento das Arboviroses do Ministério da Saúde registrou 5.000+ mortes e 6,5 milhões de casos prováveis em 2024, o maior surto da história do país.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/aedes-aegypti/monitoramento-das-arboviroses',
    fonte: 'Ministério da Saúde',
    data: '2024-08-01',
    nacional: true,
  },
  {
    titulo: 'Zika vírus: mais de 2.000 bebês nasceram com microcefalia no Brasil',
    descricao: 'O Ministério da Saúde confirma que o vírus Zika, transmitido pelo Aedes aegypti, causou mais de 2.000 casos de microcefalia no Brasil desde 2015. Gestantes são o grupo de maior risco.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/z/zika-virus',
    fonte: 'Ministério da Saúde',
    data: '2024-01-01',
    nacional: true,
  },
  {
    titulo: 'Chikungunya pode causar artrite crônica por meses ou anos',
    descricao: 'O Ministério da Saúde alerta que a chikungunya causa dores articulares intensas que podem se tornar crônicas, especialmente em idosos e pessoas com comorbidades.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/c/chikungunya',
    fonte: 'Ministério da Saúde',
    data: '2024-01-01',
    nacional: true,
  },
  {
    titulo: '2024 foi o pior ano de dengue da história do Brasil, diz Ministério da Saúde',
    descricao: 'Com 6,5 milhões de casos e mais de 5.000 mortes, 2024 superou todos os registros anteriores. São Paulo foi um dos estados mais afetados pela epidemia.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/dengue',
    fonte: 'Ministério da Saúde',
    data: '2024-09-01',
    nacional: true,
  },
  {
    titulo: 'Dengue, Zika e Chikungunya: riscos para gestantes e recém-nascidos',
    descricao: 'A Biblioteca Virtual em Saúde documenta que arboviroses podem causar prematuridade, baixo peso e complicações neurológicas em bebês quando a mãe é infectada durante a gravidez.',
    url: 'https://bvsms.saude.gov.br/arboviroses-complicacoes-na-gravidez-infeccao-por-zika-virus-infeccao-pelo-virus-da-dengue-infeccao-pelo-virus-chikungunya-recem-nascido',
    fonte: 'Biblioteca Virtual em Saúde / MS',
    data: '2024-01-01',
    nacional: true,
  },
  {
    titulo: 'Brazil 2024: worst dengue outbreak in history with over 6.5 million cases',
    descricao: 'Brazil recorded its largest dengue epidemic in 2024, with 6.5 million probable cases and over 5,000 deaths — four times more than 2023, according to the Ministry of Health monitoring panel.',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/aedes-aegypti/monitoramento-das-arboviroses',
    fonte: 'Ministério da Saúde (EN)',
    data: '2024-09-01',
    nacional: false,
  },
]

function isRelevant(titulo: string, descricao: string): boolean {
  const text = (titulo + ' ' + descricao).toLowerCase()
  const keywords = ['mosquito', 'dengue', 'tela', 'mosquiteira', 'pernilongo', 'aedes', 'zika', 'chikungunya', 'inseto', 'proteção', 'arbovirus', 'arboviral']
  return keywords.some(k => text.includes(k))
}

async function fetchNewsdata(q: string, apiKey: string): Promise<NewsItem[]> {
  const res = await $fetch<any>(
    `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=pt&country=br&size=6`
  )
  if (!res.results?.length) return []
  return res.results
    .filter((a: any) => isRelevant(a.title ?? '', a.description ?? ''))
    .slice(0, 3)
    .map((a: any) => ({
      titulo: a.title,
      descricao: a.description ?? '',
      url: a.link,
      fonte: a.source_id ?? 'Newsdata',
      data: a.pubDate?.slice(0, 10) ?? '',
      nacional: true,
    }))
}

async function fetchNewsAPI(q: string, apiKey: string, lang = 'pt'): Promise<NewsItem[]> {
  const res = await $fetch<any>(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${lang}&sortBy=relevancy&pageSize=8&apiKey=${apiKey}`
  )
  if (!res.articles?.length) return []
  return res.articles
    .filter((a: any) => isRelevant(a.title ?? '', a.description ?? ''))
    .slice(0, 3)
    .map((a: any) => ({
      titulo: a.title,
      descricao: a.description ?? '',
      url: a.url,
      fonte: a.source?.name ?? 'NewsAPI',
      data: a.publishedAt?.slice(0, 10) ?? '',
      nacional: lang === 'pt',
    }))
}

async function fetchMediastack(q: string, apiKey: string): Promise<NewsItem[]> {
  const res = await $fetch<any>(
    `http://api.mediastack.com/v1/news?access_key=${apiKey}&keywords=${encodeURIComponent(q)}&languages=pt&countries=br&limit=8`
  )
  if (!res.data?.length) return []
  return res.data
    .filter((a: any) => isRelevant(a.title ?? '', a.description ?? ''))
    .slice(0, 3)
    .map((a: any) => ({
      titulo: a.title,
      descricao: a.description ?? '',
      url: a.url,
      fonte: a.source ?? 'Mediastack',
      data: a.published_at?.slice(0, 10) ?? '',
      nacional: true,
    }))
}

export default defineEventHandler(async (event) => {
  const cached = cache.get('noticias')
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data
  }

  const config = useRuntimeConfig()
  const apiResults: NewsItem[] = []

  // Tenta pt-BR primeiro em todas as APIs
  for (const q of QUERIES_PT) {
    if (apiResults.length >= 4) break
    try {
      if (config.newsdataApiKey) {
        const r = await fetchNewsdata(q, config.newsdataApiKey)
        apiResults.push(...r)
      }
    } catch {}
    try {
      if (config.newsApiKey && apiResults.length < 4) {
        const r = await fetchNewsAPI(q, config.newsApiKey, 'pt')
        apiResults.push(...r)
      }
    } catch {}
    try {
      if (config.mediastackApiKey && apiResults.length < 4) {
        const r = await fetchMediastack(q, config.mediastackApiKey)
        apiResults.push(...r)
      }
    } catch {}
  }

  // Complementa com inglês se necessário
  if (apiResults.length < 2) {
    for (const q of QUERIES_EN) {
      if (apiResults.length >= 4) break
      try {
        if (config.newsApiKey) {
          const r = await fetchNewsAPI(q, config.newsApiKey, 'en')
          apiResults.push(...r)
        }
      } catch {}
    }
  }

  // Deduplica por URL
  const seen = new Set<string>()
  const deduped = apiResults.filter(n => {
    if (seen.has(n.url)) return false
    seen.add(n.url)
    return true
  }).slice(0, 4)

  // Mescla: artigos fixos nacionais + resultados da API + fixos internacionais
  const fixosNacionais = ARTIGOS_FIXOS.filter(a => a.nacional)
  const fixosInternacionais = ARTIGOS_FIXOS.filter(a => !a.nacional)
  const merged = [...fixosNacionais.slice(0, 3), ...deduped.slice(0, 2), ...fixosInternacionais.slice(0, 1)]

  // Deduplica final
  const seenFinal = new Set<string>()
  const final = merged.filter(n => {
    if (seenFinal.has(n.url)) return false
    seenFinal.add(n.url)
    return true
  }).slice(0, 6)

  cache.set('noticias', { data: final, ts: Date.now() })
  return final
})

export interface ServiceImage {
  src: string
  small: string
  width: number
  height: number
  smallWidth: number
  alt: string
}
export interface ServiceText { title: string; description: string }
export interface ServiceModel extends ServiceText { highlight: string; image?: ServiceImage; diagram?: 'pivotante' | 'porta-dupla' }
export interface TelasService {
  slug: string
  key: string
  name: string
  title: string
  eyebrow: string
  description: string
  whatsappUrl: string
  seo: { title: string; meta: Array<{ name?: string; property?: string; content: string }> }
  breadcrumbs: Array<{ label: string; path: string; current: boolean; icon?: string }>
  hero: ServiceImage
  gallery: ServiceImage[]
  models: ServiceModel[]
  benefits: ServiceText[]
  technical: ServiceText[]
  process: ServiceText[]
  faq: Array<{ pergunta: string; resposta: string }>
}

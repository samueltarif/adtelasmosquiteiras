export interface ServiceItem {
  key: string
  name: string
}

export interface ServiceFamily {
  id: 'telas' | 'redes' | 'vidracaria'
  name: string
  icon: string
  services: ServiceItem[]
}

export interface SiteMedia {
  id: string
  service_key: string
  storage_key: string
  media_type: 'photo' | 'video'
  mime_type: string
  title: string | null
  alt_text: string
  caption: string | null
  sort_order: number
  is_featured: boolean
  is_active: boolean
  width: number | null
  height: number | null
  file_size_bytes: number
  created_by?: string
  created_at: string
  updated_at?: string
  publicUrl: string
}

export type UploadStatus =
  | 'idle'
  | 'optimizing'
  | 'authorizing'
  | 'uploading'
  | 'validating'
  | 'completed'
  | 'error'

export interface UploadQueueItem {
  id: string
  file: File
  previewUrl: string
  mediaType: 'photo' | 'video'
  mimeType: string
  originalSize: number
  finalSize?: number
  width?: number
  height?: number
  altText: string
  caption: string
  title: string
  status: UploadStatus
  progress: number
  error?: string
  storageKey?: string
  processedBlob?: Blob
}

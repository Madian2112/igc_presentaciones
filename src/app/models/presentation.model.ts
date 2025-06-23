export interface Song {
  id: string
  name: string
  source: string
  slideCount: number
  lyrics?: string[]
  metadata?: {
    artist?: string
    album?: string
    year?: number
    genre?: string
    fileSize?: number
    mimeType?: string
    thumbnailUrl?: string
    driveFileId?: string
    lastModified?: string
    webViewLink?: string
    webContentLink?: string
  }
}

export interface PresentationItem {
  id: string
  name: string
  type: "song" | "video" | "image"
  source: string
  position?: number
  slideCount?: number
  duration?: number
  thumbnail?: string
  size?: number
  metadata?: {
    width?: number
    height?: number
    format?: string
    createdAt?: string
    originalSong?: Song
    [key: string]: any
  }
}

export interface ExportOptions {
  includeTransitions: boolean
  optimizeForProjector: boolean
  includeNotes: boolean
  slideSize: "16:9" | "4:3"
  quality: "high" | "medium" | "low"
}

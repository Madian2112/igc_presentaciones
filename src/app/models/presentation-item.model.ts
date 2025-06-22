// export interface PresentationItem {
//   id: string
//   name: string
//   type: "song" | "video" | "image"
//   source?: string // URL o path del archivo
//   duration?: number // Para videos en minutos
//   slideCount?: number // Para canciones
//   position?: number // Posición en la presentación
//   size?: number // Tamaño del archivo en bytes
//   thumbnail?: string // URL de miniatura
//   metadata?: {
//     width?: number
//     height?: number
//     format?: string
//     createdAt?: string
//   }
// }

export interface PresentationItem {
  id: string
  name: string
  type: "song" | "video" | "image"
  source: string
  slideCount?: number
  position?: number
  thumbnail?: string
  duration?: number
  metadata?: any
}